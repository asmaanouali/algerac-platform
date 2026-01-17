import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertUserSchema, insertRequestSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === AUTH SETUP ===
  app.use(session({
    secret: process.env.SESSION_SECRET || "algerac_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false, { message: "Utilisateur non trouvé" });
      
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) return done(null, false, { message: "Mot de passe incorrect" });
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // === SEED DATA ===
  const existingUser = await storage.getUserByEmail("admin@algerac.dz");
  if (!existingUser) {
    console.log("Seeding database...");
    const hashedPwd = await hashPassword("password");
    
    // Create Users
    const admin = await storage.createUser({
      email: "admin@algerac.dz",
      password: hashedPwd,
      fullName: "Salah Nacef",
      role: "admin",
      organizationName: "ALGERAC Admin"
    });

    const ra = await storage.createUser({
      email: "amine.belkacemi@algerac.dz",
      password: hashedPwd,
      fullName: "Amine Belkacemi",
      role: "ra",
      organizationName: "ALGERAC RA"
    });

    const oec = await storage.createUser({
      email: "biotest@example.com",
      password: hashedPwd,
      fullName: "Laboratoire BioTest",
      role: "oec",
      organizationName: "Laboratoire BioTest"
    });

    // Create Requests
    await storage.createRequest({
      referenceNumber: "D-2024-001",
      oecId: oec.id,
      type: "initial",
      domain: "Laboratoire Central d'Analyses",
      status: "receivability",
      progress: 15,
      submissionDate: new Date("2024-12-01"),
      nextActionDate: new Date("2025-06-01")
    });

    await storage.createRequest({
      referenceNumber: "D-2024-045",
      oecId: oec.id,
      type: "surveillance",
      domain: "Certif-Tech Algérie",
      status: "planning",
      progress: 45,
      submissionDate: new Date("2024-11-15"),
      nextActionDate: new Date("2025-05-15")
    });

     await storage.createRequest({
      referenceNumber: "D-2023-120",
      oecId: oec.id,
      type: "renouvellement",
      domain: "BioQualité Std",
      status: "evaluation",
      progress: 70,
      submissionDate: new Date("2023-10-10"),
      nextActionDate: new Date("2025-04-01")
    });
    
    console.log("Database seeded!");
  }

  // === API ROUTES ===

  // Auth
  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout(() => {
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Users
  app.get(api.users.list.path, async (req, res) => {
    // In a real app, verify admin role
    const users = await storage.getUserByEmail("admin@algerac.dz"); // Just simple fetch for list
    // Actually we should implement getAllUsers in storage
    res.json([]); // Placeholder
  });

  // Requests
  app.get(api.requests.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    
    if (user.role === 'oec') {
      const requests = await storage.getRequestsByOec(user.id);
      return res.json(requests);
    }
    
    // Admin/RA see all
    const requests = await storage.getRequests();
    res.json(requests);
  });

  app.post(api.requests.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    
    try {
      const input = api.requests.create.input.parse(req.body);
      // Auto-assign OEC ID if not provided (or force it)
      const request = await storage.createRequest({
        ...input,
        oecId: user.role === 'oec' ? user.id : input.oecId || user.id,
        referenceNumber: `D-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      });
      res.status(201).json(request);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.requests.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const request = await storage.getRequest(id);
    if (!request) return res.sendStatus(404);
    res.json(request);
  });

  // Stats
  app.get(api.stats.admin.path, (req, res) => {
    res.json({
      activeUsers: 1248,
      systemHealth: 99.9,
      securityAlerts: 3,
      totalDocuments: 842
    });
  });

  app.get(api.stats.ra.path, (req, res) => {
    res.json({
      activeDossiers: 12,
      criticalAlerts: 2,
      pendingValidation: 4,
      closedThisMonth: 3
    });
  });

  return httpServer;
}
