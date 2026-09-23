package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.SystemSetting;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.SystemSettingRepository;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Paramètres système : général, modules, emails.
 */
@RestController
@RequestMapping("/api/admin/system")
@RequiredArgsConstructor
@Slf4j
public class AdminSystemController {

    private final SystemSettingRepository systemSettingRepository;
    private final UserRepository userRepository;

    private static final Map<String, String> GENERAL_DEFAULTS = new LinkedHashMap<>();
    private static final Map<String, String> MODULES_DEFAULTS = new LinkedHashMap<>();
    private static final Map<String, String> EMAILS_DEFAULTS = new LinkedHashMap<>();

    static {
        GENERAL_DEFAULTS.put("app_name", "SGA - Système de Gestion d'Accréditation");
        GENERAL_DEFAULTS.put("organization", "Agence Nationale d'Accréditation");
        GENERAL_DEFAULTS.put("support_email", "support@ana.gov");
        GENERAL_DEFAULTS.put("timezone", "Europe/Paris (UTC+01:00)");
        GENERAL_DEFAULTS.put("maintenance_mode", "false");
        GENERAL_DEFAULTS.put("debug_mode", "false");

        MODULES_DEFAULTS.put("MODULE_ACCREDITATION", "true");
        MODULES_DEFAULTS.put("MODULE_EVALUATION", "true");
        MODULES_DEFAULTS.put("MODULE_FINANCIER", "true");
        MODULES_DEFAULTS.put("MODULE_QUALITE", "true");
        MODULES_DEFAULTS.put("MODULE_SURVEILLANCE", "true");

        EMAILS_DEFAULTS.put("smtp_host", "smtp.gmail.com");
        EMAILS_DEFAULTS.put("smtp_port", "587");
        EMAILS_DEFAULTS.put("smtp_user", "");
        EMAILS_DEFAULTS.put("from_email", "no-reply@algerac.dz");
        EMAILS_DEFAULTS.put("notifications_enabled", "true");
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
    public ResponseEntity<ApiResponse> getSettings(@RequestParam(defaultValue = "GENERAL") String category, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        Map<String, String> result = new LinkedHashMap<>(defaultsFor(category));
        for (SystemSetting s : systemSettingRepository.findByCategory(category)) {
            result.put(s.getSettingKey(), s.getSettingValue());
        }

        Map<String, Object> response = new LinkedHashMap<>(result);
        if ("GENERAL".equalsIgnoreCase(category)) {
            response.put("appName", result.get("app_name"));
            response.put("organization", result.get("organization"));
            response.put("supportEmail", result.get("support_email"));
            response.put("timezone", result.get("timezone"));
            response.put("maintenanceMode", Boolean.parseBoolean(result.get("maintenance_mode")));
            response.put("debugMode", Boolean.parseBoolean(result.get("debug_mode")));
        }
        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse> updateSettings(@RequestParam(defaultValue = "GENERAL") String category,
                                                        @RequestBody Map<String, Object> body,
                                                        HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        Map<String, Object> normalized = "GENERAL".equalsIgnoreCase(category) ? normalizeGeneralKeys(body) : body;
        upsertAll(category, normalized);
        return ResponseEntity.ok(ApiResponse.success("Paramètres mis à jour avec succès", getSettingsMap(category)));
    }

    /**
     * Accepts either snake_case or camelCase keys for GENERAL settings and
     * normalizes them to the snake_case keys used for persistence.
     */
    private Map<String, Object> normalizeGeneralKeys(Map<String, Object> body) {
        Map<String, String> aliasToKey = Map.of(
                "appName", "app_name",
                "organization", "organization",
                "supportEmail", "support_email",
                "timezone", "timezone",
                "maintenanceMode", "maintenance_mode",
                "debugMode", "debug_mode"
        );
        Map<String, Object> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : body.entrySet()) {
            String key = aliasToKey.getOrDefault(entry.getKey(), entry.getKey());
            normalized.put(key, entry.getValue());
        }
        return normalized;
    }

    @GetMapping("/modules")
    public ResponseEntity<ApiResponse> getModules(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;
        return ResponseEntity.ok(ApiResponse.success("OK", getSettingsMap("MODULES")));
    }

    @PutMapping("/modules")
    public ResponseEntity<ApiResponse> updateModules(@RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;
        upsertAll("MODULES", body);
        return ResponseEntity.ok(ApiResponse.success("Modules mis à jour avec succès", getSettingsMap("MODULES")));
    }

    @GetMapping("/emails")
    public ResponseEntity<ApiResponse> getEmails(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;
        return ResponseEntity.ok(ApiResponse.success("OK", getSettingsMap("EMAILS")));
    }

    @PutMapping("/emails")
    public ResponseEntity<ApiResponse> updateEmails(@RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;
        upsertAll("EMAILS", body);
        return ResponseEntity.ok(ApiResponse.success("Paramètres emails mis à jour avec succès", getSettingsMap("EMAILS")));
    }

    private Map<String, String> defaultsFor(String category) {
        return switch (category == null ? "" : category.toUpperCase()) {
            case "GENERAL" -> GENERAL_DEFAULTS;
            case "MODULES" -> MODULES_DEFAULTS;
            case "EMAILS" -> EMAILS_DEFAULTS;
            default -> new LinkedHashMap<>();
        };
    }

    private Map<String, String> getSettingsMap(String category) {
        Map<String, String> result = new LinkedHashMap<>(defaultsFor(category));
        for (SystemSetting s : systemSettingRepository.findByCategory(category)) {
            result.put(s.getSettingKey(), s.getSettingValue());
        }
        return result;
    }

    private void upsertAll(String category, Map<String, Object> body) {
        for (Map.Entry<String, Object> entry : body.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue() != null ? String.valueOf(entry.getValue()) : null;
            SystemSetting setting = systemSettingRepository.findBySettingKey(key).orElse(null);
            if (setting == null) {
                setting = SystemSetting.builder()
                        .settingKey(key)
                        .settingValue(value)
                        .category(category)
                        .build();
            } else {
                setting.setSettingValue(value);
                setting.setCategory(category);
            }
            systemSettingRepository.save(setting);
        }
    }
}
