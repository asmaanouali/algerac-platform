package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluationReportService {
    
    private final EvaluationReportRepository reportRepository;
    private final RequestRepository requestRepository;
    private final NotificationService notificationService;
    
    /**
     * REE rédige le rapport d'évaluation (délai: 30 jours après clôture)
     */
    @Transactional
    public EvaluationReport createReport(Long requestId, String reportNumber, ReportType type,
                                        String contextAndObjectives, String teamComposition,
                                        String programRealized, String findingsByRequirement,
                                        String gapsSummary, String gapsStatus, String strengths,
                                        String improvementAreas, String conclusion, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        // Vérifier que l'utilisateur est bien le REE de l'équipe
        // (Cette vérification nécessiterait un lien avec EvaluationTeam)
        
        EvaluationReport report = EvaluationReport.builder()
                .request(request)
                .reportNumber(reportNumber)
                .type(type)
                .contextAndObjectives(contextAndObjectives)
                .teamComposition(teamComposition)
                .programRealized(programRealized)
                .findingsByRequirement(findingsByRequirement)
                .gapsSummary(gapsSummary)
                .gapsStatus(gapsStatus)
                .strengths(strengths)
                .improvementAreas(improvementAreas)
                .conclusionAndRecommendation(conclusion)
                .evaluationClosureDate(request.getEvaluationEndDate())
                .draftedByREE(LocalDateTime.now())
                .status(EvaluationReportStatus.DRAFT)
                .build();
        
        report = reportRepository.save(report);
        
        request.setStatus(RequestStatus.REPORT_DRAFTING);
        request.setCurrentStep("Rapport en rédaction");
        requestRepository.save(request);
        
        log.info("Rapport {} créé pour {}", reportNumber, request.getReferenceNumber());
        return report;
    }
    
    /**
     * REE soumet le rapport au CD pour validation
     */
    @Transactional
    public EvaluationReport submitToCD(Long reportId, User currentUser) {
        EvaluationReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
        
        report.setSubmittedToCD(LocalDateTime.now());
        report.setStatus(EvaluationReportStatus.SUBMITTED_TO_CD);
        report = reportRepository.save(report);
        
        AccreditationRequest request = report.getRequest();
        request.setStatus(RequestStatus.REPORT_VALIDATION);
        request.setCurrentStep("Rapport en validation par CD");
        request.setPendingWith("CD");
        requestRepository.save(request);
        
        // Notifier le CD
        notificationService.notifyCDReportSubmitted(request, report.getReportNumber());
        
        log.info("Rapport {} soumis au CD pour validation", report.getReportNumber());
        return report;
    }
    
    /**
     * CD/DT valide ou demande des corrections
     */
    @Transactional
    public EvaluationReport validateReport(Long reportId, Boolean validated, 
                                          String correctionRequests, String for23Content, User currentUser) {
        EvaluationReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
        
        AccreditationRequest request = report.getRequest();
        
        // Si CD = REE, DT doit valider
        boolean cdIsREE = false; // À déterminer selon la configuration
        
        if (!validated) {
            // Demander des corrections
            report.setCorrectionRequests(correctionRequests);
            report.setStatus(EvaluationReportStatus.CORRECTIONS_NEEDED);
            
            request.setCurrentStep("Rapport - corrections demandées");
            
            // Notifier le REE
            notificationService.notifyREECorrectionsNeeded(request, correctionRequests);
        } else {
            // Rapport validé
            report.setValidatedByCD(!cdIsREE);
            report.setValidatedByDT(cdIsREE);
            report.setValidationDate(LocalDateTime.now());
            report.setFOR23AppreciationSheet(for23Content);
            report.setStatus(EvaluationReportStatus.VALIDATED);
            
            request.setStatus(RequestStatus.REPORT_VALIDATED);
            request.setCurrentStep("Rapport validé - préparation CAS");
            request.setPendingWith("CD/RA");
        }
        
        report = reportRepository.save(report);
        requestRepository.save(request);
        
        log.info("Rapport {} : {}", report.getReportNumber(), 
                validated ? "VALIDÉ" : "CORRECTIONS DEMANDÉES");
        return report;
    }
    
    /**
     * REE corrige le rapport
     */
    @Transactional
    public EvaluationReport correctReport(Long reportId, String correctedContent, User currentUser) {
        EvaluationReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
        
        // Appliquer les corrections (mise à jour des champs concernés)
        report.setStatus(EvaluationReportStatus.SUBMITTED_TO_CD);
        report.setSubmittedToCD(LocalDateTime.now());
        
        report = reportRepository.save(report);
        
        // Notifier le CD que les corrections sont faites
        notificationService.notifyCDReportCorrected(report.getRequest(), report.getReportNumber());
        
        log.info("Rapport {} corrigé et resoumis", report.getReportNumber());
        return report;
    }
    
    /**
     * CD transmet le rapport au Département Consolidation
     */
    @Transactional
    public EvaluationReport sendToConsolidation(Long reportId, User currentUser) {
        EvaluationReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
        
        if (report.getStatus() != EvaluationReportStatus.VALIDATED) {
            throw new RuntimeException("Le rapport doit être validé avant transmission");
        }
        
        report.setSentToDeptConsolidation(LocalDateTime.now());
        report.setStatus(EvaluationReportStatus.SENT_TO_CONSOLIDATION);
        report = reportRepository.save(report);
        
        AccreditationRequest request = report.getRequest();
        request.setStatus(RequestStatus.CAS_PREPARATION);
        request.setCurrentStep("Préparation dossier pour CAS");
        requestRepository.save(request);
        
        log.info("Rapport {} transmis au Département Consolidation", report.getReportNumber());
        return report;
    }
}
