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
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

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

            EvaluationTeam team = teamService.oecResponse(teamId, validated, recusedMemberIds, recusationReason, dateAccepted, oecProposedDate, dateRefusalReason, user);
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
            AccreditationRequest request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));
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
            DocumentaryReview review = docReviewRepository.findById(id).orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));
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
            DocumentaryReview review = docReviewRepository.findById(id).orElseThrow(() -> new RuntimeException("Revue documentaire non trouvée"));
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

    @PostMapping("/evaluation-plan/{id}/submit-to-ra")
    public ResponseEntity<ApiResponse> submitPlanToRA(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow(() -> new RuntimeException("Plan non trouvé"));
            plan.setStatus(EvaluationPlanStatus.SUBMITTED_TO_CD);
            evalPlanRepository.save(plan);

            // Notify the RA assigned to the request
            AccreditationRequest request = plan.getRequest();
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Plan d'évaluation FOR 32 soumis",
                    "Le REE a soumis le plan d'évaluation FOR 32 pour le dossier " + request.getReferenceNumber() + ". Veuillez le valider.",
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

    @PostMapping("/evaluation-plan/{id}/validate")
    public ResponseEntity<ApiResponse> validateEvaluationPlan(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow(() -> new RuntimeException("Plan d'évaluation non trouvé"));
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
            EvaluationPlan plan = evalPlanRepository.findById(id).orElseThrow(() -> new RuntimeException("Plan d'évaluation non trouvé"));
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

            CASMeeting meeting = casMeetingRepository.findById(meetingId).orElseThrow(() -> new RuntimeException("Réunion CAS non trouvée"));
            meeting.setFinalDecision(body.get("decision"));
            meeting.setPresidentNotes(body.get("presidentNotes"));
            meeting.setStatus(CASMeetingStatus.DECIDED);
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

            return ResponseEntity.ok(ApiResponse.success("Décision CAS enregistrée — le RA a été notifié pour transmission à l'OEC", meeting));
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

            // Notify OEC and transition request status
            if (decision.startsWith("ACCORDER")) {
                notificationService.notifyOECAccreditationGranted(request, com.algerac.model.CASDecisionType.GRANT_FULL, notes);
                request.setStatus(RequestStatus.CERTIFICATE_PREPARATION);
                request.setCurrentStep("Accréditation accordée — certificat en préparation");
            } else if ("REFUSER".equals(decision)) {
                notificationService.notifyOECAccreditationRefused(request, notes);
                request.setStatus(RequestStatus.CAS_DECISION_REFUSAL);
                request.setCurrentStep("Accréditation refusée — OEC informé");
            } else {
                notificationService.notifyOECAccreditationPostponed(request, notes);
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

            // Check that evaluation date has arrived
            List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
            if (!teams.isEmpty()) {
                EvaluationTeam team = teams.get(0);
                java.time.LocalDate evalDate = Boolean.TRUE.equals(team.getEvaluationDateAccepted())
                        ? team.getProposedEvaluationDate()
                        : (team.getOecProposedDate() != null ? team.getOecProposedDate() : team.getProposedEvaluationDate());
                if (evalDate != null && java.time.LocalDate.now().isBefore(evalDate)) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(
                            "Le dossier ne peut être déverrouillé qu'à partir de la date d'évaluation (" + evalDate + ")"));
                }
            }

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
