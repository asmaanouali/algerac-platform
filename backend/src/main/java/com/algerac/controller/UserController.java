package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.UserDTO;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.model.UserStatus;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * Récupérer tous les utilisateurs (pour l'admin)
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String role,
            HttpSession session) {
        // Optional: log if user is authenticated
        Long userId = (Long) session.getAttribute("userId");
        if (userId != null) {
            log.info("User {} fetching users", userId);
        }
        
        try {
            List<User> users;
            
            // Si un rôle est spécifié, filtrer par rôle
            if (role != null && !role.isEmpty()) {
                try {
                    UserRole userRole = UserRole.valueOf(role.toUpperCase());
                    users = userRepository.findByRole(userRole);
                    log.info("Récupération des utilisateurs avec le rôle {}", userRole);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Rôle invalide: " + role));
                }
            } else {
                users = userRepository.findAll();
            }
            
            List<UserDTO> userDTOs = users.stream()
                    .map(UserDTO::fromUser)
                    .collect(Collectors.toList());
            
            log.info("Récupération de {} utilisateurs", userDTOs.size());
            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des utilisateurs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des utilisateurs"));
        }
    }
    
    /**
     * Récupérer un utilisateur par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, HttpSession session) {
        // Vérifier l'authentification
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            return ResponseEntity.ok(UserDTO.fromUser(user));
        } catch (RuntimeException e) {
            log.error("Utilisateur non trouvé: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Utilisateur non trouvé"));
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'utilisateur", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération de l'utilisateur"));
        }
    }
    
    /**
     * Récupérer tous les utilisateurs par rôle
     */
    @GetMapping("/by-role/{role}")
    public ResponseEntity<?> getUsersByRole(@PathVariable String role, HttpSession session) {
        // Optional: log if user is authenticated
        Long userId = (Long) session.getAttribute("userId");
        if (userId != null) {
            log.info("User {} fetching users with role {}", userId, role);
        }
        
        try {
            UserRole userRole = UserRole.valueOf(role.toUpperCase());
            List<User> users = userRepository.findByRole(userRole);
            
            List<UserDTO> userDTOs = users.stream()
                    .map(UserDTO::fromUser)
                    .collect(Collectors.toList());
            
            log.info("Récupération de {} utilisateurs avec le rôle {}", userDTOs.size(), userRole);
            return ResponseEntity.ok(userDTOs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Rôle invalide: " + role));
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des utilisateurs par rôle", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des utilisateurs"));
        }
    }
    
    /**
     * Créer un nouvel utilisateur (admin uniquement)
     */
    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request, HttpSession session) {
        // Vérifier l'authentification et les droits admin
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            // Vérifier si l'email existe déjà
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Un utilisateur avec cet email existe déjà"));
            }
            
            // Créer le nouvel utilisateur
            User newUser = User.builder()
                    .nom(request.getNom())
                    .prenom(request.getPrenom())
                    .email(request.getEmail())
                    .telephone(request.getTelephone())
                    .role(UserRole.valueOf(request.getRole()))
                    .password(passwordEncoder.encode(request.getPassword()))
                    .status(UserStatus.APPROVED)
                    .build();
            
            User savedUser = userRepository.save(newUser);
            log.info("Nouvel utilisateur créé par admin: {} - {}", savedUser.getEmail(), savedUser.getRole());
            
            return ResponseEntity.ok(UserDTO.fromUser(savedUser));
        } catch (IllegalArgumentException e) {
            log.error("Rôle invalide: {}", request.getRole());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Rôle invalide: " + request.getRole()));
        } catch (Exception e) {
            log.error("Erreur lors de la création de l'utilisateur", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la création de l'utilisateur"));
        }
    }
    
    /**
     * Classe interne pour la requête de création d'utilisateur
     */
    @lombok.Data
    public static class CreateUserRequest {
        private String nom;
        private String prenom;
        private String email;
        private String telephone;
        private String role;
        private String password;
    }
}
