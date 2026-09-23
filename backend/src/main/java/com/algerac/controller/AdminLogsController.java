package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.SystemLog;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.SystemLogRepository;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
 * Journaux système filtrés et paginés.
 */
@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
@Slf4j
public class AdminLogsController {

    private final SystemLogRepository systemLogRepository;
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

    @GetMapping
    public ResponseEntity<ApiResponse> list(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        Page<SystemLog> result = systemLogRepository.findFiltered(
                blankToNull(level), blankToNull(module), blankToNull(search),
                PageRequest.of(Math.max(page, 0), Math.max(size, 1)));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content", result.getContent());
        body.put("totalElements", result.getTotalElements());
        body.put("totalPages", result.getTotalPages());
        body.put("page", result.getNumber());
        body.put("size", result.getSize());

        return ResponseEntity.ok(ApiResponse.success("OK", body));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String search,
            HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) {
            return ResponseEntity.status(err.getStatusCode()).build();
        }

        List<SystemLog> logs = systemLogRepository.findFiltered(
                blankToNull(level), blankToNull(module), blankToNull(search),
                PageRequest.of(0, Integer.MAX_VALUE >> 4)).getContent();

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
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"system-logs.csv\"")
                .body(bytes);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    private String safe(String value) {
        if (value == null) return "";
        return "\"" + value.replace("\"", "'").replace("\n", " ") + "\"";
    }
}
