package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Supervision technique : métriques JVM réelles uniquement.
 * Pas de série HTTP inventée ni d'alertes fictives.
 */
@RestController
@RequestMapping("/api/admin/monitoring")
@RequiredArgsConstructor
@Slf4j
public class AdminMonitoringController {

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

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse> metrics(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        long usedMemory = totalMemory - freeMemory;

        double cpuLoad = -1;
        try {
            var osBean = ManagementFactory.getPlatformMXBean(com.sun.management.OperatingSystemMXBean.class);
            double load = osBean.getCpuLoad();
            if (load >= 0) cpuLoad = Math.round(load * 1000.0) / 10.0;
        } catch (Throwable t) {
            log.debug("AdminMonitoringController: CPU load unavailable - {}", t.getMessage());
        }

        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        double memoryUsagePercent = maxMemory > 0 ? Math.round((usedMemory * 1000.0) / maxMemory) / 10.0 : 0;
        double ramUsedGb = Math.round((usedMemory / (1024.0 * 1024 * 1024)) * 100.0) / 100.0;
        double ramTotalGb = Math.round((maxMemory / (1024.0 * 1024 * 1024)) * 100.0) / 100.0;
        double cpuUsage = cpuLoad >= 0 ? cpuLoad : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("memoryUsedMb", usedMemory / (1024 * 1024));
        result.put("memoryTotalMb", totalMemory / (1024 * 1024));
        result.put("memoryMaxMb", maxMemory / (1024 * 1024));
        result.put("memoryUsagePercent", memoryUsagePercent);
        result.put("cpuLoadPercent", cpuLoad);
        result.put("availableProcessors", runtime.availableProcessors());
        result.put("uptimeSeconds", uptimeMs / 1000);
        result.put("activeThreads", Thread.activeCount());
        result.put("checkedAt", LocalDateTime.now());

        result.put("cpuUsage", cpuUsage);
        result.put("cpu", cpuUsage);
        result.put("ramUsedGb", ramUsedGb);
        result.put("ramTotalGb", ramTotalGb);
        result.put("ram", memoryUsagePercent);
        // Pas de collecteur réseau / latence API — null plutôt que des valeurs inventées
        result.put("networkMbps", null);
        result.put("network", null);
        result.put("apiLatencyMs", null);
        result.put("apiLatency", null);

        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    @GetMapping("/http-requests")
    public ResponseEntity<ApiResponse> httpRequests(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;
        // Aucun collecteur HTTP branché — liste vide
        return ResponseEntity.ok(ApiResponse.success("OK", List.of()));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse> alerts(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        Runtime runtime = Runtime.getRuntime();
        long usedMemory = runtime.totalMemory() - runtime.freeMemory();
        double usagePercent = runtime.maxMemory() > 0 ? (usedMemory * 100.0) / runtime.maxMemory() : 0;

        List<Map<String, Object>> alerts = new ArrayList<>();
        if (usagePercent > 85) {
            Map<String, Object> a = alert("WARNING", "High Memory Usage",
                    "Utilisation mémoire JVM > 85% (" + Math.round(usagePercent) + "%)");
            a.put("id", 1);
            alerts.add(a);
        }

        return ResponseEntity.ok(ApiResponse.success("OK", alerts));
    }

    private Map<String, Object> alert(String severity, String title, String message) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("severity", severity);
        m.put("level", severity);
        m.put("title", title);
        m.put("label", title);
        m.put("message", message);
        m.put("detail", message);
        m.put("timestamp", LocalDateTime.now());
        return m;
    }
}
