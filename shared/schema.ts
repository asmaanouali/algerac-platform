import { z } from "zod";

// === ENUMS ===
export const userTypes = ["admin", "ra", "dt", "oec", "expert"] as const;
export const userRoles = ["ADMIN", "RA", "CD", "DT", "OEC", "EXPERT"] as const;
export const requestTypes = ["initial", "surveillance", "renouvellement", "extension"] as const;
export const requestStatuses = [
  // Phase initiale
  "draft",
  "submitted",
  "pending_payment",
  "payment_completed",
  "assigned_to_ra",

  // Phase recevabilité
  "receivability_study",
  "receivable",
  "not_receivable",
  "receivability_correction",
  "receivability_resubmitted",

  // Visite préliminaire (optionnel)
  "preliminary_visit_proposed",
  "preliminary_visit_accepted",
  "preliminary_visit_declined",
  "preliminary_visit_scheduled",
  "preliminary_visit_completed",
  "preliminary_visit_report_pending",
  "process_suspended_obstacles",

  // Contractualisation
  "quotation_preparation",
  "quotation_sent_to_dag",
  "quotation_approved_by_dag",
  "quotation_sent_to_dept",
  "quotation_received_from_dept",
  "quotation_sent_to_oec",
  "quotation_validated",
  "quotation_expired",

  // Constitution équipe
  "team_designation",
  "team_sent_to_oec",
  "team_recused",
  "team_validated",

  // Revue documentaire
  "documentary_review",
  "documentary_review_deficiencies",
  "awaiting_oec_doc_response",
  "documentary_review_completed",

  // Préparation évaluation
  "evaluation_plan_preparation",
  "evaluation_plan_validation",
  "evaluation_planned",

  // Évaluation
  "evaluation_in_progress",
  "evaluation_completed",

  // Traitement écarts
  "awaiting_action_plans",
  "action_plans_evaluation",
  "action_plans_implementation",
  "complementary_evaluation_needed",
  "complementary_evaluation_planned",
  "complementary_evaluation_progress",
  "gaps_resolved",

  // Rapport
  "report_drafting",
  "report_validation",
  "report_validated",

  // Décision CAS
  "cas_preparation",
  "cas_scheduled",
  "cas_decision_grant",
  "cas_decision_refusal",
  "cas_decision_postponement",

  // Post-décision
  "certificate_preparation",
  "certificate_issued",

  // Statuts finaux
  "active",
  "suspended",
  "withdrawn",
  "closed",

  // Surveillance
  "surveillance_scheduled",
  "surveillance_in_progress",
  "surveillance_completed",
] as const;

// === ZOD SCHEMAS ===
export const insertUserSchema = z.object({
  nom: z.string().nullable().optional(),
  prenom: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  email: z.string().email(),
  emailProfessionnel: z.string().nullable().optional(),
  password: z.string(),
  telephone: z.string().nullable().optional(),
  telephoneDirect: z.string().nullable().optional(),
  fonction: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  diplomes: z.string().nullable().optional(),
  specialite: z.string().nullable().optional(),
  langues: z.string().nullable().optional(),
  nomOrganisme: z.string().nullable().optional(),
  typeOrganisme: z.string().nullable().optional(),
  porteeAccreditation: z.string().nullable().optional(),
  adresseSiege: z.string().nullable().optional(),
  disponibilite: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  userType: z.enum(userTypes).nullable().optional(),
  role: z.enum(userRoles).nullable().optional(),
});

export const insertRequestSchema = z.object({
  oecId: z.number(),
  type: z.enum(requestTypes),
  domain: z.string(),
  status: z.enum(requestStatuses).default("draft"),
  progress: z.number().default(0),
  assignedToRaId: z.number().nullable().optional(),
  assignmentDate: z.string().nullable().optional(),
  receivabilityComments: z.string().nullable().optional(),
  receivabilityDecisionDate: z.string().nullable().optional(),
  isReceivable: z.boolean().nullable().optional(),
  receivabilityCorrectionNeeded: z.string().nullable().optional(),
  correctionDeadline: z.string().nullable().optional(),
  correctionSubmittedDate: z.string().nullable().optional(),
  receivabilityAttempts: z.number().nullable().optional(),
  preliminaryVisitRequired: z.boolean().nullable().optional(),
  preliminaryVisitAccepted: z.boolean().nullable().optional(),
  preliminaryVisitDate: z.string().nullable().optional(),
  currentPhase: z.string().nullable().optional(),
  currentStep: z.string().nullable().optional(),
  nextAction: z.string().nullable().optional(),
  pendingWith: z.string().nullable().optional(),
  submissionDate: z.string().nullable().optional(),
  nextActionDate: z.string().nullable().optional(),
  evaluationStartDate: z.string().nullable().optional(),
  evaluationEndDate: z.string().nullable().optional(),
  casDecisionDate: z.string().nullable().optional(),
  certificateIssueDate: z.string().nullable().optional(),
  certificateExpirationDate: z.string().nullable().optional(),
});

export const insertDocumentSchema = z.object({
  requestId: z.number().nullable().optional(),
  uploaderId: z.number(),
  name: z.string(),
  type: z.string(),
  url: z.string(),
  status: z.string().default("pending"),
});

// === TYPES ===
export type UserType = (typeof userTypes)[number];
export type UserRole = (typeof userRoles)[number];
export type RequestType = (typeof requestTypes)[number];
export type RequestStatus = (typeof requestStatuses)[number];

export type User = {
  id: number;
  nom: string | null;
  prenom: string | null;
  fullName: string | null;
  email: string;
  emailProfessionnel: string | null;
  password: string;
  telephone: string | null;
  telephoneDirect: string | null;
  fonction: string | null;
  experience: string | null;
  diplomes: string | null;
  specialite: string | null;
  /** @deprecated Use `specialite`. Some API responses may return this camelCase alias. */
  speciality?: string | null;
  langues: string | null;
  nomOrganisme: string | null;
  /** @deprecated Use `nomOrganisme`. Some API responses may return this English alias. */
  organizationName?: string | null;
  typeOrganisme: string | null;
  porteeAccreditation: string | null;
  adresseSiege: string | null;
  disponibilite: string | null;
  status: string | null;
  userType: UserType | null;
  role: UserRole | null;
  dateInscription: string | null;
  dateApprobation: string | null;
};

export type InsertUser = z.infer<typeof insertUserSchema>;

export type AccreditationRequest = {
  id: number;
  referenceNumber: string;
  oecId: number;
  type: RequestType;
  domain: string;
  status: RequestStatus;
  progress: number | null;
  assignedToRaId: number | null;
  assignmentDate: string | null;
  receivabilityComments: string | null;
  receivabilityDecisionDate: string | null;
  isReceivable: boolean | null;
  receivabilityCorrectionNeeded: string | null;
  correctionDeadline: string | null;
  correctionSubmittedDate: string | null;
  receivabilityAttempts: number | null;
  preliminaryVisitRequired: boolean | null;
  preliminaryVisitAccepted: boolean | null;
  preliminaryVisitDate: string | null;
  currentPhase: string | null;
  currentStep: string | null;
  nextAction: string | null;
  pendingWith: string | null;
  submissionDate: string | null;
  nextActionDate: string | null;
  evaluationStartDate: string | null;
  evaluationEndDate: string | null;
  casDecisionDate: string | null;
  certificateIssueDate: string | null;
  certificateExpirationDate: string | null;
  createdAt: string | null;
};

export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type Document = {
  id: number;
  requestId: number | null;
  uploaderId: number;
  name: string;
  type: string;
  url: string;
  status: string | null;
  uploadDate: string | null;
};

export type Notification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string | null;
  read: boolean | null;
  createdAt: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};
