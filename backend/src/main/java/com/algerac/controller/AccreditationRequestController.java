package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.AssignRequestDTO;
import com.algerac.dto.NewRequestDTO;
import com.algerac.dto.ReceivabilityDecisionDTO;
import com.algerac.model.AccreditationRequest;
import com.algerac.model.Payment;
import com.algerac.model.PaymentStatus;
import com.algerac.model.RequestStatus;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.UserRepository;
import com.algerac.service.NotificationService;
import com.algerac.service.PaymentService;
import com.algerac.service.PdfGenerationService;
import com.algerac.service.QuotationService;
import com.algerac.service.RequestService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@Slf4j
public class AccreditationRequestController {
    
    private final RequestService requestService;
    private final PaymentService paymentService;
    private final QuotationService quotationService;
    private final UserRepository userRepository;
    private final RequestRepository requestRepository;
    private final NotificationService notificationService;
    private final PdfGenerationService pdfGenerationService;
    
    @GetMapping
    public ResponseEntity<List<AccreditationRequest>> getAllRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        User caller = userId == null ? null : userRepository.findById(userId).orElse(null);

        List<AccreditationRequest> all = requestService.getAllRequests();

        // CD scoping: a CD only sees requests explicitly assigned to them.
        // Other staff roles keep full visibility. OEC should not reach this endpoint
        // in practice (they use /my-requests).
        if (caller != null && caller.getRole() == UserRole.CD) {
            final Long callerCdId = caller.getId();
            all = all.stream()
                    .filter(r -> r.getAssignedToCd() != null && r.getAssignedToCd().getId().equals(callerCdId))
                    .toList();
        }
        return ResponseEntity.ok(all);
    }
    
    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }

        List<AccreditationRequest> requests = requestService.getRequestsByOec(userId);
        // OEC black-box: strip staff identifiers from responses.
        List<Map<String, Object>> masked = requests.stream().map(r -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("referenceNumber", r.getReferenceNumber());
            m.put("type", r.getType());
            m.put("domain", r.getDomain());
            m.put("description", r.getDescription());
            m.put("status", r.getStatus());
            m.put("progress", r.getProgress());
            m.put("submissionDate", r.getSubmissionDate());
            m.put("createdAt", r.getCreatedAt());
            m.put("currentPhase", r.getCurrentPhase());
            m.put("currentStep", r.getCurrentStep());
            m.put("nextAction", r.getNextAction());
            m.put("pendingWith", r.getPendingWith());
            m.put("isReceivable", r.getIsReceivable());
            m.put("receivabilityComments", r.getReceivabilityComments());
            m.put("receivabilityCorrectionNeeded", r.getReceivabilityCorrectionNeeded());
            m.put("correctionDeadline", r.getCorrectionDeadline());
            m.put("assignmentDate", r.getAssignmentDate());
            m.put("dtReviewComments", r.getDtReviewComments());
            return m;
        }).toList();
        return ResponseEntity.ok(masked);
    }
    
    @GetMapping("/assigned-to-me")
    public ResponseEntity<?> getRequestsAssignedToMe(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        List<AccreditationRequest> requests = requestService.getRequestsAssignedToRa(userId);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AccreditationRequest>> getRequestsByStatus(
            @PathVariable RequestStatus status,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        User caller = userId == null ? null : userRepository.findById(userId).orElse(null);
        if (userId != null) {
            log.info("User {} fetching requests with status {}", userId, status);
        }
        List<AccreditationRequest> results = requestService.getRequestsByStatus(status);
        // CD scoping: a CD only sees requests explicitly assigned to them.
        if (caller != null && caller.getRole() == UserRole.CD) {
            final Long callerCdId = caller.getId();
            results = results.stream()
                    .filter(r -> r.getAssignedToCd() != null && r.getAssignedToCd().getId().equals(callerCdId))
                    .toList();
        }
        return ResponseEntity.ok(results);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getRequest(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        User caller = userId == null ? null : userRepository.findById(userId).orElse(null);
        return requestService.getRequest(id)
                .map(request -> {
                    // CD can only see requests assigned to them
                    if (caller != null && caller.getRole() == UserRole.CD) {
                        if (request.getAssignedToCd() == null || !request.getAssignedToCd().getId().equals(caller.getId())) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN).<AccreditationRequest>build();
                        }
                    }
                    return ResponseEntity.ok(request);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Détails complets d'une demande (inclut les infos d'inscription OEC)
     */
    @GetMapping("/{id}/full-details")
    public ResponseEntity<?> getRequestFullDetails(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        }
        
        Optional<AccreditationRequest> optRequest = requestService.getRequest(id);
        if (optRequest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        AccreditationRequest request = optRequest.get();
        User oecUser = request.getOec();
        User caller = userRepository.findById(userId).orElse(null);

        // CD can only see requests explicitly assigned to them
        if (caller != null && caller.getRole() == UserRole.CD) {
            if (request.getAssignedToCd() == null || !request.getAssignedToCd().getId().equals(caller.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Accès refusé"));
            }
        }

        boolean isOecCaller = caller != null && caller.getRole() == UserRole.OEC;

        java.util.Map<String, Object> details = new java.util.LinkedHashMap<>();
        if (isOecCaller) {
            // Black-box: OEC must not see which staff is handling their dossier.
            // Serialize the request as a map and strip all personnel pointers.
            java.util.Map<String, Object> req = new java.util.LinkedHashMap<>();
            req.put("id", request.getId());
            req.put("referenceNumber", request.getReferenceNumber());
            req.put("type", request.getType());
            req.put("domain", request.getDomain());
            req.put("description", request.getDescription());
            req.put("status", request.getStatus());
            req.put("progress", request.getProgress());
            req.put("submissionDate", request.getSubmissionDate());
            req.put("createdAt", request.getCreatedAt());
            req.put("currentPhase", request.getCurrentPhase());
            req.put("currentStep", request.getCurrentStep());
            req.put("nextAction", request.getNextAction());
            req.put("isReceivable", request.getIsReceivable());
            req.put("receivabilityComments", request.getReceivabilityComments());
            req.put("receivabilityCorrectionNeeded", request.getReceivabilityCorrectionNeeded());
            req.put("correctionDeadline", request.getCorrectionDeadline());
            req.put("assignmentDate", request.getAssignmentDate());
            req.put("evaluationStartDate", request.getEvaluationStartDate());
            req.put("evaluationEndDate", request.getEvaluationEndDate());
            req.put("certificateIssueDate", request.getCertificateIssueDate());
            req.put("certificateExpirationDate", request.getCertificateExpirationDate());
            if (oecUser != null) {
                java.util.Map<String, Object> oecRef = new java.util.LinkedHashMap<>();
                oecRef.put("id", oecUser.getId());
                oecRef.put("email", oecUser.getEmail());
                oecRef.put("fullName", oecUser.getFullName());
                oecRef.put("organizationName", oecUser.getOrganizationName());
                req.put("oec", oecRef);
            }
            // Intentionally: no assignedToRa, no pendingWith, no staff identifiers
            details.put("request", req);
        } else {
            details.put("request", request);
        }
        
        // Infos OEC complètes
        if (oecUser != null) {
            java.util.Map<String, Object> oecProfile = new java.util.LinkedHashMap<>();
            oecProfile.put("id", oecUser.getId());
            oecProfile.put("organizationName", oecUser.getOrganizationName());
            oecProfile.put("typeOrganisme", oecUser.getTypeOrganisme());
            oecProfile.put("adresseSiege", oecUser.getAdresseSiege());
            oecProfile.put("email", oecUser.getEmail());
            oecProfile.put("phone", oecUser.getPhone());
            oecProfile.put("nomRepresentant", oecUser.getNomRepresentant());
            oecProfile.put("fonction", oecUser.getFonction());
            oecProfile.put("telephoneDirect", oecUser.getTelephoneDirect());
            oecProfile.put("emailProfessionnel", oecUser.getEmailProfessionnel());
            oecProfile.put("porteeAccreditation", oecUser.getPorteeAccreditation());
            oecProfile.put("typeDemande", oecUser.getTypeDemande());
            oecProfile.put("documentsJson", oecUser.getDocumentsJson());
            details.put("oecProfile", oecProfile);
        }
        
        return ResponseEntity.ok(details);
    }

    /**
     * OEC: Créer une nouvelle demande
     */
    @PostMapping("/new")
    public ResponseEntity<ApiResponse> createNewRequest(
            @Valid @RequestBody NewRequestDTO dto,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            AccreditationRequest request = requestService.createNewRequest(dto, currentUser);
            return ResponseEntity.ok(ApiResponse.success(
                    "Demande créée avec succès",
                    request
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * OEC: Soumettre une demande (après remplissage du formulaire)
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse> submitRequest(
            @PathVariable Long id,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            AccreditationRequest request = requestService.submitRequest(id, currentUser);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Demande soumise avec succès. La Direction Technique va vérifier vos documents.",
                    request
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * OEC: Soumettre une demande avec paiement automatique (workflow simplifié)
     * Crée et complète automatiquement le paiement
     */
    @PostMapping("/{id}/submit-with-payment")
    public ResponseEntity<ApiResponse> submitRequestWithAutomaticPayment(
            @PathVariable Long id,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            // Soumettre la demande
            AccreditationRequest request = requestService.submitRequest(id, currentUser);
            
            // Créer ou récupérer le paiement
            Payment payment;
            try {
                payment = paymentService.createRegistrationFeePayment(request.getId());
            } catch (RuntimeException e) {
                // Si le paiement existe déjà, le récupérer
                if (e.getMessage().contains("existe déjà")) {
                    var payments = paymentService.getPaymentsByRequest(request.getId());
                    if (!payments.isEmpty()) {
                        payment = paymentService.getPaymentById(payments.get(0).getId());
                    } else {
                        throw e;
                    }
                } else {
                    throw e;
                }
            }
            
            // Marquer le paiement comme complété automatiquement (simulation)
            if (payment.getStatus() != PaymentStatus.COMPLETED) {
                String transactionId = "AUTO-" + System.currentTimeMillis();
                @SuppressWarnings("deprecation")
                Payment processed = paymentService.processPayment(payment.getId(), "SIMULATION", transactionId);
                payment = processed;
            }
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Demande soumise avec succès et paiement simulé. La demande sera assignée à un responsable.",
                    request
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // ========== DT: DOCUMENT REVIEW ==========
    
    /**
     * DT: Récupérer les demandes en attente de vérification
     */
    @GetMapping("/pending-dt-review")
    public ResponseEntity<?> getPendingDTReview(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return unauthorized();
        
        List<AccreditationRequest> requests = requestService.getRequestsByStatus(RequestStatus.PENDING_DT_REVIEW);
        return ResponseEntity.ok(requests);
    }
    
    /**
     * DT: Vérifier les documents d'une demande (approuver ou rejeter)
     */
    @PostMapping("/{id}/dt-review")
    public ResponseEntity<ApiResponse> dtReviewRequest(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (currentUser.getRole() != UserRole.DT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Seul le DT peut vérifier les documents"));
            }
            
            boolean approved = Boolean.TRUE.equals(body.get("approved"));
            String comments = (String) body.getOrDefault("comments", "");
            
            AccreditationRequest request = requestService.dtReviewRequest(id, approved, comments, currentUser);

            // Nouvel OEC : créer immédiatement les frais d'enregistrement pour le DAG
            // (même écran que les OEC existants, discriminant is_new_oec).
            if (approved && Boolean.TRUE.equals(request.getIsNewOec())) {
                try {
                    paymentService.createRegistrationFeePayment(request.getId());
                } catch (Exception paymentEx) {
                    log.warn("Paiement frais d'enregistrement déjà existant ou erreur (demande {}): {}",
                            request.getId(), paymentEx.getMessage());
                }
            }
            
            String message = approved 
                    ? "Documents validés. La demande a été transmise au Chef de Département."
                    : "Documents rejetés. L'OEC a été notifié des corrections à apporter.";
            
            return ResponseEntity.ok(ApiResponse.success(message, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * DT: after validating, pick the department + a specific CD that will own
     * the request. Body: { "departmentId": Long, "cdId": Long }.
     */
    @PostMapping("/{id}/dt-assign-cd")
    public ResponseEntity<ApiResponse> dtAssignCd(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Long departmentId = body.get("departmentId") == null ? null : ((Number) body.get("departmentId")).longValue();
            Long cdId = body.get("cdId") == null ? null : ((Number) body.get("cdId")).longValue();
            String comments = (String) body.getOrDefault("comments", null);
            if (departmentId == null || cdId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("departmentId et cdId requis"));
            }
            AccreditationRequest req = requestService.dtAssignRequestToCd(id, departmentId, cdId, comments, currentUser);
            return ResponseEntity.ok(ApiResponse.success("Demande assignée au CD", req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * RA: assign the final accreditation reference (AC/<domain>/<seq>/<year>).
     * Before this call the request only has a sequential number.
     */
    @PostMapping("/{id}/assign-final-reference")
    public ResponseEntity<ApiResponse> assignFinalReference(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            AccreditationRequest req = requestService.assignFinalAccreditationReference(id, currentUser);
            return ResponseEntity.ok(ApiResponse.success("Référence d'accréditation attribuée", req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC: Resoumettre après rejet DT
     */
    @PostMapping("/{id}/resubmit-after-dt")
    public ResponseEntity<ApiResponse> resubmitAfterDTRejection(
            @PathVariable Long id,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            AccreditationRequest request = requestService.resubmitAfterDTRejection(id, currentUser);
            return ResponseEntity.ok(ApiResponse.success(
                    "Demande resoumise avec succès. La Direction Technique va vérifier vos documents corrigés.",
                    request
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * CD: Assigner à un RA
     */
    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse> assignRequestToRA(
            @PathVariable Long id,
            @Valid @RequestBody AssignRequestDTO dto,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            AccreditationRequest request = requestService.assignRequestToRA(id, dto, currentUser);
            
            // Créer le paiement en attente de fixation des frais par le DAG
            try {
                paymentService.createRegistrationFeePayment(request.getId());
            } catch (Exception paymentEx) {
                log.warn("Paiement déjà existant ou erreur: {}", paymentEx.getMessage());
            }
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Demande assignée au RA. Le DAG a été notifié pour fixer les frais d'enregistrement.",
                    request
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Attribuer un numéro de référence à une demande
     */
    @PostMapping("/{id}/set-reference")
    public ResponseEntity<ApiResponse> setReferenceNumber(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            String referenceNumber = body.get("referenceNumber");
            if (referenceNumber == null || referenceNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Le numéro de référence est requis"));
            }
            
            AccreditationRequest request = requestService.setReferenceNumberByRA(id, referenceNumber.trim(), currentUser);
            return ResponseEntity.ok(ApiResponse.success(
                    "Numéro de référence attribué avec succès",
                    request
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Refuser un dossier fraîchement assigné, avec motif obligatoire.
     * Le dossier repart chez le CD pour réassignation à un autre RA.
     */
    @PostMapping("/{id}/refuse-assignment")
    public ResponseEntity<ApiResponse> refuseAssignment(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }

            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String reason = body.get("reason");
            AccreditationRequest request = requestService.refuseAssignment(id, reason, currentUser);
            return ResponseEntity.ok(ApiResponse.success(
                    "Dossier refusé. Le Chef de Département a été notifié pour réassignation.",
                    request
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * RA: Commencer l'étude de recevabilité
     */
    @PostMapping("/{id}/start-study")
    public ResponseEntity<ApiResponse> startReceivabilityStudy(
            @PathVariable Long id,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            AccreditationRequest request = requestService.startReceivabilityStudy(id, currentUser);
            return ResponseEntity.ok(ApiResponse.success(
                    "Étude de recevabilité commencée",
                    request
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Prendre une décision de recevabilité
     */
    @PostMapping("/{id}/receivability-decision")
    public ResponseEntity<ApiResponse> makeReceivabilityDecision(
            @PathVariable Long id,
            @Valid @RequestBody ReceivabilityDecisionDTO dto,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            AccreditationRequest request = requestService.makeReceivabilityDecision(id, dto, currentUser);
            return ResponseEntity.ok(ApiResponse.success(
                    "Décision de recevabilité enregistrée avec succès",
                    request
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== STEP 1.5: CD REVIEW OF RECEIVABILITY STUDY ==========

    /**
     * CD: Valider ou demander des modifications sur l'étude de recevabilité du RA
     */
    @PostMapping("/{id}/cd-review-receivability")
    public ResponseEntity<ApiResponse> cdReviewReceivability(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (currentUser.getRole() != UserRole.CD) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Seul le CD peut valider l'étude de recevabilité"));
            }
            
            boolean approved = Boolean.TRUE.equals(body.get("approved"));
            String comments = (String) body.getOrDefault("comments", "");
            
            AccreditationRequest request = requestService.cdReviewReceivability(id, approved, comments, currentUser);
            
            String message = approved 
                    ? "Étude de recevabilité approuvée. La décision a été communiquée à l'OEC."
                    : "Modifications demandées au RA.";
            
            return ResponseEntity.ok(ApiResponse.success(message, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== STEP 2: RESOURCE CHECK ==========

    /**
     * RA: Vérifie la disponibilité des ressources (évaluateurs/experts qualifiés)
     */
    @PostMapping("/{id}/resource-check")
    public ResponseEntity<ApiResponse> resourceCheck(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            boolean resourcesAvailable = body.containsKey("resourcesAvailable") && 
                    Boolean.TRUE.equals(body.get("resourcesAvailable"));
            boolean foreignExpertNeeded = body.containsKey("foreignExpertNeeded") && 
                    Boolean.TRUE.equals(body.get("foreignExpertNeeded"));
            
            request.setCurrentStep("resource_check_completed");
            
            if (!resourcesAvailable && foreignExpertNeeded) {
                request.setNextAction("OEC doit accepter ou refuser l'expert étranger (+coûts supplémentaires)");
                request.setPendingWith("OEC");
                request.setCurrentPhase("RECEVABILITE");
            } else if (resourcesAvailable) {
                request.setNextAction("Vérification délai réalisation");
                request.setPendingWith("RA");
            }
            
            requestRepository.save(request);
            return ResponseEntity.ok(ApiResponse.success("Vérification des ressources enregistrée", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC: Accepte ou refuse l'expert étranger (+coûts)
     */
    @PostMapping("/{id}/foreign-expert-response")
    public ResponseEntity<ApiResponse> foreignExpertResponse(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            boolean accepted = body.containsKey("accepted") && Boolean.TRUE.equals(body.get("accepted"));
            
            if (accepted) {
                request.setNextAction("Vérification délai réalisation");
                request.setPendingWith("RA");
                requestRepository.save(request);
                return ResponseEntity.ok(ApiResponse.success("Expert étranger accepté", request));
            } else {
                request.setStatus(RequestStatus.CLOSED);
                request.setNextAction("Dossier classé - OEC a refusé l'expert étranger");
                request.setPendingWith(null);
                request.setProgress(100);
                requestRepository.save(request);
                return ResponseEntity.ok(ApiResponse.success("Dossier classé", request));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== STEP 2: PRELIMINARY VISIT ==========

    /**
     * RA: Décide si visite préliminaire nécessaire
     */
    @PostMapping("/{id}/preliminary-visit-decision")
    public ResponseEntity<ApiResponse> preliminaryVisitDecision(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            boolean visitRequired = body.containsKey("visitRequired") && 
                    Boolean.TRUE.equals(body.get("visitRequired"));
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            request.setPreliminaryVisitRequired(visitRequired);
            
            if (visitRequired) {
                request.setStatus(RequestStatus.PRELIMINARY_VISIT_PROPOSED);
                request.setNextAction("OEC doit accepter ou refuser la visite préliminaire");
                request.setPendingWith("OEC");
                request.setCurrentStep("preliminary_visit_proposed");
                notificationService.notifyOECPreliminaryVisitProposed(request);
            } else {
                request.setCurrentStep("prepare_dg_validation");
                request.setNextAction("Préparer dossier pour validation DG");
                request.setPendingWith("RA");
            }
            
            requestRepository.save(request);
            return ResponseEntity.ok(ApiResponse.success(
                    visitRequired ? "Visite préliminaire proposée à l'OEC" : "Pas de visite préliminaire nécessaire",
                    request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC: Répond à la proposition de visite préliminaire
     */
    @PostMapping("/{id}/preliminary-visit-response")
    public ResponseEntity<ApiResponse> preliminaryVisitResponse(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            boolean accepted = body.containsKey("accepted") && Boolean.TRUE.equals(body.get("accepted"));
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            request.setPreliminaryVisitAccepted(accepted);
            
            if (accepted) {
                request.setStatus(RequestStatus.PRELIMINARY_VISIT_ACCEPTED);
                request.setNextAction("Planifier la visite préliminaire");
                request.setPendingWith("CD");
                request.setCurrentStep("preliminary_visit_accepted");
            } else {
                request.setStatus(RequestStatus.PRELIMINARY_VISIT_DECLINED);
                request.setCurrentStep("prepare_dg_validation");
                request.setNextAction("Préparer dossier pour validation DG");
                request.setPendingWith("RA");
            }
            
            requestRepository.save(request);
            notificationService.notifyCDPreliminaryVisitResponse(request, accepted);
            return ResponseEntity.ok(ApiResponse.success(
                    accepted ? "Visite préliminaire acceptée" : "Visite préliminaire refusée", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD/RA: Soumet rapport visite préliminaire (FOR 12) - délai 10 jours
     */
    @PostMapping("/{id}/preliminary-visit-report")
    public ResponseEntity<ApiResponse> submitPreliminaryVisitReport(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            boolean hasBlockingElements = body.containsKey("hasBlockingElements") && 
                    Boolean.TRUE.equals(body.get("hasBlockingElements"));
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            request.setStatus(RequestStatus.PRELIMINARY_VISIT_COMPLETED);
            request.setCurrentStep("preliminary_visit_report_submitted");
            
            if (hasBlockingElements) {
                request.setStatus(RequestStatus.PROCESS_SUSPENDED_OBSTACLES);
                request.setNextAction("OEC doit lever les obstacles identifiés");
                request.setPendingWith("OEC");
            } else {
                request.setCurrentStep("prepare_dg_validation");
                request.setNextAction("Préparer dossier pour validation DG");
                request.setPendingWith("RA");
            }
            
            requestRepository.save(request);
            notificationService.notifyOECPreliminaryVisitReport(request, hasBlockingElements);
            return ResponseEntity.ok(ApiResponse.success("Rapport de visite soumis", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC: Notifie la levée des obstacles
     */
    @PostMapping("/{id}/lift-obstacles")
    public ResponseEntity<ApiResponse> liftObstacles(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            request.setCurrentStep("prepare_dg_validation");
            request.setNextAction("Préparer dossier pour validation DG");
            request.setPendingWith("RA");
            request.setStatus(RequestStatus.RECEIVABILITY_STUDY);
            
            requestRepository.save(request);
            notificationService.notifyCDObstaclesLifted(request);
            return ResponseEntity.ok(ApiResponse.success("Obstacles levés, dossier relancé", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== STEP 2: DG VALIDATION ==========

    /**
     * RA: Prépare le dossier pour validation DG
     */
    @PostMapping("/{id}/prepare-dg-validation")
    public ResponseEntity<ApiResponse> prepareDGValidation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            String summary = (String) body.getOrDefault("summary", "");
            request.setReceivabilityComments(summary);
            request.setCurrentStep("awaiting_dg_validation");
            request.setNextAction("En attente de validation DG");
            request.setPendingWith("DG");
            
            requestRepository.save(request);
            
            // Notify DG 
            List<User> dgUsers = userRepository.findByRole(UserRole.DG);
            for (User dg : dgUsers) {
                notificationService.createNotification(
                    dg.getId(), 
                    "Dossier en attente de validation",
                    "Le dossier " + request.getReferenceNumber() + " est prêt pour votre validation de recevabilité.",
                    "ACTION_REQUIRED"
                );
            }
            
            return ResponseEntity.ok(ApiResponse.success("Dossier transmis à la DG pour validation", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * DG: Valide la demande comme recevable
     */
    @PostMapping("/{id}/dg-validate-receivability")
    public ResponseEntity<ApiResponse> dgValidateReceivability(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (currentUser.getRole() != UserRole.DG) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Seule la DG peut valider la recevabilité"));
            }
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            request.setStatus(RequestStatus.RECEIVABLE);
            request.setIsReceivable(true);
            request.setReceivabilityDecisionDate(java.time.LocalDateTime.now());
            request.setProgress(55);
            request.setCurrentPhase("RECEVABILITE_VALIDEE");
            request.setCurrentStep("dg_validated");
            request.setNextAction("RA notifie OEC + envoie synthèse au CD");
            request.setPendingWith("RA");
            
            requestRepository.save(request);
            
            // Notify RA
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Demande validée par la DG",
                    "La demande " + request.getReferenceNumber() + " a été validée comme recevable par la DG. Veuillez notifier l'OEC et envoyer une synthèse au CD.",
                    "INFO"
                );
            }
            
            return ResponseEntity.ok(ApiResponse.success("Demande validée comme recevable par la DG", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * RA: Notifie l'OEC que le dossier est recevable + envoie synthèse au CD
     */
    @PostMapping("/{id}/notify-receivable")
    public ResponseEntity<ApiResponse> notifyReceivable(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            String synthesis = (String) body.getOrDefault("synthesis", "");
            
            request.setCurrentPhase("CONTRACTUALISATION");
            request.setCurrentStep("quotation_preparation");
            request.setNextAction("Établir le devis (FOR 48)");
            request.setPendingWith("RA");
            request.setProgress(60);
            
            requestRepository.save(request);
            
            // Notify OEC
            notificationService.notifyOECReceivabilityPositive(request);
            
            // Notify CD with synthesis
            List<User> cdUsers = userRepository.findByRole(UserRole.CD);
            for (User cd : cdUsers) {
                notificationService.createNotification(
                    cd.getId(),
                    "Synthèse recevabilité — " + request.getReferenceNumber(),
                    "Synthèse du RA: " + synthesis,
                    "INFO"
                );
            }
            
            return ResponseEntity.ok(ApiResponse.success("OEC notifié et synthèse envoyée au CD", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD: Classe un dossier (fin de procédure)
     */
    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse> closeDossier(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            String reason = (String) body.getOrDefault("reason", "Classé par le CD");
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            request.setStatus(RequestStatus.CLOSED);
            request.setProgress(100);
            request.setCurrentPhase("CLOTURE");
            request.setCurrentStep("closed");
            request.setNextAction("Dossier classé: " + reason);
            request.setPendingWith(null);
            
            requestRepository.save(request);
            
            // Notify OEC
            notificationService.createNotification(
                request.getOec().getId(),
                "Dossier classé",
                "Votre dossier " + request.getReferenceNumber() + " a été classé. Motif: " + reason,
                "WARNING"
            );
            
            return ResponseEntity.ok(ApiResponse.success("Dossier classé", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== STEP 3: CONTRACTUALISATION HELPERS ==========

    /**
     * RA: Demande la validation de devis + convention par le CD
     * Le CD validera et enverra à l'OEC, ou demandera des modifications
     */
    @PostMapping("/{id}/send-quotation-convention-to-oec")
    public ResponseEntity<ApiResponse> sendQuotationConventionToOEC(
            @PathVariable Long id,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            // Redirect: this now requests CD validation instead of sending directly to OEC
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            quotationService.requestCDValidation(id, currentUser);
            
            return ResponseEntity.ok(ApiResponse.success("Demande de validation envoyée au CD"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC: Valide (ou refuse) conjointement le devis et la convention.
     *
     * Body fields:
     *  - accepted: Boolean — the OEC accepts BOTH the quote and the convention.
     *    (If false: the OEC is refusing; see the other flags.)
     *  - conventionSigned: Boolean — must be true when accepted=true.
     *  - scopeReductionRequested: Boolean — on refusal, ask for a reduced-scope
     *    quote. The RA will produce a new quotation.
     *  - scopeReductionNote: String — free-text description of what to drop.
     *  - finalRejection: Boolean — refusal without scope reduction. Closes the dossier.
     *
     * Payment is NOT created here anymore. It is initiated on the day of the
     * evaluation (see workflow step 7).
     */
    @PostMapping("/{id}/oec-validate-quotation")
    public ResponseEntity<ApiResponse> oecValidateQuotation(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();

            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

            if (body == null) body = java.util.Map.of();
            boolean accepted = Boolean.TRUE.equals(body.get("accepted"));
            boolean conventionSigned = Boolean.TRUE.equals(body.get("conventionSigned"));
            boolean scopeReduction = Boolean.TRUE.equals(body.get("scopeReductionRequested"));
            boolean finalRejection = Boolean.TRUE.equals(body.get("finalRejection"));
            String scopeNote = (String) body.getOrDefault("scopeReductionNote", "");

            if (accepted) {
                // The OEC must accept BOTH the quote and the convention — or neither.
                if (!conventionSigned) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(
                            "La convention doit être signée en même temps que l'acceptation du devis."));
                }
                request.setStatus(RequestStatus.QUOTATION_VALIDATED);
                request.setNextAction("Constitution de l'équipe d'évaluation");
                request.setPendingWith("RA");
                request.setCurrentPhase("CONSTITUTION_EQUIPE");
                request.setCurrentStep("team_designation");
                request.setProgress(Math.max(request.getProgress() == null ? 0 : request.getProgress(), 35));

                requestRepository.save(request);

                if (request.getAssignedToRa() != null) {
                    notificationService.createNotification(
                            request.getAssignedToRa().getId(),
                            "Devis et convention acceptés",
                            "L'OEC a accepté le devis ET la convention pour " + request.getReferenceNumber() +
                                    ". Le paiement sera effectué le jour de l'évaluation.",
                            "INFO");
                }
                return ResponseEntity.ok(ApiResponse.success("Devis et convention acceptés. Le paiement sera demandé le jour de l'évaluation.", request));
            }

            // Refusal path.
            if (scopeReduction) {
                request.setStatus(RequestStatus.QUOTATION_PREPARATION);
                request.setNextAction("RA prépare un nouveau devis avec une portée réduite");
                request.setPendingWith("RA");
                request.setCurrentPhase("DEVIS");
                request.setCurrentStep("scope_reduction_requested");
                requestRepository.save(request);
                if (request.getAssignedToRa() != null) {
                    notificationService.createNotification(
                            request.getAssignedToRa().getId(),
                            "Réduction de portée demandée",
                            "L'OEC " + (request.getOec() != null ? request.getOec().getOrganizationName() : "") +
                                    " demande une réduction de portée : " + scopeNote,
                            "WARNING");
                }
                return ResponseEntity.ok(ApiResponse.success("Demande de réduction de portée transmise au RA", request));
            }

            // Plain refusal (either first refusal without scope reduction, or second refusal) → close dossier.
            request.setStatus(RequestStatus.CLOSED);
            request.setNextAction("Dossier classé suite au refus du devis");
            request.setPendingWith(null);
            request.setCurrentPhase("CLOSED");
            request.setCurrentStep("dossier_closed_quote_refused");
            requestRepository.save(request);
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(
                        request.getAssignedToRa().getId(),
                        finalRejection ? "Dossier classé (refus définitif)" : "Dossier classé (refus du devis)",
                        "Le dossier " + request.getReferenceNumber() + " a été classé suite au refus du devis par l'OEC.",
                        "WARNING");
            }
            return ResponseEntity.ok(ApiResponse.success("Dossier classé suite au refus du devis.", request));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC: Soumet réponse aux manquements documentaires
     */
    @PostMapping("/{id}/documentary-response")
    public ResponseEntity<ApiResponse> documentaryResponse(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            request.setStatus(RequestStatus.DOCUMENTARY_REVIEW);
            request.setNextAction("CD évalue la réponse de l'OEC");
            request.setPendingWith("CD");
            request.setCurrentStep("oec_documentary_response_submitted");
            
            requestRepository.save(request);
            
            return ResponseEntity.ok(ApiResponse.success("Réponse aux manquements soumise", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC: Valide ou récuse l'équipe d'évaluation
     */
    @PostMapping("/{id}/team-validation")
    public ResponseEntity<ApiResponse> teamValidation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            boolean accepted = body.containsKey("accepted") && Boolean.TRUE.equals(body.get("accepted"));
            String recusationReason = (String) body.getOrDefault("recusationReason", "");
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            if (accepted) {
                request.setStatus(RequestStatus.TEAM_VALIDATED);
                request.setNextAction("Revue documentaire");
                request.setPendingWith("RA");
                request.setCurrentPhase("REVUE_DOCUMENTAIRE");
                request.setCurrentStep("documentary_review");
                request.setProgress(70);
            } else {
                request.setStatus(RequestStatus.TEAM_RECUSED);
                request.setNextAction("ALGERAC examine la récusation (PRO 22)");
                request.setPendingWith("CD");
                request.setCurrentStep("recusation_examination");
            }
            
            requestRepository.save(request);
            notificationService.notifyCDTeamResponse(request, accepted, recusationReason);
            
            return ResponseEntity.ok(ApiResponse.success(
                    accepted ? "Équipe validée" : "Récusation enregistrée", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get all requests pending DG validation
     */
    @GetMapping("/pending-dg-validation")
    public ResponseEntity<?> getPendingDGValidation(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
            
            List<AccreditationRequest> requests = requestRepository.findAll().stream()
                    .filter(r -> "awaiting_dg_validation".equals(r.getCurrentStep()))
                    .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private ResponseEntity<ApiResponse> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Non authentifié"));
    }

    /** Download the DOC1 PDF built from the request's submitted payload. */
    @GetMapping("/{id}/doc1.pdf")
    public ResponseEntity<?> downloadDoc1Pdf(@PathVariable Long id, HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();
        AccreditationRequest request = requestService.getRequest(id).orElse(null);
        if (request == null) return ResponseEntity.notFound().build();
        byte[] pdf = pdfGenerationService.generateAccreditationDoc1Pdf(request);
        String filename = "DOC1-" + (request.getReferenceNumber() != null ? request.getReferenceNumber().replace('/', '_') : "demande-" + id) + ".pdf";
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }

    /** Download the technical form PDF (FOR 04 / FOR 05 / FOR 06 / etc.). */
    @GetMapping("/{id}/technical-form.pdf")
    public ResponseEntity<?> downloadTechnicalFormPdf(@PathVariable Long id, HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();
        AccreditationRequest request = requestService.getRequest(id).orElse(null);
        if (request == null) return ResponseEntity.notFound().build();
        byte[] pdf = pdfGenerationService.generateAccreditationTechnicalFormPdf(request);
        String filename = "FORMS-" + (request.getReferenceNumber() != null ? request.getReferenceNumber().replace('/', '_') : "demande-" + id) + ".pdf";
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }

    // ─── PRO 26 : sites satellites ────────────────────────────────────────────────

    /** Liste des sites satellites d'une demande multisites. */
    @GetMapping("/{id}/satellite-sites")
    public ResponseEntity<?> listSatelliteSites(@PathVariable Long id, HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();
        return ResponseEntity.ok(ApiResponse.success("Sites satellites",
                requestService.listSatelliteSites(id)));
    }

    /**
     * PRO 26 §5.5-4 : l'OEC déclare la fermeture d'un site satellite.
     * Met à jour le statut → CLOSED et notifie le CD.
     */
    @PostMapping("/{id}/satellite-sites/{siteId}/close")
    public ResponseEntity<?> closeSatelliteSite(@PathVariable Long id,
                                                @PathVariable Long siteId,
                                                @RequestBody(required = false) Map<String, Object> body,
                                                HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return unauthorized();
        try {
            User user = userRepository.findById(userId).orElseThrow();
            String reason = body != null ? (String) body.get("reason") : null;
            return ResponseEntity.ok(ApiResponse.success("Site marqué comme fermé",
                    requestService.closeSatelliteSite(id, siteId, reason, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
