import {
  pgTable,
  text,
  bigint,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
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

// === USERS (ALIGNÉ À LA BASE) ===
export const users = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  nom: text("nom"),
  prenom: text("prenom"),
  fullName: text("full_name"),

  email: text("email").notNull().unique(),
  emailProfessionnel: text("email_professionnel"),

  password: text("password").notNull(),

  telephone: text("telephone"),
  telephoneDirect: text("telephone_direct"),

  fonction: text("fonction"),
  experience: text("experience"),
  diplomes: text("diplomes"),
  specialite: text("specialite"),
  langues: text("langues"),

  nomOrganisme: text("nom_organisme"),
  typeOrganisme: text("type_organisme"),
  porteeAccreditation: text("portee_accreditation"),

  adresseSiege: text("adresse_siege"),
  disponibilite: text("disponibilite"),

  status: text("status"),
  userType: text("user_type", { enum: userTypes }),
  role: text("role", { enum: userRoles }),

  dateInscription: timestamp("date_inscription", { withTimezone: true }),
  dateApprobation: timestamp("date_approbation", { withTimezone: true }),
});

// === ACCREDITATION REQUESTS ===
export const accreditationRequests = pgTable("accreditation_requests", {
  id: integer("id").primaryKey(),
  referenceNumber: text("reference_number").notNull().unique(),
  oecId: bigint("oec_id", { mode: "number" }).notNull(),
  type: text("type", { enum: requestTypes }).notNull(),
  domain: text("domain").notNull(),
  status: text("status", { enum: requestStatuses }).notNull().default("draft"),
  progress: integer("progress").default(0),
  
  // Workflow
  assignedToRaId: bigint("assigned_to_ra_id", { mode: "number" }),
  assignmentDate: timestamp("assignment_date"),
  
  // Recevabilité
  receivabilityComments: text("receivability_comments"),
  receivabilityDecisionDate: timestamp("receivability_decision_date"),
  isReceivable: boolean("is_receivable"),
  receivabilityCorrectionNeeded: text("receivability_correction_needed"),
  correctionDeadline: timestamp("correction_deadline"),
  correctionSubmittedDate: timestamp("correction_submitted_date"),
  receivabilityAttempts: integer("receivability_attempts"),
  
  // Visite préliminaire
  preliminaryVisitRequired: boolean("preliminary_visit_required"),
  preliminaryVisitAccepted: boolean("preliminary_visit_accepted"),
  preliminaryVisitDate: timestamp("preliminary_visit_date"),
  
  // Workflow tracking
  currentPhase: text("current_phase"),
  currentStep: text("current_step"),
  nextAction: text("next_action"),
  pendingWith: text("pending_with"),
  
  // Dates importantes
  submissionDate: timestamp("submission_date"),
  nextActionDate: timestamp("next_action_date"),
  evaluationStartDate: timestamp("evaluation_start_date"),
  evaluationEndDate: timestamp("evaluation_end_date"),
  casDecisionDate: timestamp("cas_decision_date"),
  certificateIssueDate: timestamp("certificate_issue_date"),
  certificateExpirationDate: timestamp("certificate_expiration_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === DOCUMENTS ===
export const documents = pgTable("documents", {
  id: integer("id").primaryKey(),
  requestId: integer("request_id"),
  uploaderId: bigint("uploader_id", { mode: "number" }).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  status: text("status").default("pending"),
  uploadDate: timestamp("upload_date").defaultNow(),
});

// === NOTIFICATIONS ===
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ many }) => ({
  requests: many(accreditationRequests),
  notifications: many(notifications),
}));

export const requestsRelations = relations(accreditationRequests, ({ one, many }) => ({
  oec: one(users, {
    fields: [accreditationRequests.oecId],
    references: [users.id],
  }),
  documents: many(documents),
}));

// === ZOD SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  dateInscription: true,
  dateApprobation: true,
});

export const insertRequestSchema = createInsertSchema(accreditationRequests).omit({
  id: true,
  referenceNumber: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
});

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AccreditationRequest = typeof accreditationRequests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type LoginRequest = {
  email: string;
  password: string;
};
