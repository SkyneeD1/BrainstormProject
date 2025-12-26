import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, hashPassword, verifyPassword } from "./auth";
import { 
  loginSchema, 
  createUserSchema, 
  updatePasswordSchema, 
  updateRoleSchema,
  insertTRTSchema,
  insertVaraSchema,
  insertJuizSchema,
  insertJulgamentoSchema,
  insertAudienciaSchema,
  insertDistribuidoSchema,
  insertEncerradoSchema,
  insertSentencaMeritoSchema,
  insertAcordaoMeritoSchema,
  insertTurmaSchema,
  insertDesembargadorSchema,
  insertDecisaoRpacSchema
} from "@shared/schema";
import XLSX from "xlsx";
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
  
  // Initialize Brainstorm data from Excel
  await storage.initializeBrainstorm();

  // Login route
  app.post('/api/login', async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const { username, password } = parsed.data;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      // Set session
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro no servidor" });
    }
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao sair" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        createdAt: u.createdAt,
      })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create user (admin only)
  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const { username, password, firstName, lastName, role } = parsed.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        username,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: role || "viewer",
      });

      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  // Update user role (admin only)
  app.patch("/api/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const parsed = updateRoleSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const user = await storage.updateUserRole(id, parsed.data.role);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Erro ao atualizar função" });
    }
  });

  // Update user password (admin only)
  app.patch("/api/users/:id/password", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const parsed = updatePasswordSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const passwordHash = await hashPassword(parsed.data.newPassword);
      const user = await storage.updateUserPassword(id, passwordHash);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ success: true, message: "Senha atualizada com sucesso" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Erro ao atualizar senha" });
    }
  });

  // Passivo data routes (authenticated)
  app.get("/api/passivo", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getPassivoData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching passivo data:", error);
      res.status(500).json({ error: "Failed to fetch passivo data" });
    }
  });

  app.get("/api/passivo/raw", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getRawData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching raw data:", error);
      res.status(500).json({ error: "Failed to fetch raw data" });
    }
  });

  app.delete("/api/passivo", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.clearRawData();
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing passivo data:", error);
      res.status(500).json({ error: "Erro ao apagar dados do passivo" });
    }
  });

  // Upload Excel (admin only)
  app.post("/api/passivo/upload", isAuthenticated, isAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Try to read with headers first
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      
      if (jsonData.length === 0) {
        return res.status(400).json({ error: "Planilha vazia ou sem dados" });
      }

      const processos: ProcessoRaw[] = [];
      
      // Get headers from first row to detect column mapping
      const sampleRow = jsonData[0];
      const headers = Object.keys(sampleRow);
      
      // Find column indices by partial matching header names
      const findColumn = (patterns: string[]) => {
        return headers.find(h => {
          const headerLower = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return patterns.some(p => headerLower.includes(p.toLowerCase()));
        });
      };
      
      const colNumeroProcesso = findColumn(["numero do processo", "processo", "cnj", "numero"]);
      const colTipoOrigem = findColumn(["proprio", "oi", "terceiro", "tipo"]);
      const colEmpresa = findColumn(["empresa", "empregadora", "terceira"]);
      const colStatus = findColumn(["status"]);
      const colFase = findColumn(["fase"]);
      const colValor = findColumn(["valor", "total"]);
      const colPrognostico = findColumn(["prognostico", "perda", "risco"]);
      
      console.log("Detected columns:", { colNumeroProcesso, colTipoOrigem, colEmpresa, colStatus, colFase, colValor, colPrognostico });
      
      if (!colNumeroProcesso) {
        return res.status(400).json({ 
          error: "Não foi possível encontrar a coluna de número do processo. Certifique-se de que a planilha tem uma coluna com 'Número do Processo' ou similar no cabeçalho.",
          headers: headers.slice(0, 10)
        });
      }

      for (const row of jsonData) {
        const numeroProcesso = String(row[colNumeroProcesso] || "").trim();
        if (!numeroProcesso || numeroProcesso === "") continue;
        
        const tipoOrigem = colTipoOrigem ? String(row[colTipoOrigem] || "").trim() : "";
        const empresaOriginal = colEmpresa ? String(row[colEmpresa] || "").trim() : "";
        const status = colStatus ? String(row[colStatus] || "").trim() : "ATIVO";
        const fase = colFase ? String(row[colFase] || "").trim() : "CONHECIMENTO";
        const valorRaw = colValor ? row[colValor] : 0;
        const valorTotal = typeof valorRaw === "number" ? valorRaw : parseFloat(String(valorRaw).replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
        const prognostico = colPrognostico ? String(row[colPrognostico] || "").trim() : "POSSÍVEL";

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

  // ========== Passivo Mensal Routes ==========
  
  // Get all available periods
  app.get("/api/passivo/periodos", isAuthenticated, async (req, res) => {
    try {
      const periodos = await storage.getAllPassivoMensalPeriodos();
      res.json(periodos);
    } catch (error) {
      console.error("Error fetching passivo periods:", error);
      res.status(500).json({ error: "Erro ao buscar períodos" });
    }
  });

  // Get passivo data for a specific month/year
  app.get("/api/passivo/mensal/:ano/:mes", isAuthenticated, async (req, res) => {
    try {
      const { ano, mes } = req.params;
      const data = await storage.getPassivoMensal(mes, ano);
      
      if (!data) {
        return res.status(404).json({ error: "Dados não encontrados para este período" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching monthly passivo:", error);
      res.status(500).json({ error: "Erro ao buscar dados mensais" });
    }
  });

  // Upload Excel with month/year selection (admin only)
  app.post("/api/passivo/mensal/upload", isAuthenticated, isAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }
      
      const mes = req.body.mes as string;
      const ano = req.body.ano as string;
      
      if (!mes || !ano) {
        return res.status(400).json({ error: "Mês e ano são obrigatórios" });
      }
      
      // Validate month format (01-12)
      if (!/^(0[1-9]|1[0-2])$/.test(mes)) {
        return res.status(400).json({ error: "Mês inválido. Use formato 01-12" });
      }
      
      // Validate year format
      if (!/^\d{4}$/.test(ano)) {
        return res.status(400).json({ error: "Ano inválido. Use formato AAAA" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      
      if (jsonData.length === 0) {
        return res.status(400).json({ error: "Planilha vazia ou sem dados" });
      }

      const processos: ProcessoRaw[] = [];
      
      const sampleRow = jsonData[0];
      const headers = Object.keys(sampleRow);
      
      const findColumn = (patterns: string[]) => {
        return headers.find(h => {
          const headerLower = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return patterns.some(p => headerLower.includes(p.toLowerCase()));
        });
      };
      
      const colNumeroProcesso = findColumn(["numero do processo", "processo", "cnj", "numero"]);
      const colTipoOrigem = findColumn(["proprio", "oi", "terceiro", "tipo"]);
      const colEmpresa = findColumn(["empresa", "empregadora", "terceira"]);
      const colStatus = findColumn(["status"]);
      const colFase = findColumn(["fase"]);
      const colValor = findColumn(["valor", "total"]);
      const colPrognostico = findColumn(["prognostico", "perda", "risco"]);
      
      if (!colNumeroProcesso) {
        return res.status(400).json({ 
          error: "Não foi possível encontrar a coluna de número do processo.",
          headers: headers.slice(0, 10)
        });
      }

      for (const row of jsonData) {
        const numeroProcesso = String(row[colNumeroProcesso] || "").trim();
        if (!numeroProcesso || numeroProcesso === "") continue;
        
        const tipoOrigem = colTipoOrigem ? String(row[colTipoOrigem] || "").trim() : "";
        const empresaOriginal = colEmpresa ? String(row[colEmpresa] || "").trim() : "";
        const status = colStatus ? String(row[colStatus] || "").trim() : "ATIVO";
        const fase = colFase ? String(row[colFase] || "").trim() : "CONHECIMENTO";
        const valorRaw = colValor ? row[colValor] : 0;
        const valorTotal = typeof valorRaw === "number" ? valorRaw : parseFloat(String(valorRaw).replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
        const prognostico = colPrognostico ? String(row[colPrognostico] || "").trim() : "POSSÍVEL";

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

      // Save to in-memory for current view
      await storage.setRawData(processos);
      
      // Get computed passivo data and save to database with month/year
      const passivoData = await storage.getPassivoData();
      await storage.savePassivoMensal(mes, ano, passivoData);
      
      console.log(`Upload mensal: ${processos.length} processos importados para ${mes}/${ano}`);
      
      res.json({ 
        success: true, 
        count: processos.length,
        mes,
        ano,
        message: `${processos.length} processos importados para ${mes}/${ano}`
      });
    } catch (error) {
      console.error("Error processing monthly Excel file:", error);
      res.status(500).json({ error: "Falha ao processar arquivo Excel" });
    }
  });

  // Delete passivo for a specific month/year (admin only)
  app.delete("/api/passivo/mensal/:ano/:mes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ano, mes } = req.params;
      await storage.deletePassivoMensal(mes, ano);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting monthly passivo:", error);
      res.status(500).json({ error: "Erro ao apagar dados mensais" });
    }
  });

  // Compare two months
  app.get("/api/passivo/comparar", isAuthenticated, async (req, res) => {
    try {
      const { mes1, ano1, mes2, ano2 } = req.query;
      
      if (!mes1 || !ano1 || !mes2 || !ano2) {
        return res.status(400).json({ error: "Parâmetros mes1, ano1, mes2 e ano2 são obrigatórios" });
      }
      
      const dados1 = await storage.getPassivoMensal(mes1 as string, ano1 as string);
      const dados2 = await storage.getPassivoMensal(mes2 as string, ano2 as string);
      
      if (!dados1 || !dados2) {
        return res.status(404).json({ error: "Dados não encontrados para um ou ambos os períodos" });
      }
      
      const diferencaProcessos = dados2.summary.totalProcessos - dados1.summary.totalProcessos;
      const percentualProcessos = dados1.summary.totalProcessos > 0 
        ? Math.round((diferencaProcessos / dados1.summary.totalProcessos) * 100)
        : 0;
      
      const diferencaValor = dados2.summary.totalPassivo - dados1.summary.totalPassivo;
      const percentualValor = dados1.summary.totalPassivo > 0
        ? Math.round((diferencaValor / dados1.summary.totalPassivo) * 100)
        : 0;
      
      res.json({
        mes1: { mes: mes1, ano: ano1, dados: dados1 },
        mes2: { mes: mes2, ano: ano2, dados: dados2 },
        diferenca: {
          processos: diferencaProcessos,
          percentualProcessos,
          valorTotal: diferencaValor,
          percentualValor
        }
      });
    } catch (error) {
      console.error("Error comparing passivo data:", error);
      res.status(500).json({ error: "Erro ao comparar dados" });
    }
  });

  // ========== TRT Routes ==========
  app.get("/api/trts", isAuthenticated, async (req, res) => {
    try {
      const trts = await storage.getAllTRTs();
      res.json(trts);
    } catch (error) {
      console.error("Error fetching TRTs:", error);
      res.status(500).json({ error: "Erro ao buscar TRTs" });
    }
  });

  app.get("/api/trts/:id", isAuthenticated, async (req, res) => {
    try {
      const trt = await storage.getTRT(req.params.id);
      if (!trt) {
        return res.status(404).json({ error: "TRT não encontrado" });
      }
      res.json(trt);
    } catch (error) {
      console.error("Error fetching TRT:", error);
      res.status(500).json({ error: "Erro ao buscar TRT" });
    }
  });

  app.post("/api/trts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertTRTSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const trt = await storage.createTRT(parsed.data);
      res.status(201).json(trt);
    } catch (error) {
      console.error("Error creating TRT:", error);
      res.status(500).json({ error: "Erro ao criar TRT" });
    }
  });

  app.patch("/api/trts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const trt = await storage.updateTRT(req.params.id, req.body);
      if (!trt) {
        return res.status(404).json({ error: "TRT não encontrado" });
      }
      res.json(trt);
    } catch (error) {
      console.error("Error updating TRT:", error);
      res.status(500).json({ error: "Erro ao atualizar TRT" });
    }
  });

  app.delete("/api/trts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteTRT(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting TRT:", error);
      res.status(500).json({ error: "Erro ao excluir TRT" });
    }
  });

  // ========== Vara Routes ==========
  app.get("/api/trts/:trtId/varas", isAuthenticated, async (req, res) => {
    try {
      const varas = await storage.getVarasByTRT(req.params.trtId);
      res.json(varas);
    } catch (error) {
      console.error("Error fetching varas:", error);
      res.status(500).json({ error: "Erro ao buscar varas" });
    }
  });

  app.get("/api/varas/:id", isAuthenticated, async (req, res) => {
    try {
      const vara = await storage.getVara(req.params.id);
      if (!vara) {
        return res.status(404).json({ error: "Vara não encontrada" });
      }
      res.json(vara);
    } catch (error) {
      console.error("Error fetching vara:", error);
      res.status(500).json({ error: "Erro ao buscar vara" });
    }
  });

  app.post("/api/varas", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertVaraSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const vara = await storage.createVara(parsed.data);
      res.status(201).json(vara);
    } catch (error) {
      console.error("Error creating vara:", error);
      res.status(500).json({ error: "Erro ao criar vara" });
    }
  });

  app.patch("/api/varas/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const vara = await storage.updateVara(req.params.id, req.body);
      if (!vara) {
        return res.status(404).json({ error: "Vara não encontrada" });
      }
      res.json(vara);
    } catch (error) {
      console.error("Error updating vara:", error);
      res.status(500).json({ error: "Erro ao atualizar vara" });
    }
  });

  app.delete("/api/varas/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteVara(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vara:", error);
      res.status(500).json({ error: "Erro ao excluir vara" });
    }
  });

  // ========== Juiz Routes ==========
  app.get("/api/varas/:varaId/juizes", isAuthenticated, async (req, res) => {
    try {
      const juizes = await storage.getJuizesByVara(req.params.varaId);
      res.json(juizes);
    } catch (error) {
      console.error("Error fetching juizes:", error);
      res.status(500).json({ error: "Erro ao buscar juízes" });
    }
  });

  app.get("/api/juizes/:id", isAuthenticated, async (req, res) => {
    try {
      const juiz = await storage.getJuiz(req.params.id);
      if (!juiz) {
        return res.status(404).json({ error: "Juiz não encontrado" });
      }
      res.json(juiz);
    } catch (error) {
      console.error("Error fetching juiz:", error);
      res.status(500).json({ error: "Erro ao buscar juiz" });
    }
  });

  app.post("/api/juizes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertJuizSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const data = {
        ...parsed.data,
        dataEntrada: parsed.data.dataEntrada ? new Date(parsed.data.dataEntrada) : null,
        dataSaida: parsed.data.dataSaida ? new Date(parsed.data.dataSaida) : null,
      };
      const juiz = await storage.createJuiz(data);
      res.status(201).json(juiz);
    } catch (error) {
      console.error("Error creating juiz:", error);
      res.status(500).json({ error: "Erro ao criar juiz" });
    }
  });

  app.patch("/api/juizes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const juiz = await storage.updateJuiz(req.params.id, req.body);
      if (!juiz) {
        return res.status(404).json({ error: "Juiz não encontrado" });
      }
      res.json(juiz);
    } catch (error) {
      console.error("Error updating juiz:", error);
      res.status(500).json({ error: "Erro ao atualizar juiz" });
    }
  });

  app.delete("/api/juizes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteJuiz(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting juiz:", error);
      res.status(500).json({ error: "Erro ao excluir juiz" });
    }
  });

  // ========== Julgamento Routes ==========
  app.get("/api/juizes/:juizId/julgamentos", isAuthenticated, async (req, res) => {
    try {
      const julgamentos = await storage.getJulgamentosByJuiz(req.params.juizId);
      res.json(julgamentos);
    } catch (error) {
      console.error("Error fetching julgamentos:", error);
      res.status(500).json({ error: "Erro ao buscar julgamentos" });
    }
  });

  app.get("/api/julgamentos/:id", isAuthenticated, async (req, res) => {
    try {
      const julgamento = await storage.getJulgamento(req.params.id);
      if (!julgamento) {
        return res.status(404).json({ error: "Julgamento não encontrado" });
      }
      res.json(julgamento);
    } catch (error) {
      console.error("Error fetching julgamento:", error);
      res.status(500).json({ error: "Erro ao buscar julgamento" });
    }
  });

  app.post("/api/julgamentos", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertJulgamentoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const data = {
        ...parsed.data,
        dataJulgamento: parsed.data.dataJulgamento ? new Date(parsed.data.dataJulgamento) : null,
      };
      const julgamento = await storage.createJulgamento(data);
      res.status(201).json(julgamento);
    } catch (error) {
      console.error("Error creating julgamento:", error);
      res.status(500).json({ error: "Erro ao criar julgamento" });
    }
  });

  app.patch("/api/julgamentos/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const julgamento = await storage.updateJulgamento(req.params.id, req.body);
      if (!julgamento) {
        return res.status(404).json({ error: "Julgamento não encontrado" });
      }
      res.json(julgamento);
    } catch (error) {
      console.error("Error updating julgamento:", error);
      res.status(500).json({ error: "Erro ao atualizar julgamento" });
    }
  });

  app.delete("/api/julgamentos/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteJulgamento(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting julgamento:", error);
      res.status(500).json({ error: "Erro ao excluir julgamento" });
    }
  });

  // ========== Favorabilidade Routes ==========
  app.get("/api/juizes/:id/favorabilidade", isAuthenticated, async (req, res) => {
    try {
      const favorabilidade = await storage.getJuizFavorabilidade(req.params.id);
      res.json(favorabilidade);
    } catch (error) {
      console.error("Error fetching favorabilidade:", error);
      res.status(500).json({ error: "Erro ao buscar favorabilidade" });
    }
  });

  app.get("/api/favorabilidade/juizes", isAuthenticated, async (req, res) => {
    try {
      const juizes = await storage.getAllJuizesComFavorabilidade();
      res.json(juizes);
    } catch (error) {
      console.error("Error fetching juizes com favorabilidade:", error);
      res.status(500).json({ error: "Erro ao buscar juízes com favorabilidade" });
    }
  });

  app.get("/api/favorabilidade/trts", isAuthenticated, async (req, res) => {
    try {
      const trts = await storage.getAllTRTsComFavorabilidade();
      res.json(trts);
    } catch (error) {
      console.error("Error fetching TRTs com favorabilidade:", error);
      res.status(500).json({ error: "Erro ao buscar TRTs com favorabilidade" });
    }
  });

  // ========== Turma Routes (Mapas Estratégicos) ==========
  app.get("/api/turmas", isAuthenticated, async (req, res) => {
    try {
      const turmas = await storage.getAllTurmas();
      res.json(turmas);
    } catch (error) {
      console.error("Error fetching turmas:", error);
      res.status(500).json({ error: "Erro ao buscar turmas" });
    }
  });

  app.get("/api/turmas/:id", isAuthenticated, async (req, res) => {
    try {
      const turma = await storage.getTurma(req.params.id);
      if (!turma) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }
      res.json(turma);
    } catch (error) {
      console.error("Error fetching turma:", error);
      res.status(500).json({ error: "Erro ao buscar turma" });
    }
  });

  app.post("/api/turmas", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertTurmaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const turma = await storage.createTurma(parsed.data);
      res.status(201).json(turma);
    } catch (error) {
      console.error("Error creating turma:", error);
      res.status(500).json({ error: "Erro ao criar turma" });
    }
  });

  app.patch("/api/turmas/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const turma = await storage.updateTurma(req.params.id, req.body);
      if (!turma) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }
      res.json(turma);
    } catch (error) {
      console.error("Error updating turma:", error);
      res.status(500).json({ error: "Erro ao atualizar turma" });
    }
  });

  app.delete("/api/turmas/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteTurma(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting turma:", error);
      res.status(500).json({ error: "Erro ao excluir turma" });
    }
  });

  // ========== Desembargador Routes (Mapas Estratégicos) ==========
  app.get("/api/desembargadores", isAuthenticated, async (req, res) => {
    try {
      const desembargadores = await storage.getAllDesembargadores();
      res.json(desembargadores);
    } catch (error) {
      console.error("Error fetching desembargadores:", error);
      res.status(500).json({ error: "Erro ao buscar desembargadores" });
    }
  });

  app.get("/api/turmas/:turmaId/desembargadores", isAuthenticated, async (req, res) => {
    try {
      const desembargadores = await storage.getDesembargadoresByTurma(req.params.turmaId);
      res.json(desembargadores);
    } catch (error) {
      console.error("Error fetching desembargadores by turma:", error);
      res.status(500).json({ error: "Erro ao buscar desembargadores" });
    }
  });

  app.get("/api/desembargadores/:id", isAuthenticated, async (req, res) => {
    try {
      const desembargador = await storage.getDesembargador(req.params.id);
      if (!desembargador) {
        return res.status(404).json({ error: "Desembargador não encontrado" });
      }
      res.json(desembargador);
    } catch (error) {
      console.error("Error fetching desembargador:", error);
      res.status(500).json({ error: "Erro ao buscar desembargador" });
    }
  });

  app.post("/api/desembargadores", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertDesembargadorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const desembargador = await storage.createDesembargador(parsed.data);
      res.status(201).json(desembargador);
    } catch (error) {
      console.error("Error creating desembargador:", error);
      res.status(500).json({ error: "Erro ao criar desembargador" });
    }
  });

  app.patch("/api/desembargadores/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const desembargador = await storage.updateDesembargador(req.params.id, req.body);
      if (!desembargador) {
        return res.status(404).json({ error: "Desembargador não encontrado" });
      }
      res.json(desembargador);
    } catch (error) {
      console.error("Error updating desembargador:", error);
      res.status(500).json({ error: "Erro ao atualizar desembargador" });
    }
  });

  app.delete("/api/desembargadores/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteDesembargador(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting desembargador:", error);
      res.status(500).json({ error: "Erro ao excluir desembargador" });
    }
  });

  // ========== Mapa de Decisões Routes ==========
  app.get("/api/mapa-decisoes", isAuthenticated, async (req, res) => {
    try {
      const mapa = await storage.getMapaDecisoesGeral();
      res.json(mapa);
    } catch (error) {
      console.error("Error fetching mapa de decisões:", error);
      res.status(500).json({ error: "Erro ao buscar mapa de decisões" });
    }
  });

  app.get("/api/mapa-decisoes/admin", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const instancia = (req.query.instancia as string) || 'segunda';
      const data = await storage.getMapaDecisoesAdminData(instancia);
      res.json(data);
    } catch (error) {
      console.error("Error fetching mapa de decisões admin data:", error);
      res.status(500).json({ error: "Erro ao buscar dados administrativos" });
    }
  });

  // ========== Decisões RPAC Routes ==========
  app.get("/api/decisoes", isAuthenticated, async (req, res) => {
    try {
      const decisoes = await storage.getAllDecisoesRpac();
      res.json(decisoes);
    } catch (error) {
      console.error("Error fetching decisoes:", error);
      res.status(500).json({ error: "Erro ao buscar decisões" });
    }
  });

  app.get("/api/desembargadores/:desembargadorId/decisoes", isAuthenticated, async (req, res) => {
    try {
      const decisoes = await storage.getDecisoesRpacByDesembargador(req.params.desembargadorId);
      res.json(decisoes);
    } catch (error) {
      console.error("Error fetching decisoes:", error);
      res.status(500).json({ error: "Erro ao buscar decisões" });
    }
  });

  app.post("/api/decisoes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertDecisaoRpacSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const data = {
        ...parsed.data,
        dataDecisao: parsed.data.dataDecisao ? new Date(parsed.data.dataDecisao) : undefined,
      };
      const decisao = await storage.createDecisaoRpac(data);
      res.status(201).json(decisao);
    } catch (error) {
      console.error("Error creating decisao:", error);
      res.status(500).json({ error: "Erro ao criar decisão" });
    }
  });

  app.patch("/api/decisoes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        dataDecisao: req.body.dataDecisao ? new Date(req.body.dataDecisao) : undefined,
      };
      const decisao = await storage.updateDecisaoRpac(req.params.id, updateData);
      if (!decisao) {
        return res.status(404).json({ error: "Decisão não encontrada" });
      }
      res.json(decisao);
    } catch (error) {
      console.error("Error updating decisao:", error);
      res.status(500).json({ error: "Erro ao atualizar decisão" });
    }
  });

  app.delete("/api/decisoes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteDecisaoRpac(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting decisao:", error);
      res.status(500).json({ error: "Erro ao excluir decisão" });
    }
  });

  app.post("/api/decisoes/batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { decisoes } = req.body;
      if (!Array.isArray(decisoes) || decisoes.length === 0) {
        return res.status(400).json({ error: "Lista de decisões vazia ou inválida" });
      }
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < decisoes.length; i++) {
        const decisaoData = decisoes[i];
        try {
          const parsed = insertDecisaoRpacSchema.safeParse(decisaoData);
          if (!parsed.success) {
            errors.push({ index: i, error: parsed.error.errors[0]?.message || "Dados inválidos" });
            continue;
          }
          const data = {
            ...parsed.data,
            dataDecisao: parsed.data.dataDecisao ? new Date(parsed.data.dataDecisao) : undefined,
          };
          const decisao = await storage.createDecisaoRpac(data);
          results.push(decisao);
        } catch (err) {
          errors.push({ index: i, error: "Erro ao criar decisão" });
        }
      }
      
      res.status(201).json({ 
        success: results.length, 
        errors: errors.length,
        errorDetails: errors,
        results 
      });
    } catch (error) {
      console.error("Error batch creating decisoes:", error);
      res.status(500).json({ error: "Erro ao criar decisões em lote" });
    }
  });

  // ========== Mapa de Decisões Analytics Routes ==========
  app.get("/api/mapa-decisoes/trts", isAuthenticated, async (req, res) => {
    try {
      const responsabilidade = req.query.responsabilidade as string | undefined;
      const empresa = req.query.empresa as string | undefined;
      const instancia = (req.query.instancia as string) || 'segunda';
      const numeroProcesso = req.query.numeroProcesso as string | undefined;
      const trts = await storage.getTRTsComEstatisticas(responsabilidade, empresa, instancia, numeroProcesso);
      res.json(trts);
    } catch (error) {
      console.error("Error fetching TRTs:", error);
      res.status(500).json({ error: "Erro ao buscar TRTs" });
    }
  });

  app.get("/api/mapa-decisoes/turmas/:trtNome", isAuthenticated, async (req, res) => {
    try {
      const responsabilidade = req.query.responsabilidade as string | undefined;
      const empresa = req.query.empresa as string | undefined;
      const instancia = (req.query.instancia as string) || 'segunda';
      const numeroProcesso = req.query.numeroProcesso as string | undefined;
      const turmas = await storage.getTurmasByTRT(decodeURIComponent(req.params.trtNome), responsabilidade, empresa, instancia, numeroProcesso);
      res.json(turmas);
    } catch (error) {
      console.error("Error fetching turmas:", error);
      res.status(500).json({ error: "Erro ao buscar turmas" });
    }
  });

  app.get("/api/mapa-decisoes/desembargadores/:turmaId", isAuthenticated, async (req, res) => {
    try {
      const desembargadores = await storage.getDesembargadoresComDecisoesByTurma(req.params.turmaId);
      res.json(desembargadores);
    } catch (error) {
      console.error("Error fetching desembargadores:", error);
      res.status(500).json({ error: "Erro ao buscar desembargadores" });
    }
  });

  app.get("/api/mapa-decisoes/analytics/top-turmas", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
      const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
      const responsabilidade = req.query.responsabilidade as string | undefined;
      const instancia = (req.query.instancia as string) || 'segunda';
      const topTurmas = await storage.getTopTurmasFavorabilidade(limit, dataInicio, dataFim, responsabilidade, instancia);
      res.json(topTurmas);
    } catch (error) {
      console.error("Error fetching top turmas:", error);
      res.status(500).json({ error: "Erro ao buscar top turmas" });
    }
  });

  app.get("/api/mapa-decisoes/analytics/top-regioes", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
      const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
      const responsabilidade = req.query.responsabilidade as string | undefined;
      const instancia = (req.query.instancia as string) || 'segunda';
      const topRegioes = await storage.getTopRegioes(limit, dataInicio, dataFim, responsabilidade, instancia);
      res.json(topRegioes);
    } catch (error) {
      console.error("Error fetching top regioes:", error);
      res.status(500).json({ error: "Erro ao buscar top regiões" });
    }
  });

  app.get("/api/mapa-decisoes/analytics/top-desembargadores", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
      const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
      const responsabilidade = req.query.responsabilidade as string | undefined;
      const instancia = (req.query.instancia as string) || 'segunda';
      const topDesembargadores = await storage.getTopDesembargadores(limit, dataInicio, dataFim, responsabilidade, instancia);
      res.json(topDesembargadores);
    } catch (error) {
      console.error("Error fetching top desembargadores:", error);
      res.status(500).json({ error: "Erro ao buscar top desembargadores" });
    }
  });

  app.get("/api/mapa-decisoes/analytics/estatisticas", isAuthenticated, async (req, res) => {
    try {
      const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
      const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
      const responsabilidade = req.query.responsabilidade as string | undefined;
      const instancia = (req.query.instancia as string) || 'segunda';
      const estatisticas = await storage.getEstatisticasGerais(dataInicio, dataFim, responsabilidade, instancia);
      res.json(estatisticas);
    } catch (error) {
      console.error("Error fetching estatisticas:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/mapa-decisoes/analytics/timeline", isAuthenticated, async (req, res) => {
    try {
      const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
      const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
      const responsabilidade = req.query.responsabilidade as string | undefined;
      const instancia = (req.query.instancia as string) || 'segunda';
      const timeline = await storage.getTimelineData(dataInicio, dataFim, responsabilidade, instancia);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ error: "Erro ao buscar timeline" });
    }
  });

  app.get("/api/mapa-decisoes/analytics/por-empresa", isAuthenticated, async (req, res) => {
    try {
      const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
      const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
      const responsabilidade = req.query.responsabilidade as string | undefined;
      const instancia = (req.query.instancia as string) || 'segunda';
      const estatsPorEmpresa = await storage.getEstatisticasPorEmpresa(dataInicio, dataFim, responsabilidade, instancia);
      res.json(estatsPorEmpresa);
    } catch (error) {
      console.error("Error fetching empresa stats:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas por empresa" });
    }
  });

  // ========== Demo Data Seed ==========
  app.post("/api/seed-demo", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.seedDemoData();
      res.json({ success: true, message: "Dados de demonstração inseridos com sucesso" });
    } catch (error) {
      console.error("Error seeding demo data:", error);
      res.status(500).json({ error: "Erro ao inserir dados de demonstração" });
    }
  });

  // ========== Audiencia Routes ==========
  app.get("/api/audiencias", isAuthenticated, async (req, res) => {
    try {
      const audiencias = await storage.getAllAudiencias();
      res.json(audiencias);
    } catch (error) {
      console.error("Error fetching audiencias:", error);
      res.status(500).json({ error: "Erro ao buscar audiências" });
    }
  });

  app.get("/api/varas/:varaId/audiencias", isAuthenticated, async (req, res) => {
    try {
      const audiencias = await storage.getAudienciasByVara(req.params.varaId);
      res.json(audiencias);
    } catch (error) {
      console.error("Error fetching audiencias:", error);
      res.status(500).json({ error: "Erro ao buscar audiências" });
    }
  });

  app.get("/api/audiencias/:id", isAuthenticated, async (req, res) => {
    try {
      const audiencia = await storage.getAudiencia(req.params.id);
      if (!audiencia) {
        return res.status(404).json({ error: "Audiência não encontrada" });
      }
      res.json(audiencia);
    } catch (error) {
      console.error("Error fetching audiencia:", error);
      res.status(500).json({ error: "Erro ao buscar audiência" });
    }
  });

  app.post("/api/audiencias", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertAudienciaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const data = {
        ...parsed.data,
        dataAudiencia: new Date(parsed.data.dataAudiencia),
      };
      const audiencia = await storage.createAudiencia(data);
      res.status(201).json(audiencia);
    } catch (error) {
      console.error("Error creating audiencia:", error);
      res.status(500).json({ error: "Erro ao criar audiência" });
    }
  });

  app.patch("/api/audiencias/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const audiencia = await storage.updateAudiencia(req.params.id, req.body);
      if (!audiencia) {
        return res.status(404).json({ error: "Audiência não encontrada" });
      }
      res.json(audiencia);
    } catch (error) {
      console.error("Error updating audiencia:", error);
      res.status(500).json({ error: "Erro ao atualizar audiência" });
    }
  });

  app.delete("/api/audiencias/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAudiencia(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting audiencia:", error);
      res.status(500).json({ error: "Erro ao excluir audiência" });
    }
  });

  // ========== Timeline Events Route ==========
  app.get("/api/timeline", isAuthenticated, async (req, res) => {
    try {
      const { dataInicio, dataFim, trtId, varaId } = req.query;
      const eventos = await storage.getEventosTimeline({
        dataInicio: dataInicio as string | undefined,
        dataFim: dataFim as string | undefined,
        trtId: trtId as string | undefined,
        varaId: varaId as string | undefined,
      });
      res.json(eventos);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ error: "Erro ao buscar linha do tempo" });
    }
  });

  // ========== Brainstorm Routes ==========
  app.get("/api/brainstorm/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getBrainstormStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching brainstorm stats:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  // Distribuídos
  app.get("/api/brainstorm/distribuidos", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getAllDistribuidos();
      res.json(data);
    } catch (error) {
      console.error("Error fetching distribuidos:", error);
      res.status(500).json({ error: "Erro ao buscar distribuídos" });
    }
  });

  app.post("/api/brainstorm/distribuidos", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertDistribuidoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const created = await storage.createDistribuido(parsed.data);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating distribuido:", error);
      res.status(500).json({ error: "Erro ao criar distribuído" });
    }
  });

  app.post("/api/brainstorm/distribuidos/batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = req.body as any[];
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Esperado array de itens" });
      }
      const validItems = items.filter(item => {
        const parsed = insertDistribuidoSchema.safeParse(item);
        return parsed.success;
      }).map(item => insertDistribuidoSchema.parse(item));
      const created = await storage.createDistribuidosBatch(validItems);
      res.status(201).json({ count: created.length, items: created });
    } catch (error) {
      console.error("Error batch creating distribuidos:", error);
      res.status(500).json({ error: "Erro ao criar distribuídos em lote" });
    }
  });

  app.delete("/api/brainstorm/distribuidos/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteDistribuido(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting distribuido:", error);
      res.status(500).json({ error: "Erro ao excluir distribuído" });
    }
  });

  app.post("/api/brainstorm/distribuidos/delete-batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Esperado array de IDs" });
      }
      await storage.deleteDistribuidosBatch(ids);
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error("Error batch deleting distribuidos:", error);
      res.status(500).json({ error: "Erro ao excluir distribuídos em lote" });
    }
  });

  app.delete("/api/brainstorm/distribuidos", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAllDistribuidos();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting all distribuidos:", error);
      res.status(500).json({ error: "Erro ao excluir todos os distribuídos" });
    }
  });

  // Encerrados
  app.get("/api/brainstorm/encerrados", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getAllEncerrados();
      res.json(data);
    } catch (error) {
      console.error("Error fetching encerrados:", error);
      res.status(500).json({ error: "Erro ao buscar encerrados" });
    }
  });

  app.post("/api/brainstorm/encerrados", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertEncerradoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const created = await storage.createEncerrado(parsed.data);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating encerrado:", error);
      res.status(500).json({ error: "Erro ao criar encerrado" });
    }
  });

  app.post("/api/brainstorm/encerrados/batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = req.body as any[];
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Esperado array de itens" });
      }
      const validItems = items.filter(item => {
        const parsed = insertEncerradoSchema.safeParse(item);
        return parsed.success;
      }).map(item => insertEncerradoSchema.parse(item));
      const created = await storage.createEncerradosBatch(validItems);
      res.status(201).json({ count: created.length, items: created });
    } catch (error) {
      console.error("Error batch creating encerrados:", error);
      res.status(500).json({ error: "Erro ao criar encerrados em lote" });
    }
  });

  app.delete("/api/brainstorm/encerrados/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteEncerrado(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting encerrado:", error);
      res.status(500).json({ error: "Erro ao excluir encerrado" });
    }
  });

  app.post("/api/brainstorm/encerrados/delete-batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Esperado array de IDs" });
      }
      await storage.deleteEncerradosBatch(ids);
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error("Error batch deleting encerrados:", error);
      res.status(500).json({ error: "Erro ao excluir encerrados em lote" });
    }
  });

  app.delete("/api/brainstorm/encerrados", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAllEncerrados();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting all encerrados:", error);
      res.status(500).json({ error: "Erro ao excluir todos os encerrados" });
    }
  });

  // Sentenças de Mérito
  app.get("/api/brainstorm/sentencas-merito", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getAllSentencasMerito();
      res.json(data);
    } catch (error) {
      console.error("Error fetching sentencas merito:", error);
      res.status(500).json({ error: "Erro ao buscar sentenças de mérito" });
    }
  });

  app.post("/api/brainstorm/sentencas-merito", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertSentencaMeritoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const created = await storage.createSentencaMerito(parsed.data);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating sentenca merito:", error);
      res.status(500).json({ error: "Erro ao criar sentença de mérito" });
    }
  });

  app.post("/api/brainstorm/sentencas-merito/batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = req.body as any[];
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Esperado array de itens" });
      }
      const validItems = items.filter(item => {
        const parsed = insertSentencaMeritoSchema.safeParse(item);
        return parsed.success;
      }).map(item => insertSentencaMeritoSchema.parse(item));
      const created = await storage.createSentencasMeritoBatch(validItems);
      res.status(201).json({ count: created.length, items: created });
    } catch (error) {
      console.error("Error batch creating sentencas merito:", error);
      res.status(500).json({ error: "Erro ao criar sentenças de mérito em lote" });
    }
  });

  app.delete("/api/brainstorm/sentencas-merito/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteSentencaMerito(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting sentenca merito:", error);
      res.status(500).json({ error: "Erro ao excluir sentença de mérito" });
    }
  });

  app.post("/api/brainstorm/sentencas-merito/delete-batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Esperado array de IDs" });
      }
      await storage.deleteSentencasMeritoBatch(ids);
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error("Error batch deleting sentencas merito:", error);
      res.status(500).json({ error: "Erro ao excluir sentenças de mérito em lote" });
    }
  });

  app.delete("/api/brainstorm/sentencas-merito", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAllSentencasMerito();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting all sentencas merito:", error);
      res.status(500).json({ error: "Erro ao excluir todas as sentenças de mérito" });
    }
  });

  // Acórdãos de Mérito
  app.get("/api/brainstorm/acordaos-merito", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getAllAcordaosMerito();
      res.json(data);
    } catch (error) {
      console.error("Error fetching acordaos merito:", error);
      res.status(500).json({ error: "Erro ao buscar acórdãos de mérito" });
    }
  });

  app.post("/api/brainstorm/acordaos-merito", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertAcordaoMeritoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      const created = await storage.createAcordaoMerito(parsed.data);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating acordao merito:", error);
      res.status(500).json({ error: "Erro ao criar acórdão de mérito" });
    }
  });

  app.post("/api/brainstorm/acordaos-merito/batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = req.body as any[];
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Esperado array de itens" });
      }
      const validItems = items.filter(item => {
        const parsed = insertAcordaoMeritoSchema.safeParse(item);
        return parsed.success;
      }).map(item => insertAcordaoMeritoSchema.parse(item));
      const created = await storage.createAcordaosMeritoBatch(validItems);
      res.status(201).json({ count: created.length, items: created });
    } catch (error) {
      console.error("Error batch creating acordaos merito:", error);
      res.status(500).json({ error: "Erro ao criar acórdãos de mérito em lote" });
    }
  });

  app.delete("/api/brainstorm/acordaos-merito/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAcordaoMerito(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting acordao merito:", error);
      res.status(500).json({ error: "Erro ao excluir acórdão de mérito" });
    }
  });

  app.post("/api/brainstorm/acordaos-merito/delete-batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Esperado array de IDs" });
      }
      await storage.deleteAcordaosMeritoBatch(ids);
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error("Error batch deleting acordaos merito:", error);
      res.status(500).json({ error: "Erro ao excluir acórdãos de mérito em lote" });
    }
  });

  app.delete("/api/brainstorm/acordaos-merito", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAllAcordaosMerito();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting all acordaos merito:", error);
      res.status(500).json({ error: "Erro ao excluir todos os acórdãos de mérito" });
    }
  });

  // =====================================================
  // CASOS NOVOS - Entrada & Saídas
  // =====================================================

  app.get("/api/casos-novos", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getAllCasosNovos();
      res.json(data);
    } catch (error) {
      console.error("Error fetching casos novos:", error);
      res.status(500).json({ error: "Erro ao buscar casos novos" });
    }
  });

  app.get("/api/casos-novos/stats", isAuthenticated, async (req, res) => {
    try {
      const { mesReferencia } = req.query;
      const stats = await storage.getCasosNovosStats(
        mesReferencia ? mesReferencia as string : undefined
      );
      res.json(stats);
    } catch (error) {
      console.error("Error fetching casos novos stats:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas de casos novos" });
    }
  });

  app.post("/api/casos-novos", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const created = await storage.createCasoNovo(req.body);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating caso novo:", error);
      res.status(500).json({ error: "Erro ao criar caso novo" });
    }
  });

  app.post("/api/casos-novos/batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = req.body as any[];
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Esperado array de itens" });
      }
      const created = await storage.createCasosNovosBatch(items);
      res.status(201).json({ count: created.length, items: created });
    } catch (error) {
      console.error("Error batch creating casos novos:", error);
      res.status(500).json({ error: "Erro ao criar casos novos em lote" });
    }
  });

  app.post("/api/casos-novos/upload", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Arquivo não enviado" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as string[][];

      if (rows.length < 2) {
        return res.status(400).json({ error: "Arquivo vazio ou sem dados" });
      }

      // Map headers - expected: número do processo, data da distribuição, tribunal, empresa, valor da contingência
      const headers = rows[0].map(h => h?.toLowerCase().trim() || '');
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell));

      const casos = dataRows.map(row => {
        const getCell = (idx: number) => row[idx]?.toString().trim() || '';
        
        // Parse date (format: 10/31/25 -> 2025-10-31)
        let parsedDate: Date | undefined = undefined;
        const dateVal = getCell(1);
        if (dateVal) {
          const parts = dateVal.split('/');
          if (parts.length === 3) {
            const month = parseInt(parts[0]) - 1;
            const day = parseInt(parts[1]);
            let year = parseInt(parts[2]);
            if (year < 100) {
              year = 2000 + year;
            }
            parsedDate = new Date(year, month, day);
          }
        }

        return {
          numeroProcesso: getCell(0),
          dataDistribuicao: parsedDate,
          tribunal: getCell(2),
          empresa: getCell(3).toUpperCase(),
          valorContingencia: getCell(4)
        };
      }).filter(c => c.numeroProcesso);

      const created = await storage.createCasosNovosBatch(casos as any);
      res.status(201).json({ 
        success: true, 
        count: created.length,
        message: `${created.length} casos importados com sucesso`
      });
    } catch (error) {
      console.error("Error uploading casos novos:", error);
      res.status(500).json({ error: "Erro ao processar arquivo" });
    }
  });

  app.delete("/api/casos-novos/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCasoNovo(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting caso novo:", error);
      res.status(500).json({ error: "Erro ao excluir caso novo" });
    }
  });

  app.post("/api/casos-novos/delete-batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Esperado array de IDs" });
      }
      await storage.deleteCasosNovosBatch(ids);
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error("Error batch deleting casos novos:", error);
      res.status(500).json({ error: "Erro ao excluir casos novos em lote" });
    }
  });

  app.delete("/api/casos-novos", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAllCasosNovos();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting all casos novos:", error);
      res.status(500).json({ error: "Erro ao excluir todos os casos novos" });
    }
  });

  // =====================================================
  // CASOS ENCERRADOS - Entrada & Saídas
  // =====================================================

  app.get("/api/casos-encerrados", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getAllCasosEncerrados();
      res.json(data);
    } catch (error) {
      console.error("Error fetching casos encerrados:", error);
      res.status(500).json({ error: "Erro ao buscar casos encerrados" });
    }
  });

  app.get("/api/casos-encerrados/stats", isAuthenticated, async (req, res) => {
    try {
      const { mesReferencia } = req.query;
      const stats = await storage.getCasosEncerradosStats(
        mesReferencia ? mesReferencia as string : undefined
      );
      res.json(stats);
    } catch (error) {
      console.error("Error fetching casos encerrados stats:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas de casos encerrados" });
    }
  });

  app.post("/api/casos-encerrados", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const created = await storage.createCasoEncerrado(req.body);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating caso encerrado:", error);
      res.status(500).json({ error: "Erro ao criar caso encerrado" });
    }
  });

  app.post("/api/casos-encerrados/batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = req.body as any[];
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Esperado array de itens" });
      }
      const created = await storage.createCasosEncerradosBatch(items);
      res.status(201).json({ count: created.length, items: created });
    } catch (error) {
      console.error("Error batch creating casos encerrados:", error);
      res.status(500).json({ error: "Erro ao criar casos encerrados em lote" });
    }
  });

  app.post("/api/casos-encerrados/upload", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Arquivo não enviado" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as string[][];

      if (rows.length < 2) {
        return res.status(400).json({ error: "Arquivo vazio ou sem dados" });
      }

      const dataRows = rows.slice(1).filter(row => row.some(cell => cell));

      const casos = dataRows.map(row => {
        const getCell = (idx: number) => row[idx]?.toString().trim() || '';
        
        let parsedDate: Date | undefined = undefined;
        const dateVal = getCell(1);
        if (dateVal) {
          const parts = dateVal.split('/');
          if (parts.length === 3) {
            const month = parseInt(parts[0]) - 1;
            const day = parseInt(parts[1]);
            let year = parseInt(parts[2]);
            if (year < 100) {
              year = 2000 + year;
            }
            parsedDate = new Date(year, month, day);
          }
        }

        return {
          numeroProcesso: getCell(0),
          dataEncerramento: parsedDate,
          tribunal: getCell(2),
          empresa: getCell(3).toUpperCase(),
          valorContingencia: getCell(4)
        };
      }).filter(c => c.numeroProcesso);

      const created = await storage.createCasosEncerradosBatch(casos as any);
      res.status(201).json({ 
        success: true, 
        count: created.length,
        message: `${created.length} casos encerrados importados com sucesso`
      });
    } catch (error) {
      console.error("Error uploading casos encerrados:", error);
      res.status(500).json({ error: "Erro ao processar arquivo" });
    }
  });

  app.delete("/api/casos-encerrados/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCasoEncerrado(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting caso encerrado:", error);
      res.status(500).json({ error: "Erro ao excluir caso encerrado" });
    }
  });

  app.post("/api/casos-encerrados/delete-batch", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Esperado array de IDs" });
      }
      await storage.deleteCasosEncerradosBatch(ids);
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error("Error batch deleting casos encerrados:", error);
      res.status(500).json({ error: "Erro ao excluir casos encerrados em lote" });
    }
  });

  app.delete("/api/casos-encerrados", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAllCasosEncerrados();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting all casos encerrados:", error);
      res.status(500).json({ error: "Erro ao excluir todos os casos encerrados" });
    }
  });

  return httpServer;
}
