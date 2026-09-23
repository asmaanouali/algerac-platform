package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.SupportTicket;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.SupportTicketRepository;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gestion du support et des tickets (assistance interne / OEC).
 */
@RestController
@RequestMapping("/api/admin/support")
@RequiredArgsConstructor
@Slf4j
public class AdminSupportController {

    private final SupportTicketRepository supportTicketRepository;
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

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse> stats(HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        List<SupportTicket> all = supportTicketRepository.findAll();
        long ouverts = all.stream().filter(t -> "OUVERT".equalsIgnoreCase(t.getStatus())).count();
        long enCours = all.stream().filter(t -> "EN_COURS".equalsIgnoreCase(t.getStatus())).count();
        long resolus = all.stream().filter(t -> "RESOLU".equalsIgnoreCase(t.getStatus())).count();
        double avgSatisfaction = all.stream()
                .filter(t -> t.getSatisfactionRating() != null)
                .mapToDouble(SupportTicket::getSatisfactionRating)
                .average().orElse(0.0);

        double avgResolutionHours = all.stream()
                .filter(t -> "RESOLU".equalsIgnoreCase(t.getStatus()))
                .filter(t -> t.getCreatedAt() != null && t.getUpdatedAt() != null)
                .mapToLong(t -> java.time.Duration.between(t.getCreatedAt(), t.getUpdatedAt()).toHours())
                .filter(h -> h >= 0)
                .average()
                .orElse(0.0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", all.size());
        result.put("ouverts", ouverts);
        result.put("enCours", enCours);
        result.put("resolus", resolus);
        result.put("satisfactionMoyenne", Math.round(avgSatisfaction * 10.0) / 10.0);

        result.put("openTickets", ouverts);
        result.put("inProgressTickets", enCours);
        result.put("resolvedTickets", resolus);
        result.put("satisfaction", Math.round(avgSatisfaction * 10.0) / 10.0);
        result.put("avgResolutionHours", Math.round(avgResolutionHours * 10.0) / 10.0);

        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse> listTickets(@RequestParam(required = false) String status, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        List<SupportTicket> tickets = (status == null || status.isBlank())
                ? supportTicketRepository.findAll()
                : supportTicketRepository.findByStatus(status.toUpperCase());

        return ResponseEntity.ok(ApiResponse.success("OK", tickets));
    }

    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse> createTicket(@RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        String ticketNumber = "TK-" + String.format("%03d", supportTicketRepository.count() + 1);
        String title = str(body, "title") != null ? str(body, "title") : str(body, "subject");
        SupportTicket ticket = SupportTicket.builder()
                .ticketNumber(ticketNumber)
                .title(title)
                .priority(mapPriority(str(body, "priority")))
                .status(mapStatus(str(body, "status")))
                .assignedTo(str(body, "assignedTo"))
                .description(str(body, "description"))
                .satisfactionRating(doubleOf(body, "satisfactionRating"))
                .build();

        ticket = supportTicketRepository.save(ticket);
        return ResponseEntity.ok(ApiResponse.success("Ticket créé avec succès", ticket));
    }

    /**
     * Maps English/prototype priority values (MEDIUM/HIGH/LOW/URGENT) to the
     * French values used by the SupportTicket model (MOYENNE/HAUTE/BASSE).
     * Values already in French are passed through untouched.
     */
    private String mapPriority(String priority) {
        if (priority == null || priority.isBlank()) return "MOYENNE";
        return switch (priority.trim().toUpperCase()) {
            case "MEDIUM" -> "MOYENNE";
            case "HIGH" -> "HAUTE";
            case "LOW" -> "BASSE";
            case "URGENT" -> "HAUTE";
            default -> priority.trim().toUpperCase();
        };
    }

    /**
     * Maps English/prototype status values (OPEN/IN_PROGRESS/RESOLVED) to the
     * French values used by the SupportTicket model (OUVERT/EN_COURS/RESOLU).
     */
    private String mapStatus(String status) {
        if (status == null || status.isBlank()) return "OUVERT";
        return switch (status.trim().toUpperCase()) {
            case "OPEN" -> "OUVERT";
            case "IN_PROGRESS" -> "EN_COURS";
            case "RESOLVED" -> "RESOLU";
            case "CLOSED" -> "RESOLU";
            default -> status.trim().toUpperCase();
        };
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateTicket(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        SupportTicket ticket = supportTicketRepository.findById(id).orElse(null);
        if (ticket == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Ticket introuvable"));
        }

        if (body.containsKey("title")) ticket.setTitle(str(body, "title"));
        if (body.containsKey("priority")) ticket.setPriority(mapPriority(str(body, "priority")));
        if (body.containsKey("status")) ticket.setStatus(mapStatus(str(body, "status")));
        if (body.containsKey("assignedTo")) ticket.setAssignedTo(str(body, "assignedTo"));
        if (body.containsKey("description")) ticket.setDescription(str(body, "description"));
        if (body.containsKey("satisfactionRating")) ticket.setSatisfactionRating(doubleOf(body, "satisfactionRating"));
        ticket.setUpdatedAt(LocalDateTime.now());

        ticket = supportTicketRepository.save(ticket);
        return ResponseEntity.ok(ApiResponse.success("Ticket mis à jour avec succès", ticket));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        SupportTicket ticket = supportTicketRepository.findById(id).orElse(null);
        if (ticket == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Ticket introuvable"));
        }

        String status = str(body, "status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Le statut est requis"));
        }
        ticket.setStatus(mapStatus(status));
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket = supportTicketRepository.save(ticket);

        return ResponseEntity.ok(ApiResponse.success("Statut mis à jour avec succès", ticket));
    }

    private String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v != null ? String.valueOf(v) : null;
    }

    private Double doubleOf(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return Double.parseDouble(String.valueOf(v));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
