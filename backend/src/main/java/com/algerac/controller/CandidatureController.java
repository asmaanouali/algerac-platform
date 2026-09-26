package com.algerac.controller;

import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.UserRepository;
import com.algerac.service.CandidatureService;
import com.algerac.service.PdfGenerationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    private final PdfGenerationService pdfGenerationService;
    private final UserRepository userRepository;

    /**
     * Vérifie que l'utilisateur en session est authentifié et possède l'un des rôles autorisés.
     * Retourne null si l'accès est autorisé, sinon une réponse 401/403 à renvoyer telle quelle.
     */
    private ResponseEntity<Map<String, Object>> requireRole(HttpSession session, UserRole... allowedRoles) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Non authentifié", "message", "Non authentifié"));
        }
        User caller = userRepository.findById(userId).orElse(null);
        if (caller == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Non authentifié", "message", "Non authentifié"));
        }
        for (UserRole role : allowedRoles) {
            if (caller.hasRole(role)) {
                return null;
            }
        }
        log.warn("Accès refusé pour userId={} (rôle={}) - rôles requis: {}", userId, caller.getRole(), allowedRoles);
        return ResponseEntity.status(403).body(Map.of("success", false, "error", "Accès refusé : rôle insuffisant", "message", "Accès refusé : rôle insuffisant"));
    }

    /**
     * Récupère toutes les candidatures en attente (PENDING)
     * Accessible par DT
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingCandidatures(HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT);
            if (authError != null) return authError;
            Long userId = (Long) session.getAttribute("userId");
            
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
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;
            
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
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;
            
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
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT);
            if (authError != null) return authError;
            Long userId = (Long) session.getAttribute("userId");
            
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
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT);
            if (authError != null) return authError;
            
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
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.ADMIN);
            if (authError != null) return authError;
            
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
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.ADMIN);
            if (authError != null) return authError;
            Long adminUserId = (Long) session.getAttribute("userId");
            
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
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT);
            if (authError != null) return authError;
            
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
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT);
            if (authError != null) return authError;
            
            String rejectionReason = request.get("rejectionReason");
            
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Le motif de refus est obligatoire"
                ));
            }
            
            log.info("POST /api/candidatures/{}/reject - Rejet d'une candidature avec motif : {}", id, rejectionReason);
            
            candidatureService.rejectCandidature(id, rejectionReason);
            log.info("Candidature {} rejetée et supprimée avec succès", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidature rejetée avec succès");
            
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
    /**
     * Télécharge le formulaire DOC1 pour une candidature OEC
     */
    @GetMapping("/oec/{id}/doc1")
    public ResponseEntity<byte[]> downloadDoc1(@PathVariable Long id, HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT);
            if (authError != null) return ResponseEntity.status(authError.getStatusCode()).build();
            
            log.info("GET /api/candidatures/oec/{}/doc1 - Téléchargement DOC1", id);
            
            User user = candidatureService.getCandidatureById(id);
            byte[] pdfBytes = pdfGenerationService.generateDoc1Pdf(user);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                String.format("DOC1_%s.pdf", user.getOrganizationName().replaceAll("[^a-zA-Z0-9]", "_")));
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erreur lors du téléchargement du DOC1", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Télécharge le formulaire FOR20 pour une candidature Expert/Évaluateur/Formateur
     */
    @GetMapping("/experts/{id}/for20")
    public ResponseEntity<byte[]> downloadFor20(@PathVariable Long id, HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES, UserRole.DT, UserRole.RA, UserRole.CD, UserRole.RQ);
            if (authError != null) return ResponseEntity.status(authError.getStatusCode()).build();
            
            log.info("GET /api/candidatures/experts/{}/for20 - Téléchargement FOR20", id);
            
            User user = candidatureService.getCandidatureById(id);
            byte[] pdfBytes = pdfGenerationService.generateFor20Pdf(user);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                String.format("FOR20_%s_%s.pdf", user.getNom(), user.getPrenom()).replaceAll("[^a-zA-Z0-9_.]", "_"));
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erreur lors du téléchargement du FOR20", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Récupère toutes les candidatures d'experts/évaluateurs/formateurs en attente
     * Accessible par GES_COMPETENCES
     */
    @GetMapping("/experts")
    public ResponseEntity<?> getExpertCandidatures(HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES, UserRole.DT);
            if (authError != null) return authError;
            Long userId = (Long) session.getAttribute("userId");
            
            log.info("GET /api/candidatures/experts - Récupération des candidatures experts par userId: {}", userId);
            
            List<User> expertCandidatures = candidatureService.getExpertCandidatures();
            log.info("Nombre de candidatures experts trouvées : {}", expertCandidatures.size());
            
            return ResponseEntity.ok(expertCandidatures);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures experts", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }
    
    /**
     * Récupère les candidatures d'experts/évaluateurs/formateurs approuvées en attente de création de compte
     * Accessible par Admin
     */
    @GetMapping("/experts/approved")
    public ResponseEntity<?> getApprovedExpertCandidatures(HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.ADMIN);
            if (authError != null) return authError;
            log.info("GET /api/candidatures/experts/approved - Récupération des experts approuvés en attente de compte");
            List<User> approvedExperts = candidatureService.getApprovedExpertCandidatures();
            return ResponseEntity.ok(approvedExperts);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des experts approuvés", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }

    /**
     * Crée un compte pour un expert/évaluateur/formateur approuvé
     * Accessible par Admin
     */
    @PostMapping("/experts/{id}/create-account")
    public ResponseEntity<?> createExpertAccount(@PathVariable Long id, HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.ADMIN);
            if (authError != null) return authError;
            Long userId = (Long) session.getAttribute("userId");

            String generatedPassword = candidatureService.createExpertAccount(id, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Le compte a été créé avec succès. Les identifiants ont été envoyés par email.");
            response.put("generatedPassword", generatedPassword);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création du compte expert {}", id, e);
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur serveur lors de la création du compte expert", e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur serveur : " + e.getMessage()));
        }
    }

    /**
     * Approuve une candidature d'expert/évaluateur/formateur
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/approve")
    public ResponseEntity<?> approveExpertCandidature(@PathVariable Long id, HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES, UserRole.DT);
            if (authError != null) return authError;
            
            log.info("POST /api/candidatures/experts/{}/approve - Approbation candidature expert", id);
            
            User approvedUser = candidatureService.approveCandidature(id);
            log.info("Candidature expert {} approuvée avec succès", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidature approuvée. L'administrateur a été notifié pour créer le compte.");
            response.put("user", approvedUser);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de l'approbation de la candidature expert {}", id, e);
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
     * Rejette une candidature d'expert/évaluateur/formateur
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/reject")
    public ResponseEntity<?> rejectExpertCandidature(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES, UserRole.DT);
            if (authError != null) return authError;
            
            String rejectionReason = request.get("rejectionReason");
            
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Le motif de refus est obligatoire"
                ));
            }
            
            log.info("POST /api/candidatures/experts/{}/reject - Rejet candidature expert", id);
            
            candidatureService.rejectCandidature(id, rejectionReason);
            log.info("Candidature expert {} rejetée avec succès", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidature rejetée. Un email a été envoyé au candidat.");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors du rejet de la candidature expert {}", id, e);
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

    // ========== INTERVIEW WORKFLOW ENDPOINTS ==========

    /**
     * Planifie un entretien pour un candidat expert/évaluateur/formateur
     * Accessible par GES_COMPETENCES
     * Inclut la sélection du panel d'entretien (CD et RA)
     */
    @PostMapping("/experts/{id}/schedule-interview")
    public ResponseEntity<?> scheduleInterview(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            String interviewDateStr = (String) request.get("interviewDate");
            if (interviewDateStr == null || interviewDateStr.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "La date d'entretien est obligatoire"
                ));
            }

            // Extract panel member IDs
            Long cdId = null;
            Long raId = null;
            if (request.get("panelCdId") != null) {
                cdId = Long.valueOf(request.get("panelCdId").toString());
            }
            if (request.get("panelRaId") != null) {
                raId = Long.valueOf(request.get("panelRaId").toString());
            }

            log.info("POST /api/candidatures/experts/{}/schedule-interview - Planification entretien (panel CD={}, RA={})", id, cdId, raId);
            
            User user = candidatureService.scheduleInterview(id, java.time.LocalDateTime.parse(interviewDateStr), cdId, raId);
            log.info("Entretien planifié avec succès pour le candidat {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Entretien planifié. Tous les membres du panel ont été notifiés.");
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la planification de l'entretien pour {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur lors de la planification", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }

    /**
     * Modifier la date d'un entretien déjà planifié
     * Accessible par GES_COMPETENCES
     */
    @PutMapping("/experts/{id}/update-interview-date")
    public ResponseEntity<?> updateInterviewDate(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            String newDateStr = request.get("newDate");
            if (newDateStr == null || newDateStr.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "La nouvelle date est obligatoire"
                ));
            }

            log.info("PUT /api/candidatures/experts/{}/update-interview-date - Modification date entretien", id);
            
            User user = candidatureService.updateInterviewDate(id, java.time.LocalDateTime.parse(newDateStr));
            log.info("Date d'entretien modifiée avec succès pour le candidat {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Date d'entretien modifiée avec succès.");
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la modification de la date d'entretien pour {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }

    /**
     * Confirme un entretien planifié
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/confirm-interview")
    public ResponseEntity<?> confirmInterview(
            @PathVariable Long id,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            log.info("POST /api/candidatures/experts/{}/confirm-interview - Confirmation entretien", id);
            
            User user = candidatureService.confirmInterview(id);
            log.info("Entretien confirmé avec succès pour le candidat {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Entretien confirmé.");
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la confirmation de l'entretien pour {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }

    /**
     * Sauvegarde les notes et checklist d'entretien
     * Accessible par GES_COMPETENCES
     */
    @PutMapping("/experts/{id}/interview-notes")
    public ResponseEntity<?> saveInterviewNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            String notes = request.get("notes");
            String checklistJson = request.get("checklistJson");

            log.info("PUT /api/candidatures/experts/{}/interview-notes - Sauvegarde notes entretien", id);
            
            User user = candidatureService.saveInterviewNotes(id, notes, checklistJson);
            log.info("Notes d'entretien sauvegardées avec succès pour le candidat {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Notes sauvegardées.");
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la sauvegarde des notes pour {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }

    /**
     * Marque un entretien comme terminé
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/complete-interview")
    public ResponseEntity<?> completeInterview(
            @PathVariable Long id,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            log.info("POST /api/candidatures/experts/{}/complete-interview - Marque entretien terminé", id);
            
            User user = candidatureService.markInterviewCompleted(id);
            log.info("Entretien marqué comme terminé pour le candidat {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Entretien marqué comme terminé.");
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors du marquage de l'entretien terminé pour {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }

    /**
     * Accepte un candidat après l'entretien
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/interview-accept")
    public ResponseEntity<?> acceptAfterInterview(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;
            Long userId = (Long) session.getAttribute("userId");

            String role = body != null ? body.get("role") : null;
            log.info("POST /api/candidatures/experts/{}/interview-accept - Acceptation après entretien, role={}", id, role);
            
            User user = candidatureService.acceptAfterInterview(id, userId, role);
            log.info("Candidat {} accepté après entretien avec succès", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidat accepté. L'administrateur a été notifié pour créer le compte.");
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de l'acceptation après entretien pour {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }

    /**
     * Rejette un candidat après l'entretien (email implicite)
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/interview-reject")
    public ResponseEntity<?> rejectAfterInterview(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            String internalNotes = request.get("internalNotes");

            log.info("POST /api/candidatures/experts/{}/interview-reject - Rejet après entretien", id);
            
            candidatureService.rejectAfterInterview(id, internalNotes);
            log.info("Candidat {} rejeté après entretien avec succès", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidat rejeté. Un email implicite a été envoyé.");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors du rejet après entretien pour {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }

    /**
     * Récupère tous les entretiens planifiés/confirmés/terminés
     * Accessible par GES_COMPETENCES
     */
    @GetMapping("/experts/interviews")
    public ResponseEntity<?> getScheduledInterviews(HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            log.info("GET /api/candidatures/experts/interviews - Récupération des entretiens");
            
            List<User> interviews = candidatureService.getScheduledInterviews();
            log.info("Nombre d'entretiens récupérés : {}", interviews.size());

            return ResponseEntity.ok(interviews);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des entretiens", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }

    /**
     * Rejette une candidature avant l'entretien (dossier non retenu)
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/reject-dossier")
    public ResponseEntity<?> rejectDossier(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            String internalNotes = request.get("internalNotes");

            log.info("POST /api/candidatures/experts/{}/reject-dossier - Rejet dossier avant entretien", id);
            
            candidatureService.rejectDossier(id, internalNotes);
            log.info("Dossier {} rejeté avec succès", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Dossier rejeté. Un email implicite a été envoyé.");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors du rejet du dossier pour {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur serveur", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }
    
    // ========== FOR28 PRESELECTION ENDPOINT ==========
    
    /**
     * Présélectionne un profil après analyse du FOR20.
     * Génère un token sécurisé et envoie un email avec le lien FOR28.
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/preselect-profile")
    public ResponseEntity<?> preselectProfile(@PathVariable Long id, HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;
            log.info("POST /api/candidatures/experts/{}/preselect-profile - Présélection profil", id);
            User user = candidatureService.preselectProfile(id);
            log.info("Profil {} présélectionné avec succès - lien FOR28 envoyé", id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profil présélectionné. Un email avec le lien FOR28 a été envoyé au candidat.");
            response.put("user", user);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la présélection du profil {}", id, e);
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur serveur lors de la présélection", e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur serveur : " + e.getMessage()));
        }
    }
    
    // ========== BLACKLIST ENDPOINTS ==========
    
    /**
     * Blackliste un candidat (spam / abus)
     */
    @PostMapping("/experts/{id}/blacklist")
    public ResponseEntity<?> blacklistCandidate(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            String reason = request.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "Le motif de blacklist est obligatoire"));
            }

            log.info("POST /api/candidatures/experts/{}/blacklist - Blacklist candidat", id);
            candidatureService.blacklistCandidate(id, reason);

            return ResponseEntity.ok(Map.of("success", true, "message", "Candidat blacklisté avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur serveur : " + e.getMessage()));
        }
    }
    
    /**
     * Retire un candidat de la blacklist
     */
    @PostMapping("/experts/{id}/unblacklist")
    public ResponseEntity<?> unblacklistCandidate(
            @PathVariable Long id,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            log.info("POST /api/candidatures/experts/{}/unblacklist - Retrait blacklist", id);
            candidatureService.unblacklistCandidate(id);

            return ResponseEntity.ok(Map.of("success", true, "message", "Candidat retiré de la blacklist"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur serveur : " + e.getMessage()));
        }
    }

    /**
     * Restaure une candidature rejetée (remet en PENDING)
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/restore")
    public ResponseEntity<?> restoreCandidature(
            @PathVariable Long id,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            log.info("POST /api/candidatures/experts/{}/restore - Restauration candidature", id);
            candidatureService.restoreCandidature(id);

            return ResponseEntity.ok(Map.of("success", true, "message", "Candidature restaurée avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur serveur : " + e.getMessage()));
        }
    }

    /**
     * Toggle starred/favorite status on a candidature
     * Accessible par GES_COMPETENCES
     */
    @PostMapping("/experts/{id}/toggle-star")
    public ResponseEntity<?> toggleStar(
            @PathVariable Long id,
            HttpSession session
    ) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            log.info("POST /api/candidatures/experts/{}/toggle-star - Toggle étoile", id);
            boolean starred = candidatureService.toggleStar(id);

            return ResponseEntity.ok(Map.of("success", true, "starred", starred));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur serveur : " + e.getMessage()));
        }
    }

    /**
     * Expire les entretiens non confirmés après 7 jours (délai dépassé)
     * Appelé au chargement du dashboard/planning pour vérifier les expirations
     */
    @PostMapping("/experts/expire-unconfirmed")
    public ResponseEntity<?> expireUnconfirmedInterviews(HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;

            log.info("POST /api/candidatures/experts/expire-unconfirmed - Vérification des expirations");
            int expired = candidatureService.expireUnconfirmedInterviews();

            return ResponseEntity.ok(Map.of("success", true, "expiredCount", expired));
        } catch (Exception e) {
            log.error("Erreur lors de l'expiration des entretiens non confirmés", e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur serveur : " + e.getMessage()));
        }
    }

    /**
     * Récupère les entretiens où l'utilisateur connecté est membre du panel
     * Accessible par DT, RQ, CD, RA
     */
    @GetMapping("/experts/my-interviews")
    public ResponseEntity<?> getMyInterviews(HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT, UserRole.RQ, UserRole.CD, UserRole.RA, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;
            Long userId = (Long) session.getAttribute("userId");
            
            Object userRoleObj = session.getAttribute("userRole");
            String userRole = userRoleObj != null ? userRoleObj.toString() : null;
            log.info("GET /api/candidatures/experts/my-interviews - userId: {}, role: {}", userId, userRole);
            
            List<User> interviews = candidatureService.getInterviewsForPanelMember(userId, userRole);
            return ResponseEntity.ok(interviews);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des entretiens du panel", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }

    /**
     * Récupère les détails d'un candidat pour un membre du panel d'entretien
     * Accessible par DT, RQ, CD, RA, GES_COMPETENCES
     */
    @GetMapping("/experts/{id}/panel-view")
    public ResponseEntity<?> getCandidateForPanel(@PathVariable Long id, HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.DT, UserRole.RQ, UserRole.CD, UserRole.RA, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;
            Long userId = (Long) session.getAttribute("userId");
            
            Object userRoleObj = session.getAttribute("userRole");
            String userRole = userRoleObj != null ? userRoleObj.toString() : null;
            log.info("GET /api/candidatures/experts/{}/panel-view - userId: {}, role: {}", id, userId, userRole);
            
            User candidate = candidatureService.getCandidatureById(id);
            
            // Verify the user is part of the panel for this candidate
            boolean isPanel = candidatureService.isUserInInterviewPanel(userId, userRole, candidate);
            if (!isPanel) {
                return ResponseEntity.status(403).body(Map.of("error", "Vous n'êtes pas membre du panel pour cet entretien"));
            }
            
            return ResponseEntity.ok(candidate);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la récupération du candidat pour le panel", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }

    /**
     * Récupère la liste des CD et RA disponibles pour la sélection du panel d'entretien
     * Accessible par GES_COMPETENCES
     */
    @GetMapping("/experts/panel-members")
    public ResponseEntity<?> getAvailablePanelMembers(HttpSession session) {
        try {
            ResponseEntity<Map<String, Object>> authError = requireRole(session, UserRole.GES_COMPETENCES);
            if (authError != null) return authError;
            
            log.info("GET /api/candidatures/experts/panel-members - Récupération des membres disponibles pour le panel");
            
            Map<String, Object> result = new HashMap<>();
            result.put("chefsDepartement", candidatureService.getAvailableCDs());
            result.put("responsablesAccreditation", candidatureService.getAvailableRAs());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des membres du panel", e);
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }
}
