package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.ReferentielEntry;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.ReferentielEntryRepository;
import com.algerac.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Référentiels (OEC, évaluateurs, membres CAS).
 */
@RestController
@RequestMapping("/api/admin/referentiels")
@RequiredArgsConstructor
@Slf4j
public class AdminReferentielsController {

    private final ReferentielEntryRepository referentielEntryRepository;
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
    public ResponseEntity<ApiResponse> list(@RequestParam(required = false) String category, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        List<ReferentielEntry> entries = (category == null || category.isBlank())
                ? referentielEntryRepository.findAll()
                : referentielEntryRepository.findByCategory(category.toUpperCase());

        List<Map<String, Object>> result = new ArrayList<>();
        for (ReferentielEntry entry : entries) {
            result.add(toResponse(entry));
        }
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse> create(@RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        String category = str(body, "category");
        if (category == null || category.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("La catégorie est requise"));
        }

        ReferentielEntry entry = ReferentielEntry.builder()
                .category(category.toUpperCase())
                .code(str(body, "code"))
                .name(str(body, "name"))
                .type(str(body, "type"))
                .accreditationDate(dateOf(body, "accreditationDate"))
                .status(normalizeStatus(str(body, "status")))
                .extraJson(toJson(body.get("extra")))
                .build();

        entry = referentielEntryRepository.save(entry);
        return ResponseEntity.ok(ApiResponse.success("Entrée créée avec succès", toResponse(entry)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> update(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        ReferentielEntry entry = referentielEntryRepository.findById(id).orElse(null);
        if (entry == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Entrée introuvable"));
        }

        if (body.containsKey("category")) entry.setCategory(str(body, "category").toUpperCase());
        if (body.containsKey("code")) entry.setCode(str(body, "code"));
        if (body.containsKey("name")) entry.setName(str(body, "name"));
        if (body.containsKey("type")) entry.setType(str(body, "type"));
        if (body.containsKey("accreditationDate")) entry.setAccreditationDate(dateOf(body, "accreditationDate"));
        if (body.containsKey("status")) entry.setStatus(normalizeStatus(str(body, "status")));
        if (body.containsKey("extra")) entry.setExtraJson(toJson(body.get("extra")));
        entry.setUpdatedAt(LocalDateTime.now());

        entry = referentielEntryRepository.save(entry);
        return ResponseEntity.ok(ApiResponse.success("Entrée mise à jour avec succès", toResponse(entry)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable Long id, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        if (!referentielEntryRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Entrée introuvable"));
        }
        referentielEntryRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Entrée supprimée avec succès"));
    }

    private Map<String, Object> toResponse(ReferentielEntry entry) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", entry.getId());
        m.put("category", entry.getCategory());
        m.put("code", entry.getCode());
        m.put("name", entry.getName());
        m.put("type", entry.getType());
        m.put("accreditationDate", entry.getAccreditationDate());
        m.put("status", entry.getStatus());
        m.put("extra", fromJson(entry.getExtraJson()));
        m.put("createdAt", entry.getCreatedAt());
        m.put("updatedAt", entry.getUpdatedAt());
        return m;
    }

    private String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v != null ? String.valueOf(v) : null;
    }

    /**
     * Normalizes status values to the ACTIF/SUSPENDU vocabulary used by the
     * model, accepting the English ACTIVE/SUSPENDED prototype values too.
     */
    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "ACTIF";
        return switch (status.trim().toUpperCase()) {
            case "ACTIVE" -> "ACTIF";
            case "SUSPENDED" -> "SUSPENDU";
            case "INACTIVE", "INACTIF" -> "SUSPENDU";
            default -> status.trim().toUpperCase();
        };
    }

    private LocalDate dateOf(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return LocalDate.parse(String.valueOf(v).substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }

    private String toJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("AdminReferentielsController: failed to serialize JSON - {}", e.getMessage());
            return null;
        }
    }

    private Object fromJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            return null;
        }
    }
}
