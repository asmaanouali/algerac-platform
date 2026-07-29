package com.algerac.service;

import com.algerac.model.AccreditationRequest;
import com.algerac.model.CASDecisionType;
import com.algerac.model.Notification;
import com.algerac.model.TeamMember;
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

    /**
     * Generic helper to create a notification for any user
     */
    @Transactional
    public void createNotification(Long userId, String title, String message, String type) {
        createNotification(userId, title, message, type, null);
    }

    @Transactional
    public void createNotification(Long userId, String title, String message, String type, String link) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("Cannot create notification: user {} not found", userId);
            return;
        }
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type != null ? type.toLowerCase() : "info")
                .link(link)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
        log.info("Notification created for user {}: {}", userId, title);
    }

    /**
     * Returns the frontend route for a notification recipient + request.
     */
    private String requestLink(User recipient, AccreditationRequest request) {
        if (recipient == null || request == null) return null;
        UserRole role = recipient.getRole();
        if (role == null) return null;
        Long id = request.getId();
        switch (role) {
            case OEC:            return "/oec/demandes/" + id;
            case RA:             return "/ra/dossiers/" + id;
            case CD:             return "/cd/demande/" + id;
            case DT:             return "/dt/demande/" + id;
            case DAG:            return "/dag/dashboard";
            case ADMIN:          return "/admin";
            case DG:             return "/dg/dashboard";
            case CAS_PRESIDENT:  return "/cas/president/dashboard";
            case CAS_MEMBER:     return "/cas/member/dashboard";
            case GES_COMPETENCES:return "/ges_competences/dashboard";
            case RQ:             return "/rq/dashboard";
            case SUP:            return "/sup/dashboard";
            case CONSOLIDATION:  return "/consolidation/dashboard";
            case FORMATEUR:      return "/dashboard";
            case EXPERT:
            case REE:
            case ET:
            case EQ:             return "/dashboard";
            default:             return null;
        }
    }
    
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
                    .link(requestLink(cd, request))
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
                .link(requestLink(ra, request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification envoyée au RA {} pour la demande {}", ra.getFullName(), request.getReferenceNumber());
    }

    @Transactional
    public void notifyCDRaRefused(AccreditationRequest request, String raName, String reason) {
        User cd = request.getAssignedToCd();
        if (cd == null) return;

        Notification notification = Notification.builder()
                .user(cd)
                .title("Dossier refusé par le RA")
                .message(String.format("%s a refusé le dossier %s de %s. Motif : %s. Veuillez réassigner ce dossier à un autre RA.",
                        raName,
                        request.getReferenceNumber(),
                        request.getOec().getOrganizationName(),
                        reason))
                .type("warning")
                .link(requestLink(cd, request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);
        log.info("Notification envoyée au CD {} : refus du RA {} pour la demande {}", cd.getFullName(), raName, request.getReferenceNumber());
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
                .link(requestLink(oec, request))
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
    
    /**
     * Notifier le CD qu'une étude de recevabilité est prête pour validation
     */
    @Transactional
    public void notifyCDReceivabilityStudyReady(AccreditationRequest request, String raName, boolean isReceivable) {
        List<User> chefsDepartement = userRepository.findByRole(UserRole.CD);
        String decision = isReceivable ? "RECEVABLE" : "NON RECEVABLE";
        
        for (User cd : chefsDepartement) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Étude de recevabilité à valider")
                    .message(String.format("Le RA %s a terminé l'étude de recevabilité du dossier %s (%s). " +
                            "Proposition : %s. Veuillez vérifier et valider.",
                            raName,
                            request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId(),
                            request.getOec().getOrganizationName(),
                            decision))
                    .type("action_required")
                    .link(requestLink(cd, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            notificationRepository.save(notification);
        }
        log.info("Notification CD: étude de recevabilité prête pour {} - proposition {}", request.getReferenceNumber(), decision);
    }
    
    /**
     * Notifier le RA du résultat de la revue CD de son étude de recevabilité
     */
    @Transactional
    public void notifyRAReceivabilityReviewResult(AccreditationRequest request, boolean approved, String cdComments) {
        User ra = request.getAssignedToRa();
        if (ra == null) return;
        
        String title = approved ? "Étude de recevabilité validée par le CD" : "Modifications demandées par le CD";
        String message = approved
                ? String.format("Votre étude de recevabilité pour le dossier %s a été approuvée par le CD. La décision a été communiquée à l'OEC.",
                        request.getReferenceNumber())
                : String.format("Le CD demande des modifications sur votre étude de recevabilité du dossier %s. Remarques : %s",
                        request.getReferenceNumber(),
                        cdComments != null ? cdComments : "Voir le dossier");
        
        Notification notification = Notification.builder()
                .user(ra)
                .title(title)
                .message(message)
                .type(approved ? "success" : "warning")
                .link(requestLink(ra, request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification RA {}: revue CD {} pour {}", ra.getFullName(), approved ? "approuvée" : "modifications", request.getReferenceNumber());
    }

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
                .link(requestLink(oec, request))
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
                .link(requestLink(oec, request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification négative de recevabilité envoyée à l'OEC {} pour la demande {}", 
                oec.getOrganizationName(), request.getReferenceNumber());
    }
    
    /**
     * Notifier le DAG qu'une nouvelle demande nécessite la fixation des frais d'enregistrement
     */
    @Transactional
    public void notifyDAGNewRequest(AccreditationRequest request) {
        List<User> dags = userRepository.findByRole(UserRole.valueOf("DAG"));
        
        for (User dag : dags) {
            Notification notification = Notification.builder()
                    .user(dag)
                    .title("Nouvelle demande - Frais à fixer")
                    .message(String.format("La demande de %s nécessite la fixation des frais d'enregistrement.",
                            request.getOec() != null ? request.getOec().getOrganizationName() : "OEC #" + request.getId()))
                    .type("action_required")
                    .link("/dag/frais-enregistrement")
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            notificationRepository.save(notification);
        }
        
        log.info("Notification envoyée aux DAG pour la nouvelle demande {}", request.getId());
    }
    
    /**
     * Notifier le DT qu'une nouvelle demande nécessite la vérification des documents
     */
    @Transactional
    public void notifyDTNewRequest(AccreditationRequest request) {
        List<User> dts = userRepository.findByRole(UserRole.DT);
        
        for (User dt : dts) {
            Notification notification = Notification.builder()
                    .user(dt)
                    .title("Nouvelle demande - Documents à vérifier")
                    .message(String.format("La demande %s de %s nécessite la vérification des documents.",
                            request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId(),
                            request.getOec() != null ? request.getOec().getOrganizationName() : "OEC"))
                    .type("action_required")
                    .link(requestLink(dt, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            notificationRepository.save(notification);
        }
        
        log.info("Notification envoyée aux DT pour la demande {}", request.getReferenceNumber());
    }
    
    /**
     * Notifier le CD après validation DT — la demande nécessite le choix d'un RA
     */
    @Transactional
    public void notifyCDAfterDTApproval(AccreditationRequest request) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        
        for (User cd : cds) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Demande validée par DT - RA à assigner")
                    .message(String.format("La demande %s de %s a été validée par la Direction Technique. Veuillez choisir un Responsable d'Accréditation.",
                            request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId(),
                            request.getOec() != null ? request.getOec().getOrganizationName() : "OEC"))
                    .type("action_required")
                    .link(requestLink(cd, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            notificationRepository.save(notification);
        }
        
        log.info("Notification envoyée aux CD après validation DT de la demande {}", request.getReferenceNumber());
    }

    /**
     * Notifier les ADMINs qu'un nouvel OEC (sans compte) a été validé par le DT
     * et qu'il faut désormais créer son compte utilisateur.
     */
    @Transactional
    public void notifyAdminCreateOECAccount(AccreditationRequest request) {
        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        User oec = request.getOec();
        String orgName = oec != null && oec.getOrganizationName() != null
                ? oec.getOrganizationName() : "OEC";
        String email = oec != null ? oec.getEmail() : "—";

        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .user(admin)
                    .title("Création de compte OEC requise")
                    .message(String.format(
                            "La demande %s du nouvel OEC %s (%s) a été validée par la Direction Technique. Veuillez créer le compte utilisateur correspondant.",
                            request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId(),
                            orgName,
                            email))
                    .type("action_required")
                    .link("/admin/utilisateurs-pending")
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);
        }

        log.info("Notification envoyée aux ADMIN pour création de compte OEC suite à validation DT (demande {})",
                request.getId());
    }

    /**
     * Notifier l'OEC que ses documents ont été rejetés par le DT
     */
    @Transactional
    public void notifyOECDTRejection(AccreditationRequest request, String comments) {
        User oec = request.getOec();
        if (oec == null) return;
        
        Notification notification = Notification.builder()
                .user(oec)
                .title("Documents à corriger")
                .message(String.format("Votre demande %s a été examinée par la Direction Technique. Des corrections sont nécessaires : %s",
                        request.getReferenceNumber(),
                        comments != null && !comments.isEmpty() ? comments : "Veuillez contacter ALGERAC pour plus de détails."))
                .type("action_required")
                .link(requestLink(oec, request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification de rejet DT envoyée à l'OEC {} pour la demande {}", 
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
                    .link("/dag/fixation-devis")
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
                .link("/ra/quotes")
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
                .link(requestLink(oec, request))
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
                .link(requestLink(ra, quotation.getRequest()))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification de validation de devis par OEC envoyée au RA {}", ra.getFullName());
    }
    
    @Transactional
    public void notifyRANewCorrections(AccreditationRequest request) {
        User ra = request.getAssignedToRa();
        if (ra == null) return;
        
        Notification notification = Notification.builder()
                .user(ra)
                .title("Corrections soumises par l'OEC")
                .message(String.format("L'OEC %s a soumis des corrections pour la demande %s. " +
                        "Veuillez réévaluer la recevabilité.",
                        request.getOec().getOrganizationName(),
                        request.getReferenceNumber()))
                .type("info")
                .link(requestLink(ra, request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notificationRepository.save(notification);
        log.info("Notification envoyée au RA {} pour corrections de la demande {}", 
                ra.getFullName(), request.getReferenceNumber());
    }
    
    // ===== NOTIFICATIONS VISITE PRÉLIMINAIRE =====
    
    @Transactional
    public void notifyOECPreliminaryVisitProposed(AccreditationRequest request) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Visite préliminaire proposée")
                .message(String.format("Une visite préliminaire est proposée pour votre demande %s. " +
                        "Veuillez indiquer si vous acceptez cette visite.",
                        request.getReferenceNumber()))
                .type("info")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyCDPreliminaryVisitResponse(AccreditationRequest request, Boolean accepted) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Réponse visite préliminaire")
                    .message(String.format("L'OEC a %s la visite préliminaire pour la demande %s.",
                            accepted ? "accepté" : "refusé",
                            request.getReferenceNumber()))
                    .type("info")
                    .link(requestLink(cd, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
    
    @Transactional
    public void notifyOECPreliminaryVisitScheduled(AccreditationRequest request, LocalDateTime date) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Visite préliminaire programmée")
                .message(String.format("La visite préliminaire pour votre demande %s est programmée le %s.",
                        request.getReferenceNumber(), date.toString()))
                .type("info")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyOECPreliminaryVisitReport(AccreditationRequest request, Boolean hasBlockingElements) {
        String title = hasBlockingElements ? "Obstacles identifiés lors de la visite" : "Rapport de visite disponible";
        String message = hasBlockingElements 
                ? String.format("Des obstacles bloquants ont été identifiés lors de la visite préliminaire pour %s. " +
                        "Veuillez les lever pour continuer le processus.", request.getReferenceNumber())
                : String.format("Le rapport de visite préliminaire pour %s est disponible.", request.getReferenceNumber());
        
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title(title)
                .message(message)
                .type(hasBlockingElements ? "warning" : "info")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyCDObstaclesLifted(AccreditationRequest request) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Obstacles levés")
                    .message(String.format("L'OEC a levé les obstacles pour la demande %s. " +
                            "Vous pouvez continuer le processus.", request.getReferenceNumber()))
                    .type("success")
                    .link(requestLink(cd, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
    
    // ===== NOTIFICATIONS ÉQUIPE D'ÉVALUATION =====
    
    @Transactional
    public void notifyExpertTeamDesignation(User expert, AccreditationRequest request) {
        Notification notification = Notification.builder()
                .user(expert)
                .title("Désignation équipe d'évaluation")
                .message(String.format("Vous avez été désigné pour faire partie de l'équipe d'évaluation " +
                        "pour la demande %s. Veuillez signer les engagements de confidentialité.",
                        request.getReferenceNumber()))
                .type("info")
                .link(requestLink(expert, request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyCDAgreementSigned(TeamMember member, Boolean hasConflict) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Engagements signés")
                    .message(String.format("%s a signé les engagements. Conflit d'intérêt: %s",
                            member.getExpert().getFullName(),
                            hasConflict ? "OUI" : "NON"))
                    .type(hasConflict ? "warning" : "success")
                    .link(requestLink(cd, member.getTeam().getRequest()))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
    
    @Transactional
    public void notifyOECTeamComposition(AccreditationRequest request) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Composition de l'équipe d'évaluation")
                .message(String.format("La composition de l'équipe d'évaluation pour %s est disponible. " +
                        "Veuillez la valider sous 3 jours.", request.getReferenceNumber()))
                .type("info")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyCDTeamCompositionForReview(AccreditationRequest request) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Composition d'équipe à valider")
                    .message(String.format("Le RA a soumis la composition de l'équipe d'évaluation et la date proposée pour %s. " +
                            "Veuillez valider et envoyer à l'OEC, ou demander des modifications.", request.getReferenceNumber()))
                    .type("info")
                    .link(requestLink(cd, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
    
    @Transactional
    public void notifyCDTeamResponse(AccreditationRequest request, Boolean validated, String reason) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            String message = validated 
                    ? String.format("L'OEC a validé l'équipe d'évaluation pour %s.", request.getReferenceNumber())
                    : String.format("L'OEC a récusé des membres de l'équipe pour %s. Motif: %s",
                            request.getReferenceNumber(), reason);
            
            Notification notification = Notification.builder()
                    .user(cd)
                    .title(validated ? "Équipe validée" : "Récusation de membres")
                    .message(message)
                    .type(validated ? "success" : "warning")
                    .link(requestLink(cd, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
    
    @Transactional
    public void notifyOECRecusationDecision(AccreditationRequest request, Boolean accepted, String reason) {
        String message = accepted
                ? String.format("Votre récusation pour %s a été acceptée. Les membres seront remplacés.",
                        request.getReferenceNumber())
                : String.format("Votre récusation pour %s a été rejetée. Motif: %s",
                        request.getReferenceNumber(), reason);
        
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Décision sur récusation")
                .message(message)
                .type("info")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    // ===== NOTIFICATIONS ÉCARTS ET PLANS D'ACTIONS =====
    
    @Transactional
    public void notifyOECActionPlansRequired(AccreditationRequest request, int gapCount) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Plans d'actions requis")
                .message(String.format("%d écart(s) ont été identifiés pour %s. " +
                        "Veuillez soumettre vos plans d'actions sous 10 jours.",
                        gapCount, request.getReferenceNumber()))
                .type("warning")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyTeamActionPlanSubmitted(AccreditationRequest request, String gapCode) {
        // Notifier l'équipe d'évaluation (REE et membres)
        // À implémenter selon la structure de l'équipe
    }
    
    @Transactional
    public void notifyOECActionPlanAccepted(AccreditationRequest request, String gapCode) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Plan d'action accepté")
                .message(String.format("Votre plan d'action pour l'écart %s de %s a été accepté. " +
                        "Veuillez procéder à la mise en œuvre.",
                        gapCode, request.getReferenceNumber()))
                .type("success")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyOECActionPlanRejected(AccreditationRequest request, String gapCode, String reason) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Plan d'action rejeté")
                .message(String.format("Votre plan d'action pour l'écart %s de %s a été rejeté. " +
                        "Motif: %s. Veuillez proposer un nouveau plan.",
                        gapCode, request.getReferenceNumber(), reason))
                .type("error")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyTeamEvidenceSubmitted(AccreditationRequest request, String gapCode) {
        // Notifier l'équipe que l'OEC a fourni des preuves
    }
    
    @Transactional
    public void notifyOECEvidenceInsufficient(AccreditationRequest request, String gapCode) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Preuves insuffisantes")
                .message(String.format("Les preuves fournies pour l'écart %s de %s sont insuffisantes. " +
                        "Veuillez fournir des compléments.",
                        gapCode, request.getReferenceNumber()))
                .type("warning")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyCDComplementaryEvalDecision(AccreditationRequest request, String gapCode) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Décision évaluation complémentaire")
                    .message(String.format("L'écart critique %s de %s nécessite une décision " +
                            "sur une éventuelle évaluation complémentaire.",
                            gapCode, request.getReferenceNumber()))
                    .type("info")
                    .link(requestLink(cd, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
    
    // ===== NOTIFICATIONS RAPPORT ET CAS =====
    
    @Transactional
    public void notifyCDReportSubmitted(AccreditationRequest request, String reportNumber) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Rapport soumis pour validation")
                    .message(String.format("Le rapport %s pour %s est disponible pour validation.",
                            reportNumber, request.getReferenceNumber()))
                    .type("info")
                    .link(requestLink(cd, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
    
    @Transactional
    public void notifyREECorrectionsNeeded(AccreditationRequest request, String corrections) {
        // Notifier le REE des corrections demandées
    }
    
    @Transactional
    public void notifyCDReportCorrected(AccreditationRequest request, String reportNumber) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            Notification notification = Notification.builder()
                    .user(cd)
                    .title("Rapport corrigé")
                    .message(String.format("Le rapport %s pour %s a été corrigé et resoumis.",
                            reportNumber, request.getReferenceNumber()))
                    .type("info")
                    .link(requestLink(cd, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
    
    @Transactional
    public void notifyCASMembersScheduled(AccreditationRequest request, LocalDateTime meetingDate) {
        // Notifier tous les membres du CAS de la réunion programmée
        List<User> casMembers = userRepository.findByRole(UserRole.CD);
        casMembers.addAll(userRepository.findByRole(UserRole.DT));
        
        for (User member : casMembers) {
            Notification notification = Notification.builder()
                    .user(member)
                    .title("Réunion CAS programmée")
                    .message(String.format("Une réunion CAS est programmée le %s pour la demande %s.",
                            meetingDate.toString(), request.getReferenceNumber()))
                    .type("info")
                    .link(requestLink(member, request))
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
    
    // ===== NOTIFICATIONS DÉCISIONS CAS =====

    @Transactional
    public void notifyRACASDecisionReceived(AccreditationRequest request, String decision) {
        User ra = request.getAssignedToRa();
        if (ra == null) return;
        Notification notification = Notification.builder()
                .user(ra)
                .title("Décision CAS reçue")
                .message(String.format("Le Président du CAS a rendu sa décision pour la demande %s : %s. " +
                        "Vous pouvez maintenant transmettre cette décision à l'OEC.",
                        request.getReferenceNumber(), decision))
                .type("info")
                .link(requestLink(ra, request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyOECAccreditationGranted(AccreditationRequest request, CASDecisionType type, String scope) {
        String title = "Accréditation accordée!";
        String message = String.format("Félicitations! Votre demande %s a été approuvée par le CAS. " +
                "Type: %s. Portée: %s",
                request.getReferenceNumber(), type, scope);
        
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title(title)
                .message(message)
                .type("success")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyOECAccreditationRefused(AccreditationRequest request, String reason) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Accréditation refusée")
                .message(String.format("Votre demande %s a été refusée par le CAS. Motif: %s. " +
                        "Vous avez un droit de recours.",
                        request.getReferenceNumber(), reason))
                .type("error")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyOECAccreditationPostponed(AccreditationRequest request, String reason) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Décision ajournée")
                .message(String.format("La décision pour %s a été ajournée. " +
                        "Compléments requis: %s",
                        request.getReferenceNumber(), reason))
                .type("warning")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyOECAccreditationMaintained(AccreditationRequest request) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Accréditation maintenue")
                .message(String.format("Votre accréditation pour %s a été maintenue suite à la surveillance.",
                        request.getReferenceNumber()))
                .type("success")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyOECAccreditationSuspended(AccreditationRequest request, String reason) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Accréditation suspendue")
                .message(String.format("Votre accréditation pour %s a été suspendue. Motif: %s",
                        request.getReferenceNumber(), reason))
                .type("error")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyOECAccreditationWithdrawn(AccreditationRequest request, String reason) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Accréditation retirée")
                .message(String.format("Votre accréditation pour %s a été retirée. Motif: %s",
                        request.getReferenceNumber(), reason))
                .type("error")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyOECScopeReduced(AccreditationRequest request, String newScope) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Portée réduite")
                .message(String.format("La portée de votre accréditation %s a été réduite. " +
                        "Nouvelle portée: %s",
                        request.getReferenceNumber(), newScope))
                .type("warning")
                .link(requestLink(request.getOec(), request))
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void notifyOECCertificateIssued(AccreditationRequest request, String certificateUrl) {
        Notification notification = Notification.builder()
                .user(request.getOec())
                .title("Certificat délivré")
                .message(String.format("Votre certificat d'accréditation pour %s est disponible.",
                        request.getReferenceNumber()))
                .type("success")
                .link("/oec/certificates")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
}
