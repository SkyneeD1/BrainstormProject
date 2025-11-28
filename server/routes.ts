import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import multer from "multer";
import type { ProcessoRaw, FaseProcessual, ClassificacaoRisco, Empresa } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function normalizeEmpresa(empresaOriginal: string, tipoOrigem: string): Empresa {
  const emp = empresaOriginal?.toUpperCase().trim() || "";
  const tipo = tipoOrigem?.toUpperCase().trim() || "";
  
  if (tipo === "PRÓPRIO" || emp.includes("V.TAL") || emp.includes("VTAL")) {
    return "V.tal";
  }
  if (tipo === "OI" || emp.includes("OI")) {
    return "OI";
  }
  if (emp.includes("SEREDE")) {
    return "Serede";
  }
  if (emp.includes("SPRINK")) {
    return "Sprink";
  }
  return "Outros Terceiros";
}

function normalizeFase(fase: string): FaseProcessual {
  const f = fase?.toUpperCase().trim() || "";
  if (f.includes("CONHECIMENTO")) {
    return "Conhecimento";
  }
  if (f.includes("RECURSAL")) {
    return "Recursal";
  }
  if (f.includes("EXECU")) {
    return "Execução";
  }
  return "Conhecimento";
}

function normalizeRisco(prognostico: string): ClassificacaoRisco {
  const p = prognostico?.toUpperCase().trim() || "";
  if (p.includes("REMOTO")) {
    return "Remoto";
  }
  if (p.includes("POSS")) {
    return "Possível";
  }
  if (p.includes("PROV")) {
    return "Provável";
  }
  return "Remoto";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["admin", "viewer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const user = await storage.updateUserRole(id, role);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.get("/api/passivo", async (req, res) => {
    try {
      const data = await storage.getPassivoData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching passivo data:", error);
      res.status(500).json({ error: "Failed to fetch passivo data" });
    }
  });

  app.get("/api/passivo/raw", async (req, res) => {
    try {
      const data = await storage.getRawData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching raw data:", error);
      res.status(500).json({ error: "Failed to fetch raw data" });
    }
  });

  app.post("/api/passivo/upload", isAuthenticated, isAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

      if (rawData.length < 2) {
        return res.status(400).json({ error: "Planilha vazia ou sem dados" });
      }

      const processos: ProcessoRaw[] = [];

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as any[];
        if (!row || row.length < 7) continue;

        const numeroProcesso = String(row[0] || "").trim();
        const tipoOrigem = String(row[1] || "").trim();
        const empresaOriginal = String(row[2] || "").trim();
        const status = String(row[3] || "").trim();
        const fase = String(row[4] || "").trim();
        const valorTotal = typeof row[5] === "number" ? row[5] : parseFloat(row[5]) || 0;
        const prognostico = String(row[6] || "").trim();

        if (!numeroProcesso || numeroProcesso === "") continue;

        const processo: ProcessoRaw = {
          id: randomUUID(),
          numeroProcesso,
          tipoOrigem,
          empresaOriginal,
          status,
          fase,
          valorTotal: Math.round(valorTotal * 100) / 100,
          prognostico,
          empresa: normalizeEmpresa(empresaOriginal, tipoOrigem),
          faseProcessual: normalizeFase(fase),
          classificacaoRisco: normalizeRisco(prognostico),
        };

        processos.push(processo);
      }

      await storage.setRawData(processos);
      console.log(`Upload: ${processos.length} processos importados`);
      
      res.json({ 
        success: true, 
        count: processos.length,
        message: `${processos.length} processos importados com sucesso`
      });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      res.status(500).json({ error: "Falha ao processar arquivo Excel" });
    }
  });

  return httpServer;
}
