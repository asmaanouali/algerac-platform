package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.MaintenanceTask;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.MaintenanceTaskRepository;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Planification et historique des opérations de maintenance.
 */
@RestController
@RequestMapping("/api/admin/maintenance")
@RequiredArgsConstructor
@Slf4j
public class AdminMaintenanceController {

    private final MaintenanceTaskRepository maintenanceTaskRepository;
    private final UserRepository userRepository;

    private ResponseEntity<ApiResponse> requireAdmin(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        }
        User admin = userRepository.findById(userId).orElse(null);
        if (admin == null || (admin.getRole() != UserRole.ADMIN && !admin.hasRole(UserRole.ADMIN))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Réservé aux administrateurs"));
        }
        return null;
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse> upcoming(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        LocalDateTime now = LocalDateTime.now();
        List<MaintenanceTask> tasks = maintenanceTaskRepository.findByScheduledStartAfterOrderByScheduledStartAsc(now)
                .stream().filter(t -> "SCHEDULED".equalsIgnoreCase(t.getStatus())).toList();

        MaintenanceTask next = tasks.isEmpty() ? null : tasks.get(0);
        return ResponseEntity.ok(ApiResponse.success("OK", next));
    }

    @GetMapping("/scheduled")
    public ResponseEntity<ApiResponse> scheduled(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        return ResponseEntity.ok(ApiResponse.success("OK", maintenanceTaskRepository.findByStatusOrderByScheduledStartAsc("SCHEDULED")));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse> history(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        List<MaintenanceTask> history = maintenanceTaskRepository.findAllByOrderByScheduledStartDesc().stream()
                .filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus()) || "CANCELLED".equalsIgnoreCase(t.getStatus()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success("OK", history));
    }

    @GetMapping("/availability")
    public ResponseEntity<ApiResponse> availability(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        LocalDateTime periodStart = LocalDateTime.now().minusDays(30);
        List<MaintenanceTask> recent = maintenanceTaskRepository.findAll().stream()
                .filter(t -> t.getScheduledStart() != null && t.getScheduledStart().isAfter(periodStart))
                .filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus()))
                .toList();

        long totalDowntimeMinutes = recent.stream()
                .mapToLong(t -> t.getDowntimeMinutes() != null ? t.getDowntimeMinutes() : 0)
                .sum();

        long totalPeriodMinutes = ChronoUnit.MINUTES.between(periodStart, LocalDateTime.now());
        double availabilityPercent = totalPeriodMinutes > 0
                ? Math.max(0, 100.0 - (totalDowntimeMinutes * 100.0 / totalPeriodMinutes))
                : 100.0;

        double roundedAvailability = Math.round(availabilityPercent * 100.0) / 100.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodDays", 30);
        result.put("availabilityPercent", roundedAvailability);
        result.put("totalDowntimeMinutes", totalDowntimeMinutes);
        result.put("incidentsCount", recent.size());

        // Prototype-friendly aliases
        result.put("uptimePercent", roundedAvailability);
        result.put("totalDowntimeLabel", formatDowntime(totalDowntimeMinutes));
        result.put("incidents", recent.size());

        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    private String formatDowntime(long minutes) {
        if (minutes <= 0) return "0 min";
        if (minutes < 60) return minutes + " min";
        long hours = minutes / 60;
        long rem = minutes % 60;
        return rem == 0 ? hours + "h" : hours + "h" + rem + "min";
    }

    @PostMapping
    public ResponseEntity<ApiResponse> create(@RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        MaintenanceTask task = MaintenanceTask.builder()
                .scheduledStart(dateTimeOf(body, "scheduledStart"))
                .scheduledEnd(dateTimeOf(body, "scheduledEnd"))
                .taskType(str(body, "taskType"))
                .impactDescription(str(body, "impactDescription"))
                .affectedScope(str(body, "affectedScope"))
                .status(str(body, "status") != null ? str(body, "status") : "SCHEDULED")
                .downtimeMinutes(intOf(body, "downtimeMinutes"))
                .build();

        task = maintenanceTaskRepository.save(task);
        return ResponseEntity.ok(ApiResponse.success("Tâche de maintenance créée avec succès", task));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> update(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        MaintenanceTask task = maintenanceTaskRepository.findById(id).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Tâche introuvable"));
        }

        if (body.containsKey("scheduledStart")) task.setScheduledStart(dateTimeOf(body, "scheduledStart"));
        if (body.containsKey("scheduledEnd")) task.setScheduledEnd(dateTimeOf(body, "scheduledEnd"));
        if (body.containsKey("taskType")) task.setTaskType(str(body, "taskType"));
        if (body.containsKey("impactDescription")) task.setImpactDescription(str(body, "impactDescription"));
        if (body.containsKey("affectedScope")) task.setAffectedScope(str(body, "affectedScope"));
        if (body.containsKey("status")) task.setStatus(str(body, "status"));
        if (body.containsKey("downtimeMinutes")) task.setDowntimeMinutes(intOf(body, "downtimeMinutes"));
        task.setUpdatedAt(LocalDateTime.now());

        task = maintenanceTaskRepository.save(task);
        return ResponseEntity.ok(ApiResponse.success("Tâche mise à jour avec succès", task));
    }

    private String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v != null ? String.valueOf(v) : null;
    }

    private Integer intOf(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return Integer.parseInt(String.valueOf(v));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDateTime dateTimeOf(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return LocalDateTime.parse(String.valueOf(v));
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(String.valueOf(v).substring(0, 19));
            } catch (Exception e2) {
                return null;
            }
        }
    }
}
