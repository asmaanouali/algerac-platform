import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === ENUMS ===
export const userRoles = ["admin", "ra", "oec", "expert"] as const;
export const requestTypes = ["initial", "surveillance", "renouvellement", "extension"] as const;
export const requestStatuses = ["draft", "submitted", "receivability", "planning", "evaluation", "review", "decision", "active", "suspended"] as const;

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: userRoles }).notNull().default("oec"),
  organizationName: text("organization_name"), // For OEC
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === ACCREDITATION REQUESTS (Dossiers) ===
export const accreditationRequests = pgTable("accreditation_requests", {
  id: serial("id").primaryKey(),
  referenceNumber: text("reference_number").notNull().unique(), // e.g., D-2024-001
  oecId: integer("oec_id").notNull(), // Link to user
  type: text("type", { enum: requestTypes }).notNull(),
  domain: text("domain").notNull(), // e.g., "Laboratoire Essais", "Inspection"
  status: text("status", { enum: requestStatuses }).notNull().default("draft"),
  progress: integer("progress").default(0), // 0-100
  submissionDate: timestamp("submission_date"),
  nextActionDate: timestamp("next_action_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === DOCUMENTS ===
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id"), // Optional, some docs might be general
  uploaderId: integer("uploader_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., "manual", "procedure", "form"
  url: text("url").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  uploadDate: timestamp("upload_date").defaultNow(),
});

// === NOTIFICATIONS ===
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"), // info, warning, success, error
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
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertRequestSchema = createInsertSchema(accreditationRequests).omit({ id: true, createdAt: true, referenceNumber: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadDate: true });

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AccreditationRequest = typeof accreditationRequests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type LoginRequest = {
  email: string; // Using email instead of username
  password: string;
};
