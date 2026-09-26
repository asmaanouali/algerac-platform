package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.SystemLog;
import com.algerac.model.SystemSetting;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.SystemLogRepository;
import com.algerac.repository.SystemSettingRepository;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Paramètres de sécurité et journal d'audit.
 */
@RestController
@RequestMapping("/api/admin/security")
@RequiredArgsConstructor
@Slf4j
public class AdminSecurityController {

    private final SystemSettingRepository systemSettingRepository;
    private final SystemLogRepository systemLogRepository;
    private final UserRepository userRepository;

    private static final String CATEGORY = "SECURITY";
    private static final Map<String, String> DEFAULTS = new LinkedHashMap<>();

    static {
        DEFAULTS.put("passwordMinLength", "12");
        DEFAULTS.put("passwordRequireSpecial", "true");
        DEFAULTS.put("requireSpecialChars", "true");
        DEFAULTS.put("passwordRequireUppercase", "true");
        DEFAULTS.put("passwordRequireNumber", "true");
        DEFAULTS.put("forceExpiration", "true");
        DEFAULTS.put("passwordHistory", "true");
        DEFAULTS.put("passwordExpiryDays", "90");
        DEFAULTS.put("require2fa", "true");
        DEFAULTS.put("twoFactorEnabled", "true");
        DEFAULTS.put("blockAfterFailures", "true");
        DEFAULTS.put("maxLoginAttempts", "5");
        DEFAULTS.put("ipRestriction", "false");
        DEFAULTS.put("ipWhitelistEnabled", "false");
        DEFAULTS.put("ipWhitelist", "");
        DEFAULTS.put("sessionTimeout", "true");
        DEFAULTS.put("sessionTimeoutMinutes", "30");
        DEFAULTS.put("lockoutDurationMinutes", "15");
    }

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

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse> getSettings(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;
        return ResponseEntity.ok(ApiResponse.success("OK", getSettingsMap()));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse> updateSettings(@RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        for (Map.Entry<String, Object> entry : body.entrySet()) {
            String value = entry.getValue() != null ? String.valueOf(entry.getValue()) : null;
            SystemSetting setting = systemSettingRepository.findBySettingKey(entry.getKey()).orElse(null);
            if (setting == null) {
                setting = SystemSetting.builder()
                        .settingKey(entry.getKey())
                        .settingValue(value)
                        .category(CATEGORY)
                        .build();
            } else {
                setting.setSettingValue(value);
            }
            systemSettingRepository.save(setting);
        }
        return ResponseEntity.ok(ApiResponse.success("Paramètres de sécurité mis à jour avec succès", getSettingsMap()));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse> auditLogs(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        List<SystemLog> logs = systemLogRepository.findAllByOrderByTimestampDesc();
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (SystemLog l : logs) {
            result.add(toAuditLogResponse(l));
        }
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    /**
     * Maps a SystemLog to a UI-friendly object exposing both the French
     * prototype field names and English aliases so the frontend can use either.
     */
    private Map<String, Object> toAuditLogResponse(SystemLog l) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", l.getId());
        m.put("heure", l.getTimestamp());
        m.put("timestamp", l.getTimestamp());
        String action = l.getMessage() != null ? l.getMessage() : l.getModule();
        m.put("action", action);
        m.put("utilisateur", l.getUsername());
        m.put("user", l.getUsername());
        m.put("details", l.getMessage());
        m.put("severite", l.getLevel());
        m.put("status", l.getLevel());
        m.put("level", l.getLevel());
        m.put("ipAddress", l.getSourceIp());
        m.put("module", l.getModule());
        return m;
    }

    @GetMapping("/audit-logs/export")
    public ResponseEntity<byte[]> exportAuditLogs(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) {
            return ResponseEntity.status(err.getStatusCode()).build();
        }

        List<SystemLog> logs = systemLogRepository.findAllByOrderByTimestampDesc();
        StringBuilder csv = new StringBuilder("Date,Niveau,Module,Utilisateur,IP,Message\n");
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (SystemLog l : logs) {
            csv.append(l.getTimestamp() != null ? l.getTimestamp().format(fmt) : "").append(",")
               .append(safe(l.getLevel())).append(",")
               .append(safe(l.getModule())).append(",")
               .append(safe(l.getUsername())).append(",")
               .append(safe(l.getSourceIp())).append(",")
               .append(safe(l.getMessage())).append("\n");
        }

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-logs.csv\"")
                .body(bytes);
    }

    private Map<String, Object> getSettingsMap() {
        Map<String, String> raw = new LinkedHashMap<>(DEFAULTS);
        for (SystemSetting s : systemSettingRepository.findByCategory(CATEGORY)) {
            raw.put(s.getSettingKey(), s.getSettingValue());
        }
        Map<String, Object> result = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : raw.entrySet()) {
            result.put(entry.getKey(), typedValue(entry.getValue()));
        }
        return result;
    }

    /**
     * Converts a persisted string setting value into a boolean, number, or
     * plain string so the frontend receives correctly typed JSON values.
     */
    private Object typedValue(String value) {
        if (value == null) return null;
        if ("true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value)) {
            return Boolean.parseBoolean(value);
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ignored) {
            return value;
        }
    }

    private String safe(String value) {
        if (value == null) return "";
        return "\"" + value.replace("\"", "'").replace("\n", " ") + "\"";
    }
}
