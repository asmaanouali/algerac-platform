/**
 * Maps a request status to the RA page where work continues,
 * so the dashboard can send the RA exactly to the current step.
 */

export interface RaResumeTarget {
  href: string;
  /** CTA shown on the dashboard */
  label: string;
  /** True when the RA must act now (not waiting on someone else) */
  actionRequired: boolean;
  waitingOn?: string;
  phase: string;
}

export function getSearchRequestId(search?: string): number | null {
  const raw = search ?? (typeof window === "undefined" ? "" : window.location.search);
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  const value = params.get("requestId");
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function findByRequestId<T extends { id?: number | string; requestId?: number | string; request?: { id?: number | string } }>(
  list: T[],
  requestId: number | null,
  key: "id" | "requestId" = "id",
): T | undefined {
  if (requestId == null) return undefined;
  return list.find((item) => {
    if (Number(item[key]) === requestId) return true;
    if (key === "requestId" && Number(item.request?.id) === requestId) return true;
    return false;
  });
}

function page(path: string, id: number | string): string {
  return `${path}?requestId=${id}`;
}

function devis(id: number | string): string {
  return `/ra/demandes/${id}/devis`;
}

type ResumeRule = {
  path?: (id: number | string) => string;
  label: string;
  actionRequired: boolean;
  waitingOn?: string;
  phase: string;
};

const RULES: Record<string, ResumeRule> = {
  // Recevabilité
  ASSIGNED_TO_RA: { path: (id) => page("/ra/faisabilite", id), label: "Confirmer ou refuser", actionRequired: true, phase: "Recevabilité" },
  RECEIVABILITY_STUDY: { path: (id) => page("/ra/faisabilite", id), label: "Reprendre l'étude", actionRequired: true, phase: "Recevabilité" },
  RESOURCE_CHECK: { path: (id) => page("/ra/faisabilite", id), label: "Continuer (ressources)", actionRequired: true, phase: "Recevabilité" },
  RECEIVABILITY_RESUBMITTED: { path: (id) => page("/ra/faisabilite", id), label: "Réexaminer le dossier", actionRequired: true, phase: "Recevabilité" },
  RECEIVABILITY_PENDING_CD_REVIEW: { path: (id) => page("/ra/faisabilite", id), label: "Voir l'étude", actionRequired: false, waitingOn: "CD", phase: "Recevabilité" },
  RECEIVABLE: { path: devis, label: "Préparer le devis", actionRequired: true, phase: "Contractualisation" },
  NOT_RECEIVABLE: { path: (id) => page("/ra/faisabilite", id), label: "Voir le dossier", actionRequired: false, waitingOn: "OEC", phase: "Recevabilité" },
  RECEIVABILITY_CORRECTION: { path: (id) => page("/ra/faisabilite", id), label: "Voir le dossier", actionRequired: false, waitingOn: "OEC", phase: "Recevabilité" },

  // Visite préliminaire
  PRELIMINARY_VISIT_PROPOSED: { path: (id) => page("/ra/faisabilite", id), label: "Suivre la visite", actionRequired: false, waitingOn: "OEC", phase: "Recevabilité" },
  PRELIMINARY_VISIT_ACCEPTED: { path: (id) => page("/ra/faisabilite", id), label: "Programmer la visite", actionRequired: true, phase: "Recevabilité" },
  PRELIMINARY_VISIT_SCHEDULED: { path: (id) => page("/ra/faisabilite", id), label: "Suivre la visite", actionRequired: false, waitingOn: "Équipe", phase: "Recevabilité" },
  PRELIMINARY_VISIT_COMPLETED: { path: (id) => page("/ra/faisabilite", id), label: "Finaliser la recevabilité", actionRequired: true, phase: "Recevabilité" },
  PRELIMINARY_VISIT_REPORT_PENDING: { path: (id) => page("/ra/faisabilite", id), label: "Rédiger le compte rendu", actionRequired: true, phase: "Recevabilité" },
  PRELIMINARY_VISIT_DECLINED: { path: (id) => page("/ra/faisabilite", id), label: "Continuer sans visite", actionRequired: true, phase: "Recevabilité" },
  PROCESS_SUSPENDED_OBSTACLES: { path: (id) => page("/ra/faisabilite", id), label: "Voir les obstacles", actionRequired: false, waitingOn: "OEC", phase: "Recevabilité" },
  PENDING_DG_VALIDATION: { path: (id) => page("/ra/faisabilite", id), label: "Voir le dossier", actionRequired: false, waitingOn: "DG", phase: "Recevabilité" },
  DG_VALIDATED: { path: (id) => page("/ra/faisabilite", id), label: "Notifier l'OEC", actionRequired: true, phase: "Recevabilité" },

  // Contractualisation
  QUOTATION_PREPARATION: { path: devis, label: "Reprendre le devis", actionRequired: true, phase: "Contractualisation" },
  QUOTATION_SENT_TO_DAG: { path: devis, label: "Préparer la convention", actionRequired: true, phase: "Contractualisation" },
  QUOTATION_APPROVED_BY_DAG: { path: devis, label: "Finaliser convention / CD", actionRequired: true, phase: "Contractualisation" },
  CONVENTION_PREPARATION: { path: devis, label: "Reprendre la convention", actionRequired: true, phase: "Contractualisation" },
  QUOTATION_CONVENTION_PENDING_CD: { path: devis, label: "Voir devis & convention", actionRequired: false, waitingOn: "CD", phase: "Contractualisation" },
  QUOTATION_CONVENTION_CD_MODIF: { path: devis, label: "Corriger (modif. CD)", actionRequired: true, phase: "Contractualisation" },
  QUOTATION_SENT_TO_OEC: { path: devis, label: "Voir devis & convention", actionRequired: false, waitingOn: "OEC", phase: "Contractualisation" },
  QUOTATION_OEC_REMINDER: { path: devis, label: "Voir devis & convention", actionRequired: false, waitingOn: "OEC", phase: "Contractualisation" },
  QUOTATION_VALIDATED: { path: (id) => page("/ra/equipes", id), label: "Constituer l'équipe", actionRequired: true, phase: "Équipe" },
  CONVENTION_VALIDATED: { path: (id) => page("/ra/equipes", id), label: "Constituer l'équipe", actionRequired: true, phase: "Équipe" },
  QUOTATION_EXPIRED: { path: devis, label: "Voir le devis expiré", actionRequired: true, phase: "Contractualisation" },

  // Équipe
  TEAM_DESIGNATION: { path: (id) => page("/ra/equipes", id), label: "Reprendre la constitution", actionRequired: true, phase: "Équipe" },
  TEAM_SENT_TO_CD: { path: (id) => page("/ra/equipes", id), label: "Voir l'équipe", actionRequired: false, waitingOn: "CD", phase: "Équipe" },
  TEAM_CD_APPROVED: { path: (id) => page("/ra/equipes", id), label: "Envoyer à l'OEC", actionRequired: true, phase: "Équipe" },
  TEAM_CD_CHANGES_REQUESTED: { path: (id) => page("/ra/equipes", id), label: "Corriger l'équipe", actionRequired: true, phase: "Équipe" },
  TEAM_SENT_TO_OEC: { path: (id) => page("/ra/equipes", id), label: "Voir l'équipe", actionRequired: false, waitingOn: "OEC", phase: "Équipe" },
  TEAM_DATE_REFUSED: { path: (id) => page("/ra/equipes", id), label: "Proposer une nouvelle date", actionRequired: true, phase: "Équipe" },
  TEAM_MEMBER_RECUSED: { path: (id) => page("/ra/recusations", id), label: "Traiter la récusation", actionRequired: true, phase: "Équipe" },
  TEAM_RECUSED: { path: (id) => page("/ra/recusations", id), label: "Traiter la récusation", actionRequired: true, phase: "Équipe" },
  TEAM_RECUSATION_INVALID: { path: (id) => page("/ra/revue-documentaire", id), label: "Lancer la revue documentaire", actionRequired: true, phase: "Revue documentaire" },
  TEAM_VALIDATED: { path: (id) => page("/ra/revue-documentaire", id), label: "Lancer la revue documentaire", actionRequired: true, phase: "Revue documentaire" },

  // Revue documentaire
  DOC_REVIEW_AWAITING_FEE: { path: (id) => page("/ra/revue-documentaire", id), label: "Voir la revue", actionRequired: false, waitingOn: "DAG", phase: "Revue documentaire" },
  DOC_REVIEW_FEE_PENDING_PAYMENT: { path: (id) => page("/ra/revue-documentaire", id), label: "Voir la revue", actionRequired: false, waitingOn: "OEC", phase: "Revue documentaire" },
  DOC_REVIEW_PAYMENT_SUBMITTED: { path: (id) => page("/ra/revue-documentaire", id), label: "Voir la revue", actionRequired: false, waitingOn: "DAG", phase: "Revue documentaire" },
  DOC_REVIEW_PAYMENT_VALIDATED: { path: (id) => page("/ra/revue-documentaire", id), label: "Transmettre les documents", actionRequired: true, phase: "Revue documentaire" },
  DOC_REVIEW_IN_PROGRESS: { path: (id) => page("/ra/revue-documentaire", id), label: "Suivre la revue", actionRequired: false, waitingOn: "Équipe", phase: "Revue documentaire" },
  DOCUMENTARY_REVIEW: { path: (id) => page("/ra/revue-documentaire", id), label: "Reprendre la revue", actionRequired: true, phase: "Revue documentaire" },
  DOC_REVIEW_RESULTS_SUBMITTED: { path: (id) => page("/ra/revue-documentaire", id), label: "Transmettre au CD", actionRequired: true, phase: "Revue documentaire" },
  DOC_REVIEW_RESULTS_SENT_TO_CD: { path: (id) => page("/ra/revue-documentaire", id), label: "Voir les résultats", actionRequired: false, waitingOn: "CD", phase: "Revue documentaire" },
  DOC_REVIEW_RESULTS_SENT_TO_OEC: { path: (id) => page("/ra/revue-documentaire", id), label: "Voir les résultats", actionRequired: false, waitingOn: "OEC", phase: "Revue documentaire" },
  AWAITING_OEC_DOC_RESPONSE: { path: (id) => page("/ra/revue-documentaire", id), label: "Voir la revue", actionRequired: false, waitingOn: "OEC", phase: "Revue documentaire" },
  DOCUMENTARY_REVIEW_DEFICIENCIES: { path: (id) => page("/ra/revue-documentaire", id), label: "Suivre les observations", actionRequired: false, waitingOn: "OEC", phase: "Revue documentaire" },
  DOC_REVIEW_CD_DECISION: { path: (id) => page("/ra/revue-documentaire", id), label: "Voir la revue", actionRequired: false, waitingOn: "CD", phase: "Revue documentaire" },
  DOCUMENTARY_REVIEW_COMPLETED: { path: (id) => page("/ra/preparation-evaluation", id), label: "Préparer l'évaluation", actionRequired: true, phase: "Préparation évaluation" },

  // Préparation évaluation
  MANDATES_PREPARATION: { path: (id) => page("/ra/preparation-evaluation", id), label: "Reprendre les mandatements", actionRequired: true, phase: "Préparation évaluation" },
  MANDATES_PENDING_CD: { path: (id) => page("/ra/preparation-evaluation", id), label: "Voir les mandatements", actionRequired: false, waitingOn: "CD", phase: "Préparation évaluation" },
  MANDATES_CD_MODIFICATION: { path: (id) => page("/ra/preparation-evaluation", id), label: "Corriger les mandatements", actionRequired: true, phase: "Préparation évaluation" },
  MANDATES_SENT_TO_TEAM: { path: (id) => page("/ra/preparation-evaluation", id), label: "Établir les ordres de mission", actionRequired: true, phase: "Préparation évaluation" },
  MISSION_ORDERS_PENDING: { path: (id) => page("/ra/preparation-evaluation", id), label: "Reprendre les ordres de mission", actionRequired: true, phase: "Préparation évaluation" },
  MISSION_ORDERS_PENDING_DT: { path: (id) => page("/ra/preparation-evaluation", id), label: "Voir les ordres de mission", actionRequired: false, waitingOn: "DT", phase: "Préparation évaluation" },
  MISSION_ORDERS_PENDING_DG: { path: (id) => page("/ra/preparation-evaluation", id), label: "Voir les ordres de mission", actionRequired: false, waitingOn: "DG", phase: "Préparation évaluation" },
  MISSION_ORDERS_SENT: { path: (id) => page("/ra/preparation-evaluation", id), label: "Suivre le plan d'évaluation", actionRequired: false, waitingOn: "REE", phase: "Préparation évaluation" },
  EVALUATION_PLAN_PREPARATION: { path: (id) => page("/ra/preparation-evaluation", id), label: "Suivre le plan d'évaluation", actionRequired: false, waitingOn: "REE", phase: "Préparation évaluation" },
  EVALUATION_PLAN_PENDING_RA: { path: (id) => page("/ra/preparation-evaluation", id), label: "Valider le plan d'évaluation", actionRequired: true, phase: "Préparation évaluation" },
  EVALUATION_PLAN_RA_APPROVED: { path: (id) => page("/ra/preparation-evaluation", id), label: "Voir le plan d'évaluation", actionRequired: false, waitingOn: "CD", phase: "Préparation évaluation" },
  EVALUATION_PLAN_PENDING_CD: { path: (id) => page("/ra/preparation-evaluation", id), label: "Voir le plan d'évaluation", actionRequired: false, waitingOn: "CD", phase: "Préparation évaluation" },
  EVALUATION_PLAN_VALIDATION: { path: (id) => page("/ra/preparation-evaluation", id), label: "Voir le plan d'évaluation", actionRequired: false, waitingOn: "CD", phase: "Préparation évaluation" },
  EVALUATION_PLANNED: { path: (id) => page("/ra/preparation-evaluation", id), label: "Lancer l'évaluation", actionRequired: true, phase: "Évaluation" },

  // Évaluation
  EVALUATION_IN_PROGRESS: { path: (id) => page("/ra/preparation-evaluation", id), label: "Suivre l'évaluation", actionRequired: false, waitingOn: "Équipe", phase: "Évaluation" },
  EVALUATION_OPENING_MEETING: { path: (id) => page("/ra/preparation-evaluation", id), label: "Suivre l'évaluation", actionRequired: false, waitingOn: "Équipe", phase: "Évaluation" },
  EVALUATION_ONGOING: { path: (id) => page("/ra/preparation-evaluation", id), label: "Suivre l'évaluation", actionRequired: false, waitingOn: "Équipe", phase: "Évaluation" },
  EVALUATION_CONSENSUS: { path: (id) => page("/ra/gestion-ecarts", id), label: "Suivre l'évaluation", actionRequired: false, waitingOn: "Équipe", phase: "Évaluation" },
  EVALUATION_CLOSING_MEETING: { path: (id) => page("/ra/gestion-ecarts", id), label: "Suivre l'évaluation", actionRequired: false, waitingOn: "Équipe", phase: "Évaluation" },
  EVALUATION_GAPS_SENT_TO_OEC: { path: (id) => page("/ra/gestion-ecarts", id), label: "Voir les écarts", actionRequired: false, waitingOn: "OEC", phase: "Évaluation" },
  EVALUATION_OEC_REVIEW: { path: (id) => page("/ra/gestion-ecarts", id), label: "Voir les écarts", actionRequired: false, waitingOn: "OEC", phase: "Évaluation" },
  EVALUATION_OEC_ALL_ACCEPTED: { path: (id) => page("/ra/gestion-ecarts", id), label: "Gérer les écarts", actionRequired: true, phase: "Écarts" },
  EVALUATION_DOCS_TRANSMITTED: { path: (id) => page("/ra/gestion-ecarts", id), label: "Gérer les écarts", actionRequired: true, phase: "Écarts" },
  EVALUATION_COMPLETED: { path: (id) => page("/ra/gestion-ecarts", id), label: "Gérer les écarts", actionRequired: true, phase: "Écarts" },

  // Écarts
  AWAITING_ACTION_PLANS: { path: (id) => page("/ra/gestion-ecarts", id), label: "Voir les écarts", actionRequired: false, waitingOn: "OEC", phase: "Écarts" },
  ACTION_PLANS_EVALUATION: { path: (id) => page("/ra/gestion-ecarts", id), label: "Évaluer les plans d'action", actionRequired: true, phase: "Écarts" },
  ACTION_PLANS_IMPLEMENTATION: { path: (id) => page("/ra/gestion-ecarts", id), label: "Suivre les actions", actionRequired: false, waitingOn: "OEC", phase: "Écarts" },
  COMPLEMENTARY_EVALUATION_NEEDED: { path: (id) => page("/ra/gestion-ecarts", id), label: "Planifier l'éval. complémentaire", actionRequired: true, phase: "Écarts" },
  COMPLEMENTARY_EVALUATION_PLANNED: { path: (id) => page("/ra/gestion-ecarts", id), label: "Suivre l'éval. complémentaire", actionRequired: false, waitingOn: "Équipe", phase: "Écarts" },
  COMPLEMENTARY_EVALUATION_PROGRESS: { path: (id) => page("/ra/gestion-ecarts", id), label: "Suivre l'éval. complémentaire", actionRequired: false, waitingOn: "Équipe", phase: "Écarts" },
  GAPS_RESOLVED: { path: (id) => page("/ra/rapports", id), label: "Passer aux rapports", actionRequired: true, phase: "Rapport" },

  // Rapport
  REPORT_DRAFTING: { path: (id) => page("/ra/rapports", id), label: "Suivre le rapport", actionRequired: false, waitingOn: "REE", phase: "Rapport" },
  REPORT_VALIDATION: { path: (id) => page("/ra/rapports", id), label: "Valider le rapport", actionRequired: true, phase: "Rapport" },
  REPORT_DT_VALIDATED: { path: (id) => page("/ra/rapports", id), label: "Consolider le rapport", actionRequired: true, phase: "Rapport" },
  REPORT_CONSOLIDATION: { path: (id) => page("/ra/rapports", id), label: "Voir le rapport", actionRequired: false, waitingOn: "CD", phase: "Rapport" },
  REPORT_VALIDATED: { path: (id) => page("/ra/preparation-cas", id), label: "Préparer le CAS", actionRequired: true, phase: "CAS" },

  // CAS / décision
  CAS_PREPARATION: { path: (id) => page("/ra/preparation-cas", id), label: "Reprendre la préparation CAS", actionRequired: true, phase: "CAS" },
  CAS_SCHEDULED: { path: (id) => page("/ra/preparation-cas", id), label: "Suivre la réunion CAS", actionRequired: false, waitingOn: "CAS", phase: "CAS" },
  CAS_DECISION_GRANT: { path: (id) => page("/ra/decision-accreditation", id), label: "Préparer le certificat", actionRequired: true, phase: "Décision" },
  CAS_DECISION_REFUSAL: { path: (id) => page("/ra/decision-accreditation", id), label: "Traiter le refus", actionRequired: true, phase: "Décision" },
  CAS_DECISION_POSTPONEMENT: { path: (id) => page("/ra/decision-accreditation", id), label: "Traiter l'ajournement", actionRequired: true, phase: "Décision" },
  CERTIFICATE_PREPARATION: { path: (id) => page("/ra/decision-accreditation", id), label: "Finaliser le certificat", actionRequired: true, phase: "Certification" },
  CERTIFICATE_ISSUED: { path: (id) => page("/ra/decision-accreditation", id), label: "Voir le certificat", actionRequired: false, phase: "Certification" },
  ACTIVE: { path: (id) => page("/ra/surveillance", id), label: "Voir la surveillance", actionRequired: false, phase: "Accrédité" },

  // Surveillance / suite
  SURVEILLANCE_SCHEDULED: { path: (id) => page("/ra/surveillance", id), label: "Gérer la surveillance", actionRequired: true, phase: "Surveillance" },
  SURVEILLANCE_IN_PROGRESS: { path: (id) => page("/ra/surveillance", id), label: "Suivre la surveillance", actionRequired: true, phase: "Surveillance" },
  SURVEILLANCE_COMPLETED: { path: (id) => page("/ra/surveillance", id), label: "Clôturer la surveillance", actionRequired: true, phase: "Surveillance" },
  RENEWAL_INITIATED: { path: (id) => page("/ra/surveillance", id), label: "Gérer le renouvellement", actionRequired: true, phase: "Renouvellement" },
  RENEWAL_EVALUATION: { path: (id) => page("/ra/surveillance", id), label: "Suivre le renouvellement", actionRequired: true, phase: "Renouvellement" },
  EXTENSION_REQUESTED: { path: (id) => page("/ra/surveillance", id), label: "Gérer l'extension", actionRequired: true, phase: "Extension" },
  EXTENSION_EVALUATION: { path: (id) => page("/ra/surveillance", id), label: "Suivre l'extension", actionRequired: true, phase: "Extension" },
};

const DEFAULT_RULE: ResumeRule = {
  path: (id) => page("/ra/faisabilite", id),
  label: "Ouvrir le dossier",
  actionRequired: false,
  phase: "Dossier",
};

export function getRaResume(status: string | null | undefined, requestId: number | string): RaResumeTarget {
  const rule = (status && RULES[status]) || DEFAULT_RULE;
  return {
    href: (rule.path || DEFAULT_RULE.path!)(requestId),
    label: rule.label,
    actionRequired: rule.actionRequired,
    waitingOn: rule.waitingOn,
    phase: rule.phase,
  };
}

export function isRaActionRequired(status: string | null | undefined, pendingWith?: string | null): boolean {
  if ((pendingWith || "").trim().toUpperCase() === "RA") return true;
  if (!status) return false;
  return RULES[status]?.actionRequired === true;
}

/** Call after a list of requests is loaded to open the dossier from `?requestId=`. */
export function consumeDeepLinkedRequest<T extends { id?: number | string; requestId?: number | string }>(
  list: T[],
  select: (item: T) => void,
  key: "id" | "requestId" = "id",
): boolean {
  const match = findByRequestId(list, getSearchRequestId(), key);
  if (!match) return false;
  select(match);
  return true;
}
