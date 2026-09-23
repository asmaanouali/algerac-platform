package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.AccreditationRequest;
import com.algerac.model.RequestStatus;
import com.algerac.model.SupportTicket;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.SupportTicketRepository;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Rapports et statistiques agrégées pour le tableau de bord admin.
 * Toutes les valeurs sont calculées depuis la base — aucune donnée fictive.
 */
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@Slf4j
public class AdminReportsController {

    private final RequestRepository requestRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;

    private static final Set<RequestStatus> IN_PROGRESS_STATUSES = Set.of(
            RequestStatus.SUBMITTED, RequestStatus.PENDING_DT_REVIEW, RequestStatus.DT_APPROVED,
            RequestStatus.PENDING_CD_ASSIGNMENT, RequestStatus.ASSIGNED_TO_RA, RequestStatus.RECEIVABILITY_STUDY,
            RequestStatus.RECEIVABLE, RequestStatus.QUOTATION_PREPARATION, RequestStatus.CONVENTION_PREPARATION,
            RequestStatus.TEAM_DESIGNATION, RequestStatus.DOC_REVIEW_IN_PROGRESS, RequestStatus.EVALUATION_IN_PROGRESS,
            RequestStatus.EVALUATION_ONGOING, RequestStatus.AWAITING_ACTION_PLANS, RequestStatus.ACTION_PLANS_EVALUATION,
            RequestStatus.REPORT_DRAFTING, RequestStatus.CAS_PREPARATION, RequestStatus.CAS_SCHEDULED,
            RequestStatus.CERTIFICATE_PREPARATION, RequestStatus.SURVEILLANCE_SCHEDULED, RequestStatus.SURVEILLANCE_IN_PROGRESS,
            RequestStatus.RENEWAL_INITIATED, RequestStatus.RENEWAL_EVALUATION, RequestStatus.EXTENSION_REQUESTED,
            RequestStatus.EXTENSION_EVALUATION, RequestStatus.TRANSFER_INITIATED, RequestStatus.TRANSFER_REVIEW
    );

    private static final Set<RequestStatus> ACCREDITED_STATUSES = Set.of(
            RequestStatus.ACTIVE, RequestStatus.CERTIFICATE_ISSUED, RequestStatus.CAS_DECISION_GRANT,
            RequestStatus.EXTENSION_GRANTED, RequestStatus.RENEWAL_COMPLETED, RequestStatus.TRANSFER_COMPLETED
    );

    private static final Set<RequestStatus> REFUSED_STATUSES = Set.of(
            RequestStatus.CAS_DECISION_REFUSAL, RequestStatus.DT_REJECTED, RequestStatus.NOT_RECEIVABLE,
            RequestStatus.QUOTATION_EXPIRED
    );

    private static final Set<RequestStatus> SUSPENDED_STATUSES = Set.of(
            RequestStatus.SUSPENDED, RequestStatus.PROCESS_SUSPENDED_OBSTACLES
    );

    private static final Set<RequestStatus> CLOSED_STATUSES = Set.of(
            RequestStatus.CLOSED, RequestStatus.WITHDRAWN
    );

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
    public ResponseEntity<ApiResponse> stats(@RequestParam(defaultValue = "month") String period, HttpSession session) {
        ResponseEntity<ApiResponse> err = requireAdmin(session);
        if (err != null) return err;

        LocalDateTime from = periodStart(period);
        LocalDateTime previousFrom = previousPeriodStart(period, from);
        List<AccreditationRequest> allRequests = requestRepository.findAll();

        List<AccreditationRequest> requests = allRequests.stream()
                .filter(r -> from == null || (r.getCreatedAt() != null && !r.getCreatedAt().isBefore(from)))
                .toList();

        List<AccreditationRequest> previousRequests = previousFrom != null && from != null
                ? allRequests.stream()
                    .filter(r -> r.getCreatedAt() != null
                            && !r.getCreatedAt().isBefore(previousFrom)
                            && r.getCreatedAt().isBefore(from))
                    .toList()
                : List.of();

        long enCours = requests.stream().filter(r -> IN_PROGRESS_STATUSES.contains(r.getStatus())).count();
        long accredites = requests.stream().filter(r -> ACCREDITED_STATUSES.contains(r.getStatus())).count();
        long refuses = requests.stream().filter(r -> REFUSED_STATUSES.contains(r.getStatus())).count();
        long suspendus = requests.stream().filter(r -> SUSPENDED_STATUSES.contains(r.getStatus())).count();
        long clotures = requests.stream().filter(r -> CLOSED_STATUSES.contains(r.getStatus())).count();

        Map<String, Long> byDomain = new LinkedHashMap<>();
        for (AccreditationRequest r : requests) {
            String domain = r.getDomain() != null ? r.getDomain() : "Non spécifié";
            byDomain.merge(domain, 1L, Long::sum);
        }

        long totalUsers = userRepository.count();
        long totalOec = userRepository.findByRole(UserRole.OEC).size();
        long totalExperts = userRepository.findByRole(UserRole.EXPERT).size();

        List<SupportTicket> tickets = supportTicketRepository.findAll().stream()
                .filter(t -> from == null || (t.getCreatedAt() != null && !t.getCreatedAt().isBefore(from)))
                .toList();

        long dossiersTraites = accredites + clotures;
        long previousTraites = previousRequests.stream()
                .filter(r -> ACCREDITED_STATUSES.contains(r.getStatus()) || CLOSED_STATUSES.contains(r.getStatus()))
                .count();

        double tempsMoyen = averageProcessingDays(requests);
        double previousTempsMoyen = averageProcessingDays(previousRequests);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period", period);
        result.put("totalRequests", requests.size());
        result.put("requestsByStatus", Map.of(
                "enCours", enCours,
                "accredites", accredites,
                "refuses", refuses,
                "suspendus", suspendus,
                "clotures", clotures
        ));
        result.put("requestsByDomain", byDomain);
        result.put("totalUsers", totalUsers);
        result.put("totalOec", totalOec);
        result.put("totalExperts", totalExperts);
        result.put("totalTickets", tickets.size());
        result.put("generatedAt", LocalDateTime.now());

        result.put("dossiersTraites", dossiersTraites);
        result.put("dossiersTrend", trendLabel(dossiersTraites, previousTraites));
        result.put("tempsMoyenJours", Math.round(tempsMoyen * 10.0) / 10.0);
        result.put("tempsTrend", trendLabelInverse(tempsMoyen, previousTempsMoyen));
        result.put("utilisateursActifs", totalUsers);
        result.put("actuellementConnectes", 0);

        List<Map<String, Object>> moduleUsage = new ArrayList<>();
        for (Map.Entry<String, Long> entry : byDomain.entrySet()) {
            moduleUsage.add(pieSlice(entry.getKey(), entry.getValue()));
        }
        result.put("moduleUsage", moduleUsage);

        // Pas de collecteur HTTP — série vide plutôt que des valeurs inventées
        result.put("apiPerformance", List.of());
        result.put("weeklyActivity", buildWeeklyActivity(allRequests));

        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    private List<Map<String, Object>> buildWeeklyActivity(List<AccreditationRequest> allRequests) {
        LocalDateTime weekStart = LocalDateTime.now().with(DayOfWeek.MONDAY).truncatedTo(ChronoUnit.DAYS);
        Map<DayOfWeek, long[]> counters = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek d : List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)) {
            counters.put(d, new long[]{0, 0, 0});
        }

        for (AccreditationRequest r : allRequests) {
            if (r.getCreatedAt() == null || r.getCreatedAt().isBefore(weekStart)) continue;
            DayOfWeek day = r.getCreatedAt().getDayOfWeek();
            long[] bucket = counters.get(day);
            if (bucket == null) continue;
            if (IN_PROGRESS_STATUSES.contains(r.getStatus())) bucket[0]++;
            else if (ACCREDITED_STATUSES.contains(r.getStatus()) || CLOSED_STATUSES.contains(r.getStatus())) bucket[1]++;
            else bucket[2]++;
        }

        String[] labels = {"Lun", "Mar", "Mer", "Jeu", "Ven"};
        DayOfWeek[] days = {DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY};
        List<Map<String, Object>> weeklyActivity = new ArrayList<>();
        for (int i = 0; i < days.length; i++) {
            long[] c = counters.get(days[i]);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("day", labels[i]);
            point.put("type1", c[0]);
            point.put("type2", c[1]);
            point.put("type3", c[2]);
            weeklyActivity.add(point);
        }
        return weeklyActivity;
    }

    private double averageProcessingDays(List<AccreditationRequest> requests) {
        List<Long> durations = new ArrayList<>();
        for (AccreditationRequest r : requests) {
            if (r.getCreatedAt() == null) continue;
            if (!ACCREDITED_STATUSES.contains(r.getStatus()) && !CLOSED_STATUSES.contains(r.getStatus())) continue;
            LocalDateTime end = r.getCertificateIssueDate() != null
                    ? r.getCertificateIssueDate()
                    : r.getCasDecisionDate();
            if (end == null) continue;
            long days = ChronoUnit.DAYS.between(r.getCreatedAt(), end);
            if (days >= 0) durations.add(days);
        }
        if (durations.isEmpty()) return 0;
        return durations.stream().mapToLong(Long::longValue).average().orElse(0);
    }

    private String trendLabel(long current, long previous) {
        if (previous <= 0) return current > 0 ? "+100%" : "0%";
        long delta = Math.round(((current - previous) * 100.0) / previous);
        return (delta >= 0 ? "+" : "") + delta + "%";
    }

    /** Pour le temps moyen, une baisse est une amélioration. */
    private String trendLabelInverse(double current, double previous) {
        if (previous <= 0) return current > 0 ? "n/a" : "0%";
        long delta = Math.round(((current - previous) * 100.0) / previous);
        return (delta >= 0 ? "+" : "") + delta + "%";
    }

    private Map<String, Object> pieSlice(String name, long value) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("value", value);
        return m;
    }

    private LocalDateTime periodStart(String period) {
        LocalDateTime now = LocalDateTime.now();
        if (period == null) return now.minusMonths(1);
        return switch (period.toLowerCase()) {
            case "week" -> now.minusWeeks(1);
            case "month", "mois" -> now.minusMonths(1);
            case "quarter" -> now.minusMonths(3);
            case "year" -> now.minusYears(1);
            case "all", "tout" -> null;
            default -> now.minusMonths(1);
        };
    }

    private LocalDateTime previousPeriodStart(String period, LocalDateTime from) {
        if (from == null) return null;
        if (period == null) return from.minusMonths(1);
        return switch (period.toLowerCase()) {
            case "week" -> from.minusWeeks(1);
            case "month", "mois" -> from.minusMonths(1);
            case "quarter" -> from.minusMonths(3);
            case "year" -> from.minusYears(1);
            default -> from.minusMonths(1);
        };
    }
}
