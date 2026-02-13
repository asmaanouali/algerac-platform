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
import com.algerac.repository.UserRepository;
import com.algerac.service.PaymentService;
import com.algerac.service.RequestService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@Slf4j
public class AccreditationRequestController {
    
    private final RequestService requestService;
    private final PaymentService paymentService;
    private final UserRepository userRepository;
    
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
            
            // Créer le paiement des frais d'enregistrement
            paymentService.createRegistrationFeePayment(request.getId());
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Demande soumise avec succès. Veuillez procéder au paiement.",
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
}
