package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluationTeamService {
    
    private final EvaluationTeamRepository teamRepository;
    private final TeamMemberRepository memberRepository;
    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    /**
     * CD/RA désigne une équipe d'évaluation
     */
    @Transactional
    public EvaluationTeam createTeam(Long requestId, String teamCode, User currentUser) {
        if (currentUser.getRole() != UserRole.CD && currentUser.getRole() != UserRole.RA) {
            throw new RuntimeException("Seuls CD/RA peuvent créer une équipe");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        EvaluationTeam team = EvaluationTeam.builder()
                .request(request)
                .teamCode(teamCode)
                .status(TeamStatus.DRAFT)
                .build();
        
        team = teamRepository.save(team);
        
        request.setStatus(RequestStatus.TEAM_DESIGNATION);
        request.setCurrentStep("Constitution de l'équipe d'évaluation");
        request.setPendingWith("CD/RA");
        requestRepository.save(request);
        
        log.info("Équipe d'évaluation créée avec code {} pour {}", teamCode, request.getReferenceNumber());
        return team;
    }
    
    /**
     * Ajouter un membre à l'équipe
     */
    @Transactional
    public TeamMember addMember(Long teamId, Long expertId, TeamRole role, 
                               String specialization, User currentUser) {
        EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
        
        User expert = userRepository.findById(expertId)
                .orElseThrow(() -> new RuntimeException("Expert non trouvé"));
        
        List<UserRole> teamEligibleRoles = List.of(
            UserRole.EXPERT, UserRole.REE, UserRole.ET, UserRole.EQ,
            UserRole.EVALUATEUR, UserRole.FORMATEUR, UserRole.RA
        );
        if (!teamEligibleRoles.contains(expert.getRole())) {
            throw new RuntimeException("L'utilisateur doit avoir un rôle d'évaluation (REE, ET, EQ, EXPERT, etc.)");
        }
        
        TeamMember member = TeamMember.builder()
                .team(team)
                .expert(expert)
                .role(role)
                .specialization(specialization)
                .confidentialityAgreementSigned(false)
                .impartialityAgreementSigned(false)
                .conflictOfInterestDeclared(false)
                .available(true)
                .recusedByOEC(false)
                .build();
        
        member = memberRepository.save(member);
        
        // Notifier l'expert
        notificationService.notifyExpertTeamDesignation(expert, team.getRequest());
        
        log.info("Membre {} ajouté à l'équipe {} avec rôle {}", expert.getFullName(), 
                team.getTeamCode(), role);
        return member;
    }
    
    /**
     * Retirer un membre de l'équipe (avant envoi à l'OEC)
     */
    @Transactional
    public void removeMember(Long memberId, User currentUser) {
        TeamMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        
        EvaluationTeam team = member.getTeam();
        if (team.getStatus() != TeamStatus.DRAFT) {
            throw new RuntimeException("Impossible de supprimer un membre d'une équipe déjà envoyée");
        }
        
        memberRepository.delete(member);
        log.info("Membre {} retiré de l'équipe {} par {}", 
                member.getExpert().getFullName(), team.getTeamCode(), currentUser.getFullName());
    }
    
    /**
     * Expert signe les engagements de confidentialité et impartialité (FOR 01-1)
     */
    @Transactional
    public TeamMember signAgreements(Long memberId, Boolean hasConflictOfInterest, 
                                    String conflictDetails, User currentUser) {
        TeamMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        
        if (!member.getExpert().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Seul l'expert concerné peut signer");
        }
        
        member.setConfidentialityAgreementSigned(true);
        member.setImpartialityAgreementSigned(true);
        member.setConflictOfInterestDeclared(hasConflictOfInterest);
        member.setConflictOfInterestDetails(conflictDetails);
        
        if (hasConflictOfInterest) {
            member.setAvailable(false); // Expert non disponible à cause du conflit
        }
        
        member = memberRepository.save(member);
        
        // Notifier CD/RA
        notificationService.notifyCDAgreementSigned(member, hasConflictOfInterest);
        
        log.info("Engagements signés par {} pour l'équipe {}", 
                currentUser.getFullName(), member.getTeam().getTeamCode());
        return member;
    }
    
    /**
     * RA transmet la composition de l'équipe au CD pour validation (première étape)
     */
    @Transactional
    public EvaluationTeam sendToCD(Long teamId, String compositionSheet, LocalDate proposedEvaluationDate, User currentUser) {
        EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
        
        // Vérifier que tous les membres ont signé
        List<TeamMember> members = memberRepository.findByTeam_Id(teamId);
        boolean allSigned = members.stream()
                .allMatch(m -> m.getConfidentialityAgreementSigned() && 
                              m.getImpartialityAgreementSigned());
        
        if (!allSigned) {
            throw new RuntimeException("Tous les membres doivent avoir signé les engagements");
        }
        
        team.setCompositionSheetFOR26(compositionSheet);
        team.setProposedEvaluationDate(proposedEvaluationDate);
        team.setStatus(TeamStatus.SENT_TO_CD);
        team = teamRepository.save(team);
        
        AccreditationRequest request = team.getRequest();
        request.setStatus(RequestStatus.TEAM_SENT_TO_CD);
        request.setCurrentStep("Composition de l'équipe en attente de validation CD");
        request.setPendingWith("CD");
        requestRepository.save(request);
        
        // Notifier le CD
        notificationService.notifyCDTeamCompositionForReview(request);
        
        log.info("Composition d'équipe {} envoyée au CD pour validation", team.getTeamCode());
        return team;
    }
    
    /**
     * CD valide la composition et la date → envoie à l'OEC
     */
    @Transactional
    public EvaluationTeam cdApproveAndSendToOEC(Long teamId, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seul le CD peut approuver la composition");
        }
        
        EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
        
        team.setSentToOEC(LocalDateTime.now());
        team.setOecResponseDeadline(LocalDateTime.now().plusDays(3));
        team.setEvaluationDateAccepted(null);
        team.setStatus(TeamStatus.SENT_TO_OEC);
        team = teamRepository.save(team);
        
        AccreditationRequest request = team.getRequest();
        request.setStatus(RequestStatus.TEAM_SENT_TO_OEC);
        request.setCurrentStep("Équipe envoyée à l'OEC pour validation");
        request.setPendingWith("OEC");
        requestRepository.save(request);
        
        notificationService.notifyOECTeamComposition(request);
        
        log.info("CD a approuvé et envoyé la composition d'équipe {} à l'OEC", team.getTeamCode());
        return team;
    }
    
    /**
     * CD demande des changements au RA sur la composition
     */
    @Transactional
    public EvaluationTeam cdRequestChanges(Long teamId, String comments, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seul le CD peut demander des changements");
        }
        
        EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
        
        team.setStatus(TeamStatus.CD_CHANGES_REQUESTED);
        team.setRecusationDecisionReason(comments); // Reuse field for CD change request comments
        team = teamRepository.save(team);
        
        AccreditationRequest request = team.getRequest();
        request.setStatus(RequestStatus.TEAM_CD_CHANGES_REQUESTED);
        request.setCurrentStep("Le CD demande des modifications sur la composition");
        request.setPendingWith("RA");
        requestRepository.save(request);
        
        log.info("CD a demandé des changements sur la composition d'équipe {}", team.getTeamCode());
        return team;
    }
    
    /**
     * CD/RA transmet la composition de l'équipe à l'OEC (FOR 26) avec date d'évaluation proposée
     * (Legacy direct send, kept for backward compatibility)
     */
    @Transactional
    public EvaluationTeam sendToOEC(Long teamId, String compositionSheet, LocalDate proposedEvaluationDate, User currentUser) {
        EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
        
        // Vérifier que tous les membres ont signé
        List<TeamMember> members = memberRepository.findByTeam_Id(teamId);
        boolean allSigned = members.stream()
                .allMatch(m -> m.getConfidentialityAgreementSigned() && 
                              m.getImpartialityAgreementSigned());
        
        if (!allSigned) {
            throw new RuntimeException("Tous les membres doivent avoir signé les engagements");
        }
        
        team.setCompositionSheetFOR26(compositionSheet);
        team.setSentToOEC(LocalDateTime.now());
        team.setOecResponseDeadline(LocalDateTime.now().plusDays(3)); // 3 jours pour répondre
        team.setProposedEvaluationDate(proposedEvaluationDate);
        team.setEvaluationDateAccepted(null); // En attente réponse OEC
        team.setStatus(TeamStatus.SENT_TO_OEC);
        team = teamRepository.save(team);
        
        AccreditationRequest request = team.getRequest();
        request.setStatus(RequestStatus.TEAM_SENT_TO_OEC);
        request.setCurrentStep("Équipe envoyée à l'OEC pour validation");
        request.setPendingWith("OEC");
        requestRepository.save(request);
        
        // Notifier l'OEC
        notificationService.notifyOECTeamComposition(request);
        
        log.info("Composition d'équipe {} envoyée à l'OEC", team.getTeamCode());
        return team;
    }
    
    /**
     * OEC responds to team composition and evaluation date SEPARATELY:
     * - dateAccepted: whether OEC accepts the proposed date
     * - membersAccepted: whether OEC accepts all team members
     * - Can refuse date + accept members → RA changes date → resend
     * - Can accept date + recuse member → CD examines recusation
     */
    @Transactional
    public EvaluationTeam oecResponse(Long teamId, Boolean validated, Long[] recusedMemberIds, 
                                     String recusationReason, Boolean dateAccepted,
                                     LocalDate oecProposedDate, String dateRefusalReason,
                                     User currentUser) {
        EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
        
        AccreditationRequest request = team.getRequest();
        
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Seul l'OEC concerné peut répondre");
        }
        
        // Handle date acceptance
        if (dateAccepted != null) {
            team.setEvaluationDateAccepted(dateAccepted);
            if (!dateAccepted && oecProposedDate != null) {
                team.setOecProposedDate(oecProposedDate);
                team.setDateRefusalReason(dateRefusalReason);
            }
        }
        
        boolean membersAccepted = validated != null && validated;
        boolean hasRecusedMembers = recusedMemberIds != null && recusedMemberIds.length > 0;
        
        // Case 1: OEC accepts both date and members - fully validated
        if (membersAccepted && (dateAccepted == null || dateAccepted)) {
            team.setOecValidated(true);
            team.setHasRecusation(false);
            team.setFinalValidationDate(LocalDateTime.now());
            team.setStatus(TeamStatus.VALIDATED);
            
            request.setStatus(RequestStatus.TEAM_VALIDATED);
            request.setCurrentStep("Équipe validée - revue documentaire");
            request.setPendingWith("CD/RA");
        }
        // Case 2: OEC accepts members but refuses date → RA changes date
        else if (membersAccepted && dateAccepted != null && !dateAccepted) {
            team.setOecValidated(false);
            team.setHasRecusation(false);
            team.setStatus(TeamStatus.DATE_REFUSED);
            
            request.setStatus(RequestStatus.TEAM_DATE_REFUSED);
            request.setCurrentStep("OEC refuse la date - RA doit proposer nouvelle date");
            request.setPendingWith("RA");
        }
        // Case 3: OEC recuses member(s) - regardless of date → CD examines recusation
        else if (hasRecusedMembers) {
            team.setHasRecusation(true);
            team.setRecusationReason(recusationReason);
            team.setRecusationDate(LocalDateTime.now());
            team.setRecusationDecision(RecusationDecision.PENDING);
            team.setStatus(TeamStatus.MEMBER_RECUSED);
            
            // Mark recused members
            for (Long memberId : recusedMemberIds) {
                TeamMember member = memberRepository.findById(memberId)
                        .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
                member.setRecusedByOEC(true);
                member.setRecusationReason(recusationReason);
                memberRepository.save(member);
            }
            
            request.setStatus(RequestStatus.TEAM_MEMBER_RECUSED);
            request.setCurrentStep("Membre(s) récusé(s) - CD doit examiner la récusation");
            request.setPendingWith("CD");
        }
        // Fallback: validated=false with no specific recused members (legacy support)  
        else {
            team.setOecValidated(false);
            team.setHasRecusation(true);
            team.setRecusationReason(recusationReason);
            team.setRecusationDate(LocalDateTime.now());
            team.setRecusationDecision(RecusationDecision.PENDING);
            team.setStatus(TeamStatus.RECUSED);
            
            request.setStatus(RequestStatus.TEAM_RECUSED);
            request.setCurrentStep("Membre(s) récusé(s) - examen nécessaire");
            request.setPendingWith("CD");
        }
        
        team = teamRepository.save(team);
        requestRepository.save(request);
        
        // Notifier CD/RA
        notificationService.notifyCDTeamResponse(request, membersAccepted, recusationReason);
        
        log.info("Réponse OEC équipe : dateAccepted={}, membersAccepted={} pour {}", 
                dateAccepted, membersAccepted, team.getTeamCode());
        return team;
    }
    
    /**
     * CD examine la récusation (PRO 22):
     * - If accepted (valid recusation): RA must replace member, sign engagement, resend to CD
     * - If rejected (invalid recusation): team maintained, OEC notified that recusation is invalid
     */
    @Transactional
    public EvaluationTeam examineRecusation(Long teamId, Boolean accepted, 
                                           String decisionReason, User currentUser) {
        EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
        
        if (currentUser.getRole() != UserRole.CD && currentUser.getRole() != UserRole.DT) {
            throw new RuntimeException("Seuls CD/DT peuvent examiner la récusation");
        }
        
        if (accepted) {
            // Récusation valide → RA doit remplacer le membre récusé
            team.setRecusationDecision(RecusationDecision.ACCEPTED);
            team.setRecusationDecisionReason(decisionReason);
            team.setStatus(TeamStatus.DRAFT); // Retour en constitution pour remplacer les membres
            
            AccreditationRequest request = team.getRequest();
            request.setStatus(RequestStatus.TEAM_DESIGNATION);
            request.setCurrentStep("Remplacement du membre récusé - RA doit remplacer, faire signer et renvoyer au CD");
            request.setPendingWith("RA");
            requestRepository.save(request);
        } else {
            // Récusation non valide → équipe maintenue, notifier OEC
            team.setRecusationDecision(RecusationDecision.REJECTED);
            team.setRecusationDecisionReason(decisionReason);
            team.setStatus(TeamStatus.RECUSATION_INVALID);
            
            // Unmark recused members since recusation is invalid
            List<TeamMember> members = memberRepository.findByTeam_Id(teamId);
            for (TeamMember m : members) {
                if (m.getRecusedByOEC() != null && m.getRecusedByOEC()) {
                    m.setRecusedByOEC(false);
                    m.setRecusationReason(null);
                    memberRepository.save(m);
                }
            }
            
            // Move to validated - team maintained
            team.setOecValidated(true);
            team.setFinalValidationDate(LocalDateTime.now());
            
            AccreditationRequest request = team.getRequest();
            request.setStatus(RequestStatus.TEAM_RECUSATION_INVALID);
            request.setCurrentStep("Récusation jugée non valide - équipe maintenue");
            request.setPendingWith("CD/RA");
            requestRepository.save(request);
        }
        
        team = teamRepository.save(team);
        
        // Notifier l'OEC de la décision
        notificationService.notifyOECRecusationDecision(team.getRequest(), accepted, decisionReason);
        
        log.info("Décision récusation : {} pour équipe {}", 
                accepted ? "ACCEPTÉE (valide)" : "REJETÉE (non valide, équipe maintenue)", team.getTeamCode());
        return team;
    }
    
    /**
     * RA changes the proposed evaluation date (when OEC refused the date)
     */
    @Transactional
    public EvaluationTeam changeProposedDate(Long teamId, LocalDate newDate, User currentUser) {
        EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
        
        team.setProposedEvaluationDate(newDate);
        team.setEvaluationDateAccepted(null);
        team.setOecProposedDate(null);
        team.setDateRefusalReason(null);
        // Send back to CD for validation before sending to OEC again
        team.setStatus(TeamStatus.SENT_TO_CD);
        team = teamRepository.save(team);
        
        AccreditationRequest request = team.getRequest();
        request.setStatus(RequestStatus.TEAM_SENT_TO_CD);
        request.setCurrentStep("Nouvelle date proposée - en attente validation CD");
        request.setPendingWith("CD");
        requestRepository.save(request);
        
        log.info("RA a proposé une nouvelle date {} pour l'équipe {}", newDate, team.getTeamCode());
        return team;
    }
}
