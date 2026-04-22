package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.*;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * PRO 07 — Committee composition management + form endpoints:
 *   FOR 33 — Attendance list
 *   FOR 42 — Meeting minutes (PV)
 *   FOR 58 — Convocation records
 *   FOR 65-2 — Member competency tracking
 */
@RestController
@RequestMapping("/api/cas-committees")
@RequiredArgsConstructor
@Slf4j
public class CASCommitteeController {

    private final CASCommitteeRepository committeeRepository;
    private final CASMeetingRepository meetingRepository;
    private final CASVoteRepository voteRepository;
    private final FOR58ConvocationRepository convocationRepository;
    private final FOR65CompetencyTrackingRepository competencyRepository;
    private final UserRepository userRepository;

    // ===================== COMMITTEE CRUD =====================

    @GetMapping
    public ResponseEntity<?> listCommittees() {
        return ResponseEntity.ok(committeeRepository.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<?> listActiveCommittees() {
        return ResponseEntity.ok(committeeRepository.findByActiveTrue());
    }

    @GetMapping("/domains")
    public ResponseEntity<?> listDomains() {
        List<Map<String, String>> domains = Arrays.stream(AccreditationDomain.values())
                .map(d -> {
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("value", d.name());
                    m.put("label", d.label);
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(domains);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCommittee(@PathVariable Long id) {
        return committeeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-domain/{domain}")
    public ResponseEntity<?> getByDomain(@PathVariable String domain) {
        try {
            AccreditationDomain d = AccreditationDomain.valueOf(domain.toUpperCase());
            return committeeRepository.findByDomain(d)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Domaine inconnu: " + domain));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createCommittee(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));

            String domainStr = (String) body.get("domain");
            if (domainStr == null) return ResponseEntity.badRequest().body(ApiResponse.error("Domaine requis"));

            AccreditationDomain domain;
            try {
                domain = AccreditationDomain.valueOf(domainStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Domaine invalide: " + domainStr));
            }

            if (committeeRepository.existsByDomain(domain)) {
                return ResponseEntity.badRequest().body(ApiResponse.error(
                        "Un comité existe déjà pour le domaine: " + domain.label));
            }

            String name = (String) body.getOrDefault("name", domain.label);

            CASCommittee committee = CASCommittee.builder()
                    .domain(domain)
                    .name(name)
                    .active(true)
                    .members(new ArrayList<>())
                    .build();

            // Optional: set president
            if (body.get("presidentId") != null) {
                Long presidentId = Long.valueOf(body.get("presidentId").toString());
                userRepository.findById(presidentId).ifPresent(committee::setPresident);
            }
            // Optional: set vice-president
            if (body.get("vicePresidentId") != null) {
                Long vpId = Long.valueOf(body.get("vicePresidentId").toString());
                userRepository.findById(vpId).ifPresent(committee::setVicePresident);
            }
            // Optional: set members
            if (body.get("memberIds") instanceof List<?> memberIds) {
                List<User> members = new ArrayList<>();
                for (Object mid : memberIds) {
                    userRepository.findById(Long.valueOf(mid.toString())).ifPresent(members::add);
                }
                committee.setMembers(members);
            }

            committeeRepository.save(committee);
            return ResponseEntity.ok(ApiResponse.success("Comité CAS créé pour " + domain.label, committee));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateCommittee(@PathVariable Long id,
                                                        @RequestBody Map<String, Object> body,
                                                        HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));

            CASCommittee committee = committeeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Comité non trouvé"));

            if (body.get("name") != null) committee.setName((String) body.get("name"));
            if (body.get("active") != null) committee.setActive((Boolean) body.get("active"));

            if (body.get("presidentId") != null) {
                Long presidentId = Long.valueOf(body.get("presidentId").toString());
                userRepository.findById(presidentId).ifPresent(committee::setPresident);
            }
            if (body.get("vicePresidentId") != null) {
                Long vpId = Long.valueOf(body.get("vicePresidentId").toString());
                userRepository.findById(vpId).ifPresent(committee::setVicePresident);
            }
            if (body.get("memberIds") instanceof List<?> memberIds) {
                if (memberIds.size() > 5) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(
                            "PRO 07 §5.1 — Un comité est composé de cinq (05) membres maximum."));
                }
                List<User> members = new ArrayList<>();
                for (Object mid : memberIds) {
                    userRepository.findById(Long.valueOf(mid.toString())).ifPresent(members::add);
                }
                committee.setMembers(members);
            }

            committeeRepository.save(committee);
            return ResponseEntity.ok(ApiResponse.success("Comité mis à jour", committee));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deactivateCommittee(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));

            CASCommittee committee = committeeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Comité non trouvé"));
            committee.setActive(false);
            committeeRepository.save(committee);
            return ResponseEntity.ok(ApiResponse.success("Comité désactivé", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===================== FOR 33 — LISTE DE PRÉSENCE =====================

    /**
     * FOR 33 — Returns the formal attendance list for a CAS meeting.
     * Includes each member's attendance status and conflict-of-interest declaration.
     */
    @GetMapping("/meetings/{meetingId}/for33")
    public ResponseEntity<?> getFor33AttendanceList(@PathVariable Long meetingId) {
        try {
            CASMeeting meeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new RuntimeException("Réunion non trouvée"));

            List<FOR58Convocation> convocations = convocationRepository.findByMeeting_Id(meetingId);
            List<CASVote> votes = voteRepository.findByMeeting_Id(meetingId);

            List<Map<String, Object>> attendanceList = new ArrayList<>();

            for (FOR58Convocation conv : convocations) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("memberId", conv.getMemberId());
                row.put("memberName", conv.getMemberName());
                row.put("memberEmail", conv.getMemberEmail());
                row.put("convocationSentAt", conv.getSentAt());
                row.put("convocationAcknowledged", conv.getAcknowledged());

                // Find corresponding vote/attendance record
                Optional<CASVote> vote = votes.stream()
                        .filter(v -> v.getVoterId() != null && v.getVoterId().equals(conv.getMemberId()))
                        .findFirst();

                row.put("attended", vote.map(CASVote::getAttendanceConfirmed).orElse(false));
                row.put("hasConflictOfInterest", vote.map(CASVote::getHasConflictOfInterest).orElse(false));
                row.put("conflictDescription", vote.map(CASVote::getConflictDescription).orElse(null));
                row.put("isExcludedEvaluator", vote.map(CASVote::getIsExcludedEvaluator).orElse(false));
                row.put("exclusionReason", vote.map(CASVote::getExclusionReason).orElse(null));

                // Is this member the president?
                boolean isPresident = meeting.getCommittee() != null
                        && meeting.getCommittee().getPresident() != null
                        && meeting.getCommittee().getPresident().getId().equals(conv.getMemberId());
                boolean isVicePresident = meeting.getCommittee() != null
                        && meeting.getCommittee().getVicePresident() != null
                        && meeting.getCommittee().getVicePresident().getId().equals(conv.getMemberId());
                row.put("isPresident", isPresident);
                row.put("isVicePresident", isVicePresident);

                attendanceList.add(row);
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("meetingCode", meeting.getMeetingCode());
            result.put("meetingDate", meeting.getMeetingDate());
            result.put("location", meeting.getLocation());
            result.put("committeeName", meeting.getCommitteeName());
            result.put("quorumRequired", meeting.getQuorumRequired());
            result.put("quorumReached", meeting.getQuorumReached());
            result.put("attendeesConfirmed", meeting.getAttendeesConfirmed());
            result.put("attendanceList", attendanceList);
            result.put("totalConvened", convocations.size());
            result.put("totalAttended", attendanceList.stream()
                    .filter(r -> Boolean.TRUE.equals(r.get("attended"))).count());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===================== FOR 42 — PV DE RÉUNION =====================

    @GetMapping("/meetings/{meetingId}/for42")
    public ResponseEntity<?> getFor42Minutes(@PathVariable Long meetingId) {
        try {
            CASMeeting meeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new RuntimeException("Réunion non trouvée"));

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("meetingId", meeting.getId());
            result.put("meetingCode", meeting.getMeetingCode());
            result.put("meetingDate", meeting.getMeetingDate());
            result.put("location", meeting.getLocation());
            result.put("committeeName", meeting.getCommitteeName());
            result.put("meetingMinutes", meeting.getMeetingMinutes());
            result.put("minutesSignedAt", meeting.getMinutesSignedAt());
            result.put("minutesDistributedAt", meeting.getMinutesDistributedAt());
            result.put("presidentNotes", meeting.getPresidentNotes());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/meetings/{meetingId}/for42")
    public ResponseEntity<ApiResponse> updateFor42Minutes(@PathVariable Long meetingId,
                                                           @RequestBody Map<String, Object> body,
                                                           HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));

            CASMeeting meeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new RuntimeException("Réunion non trouvée"));

            if (body.get("meetingMinutes") != null) {
                meeting.setMeetingMinutes((String) body.get("meetingMinutes"));
            }
            if (Boolean.TRUE.equals(body.get("sign"))) {
                meeting.setMinutesSignedAt(LocalDateTime.now());
            }
            if (Boolean.TRUE.equals(body.get("distribute"))) {
                meeting.setMinutesDistributedAt(LocalDateTime.now());
            }

            meetingRepository.save(meeting);
            return ResponseEntity.ok(ApiResponse.success("PV de réunion (FOR 42) mis à jour", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===================== FOR 58 — CONVOCATIONS =====================

    @GetMapping("/meetings/{meetingId}/for58")
    public ResponseEntity<?> getFor58Convocations(@PathVariable Long meetingId) {
        try {
            List<FOR58Convocation> convocations = convocationRepository.findByMeeting_Id(meetingId);
            return ResponseEntity.ok(convocations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/meetings/{meetingId}/for58/acknowledge")
    public ResponseEntity<ApiResponse> acknowledgeConvocation(@PathVariable Long meetingId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));

            FOR58Convocation conv = convocationRepository.findByMeeting_IdAndMember_Id(meetingId, userId)
                    .orElseThrow(() -> new RuntimeException("Convocation non trouvée pour ce membre"));

            conv.setAcknowledged(true);
            conv.setAcknowledgedAt(LocalDateTime.now());
            convocationRepository.save(conv);

            return ResponseEntity.ok(ApiResponse.success("Convocation accusée de réception (FOR 58)", conv));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===================== FOR 65-2 — SUIVI DES COMPÉTENCES =====================

    @GetMapping("/meetings/{meetingId}/for65")
    public ResponseEntity<?> getFor65ForMeeting(@PathVariable Long meetingId) {
        try {
            List<FOR65CompetencyTracking> records = competencyRepository.findByMeeting_Id(meetingId);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/members/{memberId}/for65")
    public ResponseEntity<?> getFor65ForMember(@PathVariable Long memberId) {
        try {
            List<FOR65CompetencyTracking> records =
                    competencyRepository.findByMember_IdOrderByCreatedAtDesc(memberId);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/meetings/{meetingId}/for65")
    public ResponseEntity<ApiResponse> submitFor65(@PathVariable Long meetingId,
                                                    @RequestBody Map<String, Object> body,
                                                    HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));

            User evaluatedBy = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            CASMeeting meeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new RuntimeException("Réunion non trouvée"));

            Long memberId = Long.valueOf(body.get("memberId").toString());
            User member = userRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("Membre non trouvé"));

            FOR65CompetencyTracking tracking = FOR65CompetencyTracking.builder()
                    .meeting(meeting)
                    .member(member)
                    .evaluatedBy(evaluatedBy)
                    .overallRating(parseIntSafe(body.get("overallRating")))
                    .technicalKnowledgeRating(parseIntSafe(body.get("technicalKnowledgeRating")))
                    .impartialityRating(parseIntSafe(body.get("impartialityRating")))
                    .independenceRating(parseIntSafe(body.get("independenceRating")))
                    .communicationRating(parseIntSafe(body.get("communicationRating")))
                    .strengths((String) body.get("strengths"))
                    .areasForImprovement((String) body.get("areasForImprovement"))
                    .remarks((String) body.get("remarks"))
                    .recommendMaintain(body.get("recommendMaintain") != null
                            ? Boolean.valueOf(body.get("recommendMaintain").toString()) : null)
                    .maintenanceJustification((String) body.get("maintenanceJustification"))
                    .build();

            competencyRepository.save(tracking);
            return ResponseEntity.ok(ApiResponse.success("Évaluation FOR 65-2 enregistrée", tracking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private Integer parseIntSafe(Object val) {
        if (val == null) return null;
        try { return Integer.valueOf(val.toString()); } catch (NumberFormatException e) { return null; }
    }
}
