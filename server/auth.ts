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
    pendingUser?: {
      id: string;
      username: string;
      role: string;
      modulePermissions: string[];
    };
  }
}

export async function setupAuth(app: Express) {
  const sessionStore = new PgSession({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: false,
  });

  // Trust proxy for sessions behind nginx
  app.set("trust proxy", 1);
  
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "contencioso-secret-key-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.COOKIE_SECURE === "true",
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
    
    // Get tenants
    const vtalTenant = await storage.getTenantByCode("vtal");
    const nioTenant = await storage.getTenantByCode("nio");
    
    if (!vtalTenant || !nioTenant) {
      console.error("Could not find tenants V.tal or NIO");
      return;
    }
    
    // Check if admin user already exists (by username only, not tenant-specific)
    const allUsers = await storage.getAllUsers();
    const existingAdmin = allUsers.find(u => u.username === "admin");
    
    if (!existingAdmin) {
      // Create single admin user with V.tal as primary tenant
      const passwordHash = await bcrypt.hash("123456", 12);
      const adminUser = await storage.createUser({
        username: "admin",
        passwordHash,
        firstName: "Administrador",
        lastName: "Sistema",
        role: "admin",
        tenantId: vtalTenant.id,
      });
      
      // Add admin to both tenants
      await storage.addUserToTenant(adminUser.id, vtalTenant.id, true);
      await storage.addUserToTenant(adminUser.id, nioTenant.id, false);
      
      console.log("Default admin user created with access to V.tal and NIO (admin/123456)");
    } else {
      // Make sure existing admin has access to both tenants
      const userTenants = await storage.getUserTenants(existingAdmin.id);
      const hasVtal = userTenants.some(t => t.code === "vtal");
      const hasNio = userTenants.some(t => t.code === "nio");
      
      if (!hasVtal) {
        await storage.addUserToTenant(existingAdmin.id, vtalTenant.id, false);
        console.log("Added V.tal access to existing admin");
      }
      if (!hasNio) {
        await storage.addUserToTenant(existingAdmin.id, nioTenant.id, false);
        console.log("Added NIO access to existing admin");
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
