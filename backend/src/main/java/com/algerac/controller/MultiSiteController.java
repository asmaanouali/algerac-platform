package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.UserRepository;
import com.algerac.service.MultiSiteService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * PRO_26 : Contrôleur pour l'accréditation multi-sites.
 */
@RestController
@RequestMapping("/api/multi-site")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class MultiSiteController {

    private final MultiSiteService multiSiteService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createConfig(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            MultiSiteConfig config = multiSiteService.createConfig(
                ((Number) body.get("requestId")).longValue(),
                (String) body.get("mainSiteName"), (String) body.get("mainSiteAddress"),
                (String) body.get("mainSiteContact"), (String) body.get("mainSiteEmail"),
                (Boolean) body.get("centralizedSystem"), (String) body.get("managementSystemDesc"),
                body.get("totalSatellites") != null ? ((Number) body.get("totalSatellites")).intValue() : 0,
                (String) body.get("satelliteSites"), (String) body.get("selectionCriteria"), user);
            return ResponseEntity.ok(ApiResponse.success("Configuration multi-site créée", config));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<?> submit(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Soumis pour validation",
                multiSiteService.submitForValidation(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<?> validate(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Validation effectuée",
                multiSiteService.cdValidate(id, (Boolean) body.get("approved"),
                    (String) body.get("comments"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Configuration activée",
                multiSiteService.activate(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<?> getByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(ApiResponse.success("Configs multi-site",
            multiSiteService.getByRequest(requestId)));
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Toutes les configurations", multiSiteService.getAll()));
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
