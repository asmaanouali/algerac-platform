package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.ExpertSignupRequest;
import com.algerac.dto.OECSignupRequest;
import com.algerac.model.User;
import com.algerac.service.AuthService;
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
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/signup/oec")
    public ResponseEntity<ApiResponse> registerOEC(
            @Valid @RequestBody OECSignupRequest request,
            BindingResult bindingResult) {
        
        log.info("Réception d'une demande d'inscription OEC : {}", request.getNomOrganisme());
        
        // Vérifier les erreurs de validation
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
    
    @PostMapping("/signup/expert")
    public ResponseEntity<ApiResponse> registerExpert(
            @Valid @RequestBody ExpertSignupRequest request,
            BindingResult bindingResult) {
        
        log.info("Réception d'une demande d'inscription Expert : {} {}", 
                request.getNom(), request.getPrenom());
        
        // Vérifier les erreurs de validation
        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getAllErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            
            log.warn("Erreurs de validation pour Expert : {}", errors);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(errors));
        }
        
        try {
            User user = authService.registerExpert(request);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Inscription réussie ! Votre demande est en cours d'examen.",
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
