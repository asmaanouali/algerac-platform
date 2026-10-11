package com.algerac.service;

import com.algerac.dto.ExpertSignupRequest;
import com.algerac.dto.OECSignupRequest;
import com.algerac.model.LoginTwoFactorToken;
import com.algerac.model.PasswordResetToken;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.model.UserStatus;
import com.algerac.repository.LoginTwoFactorTokenRepository;
import com.algerac.repository.PasswordResetTokenRepository;
import com.algerac.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final LoginTwoFactorTokenRepository loginTwoFactorTokenRepository;

    private static final String EXPERT_PREFIX = "EXP";
    private static final String FORMATEUR_PREFIX = "FOR";
    private static final String EVALUATEUR_PREFIX = "EVAL";

    // Keyed-hash secret for OTP codes (see hashOtp()). Configure OTP_HASH_SECRET in production
    // so hashes survive app restarts; falls back to a random in-memory key otherwise.
    @Value("${app.security.otp-secret:}")
    private String configuredOtpSecret;

    private byte[] otpSecretBytes;
    // BCrypt hash of a random value, used only to keep authenticate() roughly constant-time
    // for unknown emails (mitigates timing-based user enumeration).
    private String dummyPasswordHash;

    @PostConstruct
    private void init() {
        if (configuredOtpSecret != null && !configuredOtpSecret.isBlank()) {
            otpSecretBytes = configuredOtpSecret.getBytes(StandardCharsets.UTF_8);
        } else {
            log.warn("[AUTH SERVICE] OTP_HASH_SECRET non configuré : utilisation d'une clé générée "
                    + "aléatoirement au démarrage. Les OTP déjà émis deviendront invalides après un "
                    + "redémarrage. Configurez OTP_HASH_SECRET en production.");
            byte[] random = new byte[32];
            new SecureRandom().nextBytes(random);
            otpSecretBytes = random;
        }
        dummyPasswordHash = passwordEncoder.encode(java.util.UUID.randomUUID().toString());
    }

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    /** Keyed hash of an OTP, bound to its token/challenge selector; never store the raw code. */
    private String hashOtp(String tokenSelector, String otp) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(otpSecretBytes, HMAC_ALGORITHM));
            byte[] result = mac.doFinal((tokenSelector + ":" + otp).getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(result);
        } catch (Exception e) {
            throw new IllegalStateException("Impossible de hacher le code OTP", e);
        }
    }

    /** Constant-time comparison of a candidate OTP against the stored keyed hash. */
    private boolean matchesOtp(String tokenSelector, String candidateOtp, String storedHash) {
        String candidateHash = hashOtp(tokenSelector, candidateOtp);
        return MessageDigest.isEqual(
                candidateHash.getBytes(StandardCharsets.UTF_8),
                storedHash.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Génère un ID séquentiel unique par rôle (ex: EXP-0001)
     */
    private String generateRegistrationId(String userType) {
        String prefix;
        switch (userType != null ? userType.toUpperCase() : "") {
            case "FORMATEUR":
                prefix = FORMATEUR_PREFIX;
                break;
            case "EVALUATEUR":
                prefix = EVALUATEUR_PREFIX;
                break;
            case "EXPERT":
            default:
                prefix = EXPERT_PREFIX;
        }
        // Compter le nombre d'utilisateurs existants pour ce rôle
        long count = userRepository.countByUserTypeIgnoreCase(userType);
        return String.format("%s-%04d", prefix, count + 1);
    }
    
    @Transactional
    public User registerOEC(OECSignupRequest request) {
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            User existing = existingUser.get();
            if (existing.getStatus() == UserStatus.REJECTED || existing.getStatus() == UserStatus.PENDING) {
                // Archive the old entry so the user can resubmit
                existing.setEmail(existing.getEmail() + "_archived_" + System.currentTimeMillis());
                userRepository.save(existing);
                userRepository.flush();
            } else {
                throw new RuntimeException("Un compte avec cet email existe déjà");
            }
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(
                        request.getPassword() != null && !request.getPassword().isBlank()
                                ? request.getPassword()
                                : java.util.UUID.randomUUID().toString()
                ))
                .fullName(request.getNomOrganisme())
                .role(UserRole.OEC)
                .organizationName(request.getNomOrganisme())
                .phone(request.getTelephone())
                .typeOrganisme(request.getTypeOrganisme())
                .adresseSiege(request.getAdresseSiege())
                .nomRepresentant(request.getNomRepresentant())
                .fonction(request.getFonction())
                .telephoneDirect(request.getTelephoneDirect())
                .emailProfessionnel(request.getEmailProfessionnel())
                .porteeAccreditation(request.getPorteeAccreditation())
                .typeDemande(request.getTypeDemande())
                .status(UserStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        
        // Sauvegarder les documents joints si présents
        if (request.getDocuments() != null && !request.getDocuments().isEmpty()) {
            try {
                user.setDocumentsJson(objectMapper.writeValueAsString(request.getDocuments()));
            } catch (JsonProcessingException e) {
                log.warn("Erreur lors de la sérialisation des documents OEC : {}", e.getMessage());
            }
        }
        
        user = userRepository.save(user);
        log.info("Nouvel OEC enregistré : {}", user.getOrganizationName());
        
        return user;
    }
    
    /**
     * Soumet un recours pour un candidat blacklisté
     */
    @Transactional
    public void submitBlacklistAppeal(String email, String message) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Aucun compte trouvé avec cet email");
        }
        User user = userOpt.get();
        if (user.getBlacklisted() == null || !user.getBlacklisted()) {
            throw new RuntimeException("Ce compte n'est pas concerné par un recours");
        }
        
        // Notify GES_COMPETENCES managers about the appeal
        java.util.List<User> gesUsers = userRepository.findByRole(UserRole.GES_COMPETENCES);
        String appealMessage = message != null && !message.isBlank() ? message : "Aucun message fourni";
        for (User ges : gesUsers) {
            try {
                emailService.sendBlacklistAppealNotification(ges, user, appealMessage);
            } catch (Exception e) {
                log.warn("Erreur envoi email recours à {} : {}", ges.getEmail(), e.getMessage());
            }
        }
        
        log.info("Recours soumis par {} (blacklisté)", email);
    }
    
    @Transactional
    public User registerExpert(ExpertSignupRequest request) {
        Optional<User> existingExpert = userRepository.findByEmail(request.getEmail());
        if (existingExpert.isPresent()) {
            User existing = existingExpert.get();
            if (existing.getBlacklisted() != null && existing.getBlacklisted()) {
                throw new RuntimeException("BLACKLISTED:Cette adresse email est bloquée suite à une décision précédente.");
            }
            if (existing.getStatus() == UserStatus.REJECTED) {
                // Keep old record: change email to archive it
                String archivedEmail = existing.getEmail() + "_archived_" + System.currentTimeMillis();
                existing.setEmail(archivedEmail);
                userRepository.save(existing);
                userRepository.flush();
            } else {
                throw new RuntimeException("Un compte avec cet email existe déjà");
            }
        }
        
        String fullName = request.getPrenom() + " " + request.getNom();
        
        String registrationId = generateRegistrationId(request.getUserType());
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString())) // Secure temporary password
            .fullName(fullName)
            .role(UserRole.EXPERT)
            .phone(request.getTelephone())
            // Section 1: Identification
            .nom(request.getNom())
            .prenom(request.getPrenom())
            .dateNaissance(request.getDateNaissance())
            .nationalite(request.getNationalite())
            .situationFamiliale(request.getSituationFamiliale())
            .photoBase64(request.getPhotoBase64())
            // Section 2: Contacts
            .telephoneMobile(request.getTelephoneMobile())
            .fax(request.getFax())
            .adresseDomicile(request.getAdresseDomicile())
            .adresseEntreprise(request.getAdresseEntreprise())
            .wilaya(request.getWilaya())
            .contactUrgenceNom(request.getContactUrgenceNom())
            .contactUrgenceTelephone(request.getContactUrgenceTelephone())
            .contactUrgenceMobile(request.getContactUrgenceMobile())
            // Domaine d'expertise
            .domaineExpertise(request.getDomaineExpertise())
            .sousDomaineExpertise(request.getSousDomaineExpertise())
            // Section 8: Divers
            .informationsComplementaires(request.getInformationsComplementaires())
            // Ajout userType
            .userType(request.getUserType())
            // Nouvel ID d'inscription
            .registrationId(registrationId)
            // Status
            .status(UserStatus.PENDING)
            .createdAt(LocalDateTime.now())
            .build();
        
        // Convertir les listes en JSON
        try {
            if (request.getFormationsAcademiques() != null) {
                user.setFormationsAcademiquesJson(
                    objectMapper.writeValueAsString(request.getFormationsAcademiques())
                );
            }
            if (request.getAutresFormations() != null) {
                user.setAutresFormationsJson(
                    objectMapper.writeValueAsString(request.getAutresFormations())
                );
            }
            if (request.getExperiencesProfessionnelles() != null) {
                user.setExperiencesProfessionnellesJson(
                    objectMapper.writeValueAsString(request.getExperiencesProfessionnelles())
                );
            }
            if (request.getEvaluationsAudits() != null) {
                user.setEvaluationsAuditsJson(
                    objectMapper.writeValueAsString(request.getEvaluationsAudits())
                );
            }
            if (request.getFormationsDispensees() != null) {
                user.setFormationsDispenseesJson(
                    objectMapper.writeValueAsString(request.getFormationsDispensees())
                );
            }
            if (request.getConnaissancesLinguistiques() != null) {
                user.setConnaissancesLinguistiquesJson(
                    objectMapper.writeValueAsString(request.getConnaissancesLinguistiques())
                );
            }
            if (request.getDocuments() != null && !request.getDocuments().isEmpty()) {
                user.setDocumentsJson(
                    objectMapper.writeValueAsString(request.getDocuments())
                );
            }
        } catch (JsonProcessingException e) {
            log.error("Erreur lors de la conversion des données JSON : {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la conversion des données", e);
        }
        
        user = userRepository.save(user);
        log.info("Nouvel Expert enregistré : {}", user.getFullName());
        
        // L'envoi d'email est désormais géré dans le contrôleur uniquement
        
        return user;
    }
    
    public User authenticate(String email, String password) {
        // Single generic error for unknown email vs wrong password, to avoid revealing
        // whether an email is registered (user-enumeration protection).
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Still run a BCrypt comparison against a dummy hash so the response time is
            // roughly the same as a real account with a wrong password.
            passwordEncoder.matches(password, dummyPasswordHash);
            throw new RuntimeException("INVALID_CREDENTIALS");
        }
        
        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("INVALID_CREDENTIALS");
        }
        
        if (user.getStatus() != UserStatus.APPROVED) {
            throw new RuntimeException("Votre compte n'est pas encore approuvé");
        }
        
        return user;
    }
    
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElse(null);
    }

    // Message unique pour tous les cas d'échec de vérification du code de connexion.
    private static final String LOGIN_OTP_GENERIC_ERROR = "Code invalide ou expiré. Veuillez recommencer la connexion.";
    private static final int MAX_LOGIN_OTP_ATTEMPTS = 5;

    /**
     * Démarre le second facteur d'authentification après validation du mot de passe :
     * génère un OTP, l'envoie par email et retourne un token de challenge (cookie).
     */
    @Transactional
    public String initiateTwoFactorChallenge(User user) {
        String challenge = java.util.UUID.randomUUID().toString();
        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));

        loginTwoFactorTokenRepository.deleteByUser(user);
        LoginTwoFactorToken twoFactorToken = LoginTwoFactorToken.builder()
                .token(challenge)
                .otpHash(hashOtp(challenge, otp))
                .attempts(0)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(5))
                .build();
        loginTwoFactorTokenRepository.save(twoFactorToken);

        try {
            emailService.sendLoginOtp(user, otp);
        } catch (Exception e) {
            log.warn("[AUTH SERVICE] Erreur envoi email 2FA (challenge toujours valide): {}", e.getMessage());
        }

        return challenge;
    }

    /**
     * Renvoie un nouveau code pour un challenge de connexion déjà émis (même utilisateur).
     */
    @Transactional
    public void resendTwoFactorChallenge(String challenge) {
        Optional<LoginTwoFactorToken> tokenOpt = loginTwoFactorTokenRepository.findByToken(challenge);
        if (tokenOpt.isEmpty()) {
            throw new RuntimeException(LOGIN_OTP_GENERIC_ERROR);
        }
        User user = tokenOpt.get().getUser();
        initiateTwoFactorChallenge(user);
    }

    /**
     * Vérifie l'OTP de connexion et retourne l'utilisateur si valide (crée la session côté contrôleur).
     */
    // noRollbackFor: the increment/delete below must commit even though the method signals
    // failure via a thrown RuntimeException.
    @Transactional(noRollbackFor = RuntimeException.class)
    public User verifyLoginOtp(String challenge, String otp) {
        String cleanedOtp = otp != null ? otp.trim() : "";

        Optional<LoginTwoFactorToken> tokenOpt = loginTwoFactorTokenRepository.findByToken(challenge);
        if (tokenOpt.isEmpty()) {
            throw new RuntimeException(LOGIN_OTP_GENERIC_ERROR);
        }

        LoginTwoFactorToken twoFactorToken = tokenOpt.get();
        if (twoFactorToken.isExpired() || twoFactorToken.getAttempts() >= MAX_LOGIN_OTP_ATTEMPTS) {
            loginTwoFactorTokenRepository.delete(twoFactorToken);
            throw new RuntimeException(LOGIN_OTP_GENERIC_ERROR);
        }

        if (!matchesOtp(challenge, cleanedOtp, twoFactorToken.getOtpHash())) {
            twoFactorToken.setAttempts(twoFactorToken.getAttempts() + 1);
            loginTwoFactorTokenRepository.save(twoFactorToken);
            throw new RuntimeException(LOGIN_OTP_GENERIC_ERROR);
        }

        User user = twoFactorToken.getUser();
        loginTwoFactorTokenRepository.delete(twoFactorToken);
        return user;
    }

    /**
     * Initie la procédure de récupération du mot de passe
     * Génère un OTP et l'envoie par email
     */
    @Transactional
    public String forgotPassword(String email) {
        log.info("[AUTH SERVICE] Forgot password pour: {}", email);
        
        // Toujours renvoyer un token, même si l'email est inconnu, pour ne pas révéler
        // l'existence d'un compte (protection contre l'énumération d'emails).
        String token = java.util.UUID.randomUUID().toString();
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("[AUTH SERVICE] Email inconnu, réponse générique renvoyée sans envoi.");
            return token;
        }
        
        User user = userOpt.get();
        
        // Générer un code OTP à 6 chiffres
        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        
        // Supprimer les anciens tokens pour cet utilisateur
        passwordResetTokenRepository.deleteByUser(user);
        
        // Stocker le token (sélecteur opaque) et le hash de l'OTP séparément
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .otpHash(hashOtp(token, otp))
                .verified(false)
                .attempts(0)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();
        passwordResetTokenRepository.save(resetToken);
        
        // Envoyer l'OTP par email
        try {
            emailService.sendOtpResetPassword(user, otp);
            log.info("[AUTH SERVICE] Email OTP envoyé avec succès");
        } catch (Exception e) {
            log.warn("[AUTH SERVICE] Erreur envoi email (token toujours valide): {}", e.getMessage());
        }
        
        return token;
    }

    /**
     * Vérifie l'OTP saisi par l'utilisateur
     */
    // Message unique pour tous les cas d'échec de vérification (token inconnu, expiré ou
    // OTP erroné) afin de ne pas révéler si l'email associé existe réellement.
    private static final String OTP_GENERIC_ERROR = "Code ou lien invalide. Veuillez redemander un nouveau code.";
    private static final int MAX_OTP_ATTEMPTS = 5;

    // noRollbackFor: the increment/delete below must commit even though the method signals
    // failure via a thrown RuntimeException (Spring's default would otherwise roll both back).
    @Transactional(noRollbackFor = RuntimeException.class)
    public void verifyOtp(String token, String otp) {
        log.info("[AUTH SERVICE] Vérification OTP (token masqué)");
        
        // Nettoyer l'OTP (enlever espaces, etc.)
        String cleanedOtp = otp != null ? otp.trim() : "";
        
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            log.warn("[AUTH SERVICE] Token introuvable");
            throw new RuntimeException(OTP_GENERIC_ERROR);
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        
        // Vérifier l'expiration et le nombre de tentatives
        if (resetToken.isExpired() || resetToken.getAttempts() >= MAX_OTP_ATTEMPTS) {
            log.warn("[AUTH SERVICE] Token expiré ou nombre max de tentatives atteint");
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException(OTP_GENERIC_ERROR);
        }
        
        if (!matchesOtp(token, cleanedOtp, resetToken.getOtpHash())) {
            log.warn("[AUTH SERVICE] OTP incorrect");
            resetToken.setAttempts(resetToken.getAttempts() + 1);
            passwordResetTokenRepository.save(resetToken);
            throw new RuntimeException(OTP_GENERIC_ERROR);
        }
        
        resetToken.setVerified(true);
        passwordResetTokenRepository.save(resetToken);
        log.info("[AUTH SERVICE] ✅ OTP vérifié avec succès");
    }

    /**
     * Réinitialise le mot de passe après vérification de l'OTP
     */
    // noRollbackFor: the expired-token cleanup delete below must commit even on failure.
    @Transactional(noRollbackFor = RuntimeException.class)
    public void resetPassword(String token, String newPassword) {
        log.info("[AUTH SERVICE] Reset password (token masqué)");
        
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            log.warn("[AUTH SERVICE] Token introuvable");
            throw new RuntimeException("Lien invalide.");
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        
        // Vérifier l'expiration
        if (resetToken.isExpired()) {
            log.warn("[AUTH SERVICE] Token expiré");
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException("Lien expiré. Veuillez recommencer la procédure.");
        }
        
        // Le mot de passe ne peut être changé qu'après vérification réussie de l'OTP
        // (empêche un attaquant disposant uniquement du cookie de token de réinitialiser
        // le mot de passe sans connaître le code envoyé par email).
        if (!resetToken.isVerified()) {
            log.warn("[AUTH SERVICE] Tentative de reset sans vérification OTP préalable");
            throw new RuntimeException("Veuillez d'abord vérifier le code reçu par email.");
        }
        
        User user = resetToken.getUser();
        
        validatePasswordStrength(newPassword);
        
        // Vérifier que le nouveau mot de passe n'est pas identique à l'ancien
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            log.warn("[AUTH SERVICE] Tentative de réutilisation du mot de passe actuel");
            throw new RuntimeException("Le nouveau mot de passe doit être différent de l'ancien.");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        // Marks all sessions created before this instant as stale; AuthenticationFilter
        // forces them to re-authenticate so a stolen/active session can't survive a reset.
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);
        
        // Supprimer le token utilisé
        passwordResetTokenRepository.delete(resetToken);
        
        log.info("[AUTH SERVICE] Mot de passe réinitialisé pour: {}", user.getEmail());
    }

    private static final int PASSWORD_MIN_LENGTH = 12;

    /**
     * Applique la politique de mot de passe (alignée sur les paramètres par défaut
     * de AdminSecurityController: 12 caractères min., majuscule, minuscule, chiffre, spécial).
     */
    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < PASSWORD_MIN_LENGTH) {
            throw new RuntimeException("Le mot de passe doit contenir au moins " + PASSWORD_MIN_LENGTH + " caractères.");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("Le mot de passe doit contenir au moins une lettre majuscule.");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new RuntimeException("Le mot de passe doit contenir au moins une lettre minuscule.");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new RuntimeException("Le mot de passe doit contenir au moins un chiffre.");
        }
        if (!password.matches(".*[^A-Za-z0-9].*")) {
            throw new RuntimeException("Le mot de passe doit contenir au moins un caractère spécial.");
        }
    }
    
}