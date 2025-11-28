import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import type { Processo, FaseProcessual, ClassificacaoRisco, Empresa } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  app.post("/api/passivo/upload", async (req, res) => {
    try {
      const excelPath = path.join(process.cwd(), "attached_assets", "planilha brainstorm_1764342046398.xlsx");
      
      if (!fs.existsSync(excelPath)) {
        return res.status(404).json({ error: "Excel file not found" });
      }

      const workbook = XLSX.readFile(excelPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const validFases: FaseProcessual[] = ["Conhecimento", "Recursal", "Execução"];
      const validRiscos: ClassificacaoRisco[] = ["Remoto", "Possível", "Provável"];
      const validEmpresas: Empresa[] = ["V.tal", "OI", "Serede", "Sprink", "Outros Terceiros"];

      const processos: Processo[] = jsonData.map((row: any) => {
        let empresa = row.empresa || row.Empresa || "Outros Terceiros";
        if (!validEmpresas.includes(empresa)) {
          empresa = "Outros Terceiros";
        }

        let fase = row.fase || row.Fase || row.faseProcessual || "Conhecimento";
        if (!validFases.includes(fase)) {
          fase = "Conhecimento";
        }

        let risco = row.risco || row.Risco || row.classificacaoRisco || "Remoto";
        if (!validRiscos.includes(risco)) {
          risco = "Remoto";
        }

        return {
          id: randomUUID(),
          empresa: empresa as Empresa,
          faseProcessual: fase as FaseProcessual,
          classificacaoRisco: risco as ClassificacaoRisco,
          numeroProcessos: Number(row.processos || row.numeroProcessos || row.Processos || 0),
          valorTotalRisco: Number(row.valor || row.valorTotalRisco || row.Valor || 0),
        };
      });

      await storage.setRawData(processos);
      res.json({ success: true, count: processos.length });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  return httpServer;
}
