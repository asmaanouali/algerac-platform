package com.algerac.controller;

import com.algerac.service.CompetencyManagementService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/competency")
@RequiredArgsConstructor
@Slf4j
public class CompetencyManagementController {

    private final CompetencyManagementService service;

    private Long auth(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userId;
    }

    // ============ SUPERVISION PLAN (FOR 65-7) ============

    @GetMapping("/supervision-plans")
    public ResponseEntity<?> getAllPlans(@RequestParam(required = false) Integer year, HttpSession session) {
        try {
            auth(session);
            return ResponseEntity.ok(year != null ? service.getPlansByYear(year) : service.getAllSupervisionPlans());
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/supervision-plans/{id}")
    public ResponseEntity<?> getPlanById(@PathVariable Long id, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getSupervisionPlanById(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/supervision-plans/by-evaluator/{id}")
    public ResponseEntity<?> getPlansByEvaluator(@PathVariable Long id, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getPlansByEvaluator(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/supervision-plans/by-supervisor/{id}")
    public ResponseEntity<?> getPlansBySupervisor(@PathVariable Long id, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getPlansBySupervisor(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/supervision-plans/my")
    public ResponseEntity<?> getMyPlans(HttpSession session) {
        try { Long userId = auth(session); return ResponseEntity.ok(service.getPlansBySupervisor(userId)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/supervision-plans/suggestions")
    public ResponseEntity<?> getSuggestions(HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.suggestEvaluatorsToSupervise()); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/supervision-plans")
    public ResponseEntity<?> createPlan(@RequestBody Map<String, Object> body, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.createSupervisionPlan(body)); }
        catch (Exception e) { log.error("createPlan", e); return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/supervision-plans/{id}")
    public ResponseEntity<?> updatePlan(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.updateSupervisionPlan(id, body)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/supervision-plans/{id}/complete")
    public ResponseEntity<?> completePlan(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpSession session) {
        try {
            auth(session);
            Long sheetId = body != null && body.get("sheetId") != null ? Long.valueOf(body.get("sheetId").toString()) : null;
            return ResponseEntity.ok(service.completeSupervisionPlan(id, sheetId));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // ============ FOR 21-3 (Expert) ============

    @GetMapping("/expert-sheets")
    public ResponseEntity<?> getExpertSheets(HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getAllExpertSheets()); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/expert-sheets/by-expert/{id}")
    public ResponseEntity<?> getExpertSheetsByExpert(@PathVariable Long id, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getExpertSheetsByExpert(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/expert-sheets/my")
    public ResponseEntity<?> getMyExpertSheets(HttpSession session) {
        try { Long uid = auth(session); return ResponseEntity.ok(service.getExpertSheetsBySupervisor(uid)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/expert-sheets")
    public ResponseEntity<?> createExpertSheet(@RequestBody Map<String, Object> body, HttpSession session) {
        try { Long uid = auth(session); return ResponseEntity.ok(service.createExpertSheet(body, uid)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // ============ FOR 65-1 / 65-6 (Évaluateur monitoring) ============

    @GetMapping("/monitoring-sheets")
    public ResponseEntity<?> getAllMonitoring(HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getAllMonitoringSheets()); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/monitoring-sheets/by-evaluator/{id}")
    public ResponseEntity<?> getMonitoringByEvaluator(@PathVariable Long id, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getMonitoringByEvaluator(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/monitoring-sheets")
    public ResponseEntity<?> createMonitoring(@RequestBody Map<String, Object> body, HttpSession session) {
        try { Long uid = auth(session); return ResponseEntity.ok(service.createMonitoringSheet(body, uid)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/monitoring-sheets/{id}/validate")
    public ResponseEntity<?> validateMonitoring(@PathVariable Long id, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.validateMonitoringSheet(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // ============ EXTENSIONS DE COMPÉTENCES ============

    @GetMapping("/extensions")
    public ResponseEntity<?> getAllExtensions(HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getAllExtensions()); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/extensions/by-evaluator/{id}")
    public ResponseEntity<?> getExtensionsByEvaluator(@PathVariable Long id, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getExtensionsByEvaluator(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/extensions")
    public ResponseEntity<?> requestExtension(@RequestBody Map<String, Object> body, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.requestExtension(body)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/extensions/{id}/review")
    public ResponseEntity<?> reviewExtension(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long uid = auth(session);
            String status = (String) body.get("status");
            String notes = (String) body.get("reviewNotes");
            return ResponseEntity.ok(service.reviewExtension(id, status, notes, uid));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // ============ BULLETINS D'INFORMATION ============

    @GetMapping("/bulletins")
    public ResponseEntity<?> getBulletins(HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getAllBulletins()); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/bulletins")
    public ResponseEntity<?> createBulletin(@RequestBody Map<String, Object> body, HttpSession session) {
        try { Long uid = auth(session); return ResponseEntity.ok(service.createBulletin(body, uid)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/bulletins/{id}/dispatch")
    public ResponseEntity<?> dispatchBulletin(@PathVariable Long id, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.dispatchBulletin(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // ============ INACTIVITÉ / REQUALIFICATION ============

    @GetMapping("/inactive-qualifications")
    public ResponseEntity<?> getInactive(HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getInactiveQualifications()); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/qualifications/{id}/trigger-requalification")
    public ResponseEntity<?> triggerRequalification(@PathVariable Long id, HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.triggerRequalification(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/detect-inactivity")
    public ResponseEntity<?> manualDetect(HttpSession session) {
        try { auth(session); service.detectInactivity(); return ResponseEntity.ok(Map.of("ok", true)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // ============ SUPERVISEURS (LIS 09) ============

    @GetMapping("/supervisors")
    public ResponseEntity<?> getSupervisors(HttpSession session) {
        try { auth(session); return ResponseEntity.ok(service.getSupervisorsList()); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/supervisors/qualify")
    public ResponseEntity<?> qualifySupervisor(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            auth(session);
            Long userId = Long.valueOf(body.get("userId").toString());
            String type = (String) body.getOrDefault("employmentType", "EXTERNAL");
            return ResponseEntity.ok(service.qualifyAsSupervisor(userId, type));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }
}
