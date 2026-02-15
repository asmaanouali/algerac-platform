package com.algerac.model;

public enum RequestStatus {
    // Phase initiale
    DRAFT,                              // Brouillon
    SUBMITTED,                          // Soumise par OEC
    PENDING_PAYMENT,                    // En attente de paiement
    PAYMENT_COMPLETED,                  // Paiement effectué, en attente d'assignation CD
    ASSIGNED_TO_RA,                     // Assignée à un RA par le CD
    
    // Phase recevabilité
    RECEIVABILITY_STUDY,                // En étude de recevabilité par RA
    RECEIVABLE,                         // Déclarée recevable
    NOT_RECEIVABLE,                     // Déclarée non recevable - OEC peut corriger
    RECEIVABILITY_CORRECTION,           // OEC en train de corriger
    RECEIVABILITY_RESUBMITTED,          // Re-soumise après correction
    
    // Visite préliminaire (optionnel)
    PRELIMINARY_VISIT_PROPOSED,         // Visite préliminaire proposée
    PRELIMINARY_VISIT_ACCEPTED,         // Visite acceptée par OEC
    PRELIMINARY_VISIT_DECLINED,         // Visite déclinée par OEC
    PRELIMINARY_VISIT_SCHEDULED,        // Visite programmée
    PRELIMINARY_VISIT_COMPLETED,        // Visite effectuée
    PRELIMINARY_VISIT_REPORT_PENDING,   // Rapport de visite en attente
    PROCESS_SUSPENDED_OBSTACLES,        // Processus suspendu - obstacles à lever
    
    // Contractualisation
    QUOTATION_PREPARATION,              // Préparation du devis par RA
    QUOTATION_SENT_TO_DAG,              // Devis envoyé au DAG (Directeur Administratif Général)
    QUOTATION_APPROVED_BY_DAG,          // Devis approuvé par DAG
    QUOTATION_SENT_TO_DEPT,             // Devis envoyé au Département Consolidation
    QUOTATION_RECEIVED_FROM_DEPT,       // Devis reçu du Département Consolidation
    QUOTATION_SENT_TO_OEC,              // Devis et convention envoyés à l'OEC
    QUOTATION_VALIDATED,                // Devis et convention validés par l'OEC
    QUOTATION_EXPIRED,                  // Délai dépassé, dossier classé
    
    // Constitution équipe
    TEAM_DESIGNATION,                   // Désignation de l'équipe d'évaluation
    TEAM_SENT_TO_OEC,                   // Composition équipe envoyée à OEC
    TEAM_RECUSED,                       // Membre(s) récusé(s) par OEC
    TEAM_VALIDATED,                     // Équipe validée par OEC
    
    // Revue documentaire
    DOCUMENTARY_REVIEW,                 // Revue documentaire en cours
    DOCUMENTARY_REVIEW_DEFICIENCIES,    // Manquements identifiés
    AWAITING_OEC_DOC_RESPONSE,          // En attente réponse OEC sur manquements
    DOCUMENTARY_REVIEW_COMPLETED,       // Revue documentaire terminée
    
    // Préparation évaluation
    EVALUATION_PLAN_PREPARATION,        // Préparation du plan d'évaluation
    EVALUATION_PLAN_VALIDATION,         // Plan en validation par CD
    EVALUATION_PLANNED,                 // Évaluation planifiée
    
    // Évaluation (terrain - hors système)
    EVALUATION_IN_PROGRESS,             // Évaluation en cours sur site
    EVALUATION_COMPLETED,               // Évaluation terrain terminée
    
    // Traitement écarts
    AWAITING_ACTION_PLANS,              // En attente plans d'actions OEC
    ACTION_PLANS_EVALUATION,            // Évaluation des plans d'actions
    ACTION_PLANS_IMPLEMENTATION,        // Mise en œuvre des actions
    COMPLEMENTARY_EVALUATION_NEEDED,    // Évaluation complémentaire nécessaire
    COMPLEMENTARY_EVALUATION_PLANNED,   // Évaluation complémentaire planifiée
    COMPLEMENTARY_EVALUATION_PROGRESS,  // Évaluation complémentaire en cours
    GAPS_RESOLVED,                      // Tous les écarts résolus
    
    // Rapport
    REPORT_DRAFTING,                    // Rédaction du rapport par REE
    REPORT_VALIDATION,                  // Validation du rapport par CD/DT
    REPORT_VALIDATED,                   // Rapport validé
    
    // Décision CAS
    CAS_PREPARATION,                    // Préparation du dossier pour CAS
    CAS_SCHEDULED,                      // Réunion CAS programmée
    CAS_DECISION_GRANT,                 // CAS: Octroi accréditation
    CAS_DECISION_REFUSAL,               // CAS: Refus
    CAS_DECISION_POSTPONEMENT,          // CAS: Ajournement
    
    // Post-décision
    CERTIFICATE_PREPARATION,            // Préparation certificat
    CERTIFICATE_ISSUED,                 // Certificat délivré
    
    // Statuts finaux
    ACTIVE,                             // Accréditation active
    SUSPENDED,                          // Accréditation suspendue
    WITHDRAWN,                          // Accréditation retirée
    CLOSED,                             // Dossier classé
    
    // Surveillance
    SURVEILLANCE_SCHEDULED,             // Surveillance programmée
    SURVEILLANCE_IN_PROGRESS,           // Surveillance en cours
    SURVEILLANCE_COMPLETED              // Surveillance terminée
}
