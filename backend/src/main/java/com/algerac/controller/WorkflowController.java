package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.*;
import com.algerac.service.*;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
@Slf4j
public class WorkflowController {

    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final EvaluationTeamRepository teamRepository;
    private final TeamMemberRepository memberRepository;
    private final EvaluationTeamService teamService;
    private final DocumentaryReviewRepository docReviewRepository;
    private final EvaluationPlanRepository evalPlanRepository;
    private final EvaluationReportRepository reportRepository;
    private final GapRepository gapRepository;
    private final ActionPlanRepository actionPlanRepository;
    private final EvaluationNoteRepository noteRepository;
    private final MissionOrderRepository missionOrderRepository;
    private final CASMeetingRepository casMeetingRepository;
    private final CASVoteRepository casVoteRepository;
    private final CASDecisionRepository casDecisionRepository;
    private final UserAvailabilityRepository availabilityRepository;
    private final NotificationService notificationService;
    private final PaymentRepository paymentRepository;
    private final MandateRepository mandateRepository;
    private final PreparationMeetingRepository prepMeetingRepository;
    private final WorkflowProgressService workflowProgressService;

    // ========== WORKFLOW PROGRESS ==========

    @GetMapping("/progress/{requestId}")
    public ResponseEntity<?> getWorkflowProgress(@PathVariable Long requestId) {
        return requestRepository.findById(requestId)
                .map(req -> {
                    var state = workflowProgressService.getWorkflowState(req.getStatus());
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("requestId", req.getId());
                    result.put("referenceNumber", req.getReferenceNumber());
                    result.put("status", req.getStatus().name());
                    result.put("progress", req.getProgress() > 0 ? req.getProgress() : state.progress());
                    result.put("phase", state.phase());
                    result.put("phaseLabel", state.phaseLabel());
                    result.put("stepLabel", state.stepLabel());
                    result.put("currentPhase", req.getCurrentPhase());
                    result.put("currentStep", req.getCurrentStep());
                    result.put("nextAction", req.getNextAction());
                    result.put("pendingWith", req.getPendingWith());
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ========== AVAILABILITY / PLANNING ==========

    @GetMapping("/availability/{userId}")
    public ResponseEntity<?> getUserAvailability(@PathVariable Long userId) {
        return ResponseEntity.ok(availabilityRepository.findByUser_Id(userId));
    }

    @GetMapping("/availability/user/{userId}")
    public ResponseEntity<?> getUserAvailabilityAlt(@PathVariable Long userId) {
        return ResponseEntity.ok(availabilityRepository.findByUser_Id(userId));
    }

    @PostMapping("/availability")
    public ResponseEntity<ApiResponse> setUnavailability(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            @SuppressWarnings("unchecked")
            List<String> dates = (List<String>) body.get("dates");
            String reason = (String) body.getOrDefault("reason", "Indisponible");

            for (String dateStr : dates) {
                LocalDate date = LocalDate.parse(dateStr);
                List<UserAvailability> existing = availabilityRepository.findByUser_IdAndUnavailableDateBetween(userId, date, date);
                if (existing.isEmpty()) {
                    availabilityRepository.save(UserAvailability.builder()
                            .user(user).unavailableDate(date).reason(reason).build());
                }
            }
            return ResponseEntity.ok(ApiResponse.success("Indisponibilités enregistrées", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/availability/mark-unavailable")
    public ResponseEntity<ApiResponse> markUnavailable(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String dateStr = (String) body.get("unavailableDate");
            String reason = (String) body.getOrDefault("reason", "Indisponible");

            LocalDate date = LocalDate.parse(dateStr);
            List<UserAvailability> existing = availabilityRepository.findByUser_IdAndUnavailableDateBetween(userId, date, date);
            if (existing.isEmpty()) {
                availabilityRepository.save(UserAvailability.builder()
                        .user(user).unavailableDate(date).reason(reason).build());
            }
            return ResponseEntity.ok(ApiResponse.success("Indisponibilité enregistrée", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/availability/{id}")
    public ResponseEntity<ApiResponse> removeUnavailability(@PathVariable Long id) {
        availabilityRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Disponibilité restaurée", null));
    }

    @GetMapping("/available-experts")
    public ResponseEntity<?> getAvailableExperts(@RequestParam(required = false) String date) {
        List<UserRole> teamEligibleRoles = List.of(UserRole.EXPERT, UserRole.REE, UserRole.ET, UserRole.EQ, UserRole.EVALUATEUR);
        List<User> experts = userRepository.findAll().stream()
                .filter(u -> teamEligibleRoles.contains(u.getRole()) && u.getStatus() == UserStatus.APPROVED)
                .collect(Collectors.toList());

        if (date != null) {
            LocalDate targetDate = LocalDate.parse(date);
            List<UserAvailability> unavails = availabilityRepository.findByUnavailableDate(targetDate);
            Set<Long> unavailIds = unavails.stream().map(UserAvailability::getUserId).collect(Collectors.toSet());
            experts = experts.stream().filter(e -> !unavailIds.contains(e.getId())).collect(Collectors.toList());
        }

        // Add workload info
        List<Map<String, Object>> result = experts.stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", e.getId());
            map.put("fullName", e.getFullName());
            map.put("email", e.getEmail());
            map.put("role", e.getRole() != null ? e.getRole().name() : null);
            map.put("specialite", e.getSpecialite());
            map.put("experience", e.getExperience());
            map.put("disponibilite", e.getDisponibilite());
            List<TeamMember> memberships = memberRepository.findByExpert_Id(e.getId());
            long activeTeams = memberships.stream()
                    .filter(m -> !m.getRecusedByOEC())
                    .count();
            map.put("activeDossiers", activeTeams);
            map.put("unavailableDates", availabilityRepository.findByUser_Id(e.getId())
                    .stream().map(a -> a.getUnavailableDate().toString()).collect(Collectors.toList()));
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ========== TEAM COMPOSITION (STEP 4) ==========

    @PostMapping("/teams/create")
    public ResponseEntity<ApiResponse> createTeam(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Long requestId = ((Number) body.get("requestId")).longValue();
            String teamCode = "EQ-" + Year.now().getValue() + "-" + String.format("%03d", new Random().nextInt(999));

            EvaluationTeam team = teamService.createTeam(requestId, teamCode, user);
            return ResponseEntity.ok(ApiResponse.success("Équipe créée avec succès", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/{teamId}/add-member")
    public ResponseEntity<ApiResponse> addTeamMember(@PathVariable Long teamId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Long expertId = ((Number) body.get("expertId")).longValue();
            TeamRole role = TeamRole.valueOf((String) body.get("role"));
            String specialization = (String) body.getOrDefault("specialization", "");

            TeamMember member = teamService.addMember(teamId, expertId, role, specialization, user);
            return ResponseEntity.ok(ApiResponse.success("Membre ajouté avec succès", member));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/teams/members/{memberId}")
    public ResponseEntity<ApiResponse> removeTeamMember(@PathVariable Long memberId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            teamService.removeMember(memberId, user);
            return ResponseEntity.ok(ApiResponse.success("Membre retiré de l'équipe", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/{teamId}/send-to-cd")
    public ResponseEntity<ApiResponse> sendTeamToCD(@PathVariable Long teamId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String compositionSheet = body.getOrDefault("compositionSheet", "Fiche composition équipe FOR 26");
            String evalDateStr = (String) body.get("evaluationDate");
            java.time.LocalDate proposedDate = evalDateStr != null ? java.time.LocalDate.parse(evalDateStr) : null;
            EvaluationTeam team = teamService.sendToCD(teamId, compositionSheet, proposedDate, user);
            return ResponseEntity.ok(ApiResponse.success("Composition envoyée au CD pour validation", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/{teamId}/cd-approve")
    public ResponseEntity<ApiResponse> cdApproveTeam(@PathVariable Long teamId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            EvaluationTeam team = teamService.cdApproveAndSendToOEC(teamId, user);
            return ResponseEntity.ok(ApiResponse.success("Composition approuvée et envoyée à l'OEC", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/{teamId}/cd-request-changes")
    public ResponseEntity<ApiResponse> cdRequestTeamChanges(@PathVariable Long teamId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String comments = body.getOrDefault("comments", "");
            EvaluationTeam team = teamService.cdRequestChanges(teamId, comments, user);
            return ResponseEntity.ok(ApiResponse.success("Demande de modifications envoyée au RA", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/{teamId}/change-date")
    public ResponseEntity<ApiResponse> changeTeamDate(@PathVariable Long teamId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String newDateStr = (String) body.get("evaluationDate");
            java.time.LocalDate newDate = newDateStr != null ? java.time.LocalDate.parse(newDateStr) : null;
            if (newDate == null) throw new RuntimeException("Date requise");
            EvaluationTeam team = teamService.changeProposedDate(teamId, newDate, user);
            return ResponseEntity.ok(ApiResponse.success("Nouvelle date proposée, envoyée au CD pour validation", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/{teamId}/examine-recusation")
    public ResponseEntity<ApiResponse> examineRecusation(@PathVariable Long teamId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Boolean accepted = (Boolean) body.get("accepted");
            String decisionReason = (String) body.get("decisionReason");
            if (accepted == null) throw new RuntimeException("Décision requise (accepted)");
            if (decisionReason == null || decisionReason.trim().isEmpty()) throw new RuntimeException("Raison de la décision requise");

            // Build replacements map
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> replacementsList = (List<Map<String, Object>>) body.get("replacements");
            Map<Long, Long> replacements = null;
            if (replacementsList != null && !replacementsList.isEmpty()) {
                replacements = new LinkedHashMap<>();
                for (Map<String, Object> r : replacementsList) {
                    Long recusedId = ((Number) r.get("recusedMemberId")).longValue();
                    Long replacementId = ((Number) r.get("replacementExpertId")).longValue();
                    replacements.put(recusedId, replacementId);
                }
            }

            EvaluationTeam team = teamService.examineRecusation(teamId, accepted, decisionReason, replacements, user);
            String msg = accepted ? "Récusation acceptée — membres remplacés, nouveaux membres doivent signer (PRO 22)" : "Récusation rejetée — l'équipe est maintenue (PRO 22)";
            return ResponseEntity.ok(ApiResponse.success(msg, team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== RECUSATIONS PRO 22 — dedicated endpoints ==========

    /**
     * GET /api/workflow/recusations
     * Returns all teams that have a recusation (hasRecusation=true), formatted for the RA recusation page.
     */
    @GetMapping("/recusations")
    public ResponseEntity<?> getRecusations(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            List<EvaluationTeam> teams = teamRepository.findByHasRecusationTrue();
            // Also include teams whose recusation was decided (ACCEPTED/REJECTED) for history
            List<EvaluationTeam> decided = teamRepository.findByStatusIn(
                    List.of(TeamStatus.RECUSATION_INVALID, TeamStatus.DRAFT)
            ).stream()
                    .filter(t -> t.getRecusationDecision() != null)
                    .toList();
            // Merge, avoiding duplicates
            Set<Long> seen = new java.util.HashSet<>();
            List<Map<String, Object>> result = new java.util.ArrayList<>();
            for (EvaluationTeam t : teams) {
                if (seen.add(t.getId())) result.add(buildRecusationDto(t));
            }
            for (EvaluationTeam t : decided) {
                if (seen.add(t.getId())) result.add(buildRecusationDto(t));
            }
            result.sort((a, b) -> {
                String ca = (String) a.get("createdAt");
                String cb = (String) b.get("createdAt");
                if (ca == null && cb == null) return 0;
                if (ca == null) return 1;
                if (cb == null) return -1;
                return cb.compareTo(ca); // newest first
            });
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private Map<String, Object> buildRecusationDto(EvaluationTeam team) {
        AccreditationRequest req = team.getRequest();
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", team.getId());          // id == teamId for this endpoint
        dto.put("teamId", team.getId());
        dto.put("requestId", req != null ? req.getId() : null);
        dto.put("requestRef", req != null ? req.getReferenceNumber() : null);
        String oecName = null;
        if (req != null && req.getOec() != null) {
            oecName = req.getOec().getOrganizationName() != null
                    ? req.getOec().getOrganizationName()
                    : req.getOec().getFullName();
        }
        dto.put("oecName", oecName);
        dto.put("recusationCount", team.getRecusationCount());
        // Recused members
        List<Map<String, Object>> recusedMembers = memberRepository.findByTeam_Id(team.getId())
                .stream()
                .filter(m -> Boolean.TRUE.equals(m.getRecusedByOEC()))
                .map(m -> {
                    Map<String, Object> mv = new LinkedHashMap<>();
                    mv.put("id", m.getId());
                    mv.put("name", m.getExpert() != null ? m.getExpert().getFullName() : "");
                    mv.put("role", m.getRole() != null ? m.getRole().name() : "");
                    mv.put("email", m.getExpert() != null ? m.getExpert().getEmail() : "");
                    return mv;
                }).toList();
        // If no currently-recused members but team has hasRecusation history, list from history (already replaced members won't be marked)
        dto.put("recusedMembers", recusedMembers);
        dto.put("reason", team.getRecusationReason());
        // Proof documents JSON
        dto.put("proofDocuments", team.getProofDocuments() != null ? team.getProofDocuments() : "[]");
        // Status
        String status = "PENDING";
        if (team.getRecusationDecision() == RecusationDecision.ACCEPTED) status = "ACCEPTED";
        else if (team.getRecusationDecision() == RecusationDecision.REJECTED) status = "REJECTED";
        dto.put("status", status);
        dto.put("raDecision", team.getRecusationDecisionReason());
        dto.put("createdAt", team.getRecusationDate() != null ? team.getRecusationDate().toString() : null);
        dto.put("decidedAt", team.getRecusationDecisionDate() != null ? team.getRecusationDecisionDate().toString() : null);
        return dto;
    }

    /**
     * POST /api/workflow/recusations/{teamId}/accept
     * Accept the recusation: replace recused members (PRO 22).
     */
    @PostMapping("/recusations/{teamId}/accept")
    public ResponseEntity<ApiResponse> acceptRecusation(@PathVariable Long teamId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String decisionReason = (String) body.get("raDecision");
            if (decisionReason == null || decisionReason.trim().isEmpty())
                throw new RuntimeException("Justification requise");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> replacementsList = (List<Map<String, Object>>) body.get("replacements");
            Map<Long, Long> replacements = new LinkedHashMap<>();
            if (replacementsList != null) {
                for (Map<String, Object> r : replacementsList) {
                    Long recusedId = ((Number) r.get("recusedMemberId")).longValue();
                    Long replacementId = ((Number) r.get("replacementExpertId")).longValue();
                    replacements.put(recusedId, replacementId);
                }
            }

            EvaluationTeam team = teamService.examineRecusation(teamId, true, decisionReason, replacements, user);
            return ResponseEntity.ok(ApiResponse.success(
                    "Récusation acceptée (PRO 22) — membres remplacés, ils doivent signer les engagements.", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/workflow/recusations/{teamId}/reject
     * Reject the recusation: team is maintained (PRO 22).
     */
    @PostMapping("/recusations/{teamId}/reject")
    public ResponseEntity<ApiResponse> rejectRecusation(@PathVariable Long teamId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String decisionReason = (String) body.get("raDecision");
            if (decisionReason == null || decisionReason.trim().isEmpty())
                throw new RuntimeException("Justification du rejet requise");

            EvaluationTeam team = teamService.examineRecusation(teamId, false, decisionReason, null, user);
            return ResponseEntity.ok(ApiResponse.success(
                    "Récusation rejetée (PRO 22) — l'équipe d'évaluation est maintenue.", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/workflow/teams/{teamId}/available-replacements
     * Returns experts available to replace a recused member (excludes current team members).
     */
    @GetMapping("/teams/{teamId}/available-replacements")
    public ResponseEntity<?> getAvailableReplacements(@PathVariable Long teamId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            EvaluationTeam team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
            log.debug("Finding replacements for team: {}", team.getId());

            // IDs of current non-recused members to exclude
            Set<Long> currentMemberExpertIds = memberRepository.findByTeam_Id(teamId)
                    .stream()
                    .filter(m -> !Boolean.TRUE.equals(m.getRecusedByOEC()))
                    .map(m -> m.getExpert() != null ? m.getExpert().getId() : null)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());

            List<UserRole> eligibleRoles = List.of(
                    UserRole.EXPERT, UserRole.REE, UserRole.ET, UserRole.EQ, UserRole.EVALUATEUR);

            List<Map<String, Object>> result = userRepository.findAll().stream()
                    .filter(u -> eligibleRoles.contains(u.getRole())
                            && u.getStatus() == UserStatus.APPROVED
                            && !currentMemberExpertIds.contains(u.getId()))
                    .map(e -> {
                        Map<String, Object> map = new LinkedHashMap<>();
                        map.put("id", e.getId());
                        map.put("fullName", e.getFullName());
                        map.put("email", e.getEmail());
                        map.put("role", e.getRole() != null ? e.getRole().name() : null);
                        map.put("specialite", e.getSpecialite());
                        map.put("experience", e.getExperience());
                        long activeDossiers = memberRepository.findByExpert_Id(e.getId())
                                .stream().filter(m -> !Boolean.TRUE.equals(m.getRecusedByOEC())).count();
                        map.put("activeDossiers", activeDossiers);
                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== END RECUSATIONS ==========

    @PostMapping("/teams/{teamId}/send-to-oec")
    public ResponseEntity<ApiResponse> sendTeamToOEC(@PathVariable Long teamId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String compositionSheet = body.getOrDefault("compositionSheet", "Fiche composition équipe FOR 26");
            String evalDateStr = (String) body.get("evaluationDate");
            java.time.LocalDate proposedDate = evalDateStr != null ? java.time.LocalDate.parse(evalDateStr) : null;
            EvaluationTeam team = teamService.sendToOEC(teamId, compositionSheet, proposedDate, user);
            return ResponseEntity.ok(ApiResponse.success("Équipe envoyée à l'OEC pour validation", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/teams/my-teams")
    public ResponseEntity<?> getMyTeamMemberships(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            List<TeamMember> memberships = memberRepository.findByExpert_Id(userId);
            return ResponseEntity.ok(memberships);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/members/{memberId}/sign")
    public ResponseEntity<ApiResponse> signAgreements(@PathVariable Long memberId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Boolean hasConflict = (Boolean) body.getOrDefault("hasConflictOfInterest", false);
            String conflictDetails = (String) body.getOrDefault("conflictDetails", "");

            TeamMember member = teamService.signAgreements(memberId, hasConflict, conflictDetails, user);
            return ResponseEntity.ok(ApiResponse.success("Engagements signés avec succès", member));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/members/{memberId}/mandatement")
    public ResponseEntity<ApiResponse> sendMandatement(@PathVariable Long memberId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String message = (String) body.get("message");
            Long requestId = ((Number) body.get("requestId")).longValue();

            TeamMember member = memberRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("Membre non trouvé"));

            // Save mandatement on the member record
            member.setMandatementMessage(message);
            member.setMandatementSentAt(java.time.LocalDateTime.now());
            memberRepository.save(member);

            // Send mandatement notification to team member
            notificationService.createNotification(member.getExpert().getId(),
                    "Mandatement - Évaluation",
                    message,
                    "MANDATEMENT");

            log.info("Mandatement envoyé à {} pour le dossier {}", member.getExpert().getFullName(), requestId);
            return ResponseEntity.ok(ApiResponse.success("Mandatement envoyé à " + member.getExpert().getFullName(), null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/{teamId}/oec-response")
    public ResponseEntity<ApiResponse> oecTeamResponse(@PathVariable Long teamId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Boolean validated = (Boolean) body.get("validated");
            String recusationReason = (String) body.get("recusationReason");
            @SuppressWarnings("unchecked")
            List<Number> recusedIds = (List<Number>) body.get("recusedMemberIds");
            Long[] recusedMemberIds = recusedIds != null ? recusedIds.stream().map(Number::longValue).toArray(Long[]::new) : null;

            // Date negotiation fields
            Boolean dateAccepted = (Boolean) body.get("dateAccepted");
            String oecDateStr = (String) body.get("oecProposedDate");
            java.time.LocalDate oecProposedDate = oecDateStr != null ? java.time.LocalDate.parse(oecDateStr) : null;
            String dateRefusalReason = (String) body.get("dateRefusalReason");

            // Proof documents for recusation (PRO 22)
            Object proofDocsRaw = body.get("proofDocuments");
            String proofDocumentsJson = null;
            if (proofDocsRaw != null) {
                try {
                    proofDocumentsJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(proofDocsRaw);
                } catch (Exception ignore) {
                    proofDocumentsJson = proofDocsRaw.toString();
                }
            }

            EvaluationTeam team = teamService.oecResponse(teamId, validated, recusedMemberIds, recusationReason,
                    dateAccepted, oecProposedDate, dateRefusalReason, proofDocumentsJson, user);
            return ResponseEntity.ok(ApiResponse.success(validated ? "Équipe validée" : "Récusation enregistrée (PRO 22)", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/teams/by-request/{requestId}")
    public ResponseEntity<?> getTeamByRequest(@PathVariable Long requestId) {
        List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
        return ResponseEntity.ok(teams);
    }

    @GetMapping("/teams/{teamId}/members")
    public ResponseEntity<?> getTeamMembers(@PathVariable Long teamId) {
        return ResponseEntity.ok(memberRepository.findByTeam_Id(teamId));
    }

    // ========== DOCUMENTARY REVIEW (STEP 5) ==========

    /**
     * RA lance la revue documentaire → passe directement à l'état "prêt à transmettre"
     * (les frais d'analyse sont inclus dans le devis).
     */
    @PostMapping("/documentary-review/launch")
    public ResponseEntity<ApiResponse> launchDocumentaryReview(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
            EvaluationTeam team = teams.isEmpty() ? null : teams.get(0);

            // Créer la revue documentaire — frais inclus dans le devis, pas de paiement séparé
            DocumentaryReview review = DocumentaryReview.builder()
                    .request(request).team(team)
                    .reviewStartDate(LocalDateTime.now())
                    .status(DocumentaryReviewStatus.PAYMENT_VALIDATED)
                    .build();
            docReviewRepository.save(review);

            request.setStatus(RequestStatus.DOC_REVIEW_PAYMENT_VALIDATED);
            request.setCurrentPhase("REVUE_DOCUMENTAIRE");
            request.setCurrentStep("Revue lancée — transmettez les documents à l'équipe");
            request.setPendingWith("RA");
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Revue documentaire lancée. Vous pouvez maintenant transmettre les documents à l'équipe.", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * RA transmet les documents à l'équipe d'évaluation (après validation paiement par DAG).
     * L'équipe dispose de 15 jours max.
     */
    @PostMapping("/documentary-review/{id}/transmit-docs")
    public ResponseEntity<ApiResponse> transmitDocsToTeam(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            DocumentaryReview review = docReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));

            review.setDocumentationSentToTeam(LocalDateTime.now());
            review.setTeamResultsDeadline(LocalDateTime.now().plusDays(15));
            review.setStatus(DocumentaryReviewStatus.IN_PROGRESS);
            docReviewRepository.save(review);

            AccreditationRequest request = review.getRequest();
            request.setStatus(RequestStatus.DOC_REVIEW_IN_PROGRESS);
            request.setCurrentStep("Documents transmis à l'équipe - 15 jours pour analyser");
            request.setPendingWith("Équipe d'évaluation");
            requestRepository.save(request);

            // Notifier les membres de l'équipe
            if (review.getTeam() != null) {
                for (TeamMember member : review.getTeam().getMembers()) {
                    if (member.getExpert() != null) {
                        notificationService.createNotification(
                            member.getExpert().getId(),
                            "Documents à analyser - Revue documentaire",
                            "Les documents de l'OEC pour le dossier " + request.getReferenceNumber()
                                + " vous ont été transmis. Vous disposez de 15 jours maximum pour soumettre vos résultats.",
                            "ACTION_REQUIRED"
                        );
                    }
                }
            }

            return ResponseEntity.ok(ApiResponse.success("Documents transmis à l'équipe. Délai: 15 jours.", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Un membre de l'équipe soumet ses résultats individuels d'analyse documentaire.
     * Si tous les membres ont soumis, on consolide automatiquement et on avance le statut.
     */
    @PostMapping("/documentary-review/{id}/member-submit")
    public ResponseEntity<ApiResponse> memberSubmitDocReviewResults(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            DocumentaryReview review = docReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));

            if (review.getTeam() == null) throw new RuntimeException("Aucune équipe associée");

            // Trouver le membre correspondant à l'utilisateur connecté
            TeamMember currentMember = review.getTeam().getMembers().stream()
                    .filter(m -> m.getExpert() != null && m.getExpert().getId().equals(userId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Vous n'êtes pas membre de cette équipe"));

            String results = body.get("results");
            String deficiencies = body.get("deficiencies");

            currentMember.setDocReviewResults(results);
            currentMember.setDocReviewDeficiencies(deficiencies);
            currentMember.setDocReviewSubmittedAt(LocalDateTime.now());
            memberRepository.save(currentMember);

            // Vérifier si TOUS les membres ont soumis leurs résultats
            List<TeamMember> allMembers = review.getTeam().getMembers();
            long totalMembers = allMembers.size();
            long submittedMembers = allMembers.stream()
                    .filter(m -> m.getDocReviewSubmittedAt() != null)
                    .count();

            boolean allSubmitted = submittedMembers >= totalMembers;

            if (allSubmitted) {
                // Consolider les résultats de tous les membres
                StringBuilder consolidatedResults = new StringBuilder();
                StringBuilder consolidatedDeficiencies = new StringBuilder();
                boolean anyDeficiencies = false;

                for (TeamMember member : allMembers) {
                    String memberName = member.getExpert() != null ? 
                        member.getExpert().getFullName() : "Membre";
                    String memberRole = member.getRole() != null ? member.getRole().name() : "";

                    if (member.getDocReviewResults() != null && !member.getDocReviewResults().trim().isEmpty()) {
                        consolidatedResults.append("=== ").append(memberName).append(" (").append(memberRole).append(") ===\n");
                        consolidatedResults.append(member.getDocReviewResults()).append("\n\n");
                    }
                    if (member.getDocReviewDeficiencies() != null && !member.getDocReviewDeficiencies().trim().isEmpty()) {
                        anyDeficiencies = true;
                        consolidatedDeficiencies.append("=== ").append(memberName).append(" (").append(memberRole).append(") ===\n");
                        consolidatedDeficiencies.append(member.getDocReviewDeficiencies()).append("\n\n");
                    }
                }

                review.setTeamResults(consolidatedResults.toString().trim());
                review.setReviewCompletionDate(LocalDateTime.now());
                review.setDeficienciesIdentified(anyDeficiencies);
                if (anyDeficiencies) review.setDeficienciesDetails(consolidatedDeficiencies.toString().trim());
                review.setStatus(DocumentaryReviewStatus.RESULTS_SUBMITTED);
                docReviewRepository.save(review);

                AccreditationRequest request = review.getRequest();
                request.setStatus(RequestStatus.DOC_REVIEW_RESULTS_SUBMITTED);
                request.setCurrentStep("Tous les résultats d'analyse reçus - Prêt pour envoi au CD");
                request.setPendingWith("RA");
                requestRepository.save(request);

                // Notifier le RA que tous les résultats sont arrivés
                if (request.getAssignedToRa() != null) {
                    notificationService.createNotification(
                        request.getAssignedToRa().getId(),
                        "Tous les résultats de la revue documentaire sont arrivés",
                        "Tous les membres de l'équipe ont soumis leurs résultats pour le dossier " + request.getReferenceNumber()
                            + ". Vous pouvez les transmettre au CD pour validation.",
                        "ACTION_REQUIRED"
                    );
                }

                return ResponseEntity.ok(ApiResponse.success(
                    "Résultats soumis. Tous les membres ont terminé - avancement automatique.", review));
            } else {
                return ResponseEntity.ok(ApiResponse.success(
                    "Résultats soumis avec succès (" + submittedMembers + "/" + totalMembers + " membres).", 
                    Map.of("submitted", submittedMembers, "total", totalMembers, "allDone", false)));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Obtenir la progression des soumissions individuelles des membres.
     */
    @GetMapping("/documentary-review/{id}/member-progress")
    public ResponseEntity<?> getDocReviewMemberProgress(@PathVariable Long id) {
        try {
            DocumentaryReview review = docReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));

            if (review.getTeam() == null) return ResponseEntity.ok(List.of());

            List<Map<String, Object>> progress = review.getTeam().getMembers().stream().map(m -> {
                Map<String, Object> entry = new java.util.LinkedHashMap<>();
                entry.put("memberId", m.getId());
                entry.put("expertName", m.getExpert() != null ? 
                    m.getExpert().getFullName() : "—");
                entry.put("role", m.getRole() != null ? m.getRole().name() : "");
                entry.put("submitted", m.getDocReviewSubmittedAt() != null);
                entry.put("submittedAt", m.getDocReviewSubmittedAt());
                entry.put("hasDeficiencies", m.getDocReviewDeficiencies() != null && !m.getDocReviewDeficiencies().trim().isEmpty());
                return entry;
            }).toList();

            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Équipe d'évaluation soumet ses résultats d'analyse documentaire (legacy: soumission groupée par le RA/REE).
     */
    @PostMapping("/documentary-review/{id}/submit-results")
    public ResponseEntity<ApiResponse> submitDocReviewResults(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            DocumentaryReview review = docReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));

            String results = body.get("results");
            String deficiencies = body.get("deficiencies");
            boolean hasDeficiencies = deficiencies != null && !deficiencies.trim().isEmpty();

            review.setTeamResults(results);
            review.setReviewCompletionDate(LocalDateTime.now());
            review.setDeficienciesIdentified(hasDeficiencies);
            if (hasDeficiencies) review.setDeficienciesDetails(deficiencies);
            review.setStatus(DocumentaryReviewStatus.RESULTS_SUBMITTED);
            docReviewRepository.save(review);

            AccreditationRequest request = review.getRequest();
            request.setStatus(RequestStatus.DOC_REVIEW_RESULTS_SUBMITTED);
            request.setCurrentStep("Résultats d'analyse reçus de l'équipe");
            request.setPendingWith("RA");
            requestRepository.save(request);

            // Notifier le RA
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Résultats d'analyse documentaire reçus",
                    "L'équipe d'évaluation a soumis ses résultats pour le dossier " + request.getReferenceNumber()
                        + ". Vous pouvez les transmettre au CD pour validation.",
                    "ACTION_REQUIRED"
                );
            }

            return ResponseEntity.ok(ApiResponse.success("Résultats soumis avec succès", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * RA envoie les résultats au CD pour validation.
     */
    @PostMapping("/documentary-review/{id}/send-to-cd")
    public ResponseEntity<ApiResponse> sendDocReviewToCD(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            DocumentaryReview review = docReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));

            review.setResultsSentToCd(LocalDateTime.now());
            review.setStatus(DocumentaryReviewStatus.RESULTS_SENT_TO_CD);
            docReviewRepository.save(review);

            AccreditationRequest request = review.getRequest();
            request.setStatus(RequestStatus.DOC_REVIEW_RESULTS_SENT_TO_CD);
            request.setCurrentStep("Résultats d'analyse envoyés au CD");
            request.setPendingWith("CD");
            requestRepository.save(request);

            // Notifier les CD
            List<User> cdUsers = userRepository.findByRole(UserRole.CD);
            for (User cd : cdUsers) {
                notificationService.createNotification(
                    cd.getId(),
                    "Résultats revue documentaire à valider",
                    "Les résultats de la revue documentaire pour le dossier " + request.getReferenceNumber()
                        + " sont disponibles. Vous pouvez rédiger votre synthèse ou transmettre les résultats tels quels à l'OEC.",
                    "ACTION_REQUIRED"
                );
            }

            return ResponseEntity.ok(ApiResponse.success("Résultats envoyés au CD", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD valide la revue documentaire lorsqu'aucun manquement n'a été identifié.
     * Le processus passe directement à la phase suivante sans impliquer l'OEC.
     */
    @PostMapping("/documentary-review/{id}/cd-validate-no-deficiency")
    public ResponseEntity<ApiResponse> cdValidateNoDeficiency(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            DocumentaryReview review = docReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));

            String comments = body.get("comments");

            review.setCdFinalDecision("CONTINUE");
            review.setCdDecisionComments(comments);
            review.setStatus(DocumentaryReviewStatus.CD_DECISION_CONTINUE);
            docReviewRepository.save(review);

            AccreditationRequest request = review.getRequest();
            request.setStatus(RequestStatus.DOCUMENTARY_REVIEW_COMPLETED);
            request.setCurrentStep("Revue documentaire terminée - Aucun manquement - Préparation évaluation");
            request.setPendingWith("RA");
            requestRepository.save(request);

            // Notifier le RA
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Revue documentaire terminée — Aucun manquement",
                    "La revue documentaire pour le dossier " + request.getReferenceNumber()
                        + " est terminée. Aucun manquement n'a été identifié. Vous pouvez passer à la préparation de l'évaluation.",
                    "ACTION_REQUIRED"
                );
            }

            // Notifier l'OEC
            if (request.getOec() != null) {
                notificationService.createNotification(
                    request.getOec().getId(),
                    "Revue documentaire terminée",
                    "La revue documentaire pour votre dossier " + request.getReferenceNumber()
                        + " est terminée. Aucun manquement n'a été identifié. La phase d'évaluation sera prochainement planifiée.",
                    "INFO"
                );
            }

            return ResponseEntity.ok(ApiResponse.success("Revue documentaire validée — Aucun manquement", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD envoie les résultats/synthèse à l'OEC.
     * Le CD peut écrire sa propre synthèse ou envoyer les résultats de l'équipe tels quels.
     * Utilisé uniquement quand des manquements ont été identifiés.
     */
    @PostMapping("/documentary-review/{id}/cd-send-to-oec")
    public ResponseEntity<ApiResponse> cdSendDocReviewToOEC(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            DocumentaryReview review = docReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));

            Boolean sendAsIs = (Boolean) body.get("sendAsIs");
            String synthesis = (String) body.get("synthesis");

            review.setCdSentAsIs(sendAsIs != null && sendAsIs);
            if (synthesis != null && !synthesis.trim().isEmpty()) {
                review.setCdSynthesis(synthesis);
            }
            review.setResultsSentToOEC(LocalDateTime.now());
            review.setOecResponseDeadline(LocalDateTime.now().plusMonths(3));
            review.setStatus(DocumentaryReviewStatus.RESULTS_SENT_TO_OEC);
            docReviewRepository.save(review);

            AccreditationRequest request = review.getRequest();
            request.setStatus(RequestStatus.DOC_REVIEW_RESULTS_SENT_TO_OEC);
            request.setCurrentStep("Résultats/synthèse envoyés à l'OEC");
            request.setPendingWith("OEC");
            requestRepository.save(request);

            // Notifier l'OEC
            notificationService.createNotification(
                request.getOec().getId(),
                "Résultats de la revue documentaire",
                "Les résultats de la revue documentaire pour votre dossier " + request.getReferenceNumber()
                    + " vous ont été transmis. Vous disposez de 3 mois maximum pour répondre aux éventuels manquements.",
                "ACTION_REQUIRED"
            );

            return ResponseEntity.ok(ApiResponse.success("Résultats envoyés à l'OEC", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC répond aux résultats de la revue documentaire.
     * Décide de poursuivre l'évaluation ou de corriger (3 mois max).
     */
    @PostMapping("/documentary-review/{id}/oec-respond")
    public ResponseEntity<ApiResponse> oecDocReviewResponse(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            DocumentaryReview review = docReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));

            String response = body.get("response");
            String decision = body.get("decision"); // "CONTINUE" ou "CORRECT"

            review.setOecResponse(response);
            review.setOecDecision(decision);
            review.setOecRespondedInTime(true);
            if ("CORRECT".equals(decision)) {
                review.setOecCorrectionDeadline(LocalDateTime.now().plusMonths(3));
            }
            review.setStatus(DocumentaryReviewStatus.AWAITING_OEC_RESPONSE);
            docReviewRepository.save(review);

            AccreditationRequest request = review.getRequest();
            request.setStatus(RequestStatus.DOC_REVIEW_CD_DECISION);
            request.setCurrentStep("Réponse OEC reçue - En attente décision CD");
            request.setPendingWith("CD");
            requestRepository.save(request);

            // Notifier le CD
            List<User> cdUsers = userRepository.findByRole(UserRole.CD);
            for (User cd : cdUsers) {
                notificationService.createNotification(
                    cd.getId(),
                    "Réponse OEC - Revue documentaire",
                    "L'OEC a répondu aux résultats de la revue documentaire pour le dossier " + request.getReferenceNumber()
                        + ". Décision OEC: " + ("CONTINUE".equals(decision) ? "Poursuivre" : "Corriger")
                        + ". Veuillez décider de poursuivre ou d'arrêter le processus.",
                    "ACTION_REQUIRED"
                );
            }

            return ResponseEntity.ok(ApiResponse.success("Réponse enregistrée", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD décide de poursuivre ou d'arrêter le processus d'accréditation
     * après réponse OEC ou dépassement du délai.
     */
    @PostMapping("/documentary-review/{id}/cd-decision")
    public ResponseEntity<ApiResponse> cdDocReviewDecision(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            DocumentaryReview review = docReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));

            String decision = body.get("decision"); // "CONTINUE" ou "STOP"
            String comments = body.get("comments");

            review.setCdFinalDecision(decision);
            review.setCdDecisionComments(comments);

            AccreditationRequest request = review.getRequest();

            if ("CONTINUE".equals(decision)) {
                review.setStatus(DocumentaryReviewStatus.CD_DECISION_CONTINUE);
                request.setStatus(RequestStatus.DOCUMENTARY_REVIEW_COMPLETED);
                request.setCurrentStep("Revue documentaire terminée - Préparation évaluation");
                request.setPendingWith("RA");
                
                // Notifier le RA
                if (request.getAssignedToRa() != null) {
                    notificationService.createNotification(
                        request.getAssignedToRa().getId(),
                        "Revue documentaire terminée - Poursuivre",
                        "Le CD a décidé de poursuivre le processus pour le dossier " + request.getReferenceNumber()
                            + ". Vous pouvez passer à la préparation de l'évaluation.",
                        "ACTION_REQUIRED"
                    );
                }
                
                // Notifier l'OEC
                notificationService.createNotification(
                    request.getOec().getId(),
                    "Processus d'accréditation - Suite",
                    "Le CD a décidé de poursuivre le processus d'accréditation pour votre dossier " + request.getReferenceNumber()
                        + ". La phase d'évaluation sera prochainement planifiée.",
                    "INFO"
                );
            } else {
                review.setStatus(DocumentaryReviewStatus.CD_DECISION_STOP);
                request.setStatus(RequestStatus.CLOSED);
                request.setCurrentStep("Processus arrêté par le CD");
                request.setPendingWith(null);
                
                // Notifier l'OEC
                notificationService.createNotification(
                    request.getOec().getId(),
                    "Processus d'accréditation arrêté",
                    "Le CD a décidé d'arrêter le processus d'accréditation pour votre dossier " + request.getReferenceNumber()
                        + ". Motif: " + (comments != null ? comments : "Non spécifié"),
                    "WARNING"
                );
            }

            docReviewRepository.save(review);
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success(
                    "CONTINUE".equals(decision) ? "Processus poursuivi" : "Processus arrêté", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/documentary-review/by-request/{requestId}")
    public ResponseEntity<?> getDocReviewByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(docReviewRepository.findByRequest_Id(requestId));
    }

    @GetMapping("/documentary-review/{id}")
    public ResponseEntity<?> getDocReviewById(@PathVariable Long id) {
        return ResponseEntity.ok(docReviewRepository.findById(id).orElse(null));
    }

    /**
     * Récupérer le paiement associé à une revue documentaire.
     */
    @GetMapping("/documentary-review/{id}/payment")
    public ResponseEntity<?> getDocReviewPayment(@PathVariable Long id) {
        DocumentaryReview review = docReviewRepository.findById(id).orElse(null);
        if (review == null || review.getPaymentId() == null) return ResponseEntity.ok(null);
        return ResponseEntity.ok(paymentRepository.findById(review.getPaymentId()).orElse(null));
    }

    // ========== MANDATEMENTS (STEP 6.1) ==========

    /**
     * RA crée les mandatements pour les membres de l'équipe.
     */
    @PostMapping("/mandates/create-all")
    public ResponseEntity<ApiResponse> createMandates(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
            if (teams.isEmpty()) throw new RuntimeException("Aucune équipe trouvée pour ce dossier");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> mandatesData = (List<Map<String, Object>>) body.get("mandates");

            List<Mandate> created = new ArrayList<>();
            for (Map<String, Object> m : mandatesData) {
                Long memberId = ((Number) m.get("memberId")).longValue();
                TeamMember member = memberRepository.findById(memberId)
                        .orElseThrow(() -> new RuntimeException("Membre non trouvé: " + memberId));

                Mandate mandate = Mandate.builder()
                        .request(request)
                        .teamMember(member)
                        .tasks((String) m.get("tasks"))
                        .missions((String) m.get("missions"))
                        .objectives((String) m.get("objectives"))
                        .status(MandateStatus.DRAFT)
                        .build();
                created.add(mandateRepository.save(mandate));
            }

            request.setStatus(RequestStatus.MANDATES_PREPARATION);
            request.setCurrentStep("Mandatements en préparation");
            request.setPendingWith("RA");
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Mandatements créés: " + created.size(), created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * RA envoie les mandatements au CD pour validation.
     */
    @PostMapping("/mandates/send-to-cd")
    public ResponseEntity<ApiResponse> sendMandatesToCD(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            List<Mandate> mandates = mandateRepository.findByRequest_Id(requestId);
            if (mandates.isEmpty()) throw new RuntimeException("Aucun mandatement trouvé");

            for (Mandate m : mandates) {
                if (m.getStatus() == MandateStatus.DRAFT || m.getStatus() == MandateStatus.CD_MODIFICATION_REQUESTED) {
                    m.setStatus(MandateStatus.SENT_TO_CD);
                    m.setSentToCdAt(LocalDateTime.now());
                    mandateRepository.save(m);
                }
            }

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            request.setStatus(RequestStatus.MANDATES_PENDING_CD);
            request.setCurrentStep("Mandatements envoyés au CD pour validation");
            request.setPendingWith("CD");
            requestRepository.save(request);

            // Notifier les CD
            List<User> cdUsers = userRepository.findByRole(UserRole.CD);
            for (User cd : cdUsers) {
                notificationService.createNotification(cd.getId(),
                        "Mandatements à valider",
                        "Les mandatements pour le dossier " + request.getReferenceNumber() + " sont prêts pour validation.",
                        "ACTION_REQUIRED");
            }

            return ResponseEntity.ok(ApiResponse.success("Mandatements envoyés au CD", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD approuve les mandatements et les envoie aux membres.
     */
    @PostMapping("/mandates/cd-approve")
    public ResponseEntity<ApiResponse> cdApproveMandates(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            List<Mandate> mandates = mandateRepository.findByRequest_Id(requestId);

            for (Mandate m : mandates) {
                m.setStatus(MandateStatus.CD_APPROVED);
                m.setCdApprovedAt(LocalDateTime.now());
                mandateRepository.save(m);
            }

            // Envoyer les mandatements à chaque membre
            for (Mandate m : mandates) {
                m.setStatus(MandateStatus.SENT_TO_MEMBERS);
                m.setSentToMemberAt(LocalDateTime.now());
                mandateRepository.save(m);

                // Le mandatement est aussi inscrit sur le TeamMember
                TeamMember member = m.getTeamMember();
                member.setMandatementMessage(m.getTasks() + "\n---\n" + m.getMissions());
                member.setMandatementSentAt(LocalDateTime.now());
                memberRepository.save(member);

                notificationService.createNotification(
                        member.getExpert().getId(),
                        "Mandatement reçu",
                        "Vous avez reçu votre mandatement pour le dossier " + m.getRequestReference()
                                + ". Consultez vos tâches et missions.",
                        "MANDATEMENT");
            }

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            request.setStatus(RequestStatus.MANDATES_SENT_TO_TEAM);
            request.setCurrentStep("Mandatements approuvés et envoyés à l'équipe");
            request.setPendingWith("RA");
            requestRepository.save(request);

            // Notifier le RA
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(request.getAssignedToRa().getId(),
                        "Mandatements approuvés par le CD",
                        "Le CD a approuvé et envoyé les mandatements pour le dossier " + request.getReferenceNumber(),
                        "INFO");
            }

            return ResponseEntity.ok(ApiResponse.success("Mandatements approuvés et envoyés", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD demande des modifications sur les mandatements.
     */
    @PostMapping("/mandates/cd-request-modifications")
    public ResponseEntity<ApiResponse> cdRequestMandateModifications(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            String comments = (String) body.get("comments");
            List<Mandate> mandates = mandateRepository.findByRequest_Id(requestId);

            for (Mandate m : mandates) {
                m.setStatus(MandateStatus.CD_MODIFICATION_REQUESTED);
                m.setCdComments(comments);
                mandateRepository.save(m);
            }

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            request.setStatus(RequestStatus.MANDATES_CD_MODIFICATION);
            request.setCurrentStep("CD demande modifications sur les mandatements");
            request.setPendingWith("RA");
            requestRepository.save(request);

            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(request.getAssignedToRa().getId(),
                        "Modifications demandées sur mandatements",
                        "Le CD demande des modifications sur les mandatements du dossier " + request.getReferenceNumber()
                                + ". Commentaires: " + (comments != null ? comments : "-"),
                        "ACTION_REQUIRED");
            }

            return ResponseEntity.ok(ApiResponse.success("Modifications demandées", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * RA met à jour un mandatement.
     */
    @PostMapping("/mandates/{id}/update")
    public ResponseEntity<ApiResponse> updateMandate(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Mandate mandate = mandateRepository.findById(id).orElseThrow(() -> new RuntimeException("Mandatement non trouvé"));
            if (body.containsKey("tasks")) mandate.setTasks(body.get("tasks"));
            if (body.containsKey("missions")) mandate.setMissions(body.get("missions"));
            if (body.containsKey("objectives")) mandate.setObjectives(body.get("objectives"));
            mandate.setStatus(MandateStatus.DRAFT);
            mandateRepository.save(mandate);

            return ResponseEntity.ok(ApiResponse.success("Mandatement mis à jour", mandate));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/mandates/by-request/{requestId}")
    public ResponseEntity<?> getMandatesByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(mandateRepository.findByRequest_Id(requestId));
    }

    @GetMapping("/mandates/my-mandates")
    public ResponseEntity<?> getMyMandates(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        return ResponseEntity.ok(mandateRepository.findByTeamMember_Expert_Id(userId));
    }

    @GetMapping("/mandates/pending-cd")
    public ResponseEntity<?> getMandatesPendingCD() {
        return ResponseEntity.ok(mandateRepository.findByStatus(MandateStatus.SENT_TO_CD));
    }

    // ========== PREPARATION MEETING (STEP 6.2 - CD) ==========

    /**
     * CD organise une réunion de préparation.
     */
    @PostMapping("/preparation-meeting/create")
    public ResponseEntity<ApiResponse> createPreparationMeeting(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User organizer = userRepository.findById(userId).orElseThrow();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();

            String dateStr = (String) body.get("meetingDate");
            LocalDate meetingDate = LocalDate.parse(dateStr);

            PreparationMeeting meeting = PreparationMeeting.builder()
                    .request(request)
                    .organizedBy(organizer)
                    .meetingDate(meetingDate)
                    .meetingTime((String) body.get("meetingTime"))
                    .location((String) body.get("location"))
                    .description((String) body.get("description"))
                    .agenda((String) body.get("agenda"))
                    .status(PreparationMeetingStatus.PLANNED)
                    .build();
            prepMeetingRepository.save(meeting);

            return ResponseEntity.ok(ApiResponse.success("Réunion de préparation planifiée", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD envoie les invitations de réunion aux membres de l'équipe.
     */
    @PostMapping("/preparation-meeting/{id}/send-invitations")
    public ResponseEntity<ApiResponse> sendMeetingInvitations(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            PreparationMeeting meeting = prepMeetingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Réunion non trouvée"));

            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(meeting.getRequest().getId());
            if (teams.isEmpty()) throw new RuntimeException("Aucune équipe trouvée");

            List<TeamMember> members = memberRepository.findByTeam_Id(teams.get(0).getId());
            for (TeamMember member : members) {
                notificationService.createNotification(
                        member.getExpert().getId(),
                        "Réunion de préparation d'évaluation",
                        "Vous êtes invité(e) à une réunion de préparation pour le dossier "
                                + meeting.getRequestReference() + ".\nDate: " + meeting.getMeetingDate()
                                + " à " + meeting.getMeetingTime()
                                + "\nLieu: " + meeting.getLocation()
                                + (meeting.getAgenda() != null ? "\nOrdre du jour: " + meeting.getAgenda() : ""),
                        "MEETING_INVITATION");
            }

            meeting.setStatus(PreparationMeetingStatus.INVITATIONS_SENT);
            meeting.setInvitationsSentAt(LocalDateTime.now());
            prepMeetingRepository.save(meeting);

            return ResponseEntity.ok(ApiResponse.success("Invitations envoyées à " + members.size() + " membre(s)", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/preparation-meeting/by-request/{requestId}")
    public ResponseEntity<?> getMeetingsByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(prepMeetingRepository.findByRequest_Id(requestId));
    }

    /**
     * Récupérer les disponibilités de tous les membres d'une équipe.
     */
    @GetMapping("/preparation-meeting/team-availability/{requestId}")
    public ResponseEntity<?> getTeamAvailability(@PathVariable Long requestId) {
        try {
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
            if (teams.isEmpty()) return ResponseEntity.ok(List.of());

            List<TeamMember> members = memberRepository.findByTeam_Id(teams.get(0).getId());
            List<Map<String, Object>> result = new ArrayList<>();

            for (TeamMember member : members) {
                Map<String, Object> memberData = new HashMap<>();
                memberData.put("memberId", member.getId());
                memberData.put("expertId", member.getExpert().getId());
                memberData.put("name", member.getExpert().getFullName());
                memberData.put("role", member.getRole().name());
                List<UserAvailability> unavailable = availabilityRepository.findByUser_Id(member.getExpert().getId());
                memberData.put("unavailableDates", unavailable.stream()
                        .map(a -> Map.of("date", a.getUnavailableDate().toString(), "reason", a.getReason() != null ? a.getReason() : ""))
                        .collect(Collectors.toList()));
                result.add(memberData);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== EVALUATION PLAN (STEP 6) ==========

    @PostMapping("/evaluation-plan/{id}/submit-to-ra")
    public ResponseEntity<ApiResponse> submitPlanToRA(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow(() -> new RuntimeException("Plan non trouvé"));
            plan.setStatus(EvaluationPlanStatus.SUBMITTED_TO_RA);
            evalPlanRepository.save(plan);

            AccreditationRequest request = plan.getRequest();
            request.setStatus(RequestStatus.EVALUATION_PLAN_PENDING_RA);
            request.setCurrentStep("Plan FOR 32 soumis au RA pour validation");
            request.setPendingWith("RA");
            requestRepository.save(request);

            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Plan d'évaluation FOR 32 soumis",
                    "Le REE a soumis le plan d'évaluation FOR 32 pour le dossier " + request.getReferenceNumber() + ". Vérifiez l'alignement avec la norme d'accréditation.",
                    "EVALUATION_PLAN"
                );
            }
            return ResponseEntity.ok(ApiResponse.success("Plan soumis au RA pour validation", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/evaluation-plan/create")
    public ResponseEntity<ApiResponse> createEvaluationPlan(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);

            String planCode = "PLAN-" + Year.now().getValue() + "-" + String.format("%03d", new Random().nextInt(999));

            String dailyProgram = (String) body.get("dailyProgram");
            String activityDistribution = (String) body.get("activityDistribution");
            String schedules = (String) body.get("schedules");

            EvaluationPlan plan = EvaluationPlan.builder()
                    .request(request)
                    .team(teams.isEmpty() ? null : teams.get(0))
                    .planCode(planCode)
                    .planFOR32(String.join("\n", 
                        dailyProgram != null ? dailyProgram : "",
                        activityDistribution != null ? activityDistribution : "",
                        schedules != null ? schedules : ""))
                    .dailyProgram(dailyProgram)
                    .activityDistribution(activityDistribution)
                    .schedules(schedules)
                    .documentsToExamine((String) body.get("documentsToExamine"))
                    .status(EvaluationPlanStatus.DRAFT)
                    .build();
            evalPlanRepository.save(plan);

            request.setStatus(RequestStatus.EVALUATION_PLAN_PREPARATION);
            request.setCurrentStep("Plan d'évaluation en préparation");
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Plan d'évaluation créé", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * RA valide le plan FOR 32 (vérifie alignement norme) puis demande validation CD.
     */
    @PostMapping("/evaluation-plan/{id}/ra-validate")
    public ResponseEntity<ApiResponse> raValidateEvaluationPlan(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow(() -> new RuntimeException("Plan d'évaluation non trouvé"));
            Boolean approved = (Boolean) body.getOrDefault("approved", true);
            String comments = (String) body.get("comments");

            if (approved) {
                plan.setStatus(EvaluationPlanStatus.PENDING_CD);

                AccreditationRequest request = plan.getRequest();
                request.setStatus(RequestStatus.EVALUATION_PLAN_PENDING_CD);
                request.setCurrentStep("Plan FOR 32 validé par RA - En attente validation CD");
                request.setPendingWith("CD");
                requestRepository.save(request);

                // Notifier les CD
                List<User> cdUsers = userRepository.findByRole(UserRole.CD);
                for (User cd : cdUsers) {
                    notificationService.createNotification(cd.getId(),
                            "Plan FOR 32 à valider",
                            "Le RA a validé le plan FOR 32 pour le dossier " + request.getReferenceNumber() + ". Veuillez donner votre validation.",
                            "ACTION_REQUIRED");
                }
            } else {
                plan.setCdAdjustmentRequests(comments);
                plan.setStatus(EvaluationPlanStatus.RA_ADJUSTMENTS_NEEDED);

                AccreditationRequest request = plan.getRequest();
                request.setStatus(RequestStatus.EVALUATION_PLAN_PREPARATION);
                request.setCurrentStep("RA demande ajustements sur le plan FOR 32");
                request.setPendingWith("REE");
                requestRepository.save(request);
            }
            evalPlanRepository.save(plan);

            return ResponseEntity.ok(ApiResponse.success(
                    approved ? "Plan validé par le RA - transmis au CD" : "Ajustements demandés au REE", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD valide le plan FOR 32.
     */
    @PostMapping("/evaluation-plan/{id}/cd-validate")
    public ResponseEntity<ApiResponse> cdValidateEvaluationPlan(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow(() -> new RuntimeException("Plan d'évaluation non trouvé"));
            Boolean approved = (Boolean) body.getOrDefault("approved", true);
            String comments = (String) body.get("comments");

            if (approved) {
                plan.setValidatedByCD(true);
                plan.setCdValidationDate(LocalDateTime.now());
                plan.setStatus(EvaluationPlanStatus.CD_VALIDATED);

                AccreditationRequest request = plan.getRequest();
                request.setStatus(RequestStatus.EVALUATION_PLAN_VALIDATION);
                request.setCurrentStep("Plan FOR 32 validé par le CD — REE peut envoyer à l'OEC");
                request.setPendingWith("REE");
                requestRepository.save(request);

                // Notifier le RA
                if (request.getAssignedToRa() != null) {
                    notificationService.createNotification(request.getAssignedToRa().getId(),
                            "Plan FOR 32 validé par le CD",
                            "Le CD a validé le plan d'évaluation pour le dossier " + request.getReferenceNumber(),
                            "INFO");
                }

                // Notifier le REE pour qu'il envoie le plan à l'OEC
                if (plan.getTeam() != null) {
                    for (TeamMember member : plan.getTeam().getMembers()) {
                        if (member.getRole() == TeamRole.REE && member.getExpert() != null) {
                            notificationService.createNotification(member.getExpert().getId(),
                                    "Plan FOR 32 validé — À envoyer à l'OEC",
                                    "Le CD a validé votre plan d'évaluation FOR 32 pour le dossier " + request.getReferenceNumber()
                                        + ". Vous pouvez maintenant l'envoyer à l'OEC (au moins 5 jours avant l'évaluation sur site).",
                                    "ACTION");
                            break;
                        }
                    }
                }
            } else {
                plan.setCdAdjustmentRequests(comments);
                plan.setStatus(EvaluationPlanStatus.RA_ADJUSTMENTS_NEEDED);

                AccreditationRequest request = plan.getRequest();
                request.setStatus(RequestStatus.EVALUATION_PLAN_PREPARATION);
                request.setCurrentStep("CD demande ajustements sur le plan FOR 32");
                request.setPendingWith("REE");
                requestRepository.save(request);

                // Notifier le REE des ajustements demandés
                if (plan.getTeam() != null) {
                    for (TeamMember member : plan.getTeam().getMembers()) {
                        if (member.getRole() == TeamRole.REE && member.getExpert() != null) {
                            notificationService.createNotification(member.getExpert().getId(),
                                    "Ajustements demandés sur le plan FOR 32",
                                    "Le CD demande des ajustements sur votre plan d'évaluation pour le dossier " + request.getReferenceNumber()
                                        + (comments != null ? " : " + comments : ""),
                                    "WARNING");
                            break;
                        }
                    }
                }
            }
            evalPlanRepository.save(plan);

            return ResponseEntity.ok(ApiResponse.success(
                    approved ? "Plan validé par le CD" : "Ajustements demandés", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Legacy: RA validates plan (backward compatibility).
     */
    @PostMapping("/evaluation-plan/{id}/validate")
    public ResponseEntity<ApiResponse> validateEvaluationPlan(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow(() -> new RuntimeException("Plan d'évaluation non trouvé"));
            Boolean approved = (Boolean) body.getOrDefault("approved", true);

            if (approved) {
                plan.setValidatedByCD(true);
                plan.setCdValidationDate(LocalDateTime.now());
                plan.setStatus(EvaluationPlanStatus.CD_VALIDATED);

                AccreditationRequest request = plan.getRequest();
                request.setStatus(RequestStatus.EVALUATION_PLAN_VALIDATION);
                request.setCurrentStep("Plan d'évaluation validé");
                requestRepository.save(request);
            } else {
                plan.setCdAdjustmentRequests((String) body.get("adjustments"));
                plan.setStatus(EvaluationPlanStatus.ADJUSTMENTS_NEEDED);
            }
            evalPlanRepository.save(plan);

            return ResponseEntity.ok(ApiResponse.success(
                    approved ? "Plan validé" : "Ajustements demandés", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/evaluation-plan/{id}/send-to-oec")
    public ResponseEntity<ApiResponse> sendPlanToOEC(@PathVariable Long id) {
        try {
            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow(() -> new RuntimeException("Plan d'évaluation non trouvé"));
            plan.setSentToOEC(LocalDateTime.now());
            plan.setStatus(EvaluationPlanStatus.SENT_TO_OEC);
            evalPlanRepository.save(plan);

            AccreditationRequest request = plan.getRequest();
            request.setStatus(RequestStatus.EVALUATION_PLANNED);
            request.setCurrentStep("Plan d'évaluation envoyé à l'OEC (5j avant évaluation)");
            request.setPendingWith("OEC");
            requestRepository.save(request);

            // Notifier l'OEC
            if (request.getOec() != null) {
                notificationService.createNotification(
                    request.getOec().getId(),
                    "Plan d'évaluation FOR 32 reçu",
                    "Le plan d'évaluation FOR 32 pour votre dossier " + request.getReferenceNumber()
                        + " vous a été transmis. L'évaluation est prévue prochainement.",
                    "INFO");
            }

            return ResponseEntity.ok(ApiResponse.success("Plan envoyé à l'OEC", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/evaluation-plan/by-request/{requestId}")
    public ResponseEntity<?> getEvalPlanByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(evalPlanRepository.findByRequest_Id(requestId));
    }

    // ========== MISSION ORDERS (STEP 6) ==========

    @PostMapping("/mission-orders/create")
    public ResponseEntity<ApiResponse> createMissionOrder(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            Long memberId = ((Number) body.get("teamMemberId")).longValue();

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            User member = userRepository.findById(memberId).orElseThrow(() -> new RuntimeException("Membre non trouvé"));

            String orderNumber = "OM-" + Year.now().getValue() + "-" + String.format("%03d", new Random().nextInt(999));

            MissionOrder order = MissionOrder.builder()
                    .request(request).teamMember(member)
                    .orderNumber(orderNumber)
                    .missionDetails((String) body.get("missionDetails"))
                    .checklistTasks((String) body.get("checklistTasks"))
                    .status(MissionOrderStatus.PENDING_DT_APPROVAL)
                    .build();
            missionOrderRepository.save(order);

            return ResponseEntity.ok(ApiResponse.success("Ordre de mission créé", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/mission-orders/{id}/approve-dt")
    public ResponseEntity<ApiResponse> approveMissionOrderDT(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            MissionOrder order = missionOrderRepository.findById(id).orElseThrow(() -> new RuntimeException("Ordre de mission non trouvé"));
            order.setApprovedByDT(true);
            order.setDtApprovalDate(LocalDateTime.now());
            order.setStatus(MissionOrderStatus.PENDING_DG_APPROVAL);
            missionOrderRepository.save(order);

            return ResponseEntity.ok(ApiResponse.success("Ordre de mission approuvé par DT", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/mission-orders/{id}/approve-dg")
    public ResponseEntity<ApiResponse> approveMissionOrderDG(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            MissionOrder order = missionOrderRepository.findById(id).orElseThrow(() -> new RuntimeException("Ordre de mission non trouvé"));
            order.setApprovedByDG(true);
            order.setDgApprovalDate(LocalDateTime.now());
            order.setStatus(MissionOrderStatus.FULLY_APPROVED);
            missionOrderRepository.save(order);

            return ResponseEntity.ok(ApiResponse.success("Ordre de mission approuvé par DG", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/mission-orders/{id}/reject")
    public ResponseEntity<ApiResponse> rejectMissionOrder(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            if (user.getRole() != UserRole.DT && user.getRole() != UserRole.DG) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Droits insuffisants pour rejeter un ordre de mission"));
            }

            MissionOrder order = missionOrderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Ordre de mission non trouvé"));
            order.setStatus(MissionOrderStatus.REJECTED);
            order.setRejectionNotes((String) body.getOrDefault("notes", ""));
            missionOrderRepository.save(order);

            return ResponseEntity.ok(ApiResponse.success("Ordre de mission rejeté", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/mission-orders/{id}/send-to-member")
    public ResponseEntity<ApiResponse> sendMissionOrderToMember(@PathVariable Long id) {
        try {
            MissionOrder order = missionOrderRepository.findById(id).orElseThrow(() -> new RuntimeException("Ordre de mission non trouvé"));
            order.setStatus(MissionOrderStatus.SENT_TO_MEMBER);
            order.setSentToMemberDate(LocalDateTime.now());
            missionOrderRepository.save(order);
            return ResponseEntity.ok(ApiResponse.success("Ordre de mission envoyé au membre", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/mission-orders/pending")
    public ResponseEntity<?> getPendingMissionOrders() {
        List<MissionOrder> pending = new ArrayList<>();
        pending.addAll(missionOrderRepository.findByStatus(MissionOrderStatus.PENDING_DT_APPROVAL));
        pending.addAll(missionOrderRepository.findByStatus(MissionOrderStatus.PENDING_DG_APPROVAL));
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/mission-orders/pending-approval")
    public ResponseEntity<?> getPendingApprovalOrders(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        User user = userRepository.findById(userId).orElse(null);
        List<MissionOrder> pending = new ArrayList<>();
        // DT sees orders needing DT approval; DG sees orders needing DG approval; others see all
        if (user != null && user.getRole() == UserRole.DT) {
            pending.addAll(missionOrderRepository.findByStatus(MissionOrderStatus.PENDING_DT_APPROVAL));
        } else if (user != null && user.getRole() == UserRole.DG) {
            pending.addAll(missionOrderRepository.findByStatus(MissionOrderStatus.PENDING_DG_APPROVAL));
        } else {
            pending.addAll(missionOrderRepository.findByStatus(MissionOrderStatus.PENDING_DT_APPROVAL));
            pending.addAll(missionOrderRepository.findByStatus(MissionOrderStatus.PENDING_DG_APPROVAL));
        }
        // Also include processed orders for history
        pending.addAll(missionOrderRepository.findByStatus(MissionOrderStatus.FULLY_APPROVED));
        pending.addAll(missionOrderRepository.findByStatus(MissionOrderStatus.SENT_TO_MEMBER));
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/mission-orders/by-request/{requestId}")
    public ResponseEntity<?> getMissionOrdersByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(missionOrderRepository.findByRequest_Id(requestId));
    }

    @GetMapping("/mission-orders/my-orders")
    public ResponseEntity<?> getMyMissionOrders(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        return ResponseEntity.ok(missionOrderRepository.findByTeamMember_Id(userId));
    }

    // ========== EVALUATION NOTES (STEP 7) ==========

    @PostMapping("/notes/create")
    public ResponseEntity<ApiResponse> createNote(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User author = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));

            EvaluationNote note = EvaluationNote.builder()
                    .request(request).author(author)
                    .noteType((String) body.getOrDefault("noteType", "EVALUATION"))
                    .observations((String) body.get("observations"))
                    .synthesis((String) body.get("synthesis"))
                    .checklistStatus((String) body.get("checklistStatus"))
                    .authorTeamRole(body.get("teamRole") != null ? TeamRole.valueOf((String) body.get("teamRole")) : null)
                    .build();
            noteRepository.save(note);

            return ResponseEntity.ok(ApiResponse.success("Note enregistrée", note));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/notes/{id}/send-to-ree")
    public ResponseEntity<ApiResponse> sendNoteToREE(@PathVariable Long id) {
        try {
            EvaluationNote note = noteRepository.findById(id).orElseThrow(() -> new RuntimeException("Note non trouvée"));
            note.setSentToREE(true);
            note.setSentDate(LocalDateTime.now());
            noteRepository.save(note);
            return ResponseEntity.ok(ApiResponse.success("Note envoyée au REE", note));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/notes/by-request/{requestId}")
    public ResponseEntity<?> getNotesByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(noteRepository.findByRequest_Id(requestId));
    }

    @GetMapping("/notes/my-notes")
    public ResponseEntity<?> getMyNotes(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        return ResponseEntity.ok(noteRepository.findByAuthor_Id(userId));
    }

    // ========== GAPS / FOR 02 (STEP 7-8) ==========

    @PostMapping("/gaps/create")
    public ResponseEntity<ApiResponse> createGap(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            User creator = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String gapCode = "FOR02-" + Year.now().getValue() + "-" + String.format("%03d", new Random().nextInt(999));

            // Accept both frontend field names (normReference/severity) and canonical names (requirement/type)
            String requirement = (String) body.get("requirement");
            if (requirement == null) requirement = (String) body.get("normReference");
            if (requirement == null) requirement = "";

            String typeStr = (String) body.getOrDefault("type", null);
            if (typeStr == null) {
                String severity = (String) body.getOrDefault("severity", "NON_CRITICAL");
                typeStr = severity.equals("CRITICAL") ? "CRITIQUE" : "NON_CRITIQUE";
            }

            Gap gap = Gap.builder()
                    .request(request)
                    .createdBy(creator)
                    .gapCode(gapCode)
                    .type(GapType.valueOf(typeStr))
                    .description((String) body.get("description"))
                    .requirement(requirement)
                    .evidence((String) body.getOrDefault("evidence", ""))
                    .identifiedDate(LocalDateTime.now())
                    .status(GapStatus.IDENTIFIED)
                    .build();
            gapRepository.save(gap);

            return ResponseEntity.ok(ApiResponse.success("Écart enregistré (FOR 02)", gap));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/gaps/by-request/{requestId}")
    public ResponseEntity<?> getGapsByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(gapRepository.findByRequest_Id(requestId));
    }

    @PostMapping("/gaps/{id}/submit-action-plan")
    public ResponseEntity<ApiResponse> submitActionPlan(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Gap gap = gapRepository.findById(id).orElseThrow(() -> new RuntimeException("Écart non trouvé"));

            ActionPlan plan = ActionPlan.builder()
                    .gap(gap)
                    .correctiveActions(body.get("correctiveActions"))
                    .preventiveActions(body.get("preventiveActions"))
                    .responsiblePerson(body.get("responsiblePerson"))
                    .status(ActionPlanStatus.SUBMITTED)
                    .submittedByOEC(LocalDateTime.now())
                    .submittedInTime(true)
                    .build();
            actionPlanRepository.save(plan);

            gap.setStatus(GapStatus.PLAN_SUBMITTED);
            gapRepository.save(gap);

            return ResponseEntity.ok(ApiResponse.success("Plan d'action soumis", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/gaps/{id}/evaluate-plan")
    public ResponseEntity<ApiResponse> evaluateActionPlan(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Gap gap = gapRepository.findById(id).orElseThrow(() -> new RuntimeException("Écart non trouvé"));
            ActionPlan plan = actionPlanRepository.findByGap_Id(id)
                    .orElseThrow(() -> new RuntimeException("Plan d'action non trouvé"));

            Boolean accepted = (Boolean) body.get("accepted");
            plan.setEvaluatedByTeam(LocalDateTime.now());
            plan.setAcceptedByTeam(accepted);
            plan.setTeamFeedback((String) body.get("feedback"));

            if (accepted) {
                plan.setStatus(ActionPlanStatus.ACCEPTED);
                gap.setStatus(GapStatus.PLAN_ACCEPTED);
            } else {
                plan.setStatus(ActionPlanStatus.REJECTED);
                plan.setRejectionReason((String) body.get("rejectionReason"));
                gap.setStatus(GapStatus.PLAN_REJECTED);
            }

            actionPlanRepository.save(plan);
            gapRepository.save(gap);

            return ResponseEntity.ok(ApiResponse.success(accepted ? "Plan accepté" : "Plan rejeté", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== ÉTAPE 7: ÉVALUATION SUR SITE - WORKFLOW COMPLET ==========

    // Member sends their gaps + synthesis to REE
    @PostMapping("/evaluation/send-to-ree/{requestId}")
    public ResponseEntity<ApiResponse> sendGapsAndSynthesisToREE(@PathVariable Long requestId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            String synthesis = (String) body.get("synthesis");

            // Mark all this user's gaps as sent to REE
            List<Gap> myGaps = gapRepository.findByRequest_IdAndCreatedBy_Id(requestId, userId);
            for (Gap g : myGaps) {
                if (!Boolean.TRUE.equals(g.getSentToREE())) {
                    g.setSentToREE(true);
                    g.setSentToREEDate(LocalDateTime.now());
                    g.setStatus(GapStatus.SENT_TO_REE);
                    gapRepository.save(g);
                }
            }

            // Save synthesis note
            User author = userRepository.findById(userId).orElseThrow();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            EvaluationNote note = EvaluationNote.builder()
                    .request(request).author(author)
                    .noteType("MEMBER_SYNTHESIS")
                    .content(synthesis)
                    .synthesis(synthesis)
                    .sentToREE(true).sentDate(LocalDateTime.now())
                    .build();
            noteRepository.save(note);

            // Notify REE
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
            if (!teams.isEmpty()) {
                List<TeamMember> members = memberRepository.findByTeam_Id(teams.get(0).getId());
                members.stream().filter(m -> m.getRole() == TeamRole.REE).findFirst()
                        .ifPresent(ree -> notificationService.createNotification(ree.getExpert().getId(),
                                "Évaluation - Soumission reçue",
                                "Fiches d'écart et synthèse reçues de " + author.getFullName() + " pour " + request.getReferenceNumber(),
                                "evaluation"));
            }

            return ResponseEntity.ok(ApiResponse.success("Fiches d'écart et synthèse envoyées au REE", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // REE: Get all gaps + syntheses sent by team
    @GetMapping("/evaluation/team-submissions/{requestId}")
    public ResponseEntity<?> getTeamSubmissions(@PathVariable Long requestId) {
        try {
            List<Gap> allGaps = gapRepository.findByRequest_Id(requestId);
            List<Gap> sentToREE = allGaps.stream().filter(g -> Boolean.TRUE.equals(g.getSentToREE())).toList();
            List<EvaluationNote> syntheses = noteRepository.findByRequest_IdAndNoteType(requestId, "MEMBER_SYNTHESIS");
            List<EvaluationNote> memberNotes = noteRepository.findByRequest_IdAndSentToREE(requestId, true);

            Map<String, Object> result = new HashMap<>();
            result.put("gaps", sentToREE);
            result.put("syntheses", syntheses);
            result.put("memberGaps", sentToREE);
            result.put("memberSyntheses", syntheses);
            result.put("memberNotes", memberNotes);
            result.put("totalGaps", sentToREE.size());
            result.put("totalSyntheses", syntheses.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // REE: Keep/discard a gap during consensus
    @PostMapping("/evaluation/gap/{gapId}/ree-decision")
    public ResponseEntity<ApiResponse> reeGapDecision(@PathVariable Long gapId, @RequestBody Map<String, Object> body) {
        try {
            Gap gap = gapRepository.findById(gapId).orElseThrow(() -> new RuntimeException("Écart non trouvé"));
            Boolean keep = (Boolean) body.get("keep");
            gap.setKeptByREE(keep);
            if (keep) {
                gap.setStatus(GapStatus.KEPT_BY_REE);
                if (body.get("modifiedDescription") != null) gap.setReeModifiedDescription((String) body.get("modifiedDescription"));
                if (body.get("modifiedEvidence") != null) gap.setReeModifiedEvidence((String) body.get("modifiedEvidence"));
            } else {
                gap.setStatus(GapStatus.DISCARDED_BY_REE);
            }
            gapRepository.save(gap);
            return ResponseEntity.ok(ApiResponse.success(keep ? "Écart retenu" : "Écart écarté", gap));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // REE: Save REE's own synthesis
    @PostMapping("/evaluation/ree-synthesis/{requestId}")
    public ResponseEntity<ApiResponse> saveREESynthesis(@PathVariable Long requestId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User author = userRepository.findById(userId).orElseThrow();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();

            EvaluationNote note = EvaluationNote.builder()
                    .request(request).author(author)
                    .noteType("REE_SYNTHESIS")
                    .content((String) body.get("synthesis"))
                    .synthesis((String) body.get("synthesis"))
                    .build();
            noteRepository.save(note);

            return ResponseEntity.ok(ApiResponse.success("Synthèse REE enregistrée", note));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // REE: Send gaps + synthesis to OEC (closing meeting)
    @PostMapping("/evaluation/send-to-oec/{requestId}")
    public ResponseEntity<ApiResponse> sendGapsToOEC(@PathVariable Long requestId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();

            // Mark all kept gaps as sent to OEC
            List<Gap> keptGaps = gapRepository.findByRequest_IdAndKeptByREE(requestId, true);
            for (Gap g : keptGaps) {
                g.setSentToOEC(true);
                g.setSentToOECDate(LocalDateTime.now());
                g.setStatus(GapStatus.SENT_TO_OEC);
                gapRepository.save(g);
            }

            request.setStatus(RequestStatus.EVALUATION_GAPS_SENT_TO_OEC);
            request.setCurrentStep("Fiches d'écart envoyées à l'OEC");
            request.setPendingWith("OEC");
            requestRepository.save(request);

            // Notify OEC
            if (request.getOec() != null) {
                notificationService.createNotification(request.getOec().getId(),
                        "Fiches d'écart reçues",
                        keptGaps.size() + " fiche(s) d'écart et synthèse reçues pour " + request.getReferenceNumber() + ". Veuillez examiner.",
                        "evaluation");
            }

            return ResponseEntity.ok(ApiResponse.success(keptGaps.size() + " fiches d'écart envoyées à l'OEC", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // OEC: Accept or refuse a gap
    @PostMapping("/evaluation/gap/{gapId}/oec-response")
    public ResponseEntity<ApiResponse> oecGapResponse(@PathVariable Long gapId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Gap gap = gapRepository.findById(gapId).orElseThrow(() -> new RuntimeException("Écart non trouvé"));
            Boolean accepted = (Boolean) body.get("accepted");
            gap.setOecAccepted(accepted);
            gap.setOecResponseDate(LocalDateTime.now());

            if (accepted) {
                gap.setStatus(GapStatus.OEC_ACCEPTED);
            } else {
                gap.setOecRefusalReason((String) body.get("refusalReason"));
                gap.setStatus(GapStatus.OEC_REFUSED);

                // Notify REE about refusal
                List<EvaluationTeam> teams = teamRepository.findByRequest_Id(gap.getRequest().getId());
                if (!teams.isEmpty()) {
                    List<TeamMember> members = memberRepository.findByTeam_Id(teams.get(0).getId());
                    members.stream().filter(m -> m.getRole() == TeamRole.REE).findFirst()
                            .ifPresent(ree -> notificationService.createNotification(ree.getExpert().getId(),
                                    "Écart refusé par l'OEC",
                                    "L'OEC a refusé l'écart " + gap.getGapCode() + ". Motif: " + gap.getOecRefusalReason(),
                                    "evaluation"));

                    // Also notify CD
                    List<User> cds = userRepository.findByRole(UserRole.CD);
                    for (User cd : cds) {
                        notificationService.createNotification(cd.getId(),
                                "Écart refusé par l'OEC",
                                "L'OEC a refusé l'écart " + gap.getGapCode() + " pour le dossier " + gap.getRequest().getReferenceNumber(),
                                "evaluation");
                    }
                }
            }
            gapRepository.save(gap);

            // Check if all gaps have been reviewed
            Long reqId = gap.getRequest().getId();
            long pendingCount = gapRepository.countByRequest_IdAndSentToOECAndOecAcceptedIsNull(reqId, true);
            if (pendingCount == 0) {
                AccreditationRequest request = gap.getRequest();
                long refusedCount = gapRepository.countByRequest_IdAndSentToOECAndOecAccepted(reqId, true, false);
                if (refusedCount == 0) {
                    // Auto-start gap treatment: transition accepted gaps to AWAITING_ACTION_PLAN
                    List<Gap> acceptedGaps = gapRepository.findByRequest_IdAndStatus(reqId, GapStatus.OEC_ACCEPTED);
                    for (Gap ag : acceptedGaps) {
                        ag.setStatus(GapStatus.AWAITING_ACTION_PLAN);
                        gapRepository.save(ag);
                    }
                    request.setStatus(RequestStatus.AWAITING_ACTION_PLANS);
                    request.setCurrentStep("En attente des plans d'action de l'OEC (10 jours)");
                    request.setPendingWith("OEC");
                    request.setEvaluationEndDate(LocalDateTime.now());

                    // Notify OEC
                    if (request.getOec() != null) {
                        notificationService.createNotification(request.getOec().getId(),
                                "Plans d'action requis",
                                "Vous avez 10 jours pour soumettre les plans d'actions pour " + acceptedGaps.size() + " écart(s) — " + request.getReferenceNumber(),
                                "gap_treatment");
                    }
                } else {
                    request.setStatus(RequestStatus.EVALUATION_OEC_REVIEW);
                    request.setCurrentStep(refusedCount + " écart(s) refusé(s) par l'OEC");
                    request.setPendingWith("REE / CD");
                }
                requestRepository.save(request);
            }

            return ResponseEntity.ok(ApiResponse.success(accepted ? "Écart accepté" : "Écart refusé", gap));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // OEC: Get gaps sent to OEC for review
    @GetMapping("/evaluation/oec-gaps/{requestId}")
    public ResponseEntity<?> getOECGaps(@PathVariable Long requestId) {
        List<Gap> gaps = gapRepository.findByRequest_IdAndSentToOEC(requestId, true);
        return ResponseEntity.ok(gaps);
    }

    // REE: Transmit closing docs to CD/RA
    @PostMapping("/evaluation/transmit-docs/{requestId}")
    public ResponseEntity<ApiResponse> transmitClosingDocs(@PathVariable Long requestId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            request.setStatus(RequestStatus.EVALUATION_DOCS_TRANSMITTED);
            request.setCurrentStep("Documents de clôture transmis au CD/RA");
            request.setPendingWith("CD / RA");
            requestRepository.save(request);

            // Notify RA and CD
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(request.getAssignedToRa().getId(),
                        "Documents de clôture reçus",
                        "Documents de clôture reçus : feuilles de présence, ordres de mission, fiches d'écart FOR 02 — " + request.getReferenceNumber(),
                        "evaluation");
            }
            List<User> cds = userRepository.findByRole(UserRole.CD);
            for (User cd : cds) {
                notificationService.createNotification(cd.getId(),
                        "Documents de clôture reçus",
                        "Documents de clôture reçus pour " + request.getReferenceNumber(),
                        "evaluation");
            }

            return ResponseEntity.ok(ApiResponse.success("Documents transmis au CD/RA", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== ÉTAPE 8: TRAITEMENT DES ÉCARTS ==========

    // Transition to Étape 8: Move accepted gaps to AWAITING_ACTION_PLAN
    @PostMapping("/gap-treatment/start/{requestId}")
    public ResponseEntity<ApiResponse> startGapTreatment(@PathVariable Long requestId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();

            List<Gap> acceptedGaps = gapRepository.findByRequest_IdAndStatus(requestId, GapStatus.OEC_ACCEPTED);
            for (Gap g : acceptedGaps) {
                g.setStatus(GapStatus.AWAITING_ACTION_PLAN);
                gapRepository.save(g);
            }

            request.setStatus(RequestStatus.AWAITING_ACTION_PLANS);
            request.setCurrentStep("En attente des plans d'action de l'OEC (10 jours)");
            request.setPendingWith("OEC");
            request.setEvaluationEndDate(LocalDateTime.now()); // Date de clôture = référence pour le délai de 10 jours
            requestRepository.save(request);

            // Notify OEC
            if (request.getOec() != null) {
                notificationService.createNotification(request.getOec().getId(),
                        "Plans d'action requis",
                        "Vous avez 10 jours pour soumettre les plans d'actions pour " + acceptedGaps.size() + " écart(s) — " + request.getReferenceNumber(),
                        "gap_treatment");
            }

            return ResponseEntity.ok(ApiResponse.success("Traitement des écarts lancé — " + acceptedGaps.size() + " écarts en attente de plans d'action", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // OEC submits action plan for a gap (Étape 8)
    @PostMapping("/gap-treatment/gap/{gapId}/action-plan")
    public ResponseEntity<ApiResponse> submitGapActionPlan(@PathVariable Long gapId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Gap gap = gapRepository.findById(gapId).orElseThrow(() -> new RuntimeException("Écart non trouvé"));
            AccreditationRequest request = gap.getRequest();

            // Check deadline (10 days from evaluation end)
            boolean inTime = request.getEvaluationEndDate() == null ||
                    LocalDateTime.now().isBefore(request.getEvaluationEndDate().plusDays(10));

            ActionPlan plan = ActionPlan.builder()
                    .gap(gap)
                    .correctiveActions((String) body.get("correctiveActions"))
                    .preventiveActions((String) body.get("preventiveActions"))
                    .responsiblePerson((String) body.get("responsiblePerson"))
                    .supportingDocuments((String) body.get("supportingDocuments"))
                    .status(ActionPlanStatus.SUBMITTED)
                    .submittedByOEC(LocalDateTime.now())
                    .submittedInTime(inTime)
                    .build();
            actionPlanRepository.save(plan);

            gap.setStatus(GapStatus.PLAN_SUBMITTED);
            gapRepository.save(gap);

            // Notify REE
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(request.getId());
            if (!teams.isEmpty()) {
                List<TeamMember> members = memberRepository.findByTeam_Id(teams.get(0).getId());
                members.stream().filter(m -> m.getRole() == TeamRole.REE).findFirst()
                        .ifPresent(ree -> notificationService.createNotification(ree.getExpert().getId(),
                                "Plan d'action reçu",
                                "Plan d'action reçu pour l'écart " + gap.getGapCode() + " — " + request.getReferenceNumber(),
                                "gap_treatment"));
            }

            return ResponseEntity.ok(ApiResponse.success("Plan d'action soumis" + (inTime ? "" : " (hors délai)"), plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // REE sends reminder to OEC (when 10-day deadline exceeded)
    @PostMapping("/gap-treatment/send-reminder/{requestId}")
    public ResponseEntity<ApiResponse> sendOECReminder(@PathVariable Long requestId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            if (request.getOec() != null) {
                notificationService.createNotification(request.getOec().getId(),
                        "Rappel — Plans d'action",
                        "RAPPEL : Vous disposez de 5 jours supplémentaires pour soumettre vos plans d'action pour " + request.getReferenceNumber(),
                        "gap_treatment");
            }
            return ResponseEntity.ok(ApiResponse.success("Rappel envoyé à l'OEC (5 jours supplémentaires)", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Team evaluates action plan relevance (5 days)
    @PostMapping("/gap-treatment/gap/{gapId}/evaluate-plan")
    public ResponseEntity<ApiResponse> evaluateGapActionPlan(@PathVariable Long gapId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Gap gap = gapRepository.findById(gapId).orElseThrow();
            ActionPlan plan = actionPlanRepository.findByGap_Id(gapId).orElseThrow(() -> new RuntimeException("Plan d'action non trouvé"));

            Boolean accepted = (Boolean) body.get("accepted");
            plan.setEvaluatedByTeam(LocalDateTime.now());
            plan.setAcceptedByTeam(accepted);
            plan.setTeamFeedback((String) body.get("feedback"));

            if (accepted) {
                plan.setStatus(ActionPlanStatus.ACCEPTED);
                gap.setStatus(GapStatus.PLAN_ACCEPTED);
            } else {
                plan.setStatus(ActionPlanStatus.REJECTED);
                plan.setRejectionReason((String) body.get("feedback"));
                gap.setStatus(GapStatus.PLAN_REJECTED);
            }

            actionPlanRepository.save(plan);
            gapRepository.save(gap);

            // Notify OEC
            AccreditationRequest request = gap.getRequest();
            if (request.getOec() != null) {
                notificationService.createNotification(request.getOec().getId(),
                        "Évaluation plan d'action",
                        "Plan d'action pour " + gap.getGapCode() + " : " + (accepted ? "ACCEPTÉ" : "REJETÉ — " + body.get("feedback")),
                        "gap_treatment");
            }

            // Check if all gaps have been evaluated and resolved
            checkGapTreatmentCompletion(request.getId());

            return ResponseEntity.ok(ApiResponse.success(accepted ? "Plan accepté" : "Plan rejeté", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Mark gap as resolved
    @PostMapping("/gap-treatment/gap/{gapId}/resolve")
    public ResponseEntity<ApiResponse> resolveGap(@PathVariable Long gapId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Gap gap = gapRepository.findById(gapId).orElseThrow();
            gap.setStatus(GapStatus.RESOLVED);
            gapRepository.save(gap);

            checkGapTreatmentCompletion(gap.getRequest().getId());

            return ResponseEntity.ok(ApiResponse.success("Écart soldé", gap));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // CD: Trigger complementary evaluation (placeholder)
    @PostMapping("/gap-treatment/complementary-evaluation/{requestId}")
    public ResponseEntity<ApiResponse> triggerComplementaryEvaluation(@PathVariable Long requestId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            request.setStatus(RequestStatus.COMPLEMENTARY_EVALUATION_NEEDED);
            request.setCurrentStep("Évaluation complémentaire demandée par le CD");
            request.setPendingWith("Équipe d'évaluation");
            requestRepository.save(request);

            // Notify team
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
            if (!teams.isEmpty()) {
                List<TeamMember> members = memberRepository.findByTeam_Id(teams.get(0).getId());
                for (TeamMember m : members) {
                    notificationService.createNotification(m.getExpert().getId(),
                            "Évaluation complémentaire",
                            "Évaluation complémentaire demandée pour " + request.getReferenceNumber(),
                            "gap_treatment");
                }
            }

            return ResponseEntity.ok(ApiResponse.success("Évaluation complémentaire déclenchée", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Helper: Check if gap treatment is complete
    private void checkGapTreatmentCompletion(Long requestId) {
        List<Gap> allGaps = gapRepository.findByRequest_Id(requestId);
        List<Gap> activeGaps = allGaps.stream()
                .filter(g -> Boolean.TRUE.equals(g.getSentToOEC()) && Boolean.TRUE.equals(g.getOecAccepted()))
                .toList();

        boolean allCriticalResolved = activeGaps.stream()
                .filter(g -> g.getType() == GapType.CRITIQUE)
                .allMatch(g -> g.getStatus() == GapStatus.RESOLVED);

        boolean allNonCriticalHavePlans = activeGaps.stream()
                .filter(g -> g.getType() == GapType.NON_CRITIQUE)
                .allMatch(g -> g.getStatus() == GapStatus.PLAN_ACCEPTED || g.getStatus() == GapStatus.RESOLVED);

        if (allCriticalResolved && allNonCriticalHavePlans && !activeGaps.isEmpty()) {
            AccreditationRequest request = requestRepository.findById(requestId).orElse(null);
            if (request != null && request.getStatus() != RequestStatus.GAPS_RESOLVED) {
                request.setStatus(RequestStatus.GAPS_RESOLVED);
                request.setCurrentStep("Tous les écarts critiques soldés — Prêt pour la programmation CAS");
                request.setPendingWith("RA");
                requestRepository.save(request);

                // Notify RA
                if (request.getAssignedToRa() != null) {
                    notificationService.createNotification(request.getAssignedToRa().getId(),
                            "Écarts soldés",
                            "Traitement des écarts terminé pour " + request.getReferenceNumber() + " — Vous pouvez programmer la réunion CAS",
                            "gap_treatment");
                }
            }
        }
    }

    // Get gap treatment status overview
    @GetMapping("/gap-treatment/overview/{requestId}")
    public ResponseEntity<?> getGapTreatmentOverview(@PathVariable Long requestId) {
        try {
            List<Gap> allGaps = gapRepository.findByRequest_Id(requestId);
            List<Gap> activeGaps = allGaps.stream()
                    .filter(g -> Boolean.TRUE.equals(g.getOecAccepted()))
                    .toList();

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();

            Map<String, Object> overview = new HashMap<>();
            overview.put("gaps", activeGaps);
            overview.put("totalActive", activeGaps.size());
            overview.put("criticalCount", activeGaps.stream().filter(g -> g.getType() == GapType.CRITIQUE).count());
            overview.put("nonCriticalCount", activeGaps.stream().filter(g -> g.getType() == GapType.NON_CRITIQUE).count());
            overview.put("resolvedCount", activeGaps.stream().filter(g -> g.getStatus() == GapStatus.RESOLVED).count());
            overview.put("awaitingPlanCount", activeGaps.stream().filter(g -> g.getStatus() == GapStatus.AWAITING_ACTION_PLAN).count());
            overview.put("planSubmittedCount", activeGaps.stream().filter(g -> g.getStatus() == GapStatus.PLAN_SUBMITTED).count());
            overview.put("planAcceptedCount", activeGaps.stream().filter(g -> g.getStatus() == GapStatus.PLAN_ACCEPTED).count());

            // Check 6-month deadline
            if (request.getEvaluationEndDate() != null) {
                LocalDateTime sixMonthDeadline = request.getEvaluationEndDate().plusMonths(6);
                overview.put("sixMonthDeadline", sixMonthDeadline.toString());
                overview.put("deadlineExceeded", LocalDateTime.now().isAfter(sixMonthDeadline));
            }

            // Action plans
            List<ActionPlan> plans = new java.util.ArrayList<>();
            for (Gap g : activeGaps) {
                actionPlanRepository.findByGap_Id(g.getId()).ifPresent(plans::add);
            }
            overview.put("actionPlans", plans);

            return ResponseEntity.ok(overview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== EVALUATION REPORT (STEP 9-10) ==========

    @PostMapping("/reports/create")
    public ResponseEntity<ApiResponse> createReport(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);

            String reportNumber = "RAP-" + Year.now().getValue() + "-" + String.format("%03d", new Random().nextInt(999));

            EvaluationReport report = EvaluationReport.builder()
                    .request(request)
                    .team(teams.isEmpty() ? null : teams.get(0))
                    .reportNumber(reportNumber)
                    .contextAndObjectives((String) body.get("contextAndObjectives"))
                    .teamComposition((String) body.get("teamComposition"))
                    .programRealized((String) body.get("programRealized"))
                    .findingsByRequirement((String) body.get("findingsByRequirement"))
                    .gapsSummary((String) body.get("gapsSummary"))
                    .strengths((String) body.get("strengths"))
                    .improvementAreas((String) body.get("improvementAreas"))
                    .conclusionAndRecommendation((String) body.get("conclusionAndRecommendation"))
                    .draftedByREE(LocalDateTime.now())
                    .status(EvaluationReportStatus.DRAFT)
                    .build();
            reportRepository.save(report);

            request.setStatus(RequestStatus.REPORT_DRAFTING);
            request.setCurrentStep("Rapport d'évaluation en rédaction");
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Rapport créé", report));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/reports/{id}/submit")
    public ResponseEntity<ApiResponse> submitReport(@PathVariable Long id) {
        try {
            EvaluationReport report = reportRepository.findById(id).orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
            report.setSubmittedToCD(LocalDateTime.now());
            report.setStatus(EvaluationReportStatus.SUBMITTED_TO_CD);
            reportRepository.save(report);

            AccreditationRequest request = report.getRequest();
            request.setStatus(RequestStatus.REPORT_VALIDATION);
            request.setCurrentStep("Rapport en cours de validation");
            request.setPendingWith("RA");
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Rapport soumis pour validation", report));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/reports/{id}/validate")
    public ResponseEntity<ApiResponse> validateReport(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            EvaluationReport report = reportRepository.findById(id).orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
            Boolean approved = (Boolean) body.getOrDefault("approved", true);

            if (approved) {
                report.setValidatedByCD(true);
                report.setStatus(EvaluationReportStatus.VALIDATED);

                AccreditationRequest request = report.getRequest();
                request.setStatus(RequestStatus.REPORT_VALIDATED);
                request.setCurrentStep("Rapport validé - Préparation CAS");
                request.setPendingWith("RA");
                requestRepository.save(request);
            } else {
                report.setCorrectionRequests((String) body.get("corrections"));
                report.setStatus(EvaluationReportStatus.CORRECTIONS_NEEDED);
            }
            reportRepository.save(report);

            return ResponseEntity.ok(ApiResponse.success(
                    approved ? "Rapport validé" : "Corrections demandées", report));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/reports/by-request/{requestId}")
    public ResponseEntity<?> getReportByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(reportRepository.findByRequest_Id(requestId));
    }

    // ========== CAS (STEP 11) ==========

    @PostMapping("/cas/schedule-meeting")
    public ResponseEntity<ApiResponse> scheduleCASMeeting(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));

            String meetingCode = "CAS-" + Year.now().getValue() + "-" + String.format("%03d", new Random().nextInt(999));

            CASMeeting meeting = CASMeeting.builder()
                    .request(request)
                    .meetingCode(meetingCode)
                    .meetingDate(LocalDateTime.parse((String) body.get("meetingDate")))
                    .location((String) body.getOrDefault("location", "ALGERAC - Salle CAS"))
                    .agenda((String) body.get("agenda"))
                    .dossierSummary((String) body.get("dossierSummary"))
                    .status(CASMeetingStatus.PLANNED)
                    .quorumRequired(3) // PRO 07 §5.2 - default quorum
                    .attendeesConfirmed(0)
                    .quorumReached(false)
                    .build();
            casMeetingRepository.save(meeting);

            request.setStatus(RequestStatus.CAS_SCHEDULED);
            request.setCurrentStep("Réunion CAS planifiée");
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Réunion CAS planifiée", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/cas/{meetingId}/open-vote")
    public ResponseEntity<ApiResponse> openVote(@PathVariable Long meetingId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));
            if (meeting.getStatus() == CASMeetingStatus.VOTING) {
                return ResponseEntity.ok(ApiResponse.success("Le vote est déjà ouvert", meeting));
            }
            meeting.setStatus(CASMeetingStatus.VOTING);
            meeting.setVotingOpenedAt(LocalDateTime.now());
            casMeetingRepository.save(meeting);

            return ResponseEntity.ok(ApiResponse.success("Vote ouvert — les membres peuvent maintenant voter", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/cas/{meetingId}/vote")
    public ResponseEntity<ApiResponse> castVote(@PathVariable Long meetingId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User voter = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));

            // PRO 07 §5.10 — Member who was evaluator/expert on the case must withdraw from deliberation
            Long requestId = meeting.getRequestId();
            if (requestId != null) {
                List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
                for (EvaluationTeam team : teams) {
                    boolean wasEvaluator = team.getMembers().stream()
                            .anyMatch(m -> m.getExpert() != null && m.getExpert().getId().equals(userId));
                    if (wasEvaluator) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(ApiResponse.error("PRO 07 §5.10 — Vous avez participé à l'évaluation de ce dossier. " +
                                        "Le membre qui a été évaluateur ou expert technique se retire de la délibération."));
                    }
                }
            }

            // Check if user already submitted attendance (PENDING vote) — update existing record
            List<CASVote> existingVotes = casVoteRepository.findByMeeting_Id(meetingId);
            CASVote existingAttendance = existingVotes.stream()
                    .filter(v -> v.getVoter().getId().equals(userId) && "PENDING".equals(v.getVote()))
                    .findFirst().orElse(null);

            CASVote vote;
            if (existingAttendance != null) {
                // Update the existing attendance record with the actual vote
                existingAttendance.setVote(body.get("vote"));
                existingAttendance.setJustification(body.get("justification"));
                existingAttendance.setNotes(body.get("notes"));
                existingAttendance.setFor14Opinion(body.get("for14Opinion"));
                existingAttendance.setFor14TechnicalRemarks(body.get("for14TechnicalRemarks"));
                existingAttendance.setFor14ScopeRemarks(body.get("for14ScopeRemarks"));
                existingAttendance.setFor14Recommendation(body.get("for14Recommendation"));
                existingAttendance.setFor14ConformityAssessment(body.get("for14ConformityAssessment"));
                existingAttendance.setFor14CompetenceAssessment(body.get("for14CompetenceAssessment"));
                existingAttendance.setFor14ImpartialityAssessment(body.get("for14ImpartialityAssessment"));
                vote = casVoteRepository.save(existingAttendance);
            } else {
                vote = CASVote.builder()
                        .meeting(meeting).voter(voter)
                        .vote(body.get("vote"))
                        .justification(body.get("justification"))
                        .notes(body.get("notes"))
                        .attendanceConfirmed(true)
                        .for14Opinion(body.get("for14Opinion"))
                        .for14TechnicalRemarks(body.get("for14TechnicalRemarks"))
                        .for14ScopeRemarks(body.get("for14ScopeRemarks"))
                        .for14Recommendation(body.get("for14Recommendation"))
                        .for14ConformityAssessment(body.get("for14ConformityAssessment"))
                        .for14CompetenceAssessment(body.get("for14CompetenceAssessment"))
                        .for14ImpartialityAssessment(body.get("for14ImpartialityAssessment"))
                        .build();
                vote = casVoteRepository.save(vote);
            }

            return ResponseEntity.ok(ApiResponse.success("Avis FOR 14 enregistré", vote));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // PRO 07 §4.2 - Confirm attendance and declare conflict of interest
    @PostMapping("/cas/{meetingId}/confirm-attendance")
    public ResponseEntity<ApiResponse> confirmAttendance(@PathVariable Long meetingId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User voter = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));

            // Check if already confirmed
            List<CASVote> existing = casVoteRepository.findByMeeting_Id(meetingId);
            boolean alreadyConfirmed = existing.stream().anyMatch(v -> v.getVoter().getId().equals(userId) && Boolean.TRUE.equals(v.getAttendanceConfirmed()));
            if (alreadyConfirmed) {
                return ResponseEntity.ok(ApiResponse.success("Présence déjà confirmée", null));
            }

            Boolean hasConflict = body.get("hasConflictOfInterest") != null && (Boolean) body.get("hasConflictOfInterest");
            String conflictDesc = (String) body.get("conflictDescription");

            // Create attendance record (vote will be updated when they actually vote)
            CASVote attendance = CASVote.builder()
                    .meeting(meeting).voter(voter)
                    .vote("PENDING") // Will be updated at vote time
                    .attendanceConfirmed(true)
                    .hasConflictOfInterest(hasConflict)
                    .conflictDescription(conflictDesc)
                    .build();
            casVoteRepository.save(attendance);

            // Update meeting attendees count
            long confirmedCount = casVoteRepository.findByMeeting_Id(meetingId).stream()
                    .filter(v -> Boolean.TRUE.equals(v.getAttendanceConfirmed())).count();
            meeting.setAttendeesConfirmed((int) confirmedCount);
            if (meeting.getQuorumRequired() != null && confirmedCount >= meeting.getQuorumRequired()) {
                meeting.setQuorumReached(true);
            }
            if (meeting.getStatus() == CASMeetingStatus.SUMMONS_SENT) {
                meeting.setStatus(CASMeetingStatus.ATTENDEES_CONFIRMED);
            }
            casMeetingRepository.save(meeting);

            return ResponseEntity.ok(ApiResponse.success("Présence confirmée — déclaration d'intérêts enregistrée (PRO 07 §4.2)", attendance));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // PRO 07 - Send formal summons (convocations) to CAS members
    @PostMapping("/cas/{meetingId}/send-summons")
    public ResponseEntity<ApiResponse> sendSummons(@PathVariable Long meetingId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));
            meeting.setStatus(CASMeetingStatus.SUMMONS_SENT);
            meeting.setSummonsSentAt(LocalDateTime.now());
            casMeetingRepository.save(meeting);

            // Notify all CAS members
            List<User> casMembers = userRepository.findByRole(UserRole.CAS_MEMBER);
            for (User member : casMembers) {
                notificationService.createNotification(member.getId(),
                        "Convocation CAS — " + meeting.getMeetingCode(),
                        "Vous êtes convoqué(e) à la réunion CAS " + meeting.getMeetingCode() +
                        " le " + meeting.getMeetingDate() + " — Lieu : " + meeting.getLocation() +
                        ". Veuillez confirmer votre présence et déclarer tout conflit d'intérêts (PRO 07 §4.2).",
                        "cas");
            }

            return ResponseEntity.ok(ApiResponse.success("Convocations envoyées aux membres CAS (PRO 07)", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // PRO 07 - Send dossier to CAS members before meeting
    @PostMapping("/cas/{meetingId}/send-dossier")
    public ResponseEntity<ApiResponse> sendDossier(@PathVariable Long meetingId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));
            meeting.setStatus(CASMeetingStatus.DOSSIER_SENT);
            meeting.setDossierSentAt(LocalDateTime.now());
            casMeetingRepository.save(meeting);

            // Notify CAS members that dossier is available
            List<User> casMembers = userRepository.findByRole(UserRole.CAS_MEMBER);
            for (User member : casMembers) {
                notificationService.createNotification(member.getId(),
                        "Dossier CAS transmis — " + meeting.getMeetingCode(),
                        "Le dossier pour la réunion CAS " + meeting.getMeetingCode() + " est disponible. " +
                        "Veuillez l'examiner avant la réunion (PRO 07 §5.3).",
                        "cas");
            }

            return ResponseEntity.ok(ApiResponse.success("Dossier transmis aux membres CAS (PRO 07 §5.3)", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // PRO 07 - Start deliberation (open meeting)
    @PostMapping("/cas/{meetingId}/start-meeting")
    public ResponseEntity<ApiResponse> startMeeting(@PathVariable Long meetingId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));

            // Verify quorum
            long confirmedCount = casVoteRepository.findByMeeting_Id(meetingId).stream()
                    .filter(v -> Boolean.TRUE.equals(v.getAttendanceConfirmed())).count();
            int quorum = meeting.getQuorumRequired() != null ? meeting.getQuorumRequired() : 3;
            if (confirmedCount < quorum) {
                return ResponseEntity.badRequest().body(ApiResponse.error(
                        "Quorum non atteint. " + confirmedCount + "/" + quorum + " membres confirmés. (PRO 07 §5.2)"));
            }

            meeting.setStatus(CASMeetingStatus.IN_PROGRESS);
            meeting.setQuorumReached(true);
            casMeetingRepository.save(meeting);

            return ResponseEntity.ok(ApiResponse.success("Réunion CAS démarrée — quorum atteint (" + confirmedCount + "/" + quorum + ")", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // PRO 07 - Close voting phase
    @PostMapping("/cas/{meetingId}/close-voting")
    public ResponseEntity<ApiResponse> closeVoting(@PathVariable Long meetingId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));
            meeting.setVotingClosedAt(LocalDateTime.now());
            casMeetingRepository.save(meeting);

            return ResponseEntity.ok(ApiResponse.success("Phase de vote clôturée", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // PRO 07 - Get meeting attendees info
    @GetMapping("/cas/{meetingId}/attendees")
    public ResponseEntity<?> getMeetingAttendees(@PathVariable Long meetingId) {
        List<CASVote> allVotes = casVoteRepository.findByMeeting_Id(meetingId);
        List<Map<String, Object>> attendees = allVotes.stream()
                .filter(v -> Boolean.TRUE.equals(v.getAttendanceConfirmed()))
                .map(v -> {
                    Map<String, Object> a = new HashMap<>();
                    a.put("voterId", v.getVoterId());
                    a.put("voterName", v.getVoterName());
                    a.put("hasConflictOfInterest", v.getHasConflictOfInterest());
                    a.put("conflictDescription", v.getConflictDescription());
                    a.put("hasVoted", v.getVote() != null && !"PENDING".equals(v.getVote()));
                    return a;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(attendees);
    }

    // PRO 07 §5.9 - Compute vote results with majority logic and tie-breaking (president double vote)
    @GetMapping("/cas/{meetingId}/vote-results")
    public ResponseEntity<?> getVoteResults(@PathVariable Long meetingId) {
        try {
            CASMeeting meeting = casMeetingRepository.findById(meetingId)
                    .orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));
            List<CASVote> allVotes = casVoteRepository.findByMeeting_Id(meetingId);
            List<CASVote> actualVotes = allVotes.stream()
                    .filter(v -> v.getVote() != null && !"PENDING".equals(v.getVote()))
                    .collect(Collectors.toList());

            // Count votes by category (normalize ACCORDER variants)
            Map<String, Long> breakdown = new LinkedHashMap<>();
            long accorderCount = actualVotes.stream().filter(v -> v.getVote().startsWith("ACCORDER")).count();
            long refuserCount = actualVotes.stream().filter(v -> "REFUSER".equals(v.getVote())).count();
            long ajournerCount = actualVotes.stream().filter(v -> "AJOURNER".equals(v.getVote())).count();
            long abstentionCount = actualVotes.stream().filter(v -> "ABSTENTION".equals(v.getVote())).count();
            breakdown.put("ACCORDER", accorderCount);
            breakdown.put("REFUSER", refuserCount);
            breakdown.put("AJOURNER", ajournerCount);
            breakdown.put("ABSTENTION", abstentionCount);

            // PRO 07 §5.9 — Simple majority (excluding abstentions)
            long totalVotesExclAbstention = accorderCount + refuserCount + ajournerCount;
            long majorityThreshold = totalVotesExclAbstention > 0 ? (totalVotesExclAbstention / 2) + 1 : 0;

            String majorityResult = null;
            boolean isTie = false;
            boolean presidentDoubleVoteApplied = false;

            if (totalVotesExclAbstention > 0) {
                // Find the option with the most votes
                long maxVotes = Math.max(accorderCount, Math.max(refuserCount, ajournerCount));
                List<String> topOptions = new ArrayList<>();
                if (accorderCount == maxVotes) topOptions.add("ACCORDER");
                if (refuserCount == maxVotes) topOptions.add("REFUSER");
                if (ajournerCount == maxVotes) topOptions.add("AJOURNER");

                if (topOptions.size() == 1 && maxVotes >= majorityThreshold) {
                    majorityResult = topOptions.get(0);
                } else if (topOptions.size() > 1) {
                    // PRO 07 §5.9 — Tie: President gets a double vote
                    isTie = true;
                    // Find president's vote to determine tie-break
                    List<User> presidents = userRepository.findByRole(UserRole.CAS_PRESIDENT);
                    Optional<CASVote> presidentVote = actualVotes.stream()
                            .filter(v -> presidents.stream().anyMatch(p -> p.getId().equals(v.getVoterId())))
                            .findFirst();
                    if (presidentVote.isPresent()) {
                        String pVote = presidentVote.get().getVote().startsWith("ACCORDER") ? "ACCORDER" : presidentVote.get().getVote();
                        if (topOptions.contains(pVote)) {
                            majorityResult = pVote;
                            presidentDoubleVoteApplied = true;
                        }
                    }
                }
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("meetingId", meetingId);
            result.put("totalVotes", actualVotes.size());
            result.put("totalVotesExcludingAbstention", totalVotesExclAbstention);
            result.put("breakdown", breakdown);
            result.put("majorityThreshold", majorityThreshold);
            result.put("majorityResult", majorityResult);
            result.put("isTie", isTie);
            result.put("presidentDoubleVoteApplied", presidentDoubleVoteApplied);
            result.put("quorumReached", meeting.getQuorumReached());
            result.put("attendeesConfirmed", meeting.getAttendeesConfirmed());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/cas/{meetingId}/decide")
    public ResponseEntity<ApiResponse> makeCASDecision(@PathVariable Long meetingId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            // PRO 07 §5.9 — Only CAS President can make the decision
            User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            if (currentUser.getRole() != UserRole.CAS_PRESIDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Seul le Président du CAS peut prendre la décision (PRO 07 §5.9)"));
            }

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));

            // Validate meeting is in correct state
            if (meeting.getStatus() != CASMeetingStatus.VOTING && meeting.getStatus() != CASMeetingStatus.IN_PROGRESS) {
                return ResponseEntity.badRequest().body(ApiResponse.error(
                        "La réunion doit être en cours ou le vote ouvert pour prendre une décision"));
            }

            meeting.setFinalDecision(body.get("decision"));
            meeting.setPresidentNotes(body.get("presidentNotes"));
            meeting.setStatus(CASMeetingStatus.DECIDED);
            meeting.setDecidedAt(LocalDateTime.now());
            if (meeting.getVotingClosedAt() == null) {
                meeting.setVotingClosedAt(LocalDateTime.now());
            }

            // FOR 15 fields (PRO 16 - Prise de Décision)
            meeting.setFor15DecisionJustification(body.get("for15DecisionJustification"));
            meeting.setFor15Conditions(body.get("for15Conditions"));
            meeting.setFor15ScopeDecision(body.get("for15ScopeDecision"));
            meeting.setFor15ReservesToLift(body.get("for15ReservesToLift"));
            if (body.get("for15ReservesDeadline") != null && !body.get("for15ReservesDeadline").isEmpty()) {
                meeting.setFor15ReservesDeadline(LocalDateTime.parse(body.get("for15ReservesDeadline")));
            }
            meeting.setFor15AppealRightsNotice(body.get("for15AppealRightsNotice"));
            meeting.setMeetingMinutes(body.get("meetingMinutes"));
            casMeetingRepository.save(meeting);

            AccreditationRequest request = meeting.getRequest();
            String decision = body.get("decision");
            if (decision != null && decision.startsWith("ACCORDER")) {
                request.setStatus(RequestStatus.CAS_DECISION_GRANT);
            } else if ("REFUSER".equals(decision)) {
                request.setStatus(RequestStatus.CAS_DECISION_REFUSAL);
            } else {
                request.setStatus(RequestStatus.CAS_DECISION_POSTPONEMENT);
            }
            request.setCasDecisionDate(LocalDateTime.now());
            request.setCurrentStep("Décision CAS reçue — en attente de transmission RA→OEC");
            requestRepository.save(request);

            // Notify RA to forward the decision to OEC
            notificationService.notifyRACASDecisionReceived(request, decision);

            return ResponseEntity.ok(ApiResponse.success("Décision CAS enregistrée (PRO 16 — FOR 15) — le RA a été notifié pour transmission à l'OEC", meeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/cas/by-request/{requestId}/send-decision-to-oec")
    public ResponseEntity<ApiResponse> sendCASDecisionToOEC(@PathVariable Long requestId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            AccreditationRequest request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

            // Find the decided meeting for this request
            List<CASMeeting> meetings = casMeetingRepository.findByRequest_Id(requestId);
            CASMeeting meeting = meetings.stream()
                    .filter(m -> m.getFinalDecision() != null)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Aucune décision CAS trouvée pour cette demande"));

            String decision = meeting.getFinalDecision();
            String notes = meeting.getPresidentNotes() != null ? meeting.getPresidentNotes() : "";

            // Map decision type properly from FOR 15
            CASDecisionType decisionType;
            if ("ACCORDER".equals(decision)) {
                decisionType = CASDecisionType.GRANT_FULL;
            } else if ("ACCORDER_REDUIT".equals(decision)) {
                decisionType = CASDecisionType.GRANT_REDUCED;
            } else if ("ACCORDER_RESERVES".equals(decision)) {
                decisionType = CASDecisionType.GRANT_WITH_RESERVES;
            } else if ("REFUSER".equals(decision)) {
                decisionType = CASDecisionType.REFUSAL;
            } else if ("AJOURNER".equals(decision)) {
                decisionType = CASDecisionType.POSTPONEMENT;
            } else {
                decisionType = CASDecisionType.REPORT_DECISION;
            }

            String decisionNumber = "DEC-CAS-" + java.time.Year.now().getValue() + "-" +
                    String.format("%04d", new java.util.Random().nextInt(9999));

            // Create formal CASDecision with ALL FOR 15 fields properly mapped
            CASDecision casDecision = CASDecision.builder()
                    .request(request)
                    .decisionNumber(decisionNumber)
                    .decisionType(decisionType)
                    .meetingDate(meeting.getMeetingDate())
                    .justification(meeting.getFor15DecisionJustification())
                    .scope(meeting.getFor15ScopeDecision())
                    .conditions(meeting.getFor15Conditions())
                    .reservesToLift(meeting.getFor15ReservesToLift())
                    .reservesDeadline(meeting.getFor15ReservesDeadline())
                    .appealRightNotified(meeting.getFor15AppealRightsNotice() != null && !meeting.getFor15AppealRightsNotice().isEmpty())
                    .minutesAndJustifications(meeting.getMeetingMinutes())
                    .build();
            casDecisionRepository.save(casDecision);

            // Notify OEC and transition request status
            String justification = meeting.getFor15DecisionJustification() != null ? meeting.getFor15DecisionJustification() : notes;
            if (decision.startsWith("ACCORDER")) {
                notificationService.notifyOECAccreditationGranted(request, decisionType, justification);
                request.setStatus(RequestStatus.CERTIFICATE_PREPARATION);
                request.setCurrentStep("Accréditation accordée — certificat en préparation");
            } else if ("REFUSER".equals(decision)) {
                notificationService.notifyOECAccreditationRefused(request, justification);
                request.setStatus(RequestStatus.CAS_DECISION_REFUSAL);
                request.setCurrentStep("Accréditation refusée — OEC informé");
            } else {
                notificationService.notifyOECAccreditationPostponed(request, justification);
                request.setStatus(RequestStatus.CAS_DECISION_POSTPONEMENT);
                request.setCurrentStep("Décision ajournée — OEC informé");
            }
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Décision CAS transmise à l'OEC", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }


    @GetMapping("/cas/meetings")
    public ResponseEntity<?> getAllCASMeetings() {
        return ResponseEntity.ok(casMeetingRepository.findAll());
    }

    @GetMapping("/cas/{meetingId}/votes")
    public ResponseEntity<?> getMeetingVotes(@PathVariable Long meetingId) {
        return ResponseEntity.ok(casVoteRepository.findByMeeting_Id(meetingId));
    }

    // ========== EVALUATION START/COMPLETE (STEP 7) ==========

    @PostMapping("/evaluation/start/{requestId}")
    public ResponseEntity<ApiResponse> startEvaluation(@PathVariable Long requestId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));

            // Must be in EVALUATION_PLANNED status (Étape 6 completed)
            if (request.getStatus() != RequestStatus.EVALUATION_PLANNED) {
                return ResponseEntity.badRequest().body(ApiResponse.error(
                        "L'étape 6 (Préparation) doit être terminée avant de lancer l'évaluation"));
            }

            request.setStatus(RequestStatus.EVALUATION_IN_PROGRESS);
            request.setEvaluationStartDate(LocalDateTime.now());
            request.setCurrentStep("Évaluation en cours");
            request.setPendingWith("Équipe d'évaluation");
            requestRepository.save(request);

            // Notify all team members
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
            if (!teams.isEmpty()) {
                EvaluationTeam team = teams.get(0);
                List<TeamMember> members = memberRepository.findByTeam_Id(team.getId());
                for (TeamMember member : members) {
                    notificationService.createNotification(member.getExpert().getId(),
                            "Évaluation sur site lancée",
                            "Étape 7 lancée — Évaluation sur site pour le dossier " + request.getReferenceNumber(),
                            "evaluation");
                }
            }

            // Notify OEC (request creator)
            if (request.getOec() != null) {
                notificationService.createNotification(request.getOec().getId(),
                        "Évaluation sur site lancée",
                        "L'évaluation sur site a été lancée pour votre dossier " + request.getReferenceNumber(),
                        "evaluation");
            }

            return ResponseEntity.ok(ApiResponse.success("Évaluation démarrée — L'équipe a été notifiée", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/evaluation/complete/{requestId}")
    public ResponseEntity<ApiResponse> completeEvaluation(@PathVariable Long requestId) {
        try {
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            request.setStatus(RequestStatus.EVALUATION_COMPLETED);
            request.setEvaluationEndDate(LocalDateTime.now());
            request.setCurrentStep("Évaluation terminée");
            request.setPendingWith("REE - Rédaction rapport");
            requestRepository.save(request);
            return ResponseEntity.ok(ApiResponse.success("Évaluation terminée", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== RA WORKLOAD INFO ==========

    @GetMapping("/ra-workload")
    public ResponseEntity<?> getRAWorkload() {
        List<User> ras = userRepository.findByRole(UserRole.RA);
        List<Map<String, Object>> result = ras.stream().map(ra -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", ra.getId());
            map.put("fullName", ra.getFullName());
            map.put("email", ra.getEmail());
            map.put("specialite", ra.getSpecialite());
            map.put("domaineExpertise", ra.getDomaineExpertise());
            map.put("sousDomaineExpertise", ra.getSousDomaineExpertise());
            List<AccreditationRequest> assigned = requestRepository.findByAssignedToRa_Id(ra.getId());
            map.put("assignedDossiers", assigned.size());
            long activeDossiers = assigned.stream().filter(r -> 
                r.getStatus() != RequestStatus.CLOSED && 
                r.getStatus() != RequestStatus.CAS_DECISION_REFUSAL &&
                r.getStatus() != RequestStatus.WITHDRAWN
            ).count();
            map.put("activeDossiers", activeDossiers);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ========== HELPER ==========

    @GetMapping("/experts-directory")
    public ResponseEntity<?> getExpertsDirectory() {
        List<UserRole> evaluatorRoles = List.of(UserRole.EXPERT, UserRole.REE, UserRole.ET, UserRole.EQ, UserRole.EVALUATEUR, UserRole.FORMATEUR);
        List<User> experts = userRepository.findAll().stream()
                .filter(u -> evaluatorRoles.contains(u.getRole()) && u.getStatus() == UserStatus.APPROVED)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = experts.stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", e.getId());
            map.put("fullName", e.getFullName());
            map.put("email", e.getEmail());
            map.put("phone", e.getPhone());
            map.put("role", e.getRole() != null ? e.getRole().name() : null);
            map.put("specialite", e.getSpecialite());
            map.put("experience", e.getExperience());
            map.put("diplomes", e.getDiplomes());
            map.put("langues", e.getLangues());
            map.put("disponibilite", e.getDisponibilite());
            map.put("domaineExpertise", e.getDomaineExpertise());
            map.put("sousDomaineExpertise", e.getSousDomaineExpertise());
            map.put("registrationId", e.getRegistrationId());
            map.put("createdAt", e.getCreatedAt());

            // Current team assignments (missions)
            List<TeamMember> memberships = memberRepository.findAll().stream()
                    .filter(m -> m.getExpert() != null && m.getExpert().getId().equals(e.getId()))
                    .collect(Collectors.toList());

            List<Map<String, Object>> missions = memberships.stream().map(m -> {
                Map<String, Object> mission = new HashMap<>();
                mission.put("teamMemberId", m.getId());
                mission.put("teamRole", m.getRole() != null ? m.getRole().name() : null);
                mission.put("specialization", m.getSpecialization());
                mission.put("available", m.getAvailable());
                mission.put("mandatementSentAt", m.getMandatementSentAt());
                if (m.getTeam() != null) {
                    EvaluationTeam team = m.getTeam();
                    mission.put("teamId", team.getId());
                    mission.put("proposedEvaluationDate", team.getProposedEvaluationDate());
                    mission.put("oecProposedDate", team.getOecProposedDate());
                    if (team.getRequest() != null) {
                        mission.put("requestId", team.getRequest().getId());
                        mission.put("requestRef", team.getRequest().getReferenceNumber());
                        mission.put("orgName", team.getRequest().getOecOrganizationName());
                        mission.put("requestStatus", team.getRequest().getStatus() != null ? team.getRequest().getStatus().name() : null);
                    }
                }
                return mission;
            }).collect(Collectors.toList());

            map.put("missions", missions);
            map.put("totalMissions", missions.size());
            long activeMissions = missions.stream()
                    .filter(m -> m.get("requestStatus") != null &&
                            !Set.of("CLOSED", "CAS_DECISION_REFUSAL", "CAS_DECISION_POSTPONEMENT", "WITHDRAWN").contains(m.get("requestStatus").toString()))
                    .count();
            map.put("activeMissions", activeMissions);
            return map;
        }).sorted(Comparator.comparing(m -> m.get("fullName") != null ? m.get("fullName").toString() : ""))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    private ResponseEntity<ApiResponse> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
    }
}
