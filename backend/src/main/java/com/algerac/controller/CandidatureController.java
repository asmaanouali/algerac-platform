package com.algerac.controller;

import com.algerac.model.User;
import com.algerac.service.CandidatureService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidatures")
@RequiredArgsConstructor
@Slf4j
public class CandidatureController {

    private final CandidatureService candidatureService;

    /**
     * Récupère toutes les candidatures en attente (PENDING)
     * Accessible par DT
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingCandidatures(HttpSession session) {
        try {
            // Vérifier l'authentification
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                log.warn("Tentative d'accès non autorisé à /api/candidatures/pending");
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            log.info("GET /api/candidatures/pending - Récupération des candidatures en attente par userId: {}", userId);
            
            List<User> pendingUsers = candidatureService.getPendingCandidatures();
            log.info("Nombre de candidatures en attente : {}", pendingUsers.size());
            
            return ResponseEntity.ok(pendingUsers);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures en attente", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }

    /**
     * Récupère toutes les candidatures (tous statuts)
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllCandidatures(HttpSession session) {
        try {
            // Vérifier l'authentification
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            log.info("GET /api/candidatures/all - Récupération de toutes les candidatures");
            List<User> allUsers = candidatureService.getAllCandidatures();
            return ResponseEntity.ok(allUsers);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }

    /**
     * Récupère une candidature par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCandidatureById(@PathVariable Long id, HttpSession session) {
        try {
            // Vérifier l'authentification
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body("Non authentifié");
            }
            
            log.info("GET /api/candidatures/{} - Récupération d'une candidature", id);
            User user = candidatureService.getCandidatureById(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("Candidature non trouvée : {}", id);
            return ResponseEntity.status(404).body("Candidature non trouvée");
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de la candidature", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }
    
    /**
     * Récupère toutes les candidatures OEC en attente (PENDING)
     * Accessible par DT
     */
    @GetMapping("/oec/pending")
    public ResponseEntity<?> getPendingOECCandidatures(HttpSession session) {
        try {
            // Vérifier l'authentification
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                log.warn("Tentative d'accès non autorisé à /api/candidatures/oec/pending");
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            log.info("GET /api/candidatures/oec/pending - Récupération des candidatures OEC en attente par userId: {}", userId);
            
            List<User> pendingOECs = candidatureService.getPendingOECCandidatures();
            log.info("Nombre de candidatures OEC en attente : {}", pendingOECs.size());
            
            return ResponseEntity.ok(pendingOECs);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures OEC en attente", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }
    
    /**
     * Récupère toutes les candidatures OEC (tous statuts)
     * Accessible par DT
     */
    @GetMapping("/oec/all")
    public ResponseEntity<?> getAllOECCandidatures(HttpSession session) {
        try {
            // Vérifier l'authentification
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            log.info("GET /api/candidatures/oec/all - Récupération de toutes les candidatures OEC");
            List<User> allOECs = candidatureService.getAllOECCandidatures();
            return ResponseEntity.ok(allOECs);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures OEC", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }
    
    /**
     * Récupère les candidatures OEC approuvées en attente de création de compte
     * Accessible par Admin
     */
    @GetMapping("/oec/approved")
    public ResponseEntity<?> getApprovedOECCandidatures(HttpSession session) {
        try {
            // Vérifier l'authentification
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            log.info("GET /api/candidatures/oec/approved - Récupération des OEC approuvés en attente de compte");
            List<User> approvedOECs = candidatureService.getApprovedOECCandidatures();
            return ResponseEntity.ok(approvedOECs);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des OEC approuvés", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }
    
    /**
     * Crée un compte pour un OEC approuvé
     * Accessible par Admin
     */
    @PostMapping("/oec/{id}/create-account")
    public ResponseEntity<?> createOECAccount(@PathVariable Long id, HttpSession session) {
        try {
            // Vérifier l'authentification
            Long adminUserId = (Long) session.getAttribute("userId");
            if (adminUserId == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Non authentifié"));
            }
            
            log.info("POST /api/candidatures/oec/{}/create-account - Création de compte par admin {}", id, adminUserId);
            
            String generatedPassword = candidatureService.createOECAccount(id, adminUserId);
            log.info("Compte OEC créé avec succès pour l'utilisateur {}", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Le compte OEC a été créé avec succès. Les identifiants ont été envoyés par email.");
            response.put("generatedPassword", generatedPassword); // Pour référence admin
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création du compte OEC {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur lors de la création du compte OEC", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }

    /**
     * Approuve une candidature
     * Accessible par DT
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveCandidature(@PathVariable Long id, HttpSession session) {
        try {
            // Vérifier l'authentification
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Non authentifié"));
            }
            
            log.info("POST /api/candidatures/{}/approve - Approbation d'une candidature", id);
            
            User approvedUser = candidatureService.approveCandidature(id);
            log.info("Candidature {} approuvée avec succès", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidature approuvée avec succès");
            response.put("user", approvedUser);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de l'approbation de la candidature {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur lors de l'approbation", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }

    /**
     * Rejette une candidature avec un motif
     * Accessible par DT
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectCandidature(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpSession session
    ) {
        try {
            // Vérifier l'authentification
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Non authentifié"));
            }
            
            String rejectionReason = request.get("rejectionReason");
            
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Le motif de refus est obligatoire"
                ));
            }
            
            log.info("POST /api/candidatures/{}/reject - Rejet d'une candidature avec motif : {}", id, rejectionReason);
            
            User rejectedUser = candidatureService.rejectCandidature(id, rejectionReason);
            log.info("Candidature {} rejetée avec succès", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidature rejetée avec succès");
            response.put("user", rejectedUser);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors du rejet de la candidature {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur lors du rejet", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }
}
