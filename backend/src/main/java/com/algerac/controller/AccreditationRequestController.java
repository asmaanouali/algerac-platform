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
    
    @GetMapping
    public ResponseEntity<List<AccreditationRequest>> getAllRequests(HttpSession session) {
        // Optional: log if user is authenticated
        Long userId = (Long) session.getAttribute("userId");
        if (userId != null) {
            log.info("User {} fetching all requests", userId);
        }
        return ResponseEntity.ok(requestService.getAllRequests());
    }
    
    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        List<AccreditationRequest> requests = requestService.getRequestsByOec(userId);
        return ResponseEntity.ok(requests);
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
        // Optional: log if user is authenticated
        Long userId = (Long) session.getAttribute("userId");
        if (userId != null) {
            log.info("User {} fetching requests with status {}", userId, status);
        }
        return ResponseEntity.ok(requestService.getRequestsByStatus(status));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AccreditationRequest> getRequest(@PathVariable Long id) {
        return requestService.getRequest(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
            
            // Créer le paiement en attente de fixation des frais par le DAG
            paymentService.createRegistrationFeePayment(request.getId());
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Demande soumise avec succès. Le DAG va fixer les frais d'enregistrement de votre dossier.",
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
                paymentService.processPayment(payment.getId(), "SIMULATION", transactionId);
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
            return ResponseEntity.ok(ApiResponse.success(
                    "Demande assignée avec succès au RA",
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
     * OEC: Valide le devis, signe la convention
     */
    @PostMapping("/{id}/oec-validate-quotation")
    public ResponseEntity<ApiResponse> oecValidateQuotation(
            @PathVariable Long id,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return unauthorized();
            
            AccreditationRequest request = requestService.getRequest(id)
                    .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
            
            // Créer le paiement des frais d'évaluation (flux standardisé)
            // Le montant est celui fixé par le DAG lors de l'approbation du devis
            try {
                paymentService.createEvaluationFeePayment(id);
                
                // Mettre le dossier en attente de paiement des frais d'évaluation
                request.setStatus(RequestStatus.PENDING_PAYMENT);
                request.setNextAction("OEC doit payer les frais d'évaluation");
                request.setPendingWith("OEC");
                request.setCurrentPhase("PAIEMENT_EVALUATION");
                request.setCurrentStep("evaluation_fee_payment");
                request.setProgress(55);
            } catch (Exception e) {
                // Si le montant du devis n'est pas encore défini ou autre erreur,
                // on continue sans créer le paiement (workflow legacy)
                log.warn("Impossible de créer le paiement des frais d'évaluation pour {}: {}", 
                        request.getReferenceNumber(), e.getMessage());
                        
                request.setStatus(RequestStatus.QUOTATION_VALIDATED);
                request.setNextAction("Constitution de l'équipe d'évaluation");
                request.setPendingWith("RA");
                request.setCurrentPhase("CONSTITUTION_EQUIPE");
                request.setCurrentStep("team_designation");
                request.setProgress(90);
            }
            
            requestRepository.save(request);
            
            // Notify RA
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Devis validé par l'OEC",
                    "L'OEC a validé le devis et signé la convention pour " + request.getReferenceNumber() + ".",
                    "INFO"
                );
            }
            
            return ResponseEntity.ok(ApiResponse.success("Devis validé et convention signée", request));
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
}
