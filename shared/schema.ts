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
  "draft",
  "submitted",
  "receivability",
  "planning",
  "evaluation",
  "review",
  "decision",
  "active",
  "suspended",
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
  submissionDate: timestamp("submission_date"),
  nextActionDate: timestamp("next_action_date"),
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
