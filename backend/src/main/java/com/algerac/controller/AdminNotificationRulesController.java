package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.NotificationRule;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.NotificationRuleRepository;
import com.algerac.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Règles de notification (canaux, destinataires, délais).
 */
@RestController
@RequestMapping("/api/admin/notification-rules")
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationRulesController {

    private final NotificationRuleRepository notificationRuleRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

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

    @GetMapping
    public ResponseEntity<ApiResponse> list(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        List<Map<String, Object>> result = new ArrayList<>();
        for (NotificationRule rule : notificationRuleRepository.findAll()) {
            result.add(toResponse(rule));
        }
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse> create(@RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        NotificationRule rule = NotificationRule.builder()
                .eventType(str(body, "eventType"))
                .channels(toJson(listOf(body, "channels")))
                .recipients(str(body, "recipients"))
                .delayLabel(str(body, "delayLabel"))
                .active(boolOrDefault(body, "active", true))
                .build();

        rule = notificationRuleRepository.save(rule);
        return ResponseEntity.ok(ApiResponse.success("Règle de notification créée avec succès", toResponse(rule)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> update(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        NotificationRule rule = notificationRuleRepository.findById(id).orElse(null);
        if (rule == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Règle introuvable"));
        }

        if (body.containsKey("eventType")) rule.setEventType(str(body, "eventType"));
        if (body.containsKey("channels")) rule.setChannels(toJson(listOf(body, "channels")));
        if (body.containsKey("recipients")) rule.setRecipients(str(body, "recipients"));
        if (body.containsKey("delayLabel")) rule.setDelayLabel(str(body, "delayLabel"));
        if (body.containsKey("active")) rule.setActive(boolOrDefault(body, "active", rule.getActive()));
        rule.setUpdatedAt(LocalDateTime.now());

        rule = notificationRuleRepository.save(rule);
        return ResponseEntity.ok(ApiResponse.success("Règle mise à jour avec succès", toResponse(rule)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable Long id, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        if (!notificationRuleRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Règle introuvable"));
        }
        notificationRuleRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Règle supprimée avec succès"));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse> toggle(@PathVariable Long id, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        NotificationRule rule = notificationRuleRepository.findById(id).orElse(null);
        if (rule == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Règle introuvable"));
        }
        rule.setActive(!Boolean.TRUE.equals(rule.getActive()));
        rule.setUpdatedAt(LocalDateTime.now());
        rule = notificationRuleRepository.save(rule);
        return ResponseEntity.ok(ApiResponse.success("Statut mis à jour avec succès", toResponse(rule)));
    }

    private Map<String, Object> toResponse(NotificationRule rule) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", rule.getId());
        m.put("eventType", rule.getEventType());
        m.put("channels", fromJson(rule.getChannels()));
        m.put("recipients", rule.getRecipients());
        m.put("delayLabel", rule.getDelayLabel());
        m.put("active", rule.getActive());
        m.put("createdAt", rule.getCreatedAt());
        m.put("updatedAt", rule.getUpdatedAt());
        return m;
    }

    @SuppressWarnings("unchecked")
    private List<String> listOf(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v instanceof List<?> l) {
            List<String> out = new ArrayList<>();
            for (Object o : l) out.add(String.valueOf(o));
            return out;
        }
        return new ArrayList<>();
    }

    private String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v != null ? String.valueOf(v) : null;
    }

    private Boolean boolOrDefault(Map<String, Object> body, String key, Boolean def) {
        Object v = body.get(key);
        if (v == null) return def;
        if (v instanceof Boolean b) return b;
        return Boolean.parseBoolean(String.valueOf(v));
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("AdminNotificationRulesController: failed to serialize JSON - {}", e.getMessage());
            return "[]";
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
