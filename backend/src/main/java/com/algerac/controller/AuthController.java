

package com.algerac.controller;

import com.algerac.dto.*;
import com.algerac.model.User;
import com.algerac.model.OECApplication;
import com.algerac.repository.UserRepository;
import com.algerac.repository.OECApplicationRepository;
import com.algerac.service.AuthService;
import com.algerac.service.EmailService;
import com.algerac.service.NotificationService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
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

    // === MOT DE PASSE OUBLIE ===
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("[CONTROLLER] Forgot password: {}", request.getEmail());
        try {
            String result = authService.forgotPassword(request.getEmail());
            // result format: "token|otp"
            String[] parts = result.split("\\|", 2);
            String token = parts[0];
            String otp = parts.length > 1 ? parts[1] : null;
            log.info("[CONTROLLER][DEV] OTP for {}: {}", request.getEmail(), otp);
            return ResponseEntity.ok(ApiResponse.success("Code envoyé à l'email.", token));
        } catch (RuntimeException e) {
            log.error("[CONTROLLER] Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // === [DEV] GET OTP BY EMAIL ===
    @GetMapping("/dev/otp")
    public ResponseEntity<ApiResponse> getDevOtp(@RequestParam String email) {
        try {
            String otp = authService.getDevOtp(email);
            return ResponseEntity.ok(ApiResponse.success("OTP actuel.", otp));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // === VERIFICATION OTP ===
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        log.info("[CONTROLLER] Verify OTP - Token: {}, OTP: '{}'", request.getToken(), request.getOtp());
        try {
            authService.verifyOtp(request.getToken(), request.getOtp());
            return ResponseEntity.ok(ApiResponse.success("Code vérifié avec succès."));
        } catch (RuntimeException e) {
            log.error("[CONTROLLER] Erreur vérification OTP: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // === RESET PASSWORD ===
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("[CONTROLLER] Reset password pour token: {}", request.getToken());
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
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
            BindingResult bindingResult) {
        
        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getAllErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(errors));
        }
        
        try {
            User user = authService.authenticate(request.getEmail(), request.getPassword());
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Email ou mot de passe incorrect"));
            }
            
            // Store user in session
            session.setAttribute("userId", user.getId());
            session.setAttribute("userRole", user.getRole());
            
            log.info("Connexion réussie pour : {}", user.getEmail());
            
            return ResponseEntity.ok(UserDTO.fromUser(user));
        } catch (RuntimeException e) {
            log.error("Erreur lors de la connexion : {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la connexion", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue"));
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
            
            // Envoyer email de confirmation à l'OEC
            emailService.sendOECRegistrationConfirmation(user);
            
            // Envoyer notification au DT (sans DOC1 en pièce jointe)
            emailService.sendDTNewOECNotification(user);
            
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
            emailService.sendExpertRegistrationConfirmation(user);
            
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
}