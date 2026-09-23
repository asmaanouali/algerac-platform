package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.DocumentTemplate;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.DocumentTemplateRepository;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Gestion des modèles de documents (templates FOR/PRO/LIS...).
 */
@RestController
@RequestMapping("/api/admin/documents")
@RequiredArgsConstructor
@Slf4j
public class AdminDocumentsController {

    private final DocumentTemplateRepository documentTemplateRepository;
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

    @GetMapping("/templates")
    public ResponseEntity<ApiResponse> listTemplates(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;
        List<DocumentTemplate> templates = documentTemplateRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("OK", templates));
    }

    /**
     * Lightweight file-explorer stub built from the seeded document templates,
     * grouped by file type into folders, so the frontend doesn't 404.
     */
    @GetMapping("/explorer")
    public ResponseEntity<ApiResponse> explorer(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        List<DocumentTemplate> templates = documentTemplateRepository.findAll();
        java.util.Map<String, Long> byType = new java.util.LinkedHashMap<>();
        for (DocumentTemplate t : templates) {
            String type = t.getFileType() != null ? t.getFileType().toUpperCase() : "AUTRE";
            byType.merge(type, 1L, Long::sum);
        }

        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        long folderId = 1;
        for (java.util.Map.Entry<String, Long> entry : byType.entrySet()) {
            java.util.Map<String, Object> folder = new java.util.LinkedHashMap<>();
            folder.put("id", folderId++);
            folder.put("name", "Documents " + entry.getKey());
            folder.put("type", "folder");
            folder.put("size", entry.getValue() + " fichier(s)");
            result.add(folder);
        }
        for (DocumentTemplate t : templates) {
            java.util.Map<String, Object> file = new java.util.LinkedHashMap<>();
            file.put("id", folderId++);
            file.put("name", (t.getCode() != null ? t.getCode() + " - " : "") + t.getName());
            file.put("type", "file");
            file.put("size", t.getFileType() != null ? t.getFileType() : "—");
            file.put("updatedAt", t.getLastModified());
            file.put("mimeType", t.getFileType() != null ? t.getFileType().toLowerCase() : null);
            result.add(file);
        }

        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    /**
     * Archives stub endpoint - no archived documents are tracked yet, so an
     * empty list is returned rather than a 404.
     */
    @GetMapping("/archives")
    public ResponseEntity<ApiResponse> archives(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;
        return ResponseEntity.ok(ApiResponse.success("OK", java.util.Collections.emptyList()));
    }

    @PostMapping("/templates")
    public ResponseEntity<ApiResponse> createTemplate(@RequestBody DocumentTemplate template, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        if (template.getCode() == null || template.getCode().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Le code du modèle est requis"));
        }
        if (documentTemplateRepository.existsByCode(template.getCode())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Un modèle avec ce code existe déjà"));
        }

        template.setId(null);
        DocumentTemplate saved = documentTemplateRepository.save(template);
        return ResponseEntity.ok(ApiResponse.success("Modèle créé avec succès", saved));
    }

    @GetMapping("/templates/{id}/download")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable Long id, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) {
            return ResponseEntity.status(err.getStatusCode()).build();
        }

        DocumentTemplate template = documentTemplateRepository.findById(id).orElse(null);
        if (template == null) {
            return ResponseEntity.notFound().build();
        }

        if (template.getFilePath() == null || template.getFilePath().isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        try {
            Path path = Path.of(template.getFilePath());
            if (!Files.exists(path)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            byte[] content = Files.readAllBytes(path);
            String filename = (template.getCode() != null ? template.getCode() : "document") + "."
                    + (template.getFileType() != null ? template.getFileType().toLowerCase() : "bin");
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(content);
        } catch (Exception e) {
            log.warn("AdminDocumentsController: failed to read template file - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
