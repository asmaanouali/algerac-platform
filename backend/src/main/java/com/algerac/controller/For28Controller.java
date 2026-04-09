package com.algerac.controller;

import com.algerac.model.User;
import com.algerac.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/for28")
@RequiredArgsConstructor
@Slf4j
public class For28Controller {

    private final CandidatureService candidatureService;

    /**
     * Valide un token FOR28 et retourne les informations du candidat.
     * Endpoint public (pas besoin de session) - mais nécessite email + token.
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String code = request.get("code");

            if (token == null || token.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "Token manquant"));
            }
            if (code == null || code.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "Code secret requis pour vérification"));
            }

            log.info("POST /api/for28/validate - Validation token FOR28");
            User user = candidatureService.validateFor28Token(token, code);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("candidateName", user.getPrenom() + " " + user.getNom());
            response.put("registrationId", user.getRegistrationId());
            response.put("userType", user.getUserType());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Validation token FOR28 échouée : {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur serveur lors de la validation FOR28", e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur serveur"));
        }
    }

    /**
     * Soumet les documents FOR28.
     * Endpoint public - vérifie le token + email avant d'accepter les documents.
     */
    @PostMapping("/submit")
    public ResponseEntity<?> submitDocuments(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String code = request.get("code");
            String documentsJson = request.get("documents");

            if (token == null || token.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "Token manquant"));
            }
            if (code == null || code.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "Code secret requis pour vérification"));
            }
            if (documentsJson == null || documentsJson.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "Aucun document fourni"));
            }

            log.info("POST /api/for28/submit - Soumission documents FOR28");
            User user = candidatureService.submitFor28Documents(token, code, documentsJson);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Vos documents ont été soumis avec succès. Votre dossier est maintenant complet.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Soumission FOR28 échouée : {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur serveur lors de la soumission FOR28", e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur serveur"));
        }
    }
}
