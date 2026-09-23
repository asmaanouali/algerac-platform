/**
 * Libellés et messages destinés à l'OEC uniquement.
 * Masque le jargon interne ALGERAC (DT, CD, RA, DAG, DG…).
 */

export type OecBadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface OecStatusDisplay {
  label: string;
  message: string;
  variant: OecBadgeVariant;
  color: string;
  phase: string;
}

const ALGERAC_PROCESSING = "Votre dossier est en cours de traitement par ALGERAC.";
const ALGERAC_REVIEW = "Votre dossier est en cours d'examen par ALGERAC.";
const ALGERAC_VALIDATION = "Votre dossier est en cours de validation par ALGERAC.";
const ACTION_REQUIRED = "Une action de votre part est requise.";

const STATUS_DISPLAY: Record<string, OecStatusDisplay> = {
  DRAFT: {
    label: "Brouillon",
    message: "Complétez et soumettez votre demande.",
    variant: "secondary",
    color: "bg-gray-100 text-gray-800",
    phase: "Soumission",
  },
  SUBMITTED: {
    label: "Soumise",
    message: ALGERAC_REVIEW,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Soumission",
  },
  PENDING_DT_REVIEW: {
    label: "En cours d'examen",
    message: ALGERAC_REVIEW,
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Soumission",
  },
  DT_APPROVED: {
    label: "Dossier accepté",
    message: "Votre dossier a été accepté. Le traitement se poursuit.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Soumission",
  },
  DT_REJECTED: {
    label: "Correction requise",
    message: "Des corrections sont demandées sur votre dossier.",
    variant: "destructive",
    color: "bg-red-100 text-red-800",
    phase: "Soumission",
  },
  PENDING_CD_ASSIGNMENT: {
    label: "Dossier pris en charge",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Soumission",
  },
  AWAITING_REGISTRATION_FEE: {
    label: "Frais d'enregistrement",
    message: "Les frais d'enregistrement sont en cours de préparation.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Soumission",
  },
  PENDING_PAYMENT: {
    label: "Paiement requis",
    message: "Veuillez procéder au paiement des frais d'enregistrement.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Soumission",
  },
  PAYMENT_PROOF_SUBMITTED: {
    label: "Paiement soumis",
    message: "Votre preuve de paiement est en cours de vérification.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Soumission",
  },
  PAYMENT_COMPLETED: {
    label: "Paiement validé",
    message: "Paiement validé. Le traitement de votre dossier se poursuit.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Soumission",
  },
  ASSIGNED_TO_RA: {
    label: "Étude en cours",
    message: ALGERAC_PROCESSING,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Recevabilité",
  },
  RA_ASSIGNMENT_REFUSED: {
    label: "Réaffectation en cours",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Recevabilité",
  },
  RECEIVABILITY_STUDY: {
    label: "Étude de recevabilité",
    message: "Votre dossier fait l'objet d'une étude de recevabilité.",
    variant: "default",
    color: "bg-purple-100 text-purple-800",
    phase: "Recevabilité",
  },
  RECEIVABILITY_PENDING_CD_REVIEW: {
    label: "Recevabilité en validation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-purple-100 text-purple-800",
    phase: "Recevabilité",
  },
  RECEIVABLE: {
    label: "Recevable",
    message: "Votre demande a été déclarée recevable.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Recevabilité",
  },
  NOT_RECEIVABLE: {
    label: "Non recevable",
    message: "Votre demande n'est pas recevable en l'état. Des corrections sont attendues.",
    variant: "destructive",
    color: "bg-red-100 text-red-800",
    phase: "Recevabilité",
  },
  RECEIVABILITY_CORRECTION: {
    label: "Correction en cours",
    message: "Veuillez apporter les corrections demandées.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Recevabilité",
  },
  RECEIVABILITY_RESUBMITTED: {
    label: "Corrections soumises",
    message: ALGERAC_REVIEW,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Recevabilité",
  },
  PRELIMINARY_VISIT_PROPOSED: {
    label: "Visite préliminaire proposée",
    message: "Une visite préliminaire vous a été proposée.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Recevabilité",
  },
  PRELIMINARY_VISIT_ACCEPTED: {
    label: "Visite acceptée",
    message: "La visite préliminaire a été acceptée.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Recevabilité",
  },
  PRELIMINARY_VISIT_DECLINED: {
    label: "Visite déclinée",
    message: "La visite préliminaire a été déclinée.",
    variant: "secondary",
    color: "bg-gray-100 text-gray-800",
    phase: "Recevabilité",
  },
  PRELIMINARY_VISIT_SCHEDULED: {
    label: "Visite programmée",
    message: "La visite préliminaire est programmée.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Recevabilité",
  },
  PRELIMINARY_VISIT_COMPLETED: {
    label: "Visite effectuée",
    message: "La visite préliminaire a été effectuée.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Recevabilité",
  },
  PRELIMINARY_VISIT_REPORT_PENDING: {
    label: "Compte rendu en préparation",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Recevabilité",
  },
  PROCESS_SUSPENDED_OBSTACLES: {
    label: "Processus suspendu",
    message: "Le processus est suspendu. Veuillez lever les obstacles signalés.",
    variant: "destructive",
    color: "bg-red-100 text-red-800",
    phase: "Recevabilité",
  },
  QUOTATION_PREPARATION: {
    label: "Préparation du devis",
    message: "Votre devis est en cours de préparation.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Contractualisation",
  },
  QUOTATION_SENT_TO_DAG: {
    label: "Devis en préparation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Contractualisation",
  },
  QUOTATION_APPROVED_BY_DAG: {
    label: "Devis en finalisation",
    message: ALGERAC_PROCESSING,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Contractualisation",
  },
  CONVENTION_PREPARATION: {
    label: "Préparation de la convention",
    message: "La convention est en cours de préparation.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Contractualisation",
  },
  QUOTATION_CONVENTION_PENDING_CD: {
    label: "Devis en validation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Contractualisation",
  },
  QUOTATION_CONVENTION_CD_MODIF: {
    label: "Devis en ajustement",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Contractualisation",
  },
  QUOTATION_SENT_TO_OEC: {
    label: "Devis à valider",
    message: "Veuillez examiner et valider le devis et la convention.",
    variant: "outline",
    color: "bg-orange-100 text-orange-800",
    phase: "Contractualisation",
  },
  QUOTATION_OEC_REMINDER: {
    label: "Rappel — devis à valider",
    message: "Un rappel vous a été envoyé pour valider le devis et la convention.",
    variant: "outline",
    color: "bg-orange-100 text-orange-800",
    phase: "Contractualisation",
  },
  QUOTATION_VALIDATED: {
    label: "Devis validé",
    message: "Devis et convention validés. La suite du processus est en cours.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Contractualisation",
  },
  CONVENTION_VALIDATED: {
    label: "Convention validée",
    message: "La convention a été validée.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Contractualisation",
  },
  QUOTATION_EXPIRED: {
    label: "Devis expiré",
    message: "Le délai de validation du devis est dépassé.",
    variant: "destructive",
    color: "bg-red-100 text-red-800",
    phase: "Contractualisation",
  },
  TEAM_DESIGNATION: {
    label: "Constitution de l'équipe",
    message: "L'équipe d'évaluation est en cours de constitution.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Équipe d'évaluation",
  },
  TEAM_SENT_TO_CD: {
    label: "Équipe en validation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Équipe d'évaluation",
  },
  TEAM_CD_APPROVED: {
    label: "Équipe en finalisation",
    message: ALGERAC_PROCESSING,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Équipe d'évaluation",
  },
  TEAM_CD_CHANGES_REQUESTED: {
    label: "Équipe en ajustement",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Équipe d'évaluation",
  },
  TEAM_SENT_TO_OEC: {
    label: "Équipe à valider",
    message: "Veuillez examiner et valider la composition de l'équipe d'évaluation.",
    variant: "outline",
    color: "bg-orange-100 text-orange-800",
    phase: "Équipe d'évaluation",
  },
  TEAM_DATE_REFUSED: {
    label: "Date à reprogrammer",
    message: "Une nouvelle date d'évaluation est en cours de proposition.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Équipe d'évaluation",
  },
  TEAM_MEMBER_RECUSED: {
    label: "Récusation en traitement",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Équipe d'évaluation",
  },
  TEAM_RECUSED: {
    label: "Récusation en traitement",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Équipe d'évaluation",
  },
  TEAM_RECUSATION_INVALID: {
    label: "Équipe maintenue",
    message: "La composition de l'équipe est maintenue.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Équipe d'évaluation",
  },
  TEAM_VALIDATED: {
    label: "Équipe validée",
    message: "L'équipe d'évaluation a été validée.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Équipe d'évaluation",
  },
  DOC_REVIEW_AWAITING_FEE: {
    label: "Frais de revue",
    message: "Les frais de revue documentaire sont en cours de préparation.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Revue documentaire",
  },
  DOC_REVIEW_FEE_PENDING_PAYMENT: {
    label: "Paiement revue requis",
    message: "Veuillez procéder au paiement des frais de revue documentaire.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Revue documentaire",
  },
  DOC_REVIEW_PAYMENT_SUBMITTED: {
    label: "Paiement soumis",
    message: "Votre preuve de paiement est en cours de vérification.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Revue documentaire",
  },
  DOC_REVIEW_PAYMENT_VALIDATED: {
    label: "Paiement validé",
    message: "Paiement validé. La revue documentaire se poursuit.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Revue documentaire",
  },
  DOC_REVIEW_IN_PROGRESS: {
    label: "Revue documentaire",
    message: "Vos documents sont en cours d'examen.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Revue documentaire",
  },
  DOC_REVIEW_RESULTS_SUBMITTED: {
    label: "Résultats en préparation",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Revue documentaire",
  },
  DOC_REVIEW_RESULTS_SENT_TO_CD: {
    label: "Résultats en validation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Revue documentaire",
  },
  DOC_REVIEW_RESULTS_SENT_TO_OEC: {
    label: "Résultats disponibles",
    message: "Les résultats de la revue documentaire sont disponibles.",
    variant: "outline",
    color: "bg-orange-100 text-orange-800",
    phase: "Revue documentaire",
  },
  AWAITING_OEC_DOC_RESPONSE: {
    label: "Réponse attendue",
    message: "Veuillez répondre aux observations de la revue documentaire.",
    variant: "outline",
    color: "bg-orange-100 text-orange-800",
    phase: "Revue documentaire",
  },
  DOC_REVIEW_CD_DECISION: {
    label: "Décision en cours",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Revue documentaire",
  },
  DOCUMENTARY_REVIEW_COMPLETED: {
    label: "Revue terminée",
    message: "La revue documentaire est terminée.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Revue documentaire",
  },
  DOCUMENTARY_REVIEW: {
    label: "Revue documentaire",
    message: "Vos documents sont en cours d'examen.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Revue documentaire",
  },
  DOCUMENTARY_REVIEW_DEFICIENCIES: {
    label: "Observations à traiter",
    message: "Des observations ont été identifiées. Une réponse est attendue.",
    variant: "outline",
    color: "bg-orange-100 text-orange-800",
    phase: "Revue documentaire",
  },
  MANDATES_PREPARATION: {
    label: "Préparation de l'évaluation",
    message: ALGERAC_PROCESSING,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  MANDATES_PENDING_CD: {
    label: "Préparation de l'évaluation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  MANDATES_CD_MODIFICATION: {
    label: "Préparation de l'évaluation",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Préparation évaluation",
  },
  MANDATES_SENT_TO_TEAM: {
    label: "Préparation de l'évaluation",
    message: ALGERAC_PROCESSING,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  MISSION_ORDERS_PENDING: {
    label: "Préparation de l'évaluation",
    message: ALGERAC_PROCESSING,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  MISSION_ORDERS_PENDING_DT: {
    label: "Préparation de l'évaluation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  MISSION_ORDERS_PENDING_DG: {
    label: "Préparation de l'évaluation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  MISSION_ORDERS_SENT: {
    label: "Préparation de l'évaluation",
    message: ALGERAC_PROCESSING,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  EVALUATION_PLAN_PREPARATION: {
    label: "Plan d'évaluation",
    message: "Le plan d'évaluation est en cours de préparation.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  EVALUATION_PLAN_PENDING_RA: {
    label: "Plan d'évaluation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  EVALUATION_PLAN_RA_APPROVED: {
    label: "Plan d'évaluation",
    message: ALGERAC_VALIDATION,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  EVALUATION_PLAN_PENDING_CD: {
    label: "Plan d'évaluation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  EVALUATION_PLAN_VALIDATION: {
    label: "Plan d'évaluation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Préparation évaluation",
  },
  EVALUATION_PLANNED: {
    label: "Évaluation planifiée",
    message: "L'évaluation sur site est planifiée.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Évaluation",
  },
  EVALUATION_IN_PROGRESS: {
    label: "Évaluation en cours",
    message: "L'évaluation sur site est en cours.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Évaluation",
  },
  EVALUATION_OPENING_MEETING: {
    label: "Évaluation en cours",
    message: "Réunion d'ouverture de l'évaluation.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Évaluation",
  },
  EVALUATION_ONGOING: {
    label: "Évaluation en cours",
    message: "L'évaluation sur site est en cours.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Évaluation",
  },
  EVALUATION_CONSENSUS: {
    label: "Évaluation en cours",
    message: ALGERAC_PROCESSING,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Évaluation",
  },
  EVALUATION_CLOSING_MEETING: {
    label: "Évaluation en cours",
    message: "Réunion de clôture de l'évaluation.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Évaluation",
  },
  EVALUATION_GAPS_SENT_TO_OEC: {
    label: "Écarts à traiter",
    message: "Des fiches d'écart vous ont été transmises.",
    variant: "outline",
    color: "bg-orange-100 text-orange-800",
    phase: "Évaluation",
  },
  EVALUATION_OEC_REVIEW: {
    label: "Examen des écarts",
    message: "Veuillez examiner les écarts transmis.",
    variant: "outline",
    color: "bg-orange-100 text-orange-800",
    phase: "Évaluation",
  },
  EVALUATION_OEC_ALL_ACCEPTED: {
    label: "Écarts acceptés",
    message: "Les écarts ont été acceptés. Le traitement se poursuit.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Évaluation",
  },
  EVALUATION_DOCS_TRANSMITTED: {
    label: "Évaluation en consolidation",
    message: ALGERAC_PROCESSING,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Évaluation",
  },
  EVALUATION_COMPLETED: {
    label: "Évaluation terminée",
    message: "L'évaluation sur site est terminée.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Évaluation",
  },
  AWAITING_ACTION_PLANS: {
    label: "Plans d'actions requis",
    message: "Veuillez soumettre vos plans d'actions.",
    variant: "outline",
    color: "bg-orange-100 text-orange-800",
    phase: "Traitement des écarts",
  },
  ACTION_PLANS_EVALUATION: {
    label: "Plans d'actions en examen",
    message: ALGERAC_REVIEW,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Traitement des écarts",
  },
  ACTION_PLANS_IMPLEMENTATION: {
    label: "Actions en cours",
    message: "La mise en œuvre des actions correctives est en cours.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Traitement des écarts",
  },
  COMPLEMENTARY_EVALUATION_NEEDED: {
    label: "Évaluation complémentaire",
    message: "Une évaluation complémentaire est nécessaire.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Traitement des écarts",
  },
  COMPLEMENTARY_EVALUATION_PLANNED: {
    label: "Évaluation complémentaire planifiée",
    message: "Une évaluation complémentaire est planifiée.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Traitement des écarts",
  },
  COMPLEMENTARY_EVALUATION_PROGRESS: {
    label: "Évaluation complémentaire",
    message: "L'évaluation complémentaire est en cours.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Traitement des écarts",
  },
  GAPS_RESOLVED: {
    label: "Écarts résolus",
    message: "Tous les écarts ont été résolus.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Traitement des écarts",
  },
  REPORT_DRAFTING: {
    label: "Rapport en rédaction",
    message: "Le rapport d'évaluation est en cours de rédaction.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Rapport",
  },
  REPORT_VALIDATION: {
    label: "Rapport en validation",
    message: ALGERAC_VALIDATION,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Rapport",
  },
  REPORT_VALIDATED: {
    label: "Rapport validé",
    message: "Le rapport d'évaluation a été validé.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Rapport",
  },
  CAS_PREPARATION: {
    label: "Préparation de la décision",
    message: "Votre dossier est préparé pour la commission d'accréditation.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Décision",
  },
  CAS_SCHEDULED: {
    label: "Commission programmée",
    message: "La réunion de la commission d'accréditation est programmée.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Décision",
  },
  CAS_DECISION_GRANT: {
    label: "Accréditation accordée",
    message: "Félicitations — l'accréditation a été accordée.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Décision",
  },
  CAS_DECISION_REFUSAL: {
    label: "Accréditation refusée",
    message: "La commission a décidé de ne pas accorder l'accréditation.",
    variant: "destructive",
    color: "bg-red-100 text-red-800",
    phase: "Décision",
  },
  CAS_DECISION_POSTPONEMENT: {
    label: "Décision ajournée",
    message: "La décision a été ajournée.",
    variant: "outline",
    color: "bg-amber-100 text-amber-800",
    phase: "Décision",
  },
  CERTIFICATE_PREPARATION: {
    label: "Certificat en préparation",
    message: "Votre certificat d'accréditation est en préparation.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Certification",
  },
  CERTIFICATE_ISSUED: {
    label: "Certificat délivré",
    message: "Votre certificat d'accréditation a été délivré.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Certification",
  },
  ACTIVE: {
    label: "Accréditation active",
    message: "Votre accréditation est active.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Accrédité",
  },
  SUSPENDED: {
    label: "Suspendue",
    message: "Votre accréditation est suspendue.",
    variant: "destructive",
    color: "bg-red-100 text-red-800",
    phase: "Accrédité",
  },
  WITHDRAWN: {
    label: "Retirée",
    message: "Votre accréditation a été retirée.",
    variant: "destructive",
    color: "bg-red-100 text-red-800",
    phase: "Accrédité",
  },
  CLOSED: {
    label: "Classée",
    message: "Ce dossier a été classé.",
    variant: "secondary",
    color: "bg-gray-100 text-gray-800",
    phase: "Clôture",
  },
  SURVEILLANCE_SCHEDULED: {
    label: "Surveillance programmée",
    message: "Une évaluation de surveillance est programmée.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Surveillance",
  },
  SURVEILLANCE_IN_PROGRESS: {
    label: "Surveillance en cours",
    message: "L'évaluation de surveillance est en cours.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Surveillance",
  },
  SURVEILLANCE_COMPLETED: {
    label: "Surveillance terminée",
    message: "L'évaluation de surveillance est terminée.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Surveillance",
  },
  INITIAL_EVALUATION: {
    label: "Évaluation initiale",
    message: ALGERAC_PROCESSING,
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Renouvellement",
  },
  RENEWAL_INITIATED: {
    label: "Renouvellement initié",
    message: "Votre demande de renouvellement est en cours de traitement.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Renouvellement",
  },
  RENEWAL_EVALUATION: {
    label: "Évaluation de renouvellement",
    message: "L'évaluation de renouvellement est en cours.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Renouvellement",
  },
  RENEWAL_COMPLETED: {
    label: "Renouvellement terminé",
    message: "Le renouvellement a été finalisé.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Renouvellement",
  },
  EXTENSION_REQUESTED: {
    label: "Extension demandée",
    message: "Votre demande d'extension est en cours de traitement.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Extension",
  },
  EXTENSION_EVALUATION: {
    label: "Évaluation d'extension",
    message: "L'évaluation de l'extension est en cours.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Extension",
  },
  EXTENSION_GRANTED: {
    label: "Extension accordée",
    message: "L'extension de portée a été accordée.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Extension",
  },
  TRANSFER_INITIATED: {
    label: "Transfert demandé",
    message: "Votre demande de transfert est en cours d'examen.",
    variant: "default",
    color: "bg-blue-100 text-blue-800",
    phase: "Transfert",
  },
  TRANSFER_REVIEW: {
    label: "Transfert en examen",
    message: ALGERAC_REVIEW,
    variant: "outline",
    color: "bg-blue-100 text-blue-800",
    phase: "Transfert",
  },
  TRANSFER_COMPLETED: {
    label: "Transfert terminé",
    message: "Le transfert d'accréditation est terminé.",
    variant: "default",
    color: "bg-green-100 text-green-800",
    phase: "Transfert",
  },
};

const INTERNAL_ROLE_PATTERN =
  /\b(DT|CD|RA|DAG|DG|REE|CAS|GES[_ ]?COMPETENCES|Chef de Département|Responsable d'Accréditation|Direction Technique|Direction Administrative|Direction Générale)\b/gi;

const PHASE_LABELS: Record<string, string> = {
  INITIAL: "Soumission",
  RECEVABILITE: "Recevabilité",
  VISITE_PREALABLE: "Visite préliminaire",
  CONTRACTUALISATION: "Contractualisation",
  CONSTITUTION_EQUIPE: "Équipe d'évaluation",
  REVUE_DOCUMENTAIRE: "Revue documentaire",
  PREPARATION_EVALUATION: "Préparation de l'évaluation",
  EVALUATION: "Évaluation",
  TRAITEMENT_ECARTS: "Traitement des écarts",
  RAPPORT: "Rapport",
  DECISION_CAS: "Décision d'accréditation",
  POST_DECISION: "Certification",
  ACTIVE: "Accrédité",
  SURVEILLANCE: "Surveillance",
  RENOUVELLEMENT: "Renouvellement",
  EXTENSION: "Extension",
  TRANSFERT: "Transfert",
  FINALE: "Clôture",
  UNKNOWN: "Dossier",
};

function looksInternal(text: string | null | undefined): boolean {
  if (!text) return true;
  INTERNAL_ROLE_PATTERN.lastIndex = 0;
  return INTERNAL_ROLE_PATTERN.test(text) || /pending|waiting|_/i.test(text);
}

function sanitizeForOec(text: string | null | undefined, fallback: string): string {
  if (!text?.trim()) return fallback;
  if (looksInternal(text)) return fallback;
  return text.trim();
}

export function getOecStatusDisplay(status: string | null | undefined): OecStatusDisplay {
  if (!status) {
    return {
      label: "En cours",
      message: ALGERAC_PROCESSING,
      variant: "secondary",
      color: "bg-gray-100 text-gray-800",
      phase: "Dossier",
    };
  }
  return (
    STATUS_DISPLAY[status] || {
      label: "En cours de traitement",
      message: ALGERAC_PROCESSING,
      variant: "outline" as OecBadgeVariant,
      color: "bg-gray-100 text-gray-800",
      phase: "Dossier",
    }
  );
}

export function getOecStatusLabel(status: string | null | undefined): string {
  return getOecStatusDisplay(status).label;
}

export function getOecStatusMessage(status: string | null | undefined): string {
  return getOecStatusDisplay(status).message;
}

export function getOecPhaseLabel(phase: string | null | undefined, status?: string | null): string {
  if (status) {
    const fromStatus = getOecStatusDisplay(status).phase;
    if (fromStatus) return fromStatus;
  }
  if (!phase) return "Dossier";
  return PHASE_LABELS[phase] || phase.replace(/_/g, " ");
}

/** Message d'action / attente affiché à l'OEC (jamais de jargon interne). */
export function getOecNextAction(opts: {
  status?: string | null;
  nextAction?: string | null;
  currentStep?: string | null;
  pendingWith?: string | null;
}): string {
  const display = getOecStatusDisplay(opts.status);
  const pending = (opts.pendingWith || "").trim().toUpperCase();

  if (pending === "OEC") {
    const candidate = opts.nextAction || opts.currentStep || display.message;
    return sanitizeForOec(candidate, ACTION_REQUIRED);
  }

  // En attente d'ALGERAC : ne jamais exposer nextAction interne
  return display.message || ALGERAC_PROCESSING;
}

/** true si l'OEC doit agir ; sinon on n'affiche pas « En attente de DT/CD… ». */
export function isOecActionPending(pendingWith?: string | null): boolean {
  return (pendingWith || "").trim().toUpperCase() === "OEC";
}

export function getOecPendingLabel(pendingWith?: string | null): string | null {
  if (!pendingWith) return null;
  if (isOecActionPending(pendingWith)) return "Votre organisme";
  return "ALGERAC";
}
