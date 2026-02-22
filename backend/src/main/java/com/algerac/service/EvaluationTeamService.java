package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
     * CD/RA transmet la composition de l'équipe à l'OEC (FOR 26)
     */
    @Transactional
    public EvaluationTeam sendToOEC(Long teamId, String compositionSheet, User currentUser) {
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
     * OEC valide ou récuse la composition de l'équipe
     */
    @Transactional
    public EvaluationTeam oecResponse(Long teamId, Boolean validated, Long[] recusedMemberIds, 
                                     String recusationReason, User currentUser) {
        EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
        
        AccreditationRequest request = team.getRequest();
        
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Seul l'OEC concerné peut répondre");
        }
        
        if (validated) {
            team.setOecValidated(true);
            team.setHasRecusation(false);
            team.setFinalValidationDate(LocalDateTime.now());
            team.setStatus(TeamStatus.VALIDATED);
            
            request.setStatus(RequestStatus.TEAM_VALIDATED);
            request.setCurrentStep("Équipe validée - revue documentaire");
            request.setPendingWith("CD/RA");
        } else {
            // OEC récuse des membres
            team.setHasRecusation(true);
            team.setRecusationReason(recusationReason);
            team.setRecusationDate(LocalDateTime.now());
            team.setRecusationDecision(RecusationDecision.PENDING);
            team.setStatus(TeamStatus.RECUSED);
            
            // Marquer les membres récusés
            if (recusedMemberIds != null) {
                for (Long memberId : recusedMemberIds) {
                    TeamMember member = memberRepository.findById(memberId)
                            .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
                    member.setRecusedByOEC(true);
                    member.setRecusationReason(recusationReason);
                    memberRepository.save(member);
                }
            }
            
            request.setStatus(RequestStatus.TEAM_RECUSED);
            request.setCurrentStep("Membre(s) récusé(s) - remplacement nécessaire");
            request.setPendingWith("ALGERAC/CD");
        }
        
        team = teamRepository.save(team);
        requestRepository.save(request);
        
        // Notifier CD/RA
        notificationService.notifyCDTeamResponse(request, validated, recusationReason);
        
        log.info("Réponse OEC équipe : {} pour {}", validated ? "VALIDÉE" : "RÉCUSÉE", 
                team.getTeamCode());
        return team;
    }
    
    /**
     * ALGERAC examine la récusation (PRO 22)
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
            team.setRecusationDecision(RecusationDecision.ACCEPTED);
            team.setRecusationDecisionReason(decisionReason);
            team.setStatus(TeamStatus.DRAFT); // Retour en constitution pour remplacer les membres
            
            AccreditationRequest request = team.getRequest();
            request.setStatus(RequestStatus.TEAM_DESIGNATION);
            request.setCurrentStep("Remplacement des membres récusés");
            requestRepository.save(request);
        } else {
            team.setRecusationDecision(RecusationDecision.REJECTED);
            team.setRecusationDecisionReason(decisionReason);
            team.setStatus(TeamStatus.VALIDATED); // Équipe maintenue
            
            AccreditationRequest request = team.getRequest();
            request.setStatus(RequestStatus.TEAM_VALIDATED);
            request.setCurrentStep("Équipe maintenue - revue documentaire");
            requestRepository.save(request);
        }
        
        team = teamRepository.save(team);
        
        // Notifier l'OEC de la décision
        notificationService.notifyOECRecusationDecision(team.getRequest(), accepted, decisionReason);
        
        log.info("Décision récusation : {} pour équipe {}", 
                accepted ? "ACCEPTÉE" : "REJETÉE", team.getTeamCode());
        return team;
    }
}
