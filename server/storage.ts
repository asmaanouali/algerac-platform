import { db } from "./db";
import {
  users, accreditationRequests, documents, notifications,
  type User, type InsertUser, type AccreditationRequest, type InsertRequest, type Document, type Notification
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Requests
  getRequests(): Promise<AccreditationRequest[]>;
  getRequestsByOec(oecId: number): Promise<AccreditationRequest[]>;
  createRequest(request: InsertRequest): Promise<AccreditationRequest>;
  getRequest(id: number): Promise<AccreditationRequest | undefined>;
  updateRequest(id: number, updates: Partial<AccreditationRequest>): Promise<AccreditationRequest>;

  // Documents
  getDocuments(requestId?: number): Promise<Document[]>;
  
  // Notifications
  getNotifications(userId: number): Promise<Notification[]>;
}

export class DatabaseStorage implements IStorage {
  // === Users ===
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // === Requests ===
  async getRequests(): Promise<AccreditationRequest[]> {
    return await db.select().from(accreditationRequests);
  }

  async getRequestsByOec(oecId: number): Promise<AccreditationRequest[]> {
    return await db.select().from(accreditationRequests).where(eq(accreditationRequests.oecId, oecId));
  }

  async createRequest(request: InsertRequest): Promise<AccreditationRequest> {
    const [req] = await db.insert(accreditationRequests).values(request).returning();
    return req;
  }

  async getRequest(id: number): Promise<AccreditationRequest | undefined> {
    const [req] = await db.select().from(accreditationRequests).where(eq(accreditationRequests.id, id));
    return req;
  }

  async updateRequest(id: number, updates: Partial<AccreditationRequest>): Promise<AccreditationRequest> {
    const [req] = await db.update(accreditationRequests).set(updates).where(eq(accreditationRequests.id, id)).returning();
    return req;
  }

  // === Documents ===
  async getDocuments(requestId?: number): Promise<Document[]> {
    if (requestId) {
      return await db.select().from(documents).where(eq(documents.requestId, requestId));
    }
    return await db.select().from(documents);
  }

  // === Notifications ===
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
