package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.AdminRoleDefinition;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.AdminRoleDefinitionRepository;
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
 * Gestion des rôles et permissions administrateur.
 */
@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
@Slf4j
public class AdminRolesController {

    private final AdminRoleDefinitionRepository adminRoleDefinitionRepository;
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
    public ResponseEntity<ApiResponse> listRoles(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        List<Map<String, Object>> result = new ArrayList<>();
        for (AdminRoleDefinition role : adminRoleDefinitionRepository.findAll()) {
            result.add(toResponse(role));
        }
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse> listPermissions(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        List<Map<String, Object>> catalog = new ArrayList<>();
        catalog.add(permissionGroup("Accès globaux", "Tous les accès", "Lecture seule", "Export"));
        catalog.add(permissionGroup("Dossiers", "Validation dossiers", "Approbation dossiers", "Consultation dossiers", "Gestion équipe"));
        catalog.add(permissionGroup("Documents & Rapports", "Lecture documents", "Validation rapports", "Rapports", "Rapport d'audit"));
        catalog.add(permissionGroup("Évaluation", "Évaluation technique", "Terrain", "Audit"));
        catalog.add(permissionGroup("Pilotage", "Pilotage"));

        return ResponseEntity.ok(ApiResponse.success("OK", catalog));
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createRole(@RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        String code = str(body, "code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Le code du rôle est requis"));
        }
        if (adminRoleDefinitionRepository.existsByCode(code)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Un rôle avec ce code existe déjà"));
        }

        AdminRoleDefinition role = AdminRoleDefinition.builder()
                .code(code)
                .name(str(body, "name"))
                .description(str(body, "description"))
                .permissions(toJson(listOf(body, "permissions")))
                .active(boolOrDefault(body, "active", true))
                .build();

        role = adminRoleDefinitionRepository.save(role);
        return ResponseEntity.ok(ApiResponse.success("Rôle créé avec succès", toResponse(role)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateRole(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        AdminRoleDefinition role = adminRoleDefinitionRepository.findById(id).orElse(null);
        if (role == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Rôle introuvable"));
        }

        if (body.containsKey("name")) role.setName(str(body, "name"));
        if (body.containsKey("description")) role.setDescription(str(body, "description"));
        if (body.containsKey("permissions")) role.setPermissions(toJson(listOf(body, "permissions")));
        if (body.containsKey("active")) role.setActive(boolOrDefault(body, "active", role.getActive()));
        role.setUpdatedAt(LocalDateTime.now());

        role = adminRoleDefinitionRepository.save(role);
        return ResponseEntity.ok(ApiResponse.success("Rôle mis à jour avec succès", toResponse(role)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteRole(@PathVariable Long id, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        if (!adminRoleDefinitionRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Rôle introuvable"));
        }
        adminRoleDefinitionRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Rôle supprimé avec succès"));
    }

    private Map<String, Object> permissionGroup(String category, String... perms) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("category", category);
        m.put("permissions", List.of(perms));
        return m;
    }

    private Map<String, Object> toResponse(AdminRoleDefinition role) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", role.getId());
        m.put("code", role.getCode());
        m.put("name", role.getName());
        m.put("description", role.getDescription());
        m.put("permissions", fromJson(role.getPermissions()));
        m.put("active", role.getActive());
        m.put("createdAt", role.getCreatedAt());
        m.put("updatedAt", role.getUpdatedAt());
        long userCount = countUsersForCode(role.getCode());
        m.put("userCount", userCount);
        m.put("usersCount", userCount);
        return m;
    }

    private long countUsersForCode(String code) {
        if (code == null) return 0;
        try {
            UserRole role = UserRole.valueOf(code.trim().toUpperCase());
            return userRepository.findByRole(role).size();
        } catch (IllegalArgumentException e) {
            return 0;
        }
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
            log.warn("AdminRolesController: failed to serialize JSON - {}", e.getMessage());
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
