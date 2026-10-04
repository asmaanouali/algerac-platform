

package com.algerac.controller;

import com.algerac.dto.*;
import com.algerac.model.SystemLog;
import com.algerac.model.User;
import com.algerac.model.OECApplication;
import com.algerac.model.RequestType;
import com.algerac.repository.UserRepository;
import com.algerac.repository.OECApplicationRepository;
import com.algerac.repository.SystemLogRepository;
import com.algerac.repository.SystemSettingRepository;
import com.algerac.service.AuthService;
import com.algerac.service.EmailService;
import com.algerac.service.NotificationService;
import com.algerac.service.RateLimiterService;
import com.algerac.service.RequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final AuthService authService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final OECApplicationRepository oecApplicationRepository;
    private final RequestService requestService;
    private final RateLimiterService rateLimiterService;
    private final SystemSettingRepository systemSettingRepository;
    private final SystemLogRepository systemLogRepository;

    private static final String RESET_TOKEN_COOKIE = "pwd_reset_token";
    private static final String LOGIN_2FA_COOKIE = "login_2fa_token";

    @Value("${server.servlet.session.cookie.secure:false}")
    private boolean cookieSecure;

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /** Partially redacts a secret token so it can be correlated in logs without exposing it fully. */
    private static String maskToken(String token) {
        if (token == null || token.length() <= 8) {
            return "****";
        }
        return token.substring(0, 4) + "…" + token.substring(token.length() - 4);
    }

    /** Persists a security-relevant event to the SystemLog audit trail (admin Security > Audit Logs). */
    private void audit(String level, String module, String identifier, String ip, String message) {
        try {
            systemLogRepository.save(SystemLog.builder()
                    .timestamp(LocalDateTime.now())
                    .level(level)
                    .module(module)
                    .message(message)
                    .username(identifier)
                    .sourceIp(ip)
                    .build());
        } catch (Exception e) {
            log.warn("AuthController: unable to persist audit log entry - {}", e.getMessage());
        }
    }

    private String getSetting(String key, String defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(com.algerac.model.SystemSetting::getSettingValue)
                .filter(v -> v != null && !v.isBlank())
                .orElse(defaultValue);
    }

    private boolean getSettingBool(String key, boolean defaultValue) {
        return Boolean.parseBoolean(getSetting(key, String.valueOf(defaultValue)));
    }

    private int getSettingInt(String key, int defaultValue) {
        try {
            return Integer.parseInt(getSetting(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private int maxAttempts() {
        return getSettingInt("maxLoginAttempts", 5);
    }

    private Duration lockoutDuration() {
        return Duration.ofMinutes(getSettingInt("lockoutDurationMinutes", 15));
    }

    /** Admin-configured IP allowlist check (settings: ipRestriction / ipWhitelist). */
    private boolean isIpAllowed(String clientIp) {
        boolean restricted = getSettingBool("ipRestriction", false) || getSettingBool("ipWhitelistEnabled", false);
        if (!restricted) {
            return true;
        }
        String whitelist = getSetting("ipWhitelist", "");
        if (whitelist.isBlank()) {
            return false; // restriction on but nothing whitelisted => deny by default
        }
        for (String entry : whitelist.split(",")) {
            String pattern = entry.trim();
            if (pattern.isEmpty()) continue;
            if (pattern.equals(clientIp)) return true;
            if (pattern.endsWith(".*") && clientIp.startsWith(pattern.substring(0, pattern.length() - 1))) return true;
        }
        return false;
    }

    /** Whether login must go through the email-OTP second factor before a session is created. */
    private boolean twoFactorRequired() {
        return getSettingBool("require2fa", false) || getSettingBool("twoFactorEnabled", false);
    }

    private void setResetTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(RESET_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(Duration.ofMinutes(15))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearResetTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(RESET_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void setLoginChallengeCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(LOGIN_2FA_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(Duration.ofMinutes(5))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearLoginChallengeCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(LOGIN_2FA_COOKIE, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void createSession(HttpSession session, User user) {
        session.setAttribute("userId", user.getId());
        session.setAttribute("userRole", user.getRole());
    }

    // === MOT DE PASSE OUBLIE ===
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        log.info("[CONTROLLER] Forgot password: {}", request.getEmail());
        String ip = clientIp(httpRequest);
        String rateLimitKey = "forgot:" + ip + ":" + request.getEmail().toLowerCase();
        try {
            rateLimiterService.assertNotLocked(rateLimitKey, "AUTH_FORGOT_PASSWORD", request.getEmail(), ip);
        } catch (RateLimiterService.RateLimitedException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.error(e.getMessage()));
        }
        rateLimiterService.recordFailure(rateLimitKey, maxAttempts(), lockoutDuration(), "AUTH_FORGOT_PASSWORD", request.getEmail(), ip);
        try {
            String token = authService.forgotPassword(request.getEmail());
            setResetTokenCookie(httpResponse, token);
            return ResponseEntity.ok(ApiResponse.success("Code envoyé à l'email."));
        } catch (RuntimeException e) {
            log.error("[CONTROLLER] Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // === VERIFICATION OTP ===
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request,
            @CookieValue(name = RESET_TOKEN_COOKIE, required = false) String token,
            HttpServletRequest httpRequest) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Session expirée. Veuillez recommencer la procédure."));
        }
        log.info("[CONTROLLER] Verify OTP - Token: {}", token);
        String ip = clientIp(httpRequest);
        String identifier = maskToken(token);
        String rateLimitKey = "otp:" + token;
        try {
            rateLimiterService.assertNotLocked(rateLimitKey, "AUTH_OTP_VERIFY", identifier, ip);
        } catch (RateLimiterService.RateLimitedException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.error(e.getMessage()));
        }
        try {
            authService.verifyOtp(token, request.getOtp());
            rateLimiterService.recordSuccess(rateLimitKey);
            return ResponseEntity.ok(ApiResponse.success("Code vérifié avec succès."));
        } catch (RuntimeException e) {
            rateLimiterService.recordFailure(rateLimitKey, maxAttempts(), lockoutDuration(), "AUTH_OTP_VERIFY", identifier, ip);
            log.error("[CONTROLLER] Erreur vérification OTP: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // === RESET PASSWORD ===
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
            @CookieValue(name = RESET_TOKEN_COOKIE, required = false) String token,
            HttpServletResponse httpResponse) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Session expirée. Veuillez recommencer la procédure."));
        }
        log.info("[CONTROLLER] Reset password pour token: {}", token);
        try {
            authService.resetPassword(token, request.getNewPassword());
            clearResetTokenCookie(httpResponse);
            return ResponseEntity.ok(ApiResponse.success("Mot de passe réinitialisé avec succès."));
        } catch (RuntimeException e) {
            log.error("[CONTROLLER] Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // === LOGIN endpoint ===
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpSession session,
            BindingResult bindingResult,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        
        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getAllErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(errors));
        }

        String clientIp = clientIp(httpRequest);
        if (!isIpAllowed(clientIp)) {
            log.warn("Connexion refusée pour IP non autorisée : {}", clientIp);
            audit("WARNING", "AUTH_LOGIN", request.getEmail(), clientIp, "Connexion refusée : IP non autorisée");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Connexion non autorisée depuis cette adresse IP."));
        }
        
        String rateLimitKey = "login:" + clientIp + ":" + request.getEmail().toLowerCase();
        try {
            rateLimiterService.assertNotLocked(rateLimitKey, "AUTH_LOGIN", request.getEmail(), clientIp);
        } catch (RateLimiterService.RateLimitedException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.error(e.getMessage()));
        }
        
        try {
            User user = authService.authenticate(request.getEmail(), request.getPassword());
            rateLimiterService.recordSuccess(rateLimitKey);

            if (twoFactorRequired()) {
                String challenge = authService.initiateTwoFactorChallenge(user);
                setLoginChallengeCookie(httpResponse, challenge);
                log.info("2FA requis, code envoyé pour : {}", user.getEmail());
                return ResponseEntity.ok(ApiResponse.success("Code de vérification envoyé à votre email.",
                        java.util.Map.of("twoFactorRequired", true)));
            }

            createSession(session, user);
            log.info("Connexion réussie pour : {}", user.getEmail());
            
            return ResponseEntity.ok(UserDTO.fromUser(user));
        } catch (RuntimeException e) {
            rateLimiterService.recordFailure(rateLimitKey, maxAttempts(), lockoutDuration(), "AUTH_LOGIN", request.getEmail(), clientIp);
            log.error("Erreur lors de la connexion : {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la connexion", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue"));
        }
    }

    // === VERIFY LOGIN OTP endpoint (2nd factor) ===
    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOtp(@Valid @RequestBody VerifyOtpRequest request,
            @CookieValue(name = LOGIN_2FA_COOKIE, required = false) String challenge,
            HttpSession session, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (challenge == null || challenge.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Session expirée. Veuillez recommencer la connexion."));
        }
        String ip = clientIp(httpRequest);
        String identifier = maskToken(challenge);
        String rateLimitKey = "login2fa:" + challenge;
        try {
            rateLimiterService.assertNotLocked(rateLimitKey, "AUTH_LOGIN_2FA_VERIFY", identifier, ip);
        } catch (RateLimiterService.RateLimitedException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.error(e.getMessage()));
        }
        try {
            User user = authService.verifyLoginOtp(challenge, request.getOtp());
            rateLimiterService.recordSuccess(rateLimitKey);
            clearLoginChallengeCookie(httpResponse);
            createSession(session, user);
            log.info("Connexion (2FA) réussie pour : {}", user.getEmail());
            return ResponseEntity.ok(UserDTO.fromUser(user));
        } catch (RuntimeException e) {
            rateLimiterService.recordFailure(rateLimitKey, maxAttempts(), lockoutDuration(), "AUTH_LOGIN_2FA_VERIFY", identifier, ip);
            log.error("[CONTROLLER] Erreur vérification OTP de connexion: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // === RESEND LOGIN OTP endpoint (2nd factor) ===
    @PostMapping("/resend-login-otp")
    public ResponseEntity<ApiResponse> resendLoginOtp(
            @CookieValue(name = LOGIN_2FA_COOKIE, required = false) String challenge,
            HttpServletRequest httpRequest) {
        if (challenge == null || challenge.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Session expirée. Veuillez recommencer la connexion."));
        }
        String ip = clientIp(httpRequest);
        String identifier = maskToken(challenge);
        String rateLimitKey = "login2faresend:" + ip + ":" + challenge;
        try {
            rateLimiterService.assertNotLocked(rateLimitKey, "AUTH_LOGIN_2FA_RESEND", identifier, ip);
        } catch (RateLimiterService.RateLimitedException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.error(e.getMessage()));
        }
        rateLimiterService.recordFailure(rateLimitKey, maxAttempts(), lockoutDuration(), "AUTH_LOGIN_2FA_RESEND", identifier, ip);
        try {
            authService.resendTwoFactorChallenge(challenge);
            return ResponseEntity.ok(ApiResponse.success("Nouveau code envoyé."));
        } catch (RuntimeException e) {
            log.error("[CONTROLLER] Erreur renvoi OTP de connexion: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // === LOGOUT endpoint ===
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(ApiResponse.success("Déconnexion réussie"));
    }
    
    // === GET CURRENT USER endpoint ===
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = authService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        return ResponseEntity.ok(UserDTO.fromUser(user));
    }
    
    // === SWITCH ROLE endpoint (for multi-role users) ===
    @PostMapping("/switch-role")
    public ResponseEntity<?> switchRole(
            @RequestBody java.util.Map<String, String> request,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }
        
        String roleName = request.get("role");
        if (roleName == null || roleName.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Le rôle est requis"));
        }
        
        try {
            com.algerac.model.UserRole newRole = com.algerac.model.UserRole.valueOf(roleName.toUpperCase());
            
            // Validate user actually has this role
            User user = authService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Utilisateur non trouvé"));
            }
            if (!user.hasRole(newRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Vous n'avez pas le rôle: " + roleName));
            }
            
            session.setAttribute("userRole", newRole);
            log.info("User {} switched role to {}", userId, newRole);
            return ResponseEntity.ok(ApiResponse.success("Rôle changé avec succès", newRole.name()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Rôle invalide: " + roleName));
        }
    }
    
    // === OEC REGISTRATION (UPDATED - Creates PENDING User) ===
    @PostMapping("/signup/oec")
    public ResponseEntity<ApiResponse> registerOEC(
            @Valid @RequestBody OECSignupRequest request,
            BindingResult bindingResult) {
        
        log.info("Réception d'une demande d'inscription OEC : {}", request.getNomOrganisme());
        
        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getAllErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            
            log.warn("Erreurs de validation pour OEC : {}", errors);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(errors));
        }
        
        try {
            // Créer un User PENDING au lieu de OECApplication
            User user = authService.registerOEC(request);
            
            // Créer aussi un OECApplication pour le workflow DT → DAG → Admin
            OECApplication oecApp = OECApplication.builder()
                    .nomOrganisme(request.getNomOrganisme())
                    .typeOrganisme(request.getTypeOrganisme())
                    .adresseSiege(request.getAdresseSiege())
                    .telephone(request.getTelephone())
                    .email(request.getEmail())
                    .nomRepresentant(request.getNomRepresentant())
                    .fonction(request.getFonction())
                    .telephoneDirect(request.getTelephoneDirect())
                    .emailProfessionnel(request.getEmailProfessionnel())
                    .porteeAccreditation(request.getPorteeAccreditation())
                    .typeDemande(request.getTypeDemande())
                    .formDataJson(request.getDescription())
                    .build();
            oecApplicationRepository.save(oecApp);
            
            // Créer aussi une AccreditationRequest en PENDING_DT_REVIEW pour que ce
            // nouvel OEC (sans compte) apparaisse dans la liste des demandes du DT
            // au même titre qu'un OEC existant. Le champ User.typeDemande sert de
            // discriminant côté UI ("Type demandeur").
            try {
                RequestType reqType = mapTypeDemande(request.getTypeDemande());
                requestService.createAndSubmitForNewOec(
                        user,
                        reqType,
                        request.getPorteeAccreditation(),
                        request.getDescription()
                );
            } catch (Exception e) {
                log.error("Erreur lors de la création de l'AccreditationRequest pour le nouvel OEC {} : {}",
                        user.getEmail(), e.getMessage(), e);
            }
            
            // Envoyer email de confirmation à l'OEC
            // L'échec d'envoi ne doit pas annuler l'inscription : le compte est déjà créé
            try {
                emailService.sendOECRegistrationConfirmation(user);
            } catch (Exception e) {
                log.error("Email de confirmation OEC non envoyé à {} : {}", user.getEmail(), e.getMessage());
            }
            
            // Envoyer notification au DT (sans DOC1 en pièce jointe)
            try {
                emailService.sendDTNewOECNotification(user);
            } catch (Exception e) {
                log.error("Notification DT (nouvel OEC) non envoyée : {}", e.getMessage());
            }
            
            log.info("Candidature OEC créée avec succès (User PENDING) - ID: {}, Organisme: {}", 
                    user.getId(), user.getOrganizationName());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Votre demande d'accréditation a bien été enregistrée. Vous recevrez un email dès qu'elle sera examinée par la Direction Technique.",
                            user.getId()
                    ));
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de la candidature OEC : {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la création de la candidature OEC", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue. Veuillez réessayer."));
        }
    }
    
    // === EXPERT REGISTRATION (UPDATED - Creates PENDING User) ===
    @PostMapping("/signup/expert")
    public ResponseEntity<ApiResponse> registerExpert(
            @Valid @RequestBody ExpertSignupRequest request,
            BindingResult bindingResult) {
        
        log.info("Réception d'une demande d'inscription Expert FOR 20 : {} {}", 
                request.getNom(), request.getPrenom());
        
        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getAllErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            
            log.warn("Erreurs de validation pour Expert : {}", errors);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(errors));
        }
        
        try {
            // Créer un User PENDING (déjà implémenté dans authService.registerExpert)
            // Le status sera automatiquement PENDING grâce au @PrePersist
            User user = authService.registerExpert(request);
            
            // Envoyer email de confirmation au candidat (ton professionnel, profil sera évalué)
            // L'échec d'envoi ne doit pas annuler l'inscription : le compte est déjà créé
            try {
                emailService.sendExpertRegistrationConfirmation(user);
            } catch (Exception e) {
                log.error("Email de confirmation Expert non envoyé à {} : {}", user.getEmail(), e.getMessage());
            }
            
            // Envoyer notification IN-APP au gestionnaire de compétences (PAS d'email)
            String typeLabel = user.getUserType() != null ? switch (user.getUserType().toUpperCase()) {
                case "FORMATEUR" -> "Formateur";
                case "EVALUATEUR" -> "Évaluateur";
                default -> "Expert";
            } : "Expert";
            
            java.util.List<com.algerac.model.User> gesUsers = userRepository.findByRole(com.algerac.model.UserRole.GES_COMPETENCES);
            for (com.algerac.model.User ges : gesUsers) {
                notificationService.createNotification(
                    ges.getId(),
                    "Nouvelle candidature " + typeLabel,
                    String.format("Nouvelle candidature %s de %s %s (%s). Domaine : %s. Veuillez examiner le dossier.",
                        typeLabel, user.getPrenom(), user.getNom(), user.getRegistrationId(),
                        user.getDomaineExpertise() != null ? user.getDomaineExpertise() : "Non renseigné"),
                    "info"
                );
            }
            
            log.info("Candidature Expert créée avec succès (User PENDING) - ID: {}, Nom: {} {}", 
                    user.getId(), user.getNom(), user.getPrenom());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Votre candidature a bien été enregistrée. Vous recevrez un email dès qu'elle sera examinée.",
                            user.getId()
                    ));
        } catch (RuntimeException e) {
            log.error("Erreur lors de l'inscription Expert : {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'inscription Expert", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue. Veuillez réessayer."));
        }
    }
    
    /**
     * Endpoint public pour qu'un candidat blacklisté puisse introduire un recours
     */
    @PostMapping("/appeal")
    public ResponseEntity<ApiResponse> submitAppeal(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        String message = request.get("message");
        
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("L'email est requis"));
        }
        
        log.info("Réception d'un recours pour l'email : {}", email);
        
        try {
            authService.submitBlacklistAppeal(email, message);
            return ResponseEntity.ok(ApiResponse.success(
                "Votre recours a bien été enregistré. Vous recevrez une réponse par email dans les meilleurs délais."
            ));
        } catch (RuntimeException e) {
            log.error("Erreur lors du recours : {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<ApiResponse> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success("API is running"));
    }

    private RequestType mapTypeDemande(String typeDemande) {
        if (typeDemande == null) return RequestType.INITIAL;
        return switch (typeDemande.toLowerCase()) {
            case "extension" -> RequestType.EXTENSION;
            case "renouvellement" -> RequestType.RENOUVELLEMENT;
            case "transfert" -> RequestType.EXTENSION;
            default -> RequestType.INITIAL;
        };
    }
}