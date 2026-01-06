import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import type { SessionUser } from "@shared/schema";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    user: SessionUser;
  }
}

export async function setupAuth(app: Express) {
  const sessionStore = new PgSession({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: false,
  });

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "contencioso-secret-key-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax",
      },
    })
  );

  // Seed default tenants and admin users
  await seedDefaultTenantsAndAdmins();
}

async function seedDefaultTenantsAndAdmins() {
  try {
    // First, seed default tenants
    await storage.seedDefaultTenants();
    
    // Get tenants to create admin users
    const vtalTenant = await storage.getTenantByCode("vtal");
    const nioTenant = await storage.getTenantByCode("nio");
    
    // Create admin for V.tal if doesn't exist
    if (vtalTenant) {
      const existingVtalAdmin = await storage.getUserByUsernameAndTenant("admin", vtalTenant.id);
      if (!existingVtalAdmin) {
        const passwordHash = await bcrypt.hash("123456", 12);
        await storage.createUser({
          username: "admin",
          passwordHash,
          firstName: "Administrador",
          lastName: "V.tal",
          role: "admin",
          tenantId: vtalTenant.id,
        });
        console.log("Default V.tal admin user created (admin/123456)");
      }
    }
    
    // Create admin for NIO if doesn't exist
    if (nioTenant) {
      const existingNioAdmin = await storage.getUserByUsernameAndTenant("admin", nioTenant.id);
      if (!existingNioAdmin) {
        const passwordHash = await bcrypt.hash("123456", 12);
        await storage.createUser({
          username: "admin",
          passwordHash,
          firstName: "Administrador",
          lastName: "NIO",
          role: "admin",
          tenantId: nioTenant.id,
        });
        console.log("Default NIO admin user created (admin/123456)");
      }
    }
  } catch (error) {
    console.error("Error seeding default tenants and admins:", error);
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
}

export function requireModule(moduleId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (user.role === "admin") {
      return next();
    }
    
    const permissions = user.modulePermissions || [];
    if (permissions.includes(moduleId)) {
      return next();
    }
    
    res.status(403).json({ message: "Forbidden: Module access required" });
  };
}
