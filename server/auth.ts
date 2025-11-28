import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      username: string;
      role: string;
    };
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

  // Seed default admin user if not exists
  await seedDefaultAdmin();
}

async function seedDefaultAdmin() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("123456", 12);
      await storage.createUser({
        username: "admin",
        passwordHash,
        firstName: "Administrador",
        lastName: "Sistema",
        role: "admin",
      });
      console.log("Default admin user created (admin/123456)");
    }
  } catch (error) {
    console.error("Error seeding default admin:", error);
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
