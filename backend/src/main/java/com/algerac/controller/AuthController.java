

package com.algerac.controller;

import com.algerac.dto.*;
import com.algerac.model.User;
import com.algerac.model.PasswordResetToken;
import com.algerac.repository.PasswordResetTokenRepository;
import com.algerac.repository.UserRepository;
import com.algerac.service.AuthService;
import com.algerac.service.EmailService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
public class AuthController {
    private final AuthService authService;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // === MOT DE PASSE OUBLIE ===
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("[FORGOT PASSWORD] Body reçu: email={}", request.getEmail());
        var userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Aucun utilisateur avec cet email."));
        }
        var user = userOpt.get();
        // Générer un code OTP à 6 chiffres
        String otp = String.format("%06d", new Random().nextInt(1_000_000));
        // Token unique pour le frontend (UUID ou random)
        String token = java.util.UUID.randomUUID().toString();
        // Supprimer les anciens tokens pour cet utilisateur
        passwordResetTokenRepository.deleteByUser(user);
        // Stocker le token et OTP (concaténé ou séparé)
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token + ":" + otp)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();
        passwordResetTokenRepository.save(resetToken);
        // Envoyer l'OTP par email
        emailService.sendOtpResetPassword(user, otp);
        return ResponseEntity.ok(ApiResponse.success("Code envoyé à l'email.", token));
    }

    // === VERIFICATION OTP ===
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        var tokenOpt = passwordResetTokenRepository.findByTokenStartingWith(request.getToken());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lien ou code invalide."));
        }
        var resetToken = tokenOpt.get();
        if (resetToken.isExpired()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Code expiré."));
        }
        String[] parts = resetToken.getToken().split(":");
        if (parts.length != 2 || !parts[1].equals(request.getOtp())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Code incorrect."));
        }
        return ResponseEntity.ok(ApiResponse.success("Code vérifié."));
    }

    // === RESET PASSWORD ===
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        var tokenOpt = passwordResetTokenRepository.findByTokenStartingWith(request.getToken());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lien invalide."));
        }
        var resetToken = tokenOpt.get();
        if (resetToken.isExpired()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lien expiré."));
        }
        var user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);
        return ResponseEntity.ok(ApiResponse.success("Mot de passe réinitialisé."));
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
    
    // === OEC REGISTRATION ===
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
            User user = authService.registerOEC(request);
            emailService.sendOECRegistrationNotification(user);
            emailService.sendConfirmationToUser(user);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Inscription réussie ! Votre demande est en cours d'examen.",
                            user.getId()
                    ));
        } catch (RuntimeException e) {
            log.error("Erreur lors de l'inscription OEC : {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'inscription OEC", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue. Veuillez réessayer."));
        }
    }
    
    // === EXPERT REGISTRATION (UPDATED FOR FOR 20) ===
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
            // Créer l'utilisateur dans la base de données
            User user = authService.registerExpert(request);
            
            // Envoyer l'email avec le PDF FOR 20
            emailService.sendExpertRegistrationNotification(user);
            
            // Envoyer l'email de confirmation à l'utilisateur
            emailService.sendConfirmationToUser(user);
            
            log.info("Inscription Expert réussie et PDF envoyé pour {} {}", 
                    user.getNom(), user.getPrenom());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Inscription réussie ! Votre formulaire FOR 20 a été généré et envoyé à ALGERAC.",
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