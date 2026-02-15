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
    private final UserAvailabilityRepository availabilityRepository;
    private final NotificationService notificationService;

    // ========== AVAILABILITY / PLANNING ==========

    @GetMapping("/availability/{userId}")
    public ResponseEntity<?> getUserAvailability(@PathVariable Long userId) {
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

    @DeleteMapping("/availability/{id}")
    public ResponseEntity<ApiResponse> removeUnavailability(@PathVariable Long id) {
        availabilityRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Disponibilité restaurée", null));
    }

    @GetMapping("/available-experts")
    public ResponseEntity<?> getAvailableExperts(@RequestParam(required = false) String date) {
        List<User> experts = userRepository.findByRole(UserRole.EXPERT).stream()
                .filter(u -> u.getStatus() == UserStatus.APPROVED).collect(Collectors.toList());

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
            User user = userRepository.findById(userId).orElseThrow();

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
            User user = userRepository.findById(userId).orElseThrow();

            Long expertId = ((Number) body.get("expertId")).longValue();
            TeamRole role = TeamRole.valueOf((String) body.get("role"));
            String specialization = (String) body.getOrDefault("specialization", "");

            TeamMember member = teamService.addMember(teamId, expertId, role, specialization, user);
            return ResponseEntity.ok(ApiResponse.success("Membre ajouté avec succès", member));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/{teamId}/send-to-oec")
    public ResponseEntity<ApiResponse> sendTeamToOEC(@PathVariable Long teamId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow();

            String compositionSheet = body.getOrDefault("compositionSheet", "Fiche composition équipe FOR 26");
            EvaluationTeam team = teamService.sendToOEC(teamId, compositionSheet, user);
            return ResponseEntity.ok(ApiResponse.success("Équipe envoyée à l'OEC pour validation", team));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/members/{memberId}/sign")
    public ResponseEntity<ApiResponse> signAgreements(@PathVariable Long memberId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow();

            Boolean hasConflict = (Boolean) body.getOrDefault("hasConflictOfInterest", false);
            String conflictDetails = (String) body.getOrDefault("conflictDetails", "");

            TeamMember member = teamService.signAgreements(memberId, hasConflict, conflictDetails, user);
            return ResponseEntity.ok(ApiResponse.success("Engagements signés avec succès", member));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/teams/{teamId}/oec-response")
    public ResponseEntity<ApiResponse> oecTeamResponse(@PathVariable Long teamId, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User user = userRepository.findById(userId).orElseThrow();

            Boolean validated = (Boolean) body.get("validated");
            String recusationReason = (String) body.get("recusationReason");
            @SuppressWarnings("unchecked")
            List<Number> recusedIds = (List<Number>) body.get("recusedMemberIds");
            Long[] recusedMemberIds = recusedIds != null ? recusedIds.stream().map(Number::longValue).toArray(Long[]::new) : null;

            EvaluationTeam team = teamService.oecResponse(teamId, validated, recusedMemberIds, recusationReason, user);
            return ResponseEntity.ok(ApiResponse.success(validated ? "Équipe validée" : "Récusation enregistrée", team));
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

    @PostMapping("/documentary-review/start")
    public ResponseEntity<ApiResponse> startDocumentaryReview(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
            EvaluationTeam team = teams.isEmpty() ? null : teams.get(0);

            DocumentaryReview review = DocumentaryReview.builder()
                    .request(request).team(team)
                    .documentationSentToTeam(LocalDateTime.now())
                    .reviewStartDate(LocalDateTime.now())
                    .status(DocumentaryReviewStatus.IN_PROGRESS)
                    .build();
            docReviewRepository.save(review);

            request.setStatus(RequestStatus.DOCUMENTARY_REVIEW);
            request.setCurrentStep("Revue documentaire en cours");
            request.setPendingWith("Équipe d'évaluation");
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Revue documentaire démarrée", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/documentary-review/{id}/report-deficiency")
    public ResponseEntity<ApiResponse> reportDeficiency(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            DocumentaryReview review = docReviewRepository.findById(id).orElseThrow();
            review.setDeficienciesIdentified(true);
            review.setDeficienciesDetails(body.get("details"));
            review.setStatus(DocumentaryReviewStatus.DEFICIENCIES_FOUND);
            docReviewRepository.save(review);

            AccreditationRequest request = review.getRequest();
            request.setStatus(RequestStatus.DOCUMENTARY_REVIEW_DEFICIENCIES);
            request.setCurrentStep("Insuffisances identifiées dans la revue documentaire");
            request.setPendingWith("OEC");
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Insuffisances signalées", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/documentary-review/{id}/complete")
    public ResponseEntity<ApiResponse> completeDocumentaryReview(@PathVariable Long id) {
        try {
            DocumentaryReview review = docReviewRepository.findById(id).orElseThrow();
            review.setReviewCompletionDate(LocalDateTime.now());
            review.setStatus(DocumentaryReviewStatus.COMPLETED_NO_ISSUES);
            docReviewRepository.save(review);

            AccreditationRequest request = review.getRequest();
            request.setStatus(RequestStatus.DOCUMENTARY_REVIEW_COMPLETED);
            request.setCurrentStep("Revue documentaire complétée");
            request.setPendingWith("RA");
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Revue documentaire complétée", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/documentary-review/by-request/{requestId}")
    public ResponseEntity<?> getDocReviewByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(docReviewRepository.findByRequest_Id(requestId));
    }

    // ========== EVALUATION PLAN (STEP 6) ==========

    @PostMapping("/evaluation-plan/create")
    public ResponseEntity<ApiResponse> createEvaluationPlan(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);

            String planCode = "PLAN-" + Year.now().getValue() + "-" + String.format("%03d", new Random().nextInt(999));

            EvaluationPlan plan = EvaluationPlan.builder()
                    .request(request)
                    .team(teams.isEmpty() ? null : teams.get(0))
                    .planCode(planCode)
                    .dailyProgram((String) body.get("dailyProgram"))
                    .activityDistribution((String) body.get("activityDistribution"))
                    .schedules((String) body.get("schedules"))
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

    @PostMapping("/evaluation-plan/{id}/validate")
    public ResponseEntity<ApiResponse> validateEvaluationPlan(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow();
            Boolean approved = (Boolean) body.getOrDefault("approved", true);

            if (approved) {
                plan.setValidatedByCD(true);
                plan.setCdValidationDate(LocalDateTime.now());
                plan.setStatus(EvaluationPlanStatus.VALIDATED);

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
            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow();
            plan.setSentToOEC(LocalDateTime.now());
            plan.setStatus(EvaluationPlanStatus.SENT_TO_OEC);
            evalPlanRepository.save(plan);

            AccreditationRequest request = plan.getRequest();
            request.setStatus(RequestStatus.EVALUATION_PLANNED);
            request.setCurrentStep("Plan d'évaluation envoyé à l'OEC");
            requestRepository.save(request);

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

            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            User member = userRepository.findById(memberId).orElseThrow();

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

            MissionOrder order = missionOrderRepository.findById(id).orElseThrow();
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

            MissionOrder order = missionOrderRepository.findById(id).orElseThrow();
            order.setApprovedByDG(true);
            order.setDgApprovalDate(LocalDateTime.now());
            order.setStatus(MissionOrderStatus.FULLY_APPROVED);
            missionOrderRepository.save(order);

            return ResponseEntity.ok(ApiResponse.success("Ordre de mission approuvé par DG", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/mission-orders/{id}/send-to-member")
    public ResponseEntity<ApiResponse> sendMissionOrderToMember(@PathVariable Long id) {
        try {
            MissionOrder order = missionOrderRepository.findById(id).orElseThrow();
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
            User author = userRepository.findById(userId).orElseThrow();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();

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
            EvaluationNote note = noteRepository.findById(id).orElseThrow();
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
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();

            String gapCode = "FOR02-" + Year.now().getValue() + "-" + String.format("%03d", new Random().nextInt(999));

            Gap gap = Gap.builder()
                    .request(request)
                    .gapCode(gapCode)
                    .type(GapType.valueOf((String) body.getOrDefault("type", "NON_CRITIQUE")))
                    .description((String) body.get("description"))
                    .requirement((String) body.get("requirement"))
                    .evidence((String) body.get("evidence"))
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
            Gap gap = gapRepository.findById(id).orElseThrow();

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
            Gap gap = gapRepository.findById(id).orElseThrow();
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

    // ========== EVALUATION REPORT (STEP 9-10) ==========

    @PostMapping("/reports/create")
    public ResponseEntity<ApiResponse> createReport(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            Long requestId = ((Number) body.get("requestId")).longValue();
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
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
            EvaluationReport report = reportRepository.findById(id).orElseThrow();
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
            EvaluationReport report = reportRepository.findById(id).orElseThrow();
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
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();

            String meetingCode = "CAS-" + Year.now().getValue() + "-" + String.format("%03d", new Random().nextInt(999));

            CASMeeting meeting = CASMeeting.builder()
                    .request(request)
                    .meetingCode(meetingCode)
                    .meetingDate(LocalDateTime.parse((String) body.get("meetingDate")))
                    .location((String) body.getOrDefault("location", "ALGERAC - Salle CAS"))
                    .agenda((String) body.get("agenda"))
                    .dossierSummary((String) body.get("dossierSummary"))
                    .status(CASMeetingStatus.PLANNED)
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

    @PostMapping("/cas/{meetingId}/vote")
    public ResponseEntity<ApiResponse> castVote(@PathVariable Long meetingId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User voter = userRepository.findById(userId).orElseThrow();

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow();

            CASVote vote = CASVote.builder()
                    .meeting(meeting).voter(voter)
                    .vote(body.get("vote"))
                    .justification(body.get("justification"))
                    .notes(body.get("notes"))
                    .attendanceConfirmed(true)
                    .build();
            casVoteRepository.save(vote);

            return ResponseEntity.ok(ApiResponse.success("Vote enregistré", vote));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/cas/{meetingId}/decide")
    public ResponseEntity<ApiResponse> makeCASDecision(@PathVariable Long meetingId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow();
            meeting.setFinalDecision(body.get("decision"));
            meeting.setPresidentNotes(body.get("presidentNotes"));
            meeting.setStatus(CASMeetingStatus.DECIDED);
            casMeetingRepository.save(meeting);

            AccreditationRequest request = meeting.getRequest();
            String decision = body.get("decision");
            if ("ACCORDER".equals(decision)) {
                request.setStatus(RequestStatus.CAS_DECISION_GRANT);
            } else if ("REFUSER".equals(decision)) {
                request.setStatus(RequestStatus.CAS_DECISION_REFUSAL);
            } else {
                request.setStatus(RequestStatus.CAS_DECISION_POSTPONEMENT);
            }
            request.setCasDecisionDate(LocalDateTime.now());
            request.setCurrentStep("Décision CAS : " + decision);
            requestRepository.save(request);

            return ResponseEntity.ok(ApiResponse.success("Décision CAS enregistrée", meeting));
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
    public ResponseEntity<ApiResponse> startEvaluation(@PathVariable Long requestId) {
        try {
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
            request.setStatus(RequestStatus.EVALUATION_IN_PROGRESS);
            request.setEvaluationStartDate(LocalDateTime.now());
            request.setCurrentStep("Évaluation en cours");
            request.setPendingWith("Équipe d'évaluation");
            requestRepository.save(request);
            return ResponseEntity.ok(ApiResponse.success("Évaluation démarrée", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/evaluation/complete/{requestId}")
    public ResponseEntity<ApiResponse> completeEvaluation(@PathVariable Long requestId) {
        try {
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow();
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
            long assignedCount = requestRepository.findByAssignedToRa_Id(ra.getId()).size();
            map.put("assignedDossiers", assignedCount);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ========== HELPER ==========
    
    private ResponseEntity<ApiResponse> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
    }
}
