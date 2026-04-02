package com.algerac.service;

import com.algerac.dto.ExpertSignupRequest;
import com.algerac.dto.OECSignupRequest;
import com.algerac.model.PasswordResetToken;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.model.UserStatus;
import com.algerac.repository.PasswordResetTokenRepository;
import com.algerac.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    private static final String EXPERT_PREFIX = "EXP";
    private static final String EVALUATEUR_PREFIX = "EVA";
    private static final String FORMATEUR_PREFIX = "FOR";

    /**
     * Génère un ID séquentiel unique par rôle (ex: EXP-0001)
     */
    private String generateRegistrationId(String userType) {
        String prefix;
        switch (userType != null ? userType.toUpperCase() : "") {
            case "EVALUATEUR":
                prefix = EVALUATEUR_PREFIX;
                break;
            case "FORMATEUR":
                prefix = FORMATEUR_PREFIX;
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
            if (existingUser.get().getStatus() == UserStatus.REJECTED) {
                userRepository.delete(existingUser.get());
                userRepository.flush();
            } else {
                throw new RuntimeException("Un compte avec cet email existe déjà");
            }
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString())) // Secure temporary password
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
            .contactUrgenceNom(request.getContactUrgenceNom())
            .contactUrgenceTelephone(request.getContactUrgenceTelephone())
            .contactUrgenceMobile(request.getContactUrgenceMobile())
            // Domaine d'expertise
            .domaineExpertise(request.getDomaineExpertise())
            .sousDomaineExpertise(request.getSousDomaineExpertise())
            // OEC Data consent
            .consentOecData(request.getConsentOecData())
            .consentOecDataDetails(request.getConsentOecDataDetails())
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
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return null;
        }
        
        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return null;
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

    /**
     * Initie la procédure de récupération du mot de passe
     * Génère un OTP et l'envoie par email
     */
    @Transactional
    public String forgotPassword(String email) {
        log.info("[AUTH SERVICE] Forgot password pour: {}", email);
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Aucun utilisateur avec cet email.");
        }
        
        User user = userOpt.get();
        
        // Générer un code OTP à 6 chiffres
        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        log.info("[AUTH SERVICE] OTP généré pour {}", email);
        
        // Token unique pour le frontend (UUID)
        String token = java.util.UUID.randomUUID().toString();
        
        // Supprimer les anciens tokens pour cet utilisateur
        passwordResetTokenRepository.deleteByUser(user);
        
        // Stocker le token et OTP (format: token:otp)
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token + ":" + otp)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();
        passwordResetTokenRepository.save(resetToken);
        
        // Envoyer l'OTP par email
        try {
            emailService.sendOtpResetPassword(user, otp);
            log.info("[AUTH SERVICE] Email OTP envoyé avec succès");
        } catch (Exception e) {
            log.error("[AUTH SERVICE] Erreur envoi email: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'email.");
        }
        
        return token;
    }

    /**
     * Vérifie l'OTP saisi par l'utilisateur
     */
    @Transactional(readOnly = true)
    public void verifyOtp(String token, String otp) {
        log.info("[AUTH SERVICE] Vérification OTP pour token: {}", token);
        
        // Nettoyer l'OTP (enlever espaces, etc.)
        String cleanedOtp = otp != null ? otp.trim() : "";
        
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByTokenStartingWith(token);
        if (tokenOpt.isEmpty()) {
            log.warn("[AUTH SERVICE] Token introuvable: {}", token);
            throw new RuntimeException("Lien ou code invalide.");
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        
        // Vérifier l'expiration
        if (resetToken.isExpired()) {
            log.warn("[AUTH SERVICE] Token expiré: {}", resetToken.getExpiryDate());
            throw new RuntimeException("Code expiré. Veuillez redemander un nouveau code.");
        }
        
        // Extraire et vérifier l'OTP
        String[] parts = resetToken.getToken().split(":");
        
        if (parts.length != 2) {
            log.error("[AUTH SERVICE] Format de token invalide. Token: '{}'", resetToken.getToken());
            throw new RuntimeException("Format de token invalide.");
        }
        
        String storedOtp = parts[1].trim();
        
        if (!storedOtp.equals(cleanedOtp)) {
            log.warn("[AUTH SERVICE] OTP incorrect pour token: {}", token);
            throw new RuntimeException("Code incorrect.");
        }
        
        log.info("[AUTH SERVICE] ✅ OTP vérifié avec succès");
    }

    /**
     * Réinitialise le mot de passe après vérification de l'OTP
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("[AUTH SERVICE] Reset password pour token: {}", token);
        
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByTokenStartingWith(token);
        if (tokenOpt.isEmpty()) {
            log.warn("[AUTH SERVICE] Token introuvable");
            throw new RuntimeException("Lien invalide.");
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        
        // Vérifier l'expiration
        if (resetToken.isExpired()) {
            log.warn("[AUTH SERVICE] Token expiré");
            throw new RuntimeException("Lien expiré. Veuillez recommencer la procédure.");
        }
        
        User user = resetToken.getUser();
        
        // Vérifier que le nouveau mot de passe n'est pas identique à l'ancien
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            log.warn("[AUTH SERVICE] Tentative de réutilisation du mot de passe actuel");
            throw new RuntimeException("Le nouveau mot de passe doit être différent de l'ancien.");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Supprimer le token utilisé
        passwordResetTokenRepository.delete(resetToken);
        
        log.info("[AUTH SERVICE] Mot de passe réinitialisé pour: {}", user.getEmail());
    }
    
}