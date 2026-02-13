package com.algerac.service;

import com.algerac.model.AccreditationRequest;
import com.algerac.model.Notification;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.NotificationRepository;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public void notifyChefDepartmentNewRequest(AccreditationRequest request) {
        List<User> chefsDepartement = userRepository.findByRole(UserRole.CD);
        
        for (User cd : chefsDepartement) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Nouvelle demande à traiter")
                    .message(String.format("La demande %s de %s nécessite une attribution de numéro et une assignation à un RA.",
                            request.getReferenceNumber() != null ? request.getReferenceNumber() : "en attente",
                            request.getOec().getOrganizationName()))
                    .type("info")
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            notificationRepository.save(notification);
        }
        
        log.info("Notification envoyée aux chefs de département pour la demande {}", request.getReferenceNumber());
    }
    
    @Transactional
    public void notifyRAAssignment(AccreditationRequest request) {
        User ra = request.getAssignedToRa();
        if (ra == null) return;
        
        Notification notification = Notification.builder()
                .user(ra)
                .title("Nouvelle demande assignée")
                .message(String.format("La demande %s de %s vous a été assignée pour étude de recevabilité.",
                        request.getReferenceNumber(),
                        request.getOec().getOrganizationName()))
                .type("info")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification envoyée au RA {} pour la demande {}", ra.getFullName(), request.getReferenceNumber());
    }
    
    @Transactional
    public void notifyOECReceivabilityDecision(AccreditationRequest request, boolean isReceivable) {
        User oec = request.getOec();
        
        String title = isReceivable ? "Demande recevable" : "Demande non recevable";
        String message = isReceivable 
                ? String.format("Votre demande %s a été déclarée recevable. Elle passera prochainement à l'étape de planification.",
                        request.getReferenceNumber())
                : String.format("Votre demande %s a été déclarée non recevable. Raison : %s",
                        request.getReferenceNumber(),
                        request.getReceivabilityComments());
        
        Notification notification = Notification.builder()
                .user(oec)
                .title(title)
                .message(message)
                .type(isReceivable ? "success" : "warning")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification de décision de recevabilité envoyée à l'OEC {} pour la demande {}", 
                oec.getOrganizationName(), request.getReferenceNumber());
    }
    
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }
    
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }
    
    // ===== NOUVELLES MÉTHODES DE NOTIFICATION =====
    
    @Transactional
    public void notifyOECReceivabilityPositive(AccreditationRequest request) {
        User oec = request.getOec();
        
        Notification notification = Notification.builder()
                .user(oec)
                .title("Demande recevable")
                .message(String.format("Votre demande %s a été déclarée recevable. " +
                        "Le responsable d'accréditation va maintenant préparer le devis et la convention.",
                        request.getReferenceNumber()))
                .type("success")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification positive de recevabilité envoyée à l'OEC {} pour la demande {}", 
                oec.getOrganizationName(), request.getReferenceNumber());
    }
    
    @Transactional
    public void notifyOECReceivabilityNegative(AccreditationRequest request, String reason) {
        User oec = request.getOec();
        
        Notification notification = Notification.builder()
                .user(oec)
                .title("Demande non recevable")
                .message(String.format("Votre demande %s a été déclarée non recevable. " +
                        "Raison : %s. Veuillez consulter votre compte pour plus de détails.",
                        request.getReferenceNumber(), reason))
                .type("error")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification négative de recevabilité envoyée à l'OEC {} pour la demande {}", 
                oec.getOrganizationName(), request.getReferenceNumber());
    }
    
    @Transactional
    public void notifyDAGNewQuotation(com.algerac.model.Quotation quotation) {
        List<User> dags = userRepository.findByRole(UserRole.valueOf("DAG"));
        
        for (User dag : dags) {
            Notification notification = Notification.builder()
                    .user(dag)
                    .title("Nouveau devis à approuver")
                    .message(String.format("Le devis %s pour la demande %s nécessite votre approbation.",
                            quotation.getQuotationNumber(),
                            quotation.getRequest().getReferenceNumber()))
                    .type("info")
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            notificationRepository.save(notification);
        }
        
        log.info("Notification envoyée aux DAG pour le devis {}", quotation.getQuotationNumber());
    }
    
    @Transactional
    public void notifyRAQuotationApproved(com.algerac.model.Quotation quotation) {
        User ra = quotation.getPreparedByRa();
        
        Notification notification = Notification.builder()
                .user(ra)
                .title("Devis approuvé")
                .message(String.format("Votre devis %s a été approuvé par le DAG. " +
                        "Vous pouvez maintenant l'envoyer à l'OEC avec la convention.",
                        quotation.getQuotationNumber()))
                .type("success")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification d'approbation de devis envoyée au RA {} pour le devis {}", 
                ra.getFullName(), quotation.getQuotationNumber());
    }
    
    @Transactional
    public void notifyOECQuotationAndConvention(AccreditationRequest request) {
        User oec = request.getOec();
        
        Notification notification = Notification.builder()
                .user(oec)
                .title("Devis et convention disponibles")
                .message(String.format("Le devis et la convention pour votre demande %s sont disponibles. " +
                        "Veuillez les consulter et les valider.",
                        request.getReferenceNumber()))
                .type("info")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification de devis et convention envoyée à l'OEC {} pour la demande {}", 
                oec.getOrganizationName(), request.getReferenceNumber());
    }
    
    @Transactional
    public void notifyRAQuotationValidatedByOEC(com.algerac.model.Quotation quotation) {
        User ra = quotation.getPreparedByRa();
        
        Notification notification = Notification.builder()
                .user(ra)
                .title("Devis validé par l'OEC")
                .message(String.format("Le devis %s a été validé par l'OEC %s.",
                        quotation.getQuotationNumber(),
                        quotation.getRequest().getOec().getOrganizationName()))
                .type("success")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification de validation de devis par OEC envoyée au RA {}", ra.getFullName());
    }
}
