package com.algerac.model;

public enum RequestStatus {
    // Phase initiale
    DRAFT,                              // Brouillon
    SUBMITTED,                          // Soumise par OEC
    AWAITING_REGISTRATION_FEE,          // En attente que le DAG fixe les frais d'enregistrement
    PENDING_PAYMENT,                    // En attente de paiement par OEC (frais fixés par DAG)
    PAYMENT_PROOF_SUBMITTED,            // OEC a soumis preuve de paiement, en attente validation DAG
    PAYMENT_COMPLETED,                  // Paiement validé par le DAG, en attente d'assignation CD
    ASSIGNED_TO_RA,                     // Assignée à un RA par le CD
    
    // Phase recevabilité
    RECEIVABILITY_STUDY,                // En étude de recevabilité par RA
    RECEIVABILITY_PENDING_CD_REVIEW,    // Étude terminée par RA, en attente validation CD
    RECEIVABLE,                         // Déclarée recevable (validé par CD)
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
    CONVENTION_PREPARATION,             // Préparation de la convention par RA
    QUOTATION_CONVENTION_PENDING_CD,    // Devis + convention en attente validation CD
    QUOTATION_CONVENTION_CD_MODIF,      // CD demande modifications au RA
    QUOTATION_SENT_TO_OEC,              // Devis et convention envoyés à l'OEC par CD
    QUOTATION_OEC_REMINDER,             // Rappel envoyé à l'OEC (5 jours)
    QUOTATION_VALIDATED,                // Devis et convention validés par l'OEC
    QUOTATION_EXPIRED,                  // Délai dépassé (15 jours), dossier classé
    
    // Constitution équipe
    TEAM_DESIGNATION,                   // Désignation de l'équipe d'évaluation
    TEAM_SENT_TO_CD,                    // Composition équipe envoyée au CD pour validation
    TEAM_CD_APPROVED,                   // Composition approuvée par le CD
    TEAM_CD_CHANGES_REQUESTED,          // CD demande des changements au RA
    TEAM_SENT_TO_OEC,                   // Composition équipe envoyée à OEC
    TEAM_DATE_REFUSED,                  // OEC refuse la date, accepte l'équipe
    TEAM_MEMBER_RECUSED,                // OEC accepte la date, récuse un membre
    TEAM_RECUSED,                       // Membre(s) récusé(s) par OEC (legacy)
    TEAM_RECUSATION_INVALID,            // CD juge récusation non valide, équipe maintenue
    TEAM_VALIDATED,                     // Équipe validée par OEC
    
    // Revue documentaire - Phase frais
    DOC_REVIEW_AWAITING_FEE,            // RA a lancé la revue, en attente fixation frais par DAG
    DOC_REVIEW_FEE_PENDING_PAYMENT,     // DAG a fixé les frais, OEC doit payer
    DOC_REVIEW_PAYMENT_SUBMITTED,       // OEC a soumis preuve de paiement
    DOC_REVIEW_PAYMENT_VALIDATED,       // DAG a validé le paiement, RA peut transmettre docs
    
    // Revue documentaire - Phase analyse
    DOC_REVIEW_IN_PROGRESS,             // Documents transmis à l'équipe (15 jours max)
    DOC_REVIEW_RESULTS_SUBMITTED,       // Résultats soumis par l'équipe d'évaluation
    DOC_REVIEW_RESULTS_SENT_TO_CD,      // RA a transmis les résultats au CD
    DOC_REVIEW_RESULTS_SENT_TO_OEC,     // CD a envoyé résultats/synthèse à l'OEC
    AWAITING_OEC_DOC_RESPONSE,          // En attente réponse OEC (3 mois max)
    DOC_REVIEW_CD_DECISION,             // CD doit décider de poursuivre ou arrêter
    DOCUMENTARY_REVIEW_COMPLETED,       // Revue documentaire terminée, poursuivre
    
    // Legacy documentary review statuses (backward compat)
    DOCUMENTARY_REVIEW,                 // Revue documentaire en cours (legacy)
    DOCUMENTARY_REVIEW_DEFICIENCIES,    // Manquements identifiés (legacy)
    
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
