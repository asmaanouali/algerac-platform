

package com.algerac.controller;

import com.algerac.dto.*;
import com.algerac.model.OECApplication;
import com.algerac.model.User;
import com.algerac.repository.UserRepository;
import com.algerac.service.AuthService;
import com.algerac.service.EmailService;
import com.algerac.service.OECApplicationService;
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
    private final UserRepository userRepository;
    private final OECApplicationService oecApplicationService;

    // === MOT DE PASSE OUBLIE ===
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("[CONTROLLER] Forgot password: {}", request.getEmail());
        try {
            String token = authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(ApiResponse.success("Code envoyé à l'email.", token));
        } catch (RuntimeException e) {
            log.error("[CONTROLLER] Erreur: {}", e.getMessage());
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
            
            // Envoyer l'email avec le PDF DOC1 à ALGERAC
            emailService.sendOECRegistrationNotification(user);
            
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
            
            // Envoyer l'email avec le PDF FOR 20 à ALGERAC
            emailService.sendExpertRegistrationNotification(user);
            
            // Envoyer l'email de confirmation au candidat
            emailService.sendConfirmationToUser(user);
            
            log.info("Candidature Expert créée avec succès (User PENDING) - ID: {}, Nom: {} {}", 
                    user.getId(), user.getNom(), user.getPrenom());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Votre candidature a bien été enregistrée. Vous recevrez un email dès qu'elle sera examinée par la Direction Technique.",
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
    
    @GetMapping("/health")
    public ResponseEntity<ApiResponse> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success("API is running"));
    }
}