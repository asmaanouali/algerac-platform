package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.ReferenceRule;
import com.algerac.service.ReferenceRuleService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * PRO_19 : Contrôleur pour les règles de référence d'accréditation.
 */
@RestController
@RequestMapping("/api/reference-rules")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class ReferenceRuleController {

    private final ReferenceRuleService ruleService;

    @PostMapping
    public ResponseEntity<?> createRule(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            checkAuth(session);
            ReferenceRule rule = ruleService.createRule(
                (String) body.get("standardCode"), (String) body.get("version"),
                (String) body.get("title"), (String) body.get("description"),
                (String) body.get("applicableDomains"), (String) body.get("applicableOecTypes"),
                body.get("publicationDate") != null ? LocalDate.parse((String) body.get("publicationDate")) : null,
                body.get("effectiveDate") != null ? LocalDate.parse((String) body.get("effectiveDate")) : null,
                body.get("transitionStart") != null ? LocalDate.parse((String) body.get("transitionStart")) : null,
                body.get("transitionEnd") != null ? LocalDate.parse((String) body.get("transitionEnd")) : null,
                (String) body.get("previousCode"), (String) body.get("previousVersion"),
                (String) body.get("transitionRequirements"), (String) body.get("guidanceDocs"));
            return ResponseEntity.ok(ApiResponse.success("Règle créée", rule));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<?> publish(@PathVariable Long id, HttpSession session) {
        try {
            checkAuth(session);
            return ResponseEntity.ok(ApiResponse.success("Règle publiée", ruleService.publishRule(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/start-transition")
    public ResponseEntity<?> startTransition(@PathVariable Long id, HttpSession session) {
        try {
            checkAuth(session);
            return ResponseEntity.ok(ApiResponse.success("Transition démarrée", ruleService.startTransition(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/record-transition")
    public ResponseEntity<?> recordTransition(@PathVariable Long id, HttpSession session) {
        try {
            checkAuth(session);
            return ResponseEntity.ok(ApiResponse.success("Transition enregistrée",
                ruleService.recordOecTransitionComplete(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable Long id, HttpSession session) {
        try {
            checkAuth(session);
            return ResponseEntity.ok(ApiResponse.success("Règle retirée", ruleService.withdrawRule(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Toutes les règles", ruleService.getAllRules()));
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActive() {
        return ResponseEntity.ok(ApiResponse.success("Règles actives", ruleService.getActiveRules()));
    }

    private void checkAuth(HttpSession session) {
        if (session.getAttribute("userId") == null) throw new RuntimeException("Non authentifié");
    }
}
