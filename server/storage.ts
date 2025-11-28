import type { 
  ProcessoRaw, 
  FaseData, 
  RiscoData, 
  EmpresaFaseData, 
  DashboardSummary,
  PassivoData,
  FaseProcessual,
  ClassificacaoRisco,
  Empresa,
  User,
  InsertUser,
  TRT,
  InsertTRT,
  Vara,
  InsertVara,
  Juiz,
  InsertJuiz,
  Julgamento,
  InsertJulgamento,
  Favorabilidade,
  JuizComFavorabilidade,
  VaraComFavorabilidade,
  TRTComFavorabilidade,
  DecisionResult
} from "@shared/schema";
import { users, trts, varas, juizes, julgamentos } from "@shared/schema";
import { parseExcelFile } from "./excel-parser";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPassivoData(): Promise<PassivoData>;
  setRawData(data: ProcessoRaw[]): Promise<void>;
  getRawData(): Promise<ProcessoRaw[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  getAllTRTs(): Promise<TRT[]>;
  getTRT(id: string): Promise<TRT | undefined>;
  createTRT(trt: InsertTRT): Promise<TRT>;
  updateTRT(id: string, data: Partial<InsertTRT>): Promise<TRT | undefined>;
  deleteTRT(id: string): Promise<boolean>;
  
  getVarasByTRT(trtId: string): Promise<Vara[]>;
  getVara(id: string): Promise<Vara | undefined>;
  createVara(vara: InsertVara): Promise<Vara>;
  updateVara(id: string, data: Partial<InsertVara>): Promise<Vara | undefined>;
  deleteVara(id: string): Promise<boolean>;
  
  getJuizesByVara(varaId: string): Promise<Juiz[]>;
  getJuiz(id: string): Promise<Juiz | undefined>;
  createJuiz(juiz: InsertJuiz): Promise<Juiz>;
  updateJuiz(id: string, data: Partial<InsertJuiz>): Promise<Juiz | undefined>;
  deleteJuiz(id: string): Promise<boolean>;
  
  getJulgamentosByJuiz(juizId: string): Promise<Julgamento[]>;
  getJulgamento(id: string): Promise<Julgamento | undefined>;
  createJulgamento(julgamento: InsertJulgamento): Promise<Julgamento>;
  updateJulgamento(id: string, data: Partial<InsertJulgamento>): Promise<Julgamento | undefined>;
  deleteJulgamento(id: string): Promise<boolean>;
  
  getJuizFavorabilidade(juizId: string): Promise<Favorabilidade>;
  getAllJuizesComFavorabilidade(): Promise<JuizComFavorabilidade[]>;
  getAllTRTsComFavorabilidade(): Promise<TRTComFavorabilidade[]>;
}

export class MemStorage implements IStorage {
  private rawData: ProcessoRaw[] = [];

  constructor() {
    this.initializeFromExcel();
  }

  private initializeFromExcel(): void {
    const excelPath = "attached_assets/planilha brainstorm_1764343188095.xlsx";
    this.rawData = parseExcelFile(excelPath);
    
    if (this.rawData.length === 0) {
      console.warn("Nenhum dado carregado do Excel, usando fallback");
    }
  }

  async setRawData(data: ProcessoRaw[]): Promise<void> {
    this.rawData = data;
  }

  async getRawData(): Promise<ProcessoRaw[]> {
    return this.rawData;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getPassivoData(): Promise<PassivoData> {
    const fases = this.calculateFaseData();
    const riscos = this.calculateRiscoData();
    const empresas = this.calculateEmpresaData();
    const summary = this.calculateSummary();

    return {
      fases,
      riscos,
      empresas,
      summary,
      rawData: this.rawData,
    };
  }

  private calculateFaseData(): FaseData[] {
    const faseMap = new Map<FaseProcessual, { processos: number; valor: number }>();
    
    const fases: FaseProcessual[] = ["Conhecimento", "Recursal", "Execução"];
    fases.forEach(f => faseMap.set(f, { processos: 0, valor: 0 }));

    this.rawData.forEach(p => {
      const current = faseMap.get(p.faseProcessual) || { processos: 0, valor: 0 };
      current.processos += 1;
      current.valor += p.valorTotal;
      faseMap.set(p.faseProcessual, current);
    });

    const totalProcessos = this.rawData.length;
    const totalValor = this.rawData.reduce((sum, p) => sum + p.valorTotal, 0);

    return fases.map(fase => {
      const data = faseMap.get(fase)!;
      return {
        fase,
        processos: data.processos,
        percentualProcessos: totalProcessos > 0 ? Math.round((data.processos / totalProcessos) * 100) : 0,
        valorTotal: Math.round(data.valor),
        percentualValor: totalValor > 0 ? Math.round((data.valor / totalValor) * 100) : 0,
        ticketMedio: data.processos > 0 ? Math.round(data.valor / data.processos) : 0,
      };
    });
  }

  private calculateRiscoData(): RiscoData[] {
    const riscoMap = new Map<ClassificacaoRisco, { processos: number; valor: number }>();
    
    const riscos: ClassificacaoRisco[] = ["Remoto", "Possível", "Provável"];
    riscos.forEach(r => riscoMap.set(r, { processos: 0, valor: 0 }));

    this.rawData.forEach(p => {
      const current = riscoMap.get(p.classificacaoRisco) || { processos: 0, valor: 0 };
      current.processos += 1;
      current.valor += p.valorTotal;
      riscoMap.set(p.classificacaoRisco, current);
    });

    const totalProcessos = this.rawData.length;
    const totalValor = this.rawData.reduce((sum, p) => sum + p.valorTotal, 0);

    return riscos.map(risco => {
      const data = riscoMap.get(risco)!;
      return {
        risco,
        processos: data.processos,
        percentualProcessos: totalProcessos > 0 ? Math.round((data.processos / totalProcessos) * 100) : 0,
        valorTotal: Math.round(data.valor),
        percentualValor: totalValor > 0 ? Math.round((data.valor / totalValor) * 100) : 0,
        ticketMedio: data.processos > 0 ? Math.round(data.valor / data.processos) : 0,
      };
    });
  }

  private calculateEmpresaData(): EmpresaFaseData[] {
    const empresas: Empresa[] = ["V.tal", "OI", "Serede", "Sprink", "Outros Terceiros"];
    const fases: FaseProcessual[] = ["Conhecimento", "Recursal", "Execução"];
    
    const empresaMap = new Map<Empresa, Map<FaseProcessual, { processos: number; valor: number }>>();
    
    empresas.forEach(emp => {
      const faseMap = new Map<FaseProcessual, { processos: number; valor: number }>();
      fases.forEach(f => faseMap.set(f, { processos: 0, valor: 0 }));
      empresaMap.set(emp, faseMap);
    });

    this.rawData.forEach(p => {
      const faseMap = empresaMap.get(p.empresa);
      if (faseMap) {
        const current = faseMap.get(p.faseProcessual) || { processos: 0, valor: 0 };
        current.processos += 1;
        current.valor += p.valorTotal;
        faseMap.set(p.faseProcessual, current);
      }
    });

    const totalProcessos = this.rawData.length;
    const totalValor = this.rawData.reduce((sum, p) => sum + p.valorTotal, 0);

    return empresas.map(empresa => {
      const faseMap = empresaMap.get(empresa)!;
      const conhecimento = faseMap.get("Conhecimento")!;
      const recursal = faseMap.get("Recursal")!;
      const execucao = faseMap.get("Execução")!;
      
      const empTotal = conhecimento.processos + recursal.processos + execucao.processos;
      const empValor = conhecimento.valor + recursal.valor + execucao.valor;

      return {
        empresa,
        conhecimento: {
          processos: conhecimento.processos,
          valor: Math.round(conhecimento.valor),
          percentualValor: totalValor > 0 ? Math.round((conhecimento.valor / totalValor) * 100) : 0,
        },
        recursal: {
          processos: recursal.processos,
          valor: Math.round(recursal.valor),
          percentualValor: totalValor > 0 ? Math.round((recursal.valor / totalValor) * 100) : 0,
        },
        execucao: {
          processos: execucao.processos,
          valor: Math.round(execucao.valor),
          percentualValor: totalValor > 0 ? Math.round((execucao.valor / totalValor) * 100) : 0,
        },
        total: {
          processos: empTotal,
          percentualProcessos: totalProcessos > 0 ? Math.round((empTotal / totalProcessos) * 100) : 0,
          valor: Math.round(empValor),
          percentualValor: totalValor > 0 ? Math.round((empValor / totalValor) * 100) : 0,
        },
      };
    });
  }

  private calculateSummary(): DashboardSummary {
    const totalProcessos = this.rawData.length;
    const totalValor = this.rawData.reduce((sum, p) => sum + p.valorTotal, 0);
    
    const riscoProvavel = this.rawData.filter(p => p.classificacaoRisco === "Provável").length;
    const faseRecursal = this.rawData.filter(p => p.faseProcessual === "Recursal").length;

    return {
      totalProcessos,
      totalPassivo: Math.round(totalValor),
      ticketMedioGlobal: totalProcessos > 0 ? Math.round(totalValor / totalProcessos) : 0,
      percentualRiscoProvavel: totalProcessos > 0 ? Math.round((riscoProvavel / totalProcessos) * 100) : 0,
      percentualFaseRecursal: totalProcessos > 0 ? Math.round((faseRecursal / totalProcessos) * 100) : 0,
    };
  }

  async getAllTRTs(): Promise<TRT[]> {
    return await db.select().from(trts).orderBy(trts.numero);
  }

  async getTRT(id: string): Promise<TRT | undefined> {
    const [trt] = await db.select().from(trts).where(eq(trts.id, id));
    return trt;
  }

  async createTRT(trt: InsertTRT): Promise<TRT> {
    const [created] = await db.insert(trts).values(trt).returning();
    return created;
  }

  async updateTRT(id: string, data: Partial<InsertTRT>): Promise<TRT | undefined> {
    const [updated] = await db.update(trts).set(data).where(eq(trts.id, id)).returning();
    return updated;
  }

  async deleteTRT(id: string): Promise<boolean> {
    const result = await db.delete(trts).where(eq(trts.id, id));
    return true;
  }

  async getVarasByTRT(trtId: string): Promise<Vara[]> {
    return await db.select().from(varas).where(eq(varas.trtId, trtId));
  }

  async getVara(id: string): Promise<Vara | undefined> {
    const [vara] = await db.select().from(varas).where(eq(varas.id, id));
    return vara;
  }

  async createVara(vara: InsertVara): Promise<Vara> {
    const [created] = await db.insert(varas).values(vara).returning();
    return created;
  }

  async updateVara(id: string, data: Partial<InsertVara>): Promise<Vara | undefined> {
    const [updated] = await db.update(varas).set(data).where(eq(varas.id, id)).returning();
    return updated;
  }

  async deleteVara(id: string): Promise<boolean> {
    await db.delete(varas).where(eq(varas.id, id));
    return true;
  }

  async getJuizesByVara(varaId: string): Promise<Juiz[]> {
    return await db.select().from(juizes).where(eq(juizes.varaId, varaId));
  }

  async getJuiz(id: string): Promise<Juiz | undefined> {
    const [juiz] = await db.select().from(juizes).where(eq(juizes.id, id));
    return juiz;
  }

  async createJuiz(juiz: InsertJuiz): Promise<Juiz> {
    const [created] = await db.insert(juizes).values(juiz).returning();
    return created;
  }

  async updateJuiz(id: string, data: Partial<InsertJuiz>): Promise<Juiz | undefined> {
    const [updated] = await db.update(juizes).set(data).where(eq(juizes.id, id)).returning();
    return updated;
  }

  async deleteJuiz(id: string): Promise<boolean> {
    await db.delete(juizes).where(eq(juizes.id, id));
    return true;
  }

  async getJulgamentosByJuiz(juizId: string): Promise<Julgamento[]> {
    return await db.select().from(julgamentos).where(eq(julgamentos.juizId, juizId));
  }

  async getJulgamento(id: string): Promise<Julgamento | undefined> {
    const [julgamento] = await db.select().from(julgamentos).where(eq(julgamentos.id, id));
    return julgamento;
  }

  async createJulgamento(julgamento: InsertJulgamento): Promise<Julgamento> {
    const [created] = await db.insert(julgamentos).values(julgamento).returning();
    return created;
  }

  async updateJulgamento(id: string, data: Partial<InsertJulgamento>): Promise<Julgamento | undefined> {
    const [updated] = await db.update(julgamentos).set(data).where(eq(julgamentos.id, id)).returning();
    return updated;
  }

  async deleteJulgamento(id: string): Promise<boolean> {
    await db.delete(julgamentos).where(eq(julgamentos.id, id));
    return true;
  }

  private calculateFavorabilidade(julgamentosData: Julgamento[]): Favorabilidade {
    const favoraveis = julgamentosData.filter(j => j.resultado === "favoravel").length;
    const desfavoraveis = julgamentosData.filter(j => j.resultado === "desfavoravel").length;
    const parciais = julgamentosData.filter(j => j.resultado === "parcial").length;
    
    const pontosFavoraveis = favoraveis + (parciais * 0.5);
    const total = favoraveis + desfavoraveis + parciais;
    
    return {
      totalJulgamentos: total,
      favoraveis,
      desfavoraveis,
      parciais,
      percentualFavoravel: total > 0 ? Math.round((pontosFavoraveis / total) * 100) : 0,
      percentualDesfavoravel: total > 0 ? Math.round(((desfavoraveis + parciais * 0.5) / total) * 100) : 0,
    };
  }

  async getJuizFavorabilidade(juizId: string): Promise<Favorabilidade> {
    const julgamentosData = await this.getJulgamentosByJuiz(juizId);
    return this.calculateFavorabilidade(julgamentosData);
  }

  async getAllJuizesComFavorabilidade(): Promise<JuizComFavorabilidade[]> {
    const allTrts = await this.getAllTRTs();
    const result: JuizComFavorabilidade[] = [];

    for (const trt of allTrts) {
      const trtVaras = await this.getVarasByTRT(trt.id);
      for (const vara of trtVaras) {
        const varaJuizes = await this.getJuizesByVara(vara.id);
        for (const juiz of varaJuizes) {
          const favorabilidade = await this.getJuizFavorabilidade(juiz.id);
          result.push({
            id: juiz.id,
            nome: juiz.nome,
            tipo: juiz.tipo,
            varaId: vara.id,
            varaNome: vara.nome,
            trtId: trt.id,
            trtNome: trt.nome,
            trtUF: trt.uf,
            favorabilidade,
          });
        }
      }
    }

    return result;
  }

  async getAllTRTsComFavorabilidade(): Promise<TRTComFavorabilidade[]> {
    const allTrts = await this.getAllTRTs();
    const result: TRTComFavorabilidade[] = [];

    for (const trt of allTrts) {
      const trtVaras = await this.getVarasByTRT(trt.id);
      const varasComFavorabilidade: VaraComFavorabilidade[] = [];
      let trtJulgamentos: Julgamento[] = [];

      for (const vara of trtVaras) {
        const varaJuizes = await this.getJuizesByVara(vara.id);
        const juizesComFavorabilidade: JuizComFavorabilidade[] = [];
        let varaJulgamentos: Julgamento[] = [];

        for (const juiz of varaJuizes) {
          const julgamentosJuiz = await this.getJulgamentosByJuiz(juiz.id);
          varaJulgamentos = [...varaJulgamentos, ...julgamentosJuiz];
          trtJulgamentos = [...trtJulgamentos, ...julgamentosJuiz];
          
          juizesComFavorabilidade.push({
            id: juiz.id,
            nome: juiz.nome,
            tipo: juiz.tipo,
            varaId: vara.id,
            varaNome: vara.nome,
            trtId: trt.id,
            trtNome: trt.nome,
            trtUF: trt.uf,
            favorabilidade: this.calculateFavorabilidade(julgamentosJuiz),
          });
        }

        varasComFavorabilidade.push({
          id: vara.id,
          nome: vara.nome,
          cidade: vara.cidade,
          trtId: trt.id,
          juizes: juizesComFavorabilidade,
          favorabilidade: this.calculateFavorabilidade(varaJulgamentos),
        });
      }

      result.push({
        id: trt.id,
        numero: trt.numero,
        nome: trt.nome,
        uf: trt.uf,
        varas: varasComFavorabilidade,
        favorabilidade: this.calculateFavorabilidade(trtJulgamentos),
      });
    }

    return result;
  }

  async seedDemoData(): Promise<void> {
    console.log("Inserindo dados de demonstração...");

    const trtData = [
      { numero: "1", nome: "TRT da 1ª Região", uf: "RJ" },
      { numero: "2", nome: "TRT da 2ª Região", uf: "SP" },
      { numero: "3", nome: "TRT da 3ª Região", uf: "MG" },
      { numero: "4", nome: "TRT da 4ª Região", uf: "RS" },
      { numero: "5", nome: "TRT da 5ª Região", uf: "BA" },
      { numero: "15", nome: "TRT da 15ª Região", uf: "SP" },
    ];

    const createdTRTs: TRT[] = [];
    for (const t of trtData) {
      const trt = await this.createTRT(t);
      createdTRTs.push(trt);
    }

    const varaData = [
      { nome: "1ª Vara do Trabalho", cidade: "Rio de Janeiro", trtId: createdTRTs[0].id },
      { nome: "2ª Vara do Trabalho", cidade: "Rio de Janeiro", trtId: createdTRTs[0].id },
      { nome: "3ª Vara do Trabalho", cidade: "Niterói", trtId: createdTRTs[0].id },
      { nome: "1ª Vara do Trabalho", cidade: "São Paulo", trtId: createdTRTs[1].id },
      { nome: "2ª Vara do Trabalho", cidade: "São Paulo", trtId: createdTRTs[1].id },
      { nome: "5ª Vara do Trabalho", cidade: "Guarulhos", trtId: createdTRTs[1].id },
      { nome: "1ª Vara do Trabalho", cidade: "Belo Horizonte", trtId: createdTRTs[2].id },
      { nome: "3ª Vara do Trabalho", cidade: "Belo Horizonte", trtId: createdTRTs[2].id },
      { nome: "1ª Vara do Trabalho", cidade: "Porto Alegre", trtId: createdTRTs[3].id },
      { nome: "2ª Vara do Trabalho", cidade: "Caxias do Sul", trtId: createdTRTs[3].id },
      { nome: "1ª Vara do Trabalho", cidade: "Salvador", trtId: createdTRTs[4].id },
      { nome: "2ª Vara do Trabalho", cidade: "Salvador", trtId: createdTRTs[4].id },
      { nome: "1ª Vara do Trabalho", cidade: "Campinas", trtId: createdTRTs[5].id },
      { nome: "2ª Vara do Trabalho", cidade: "Ribeirão Preto", trtId: createdTRTs[5].id },
    ];

    const createdVaras: Vara[] = [];
    for (const v of varaData) {
      const vara = await this.createVara(v);
      createdVaras.push(vara);
    }

    const juizData = [
      { nome: "Dr. Carlos Alberto Mendes", varaId: createdVaras[0].id, tipo: "titular" as const },
      { nome: "Dra. Maria Helena Souza", varaId: createdVaras[0].id, tipo: "substituto" as const },
      { nome: "Dr. João Pedro Oliveira", varaId: createdVaras[1].id, tipo: "titular" as const },
      { nome: "Dra. Ana Beatriz Costa", varaId: createdVaras[2].id, tipo: "titular" as const },
      { nome: "Dr. Roberto Silva Santos", varaId: createdVaras[3].id, tipo: "titular" as const },
      { nome: "Dra. Fernanda Lima Pereira", varaId: createdVaras[3].id, tipo: "substituto" as const },
      { nome: "Dr. Marcos Antônio Ribeiro", varaId: createdVaras[4].id, tipo: "titular" as const },
      { nome: "Dra. Claudia Rodrigues", varaId: createdVaras[5].id, tipo: "titular" as const },
      { nome: "Dr. Ricardo Ferreira Alves", varaId: createdVaras[6].id, tipo: "titular" as const },
      { nome: "Dra. Patricia Gomes Dias", varaId: createdVaras[7].id, tipo: "titular" as const },
      { nome: "Dr. Eduardo Martins Costa", varaId: createdVaras[8].id, tipo: "titular" as const },
      { nome: "Dra. Luciana Barbosa", varaId: createdVaras[9].id, tipo: "titular" as const },
      { nome: "Dr. Thiago Nascimento", varaId: createdVaras[10].id, tipo: "titular" as const },
      { nome: "Dra. Camila Andrade", varaId: createdVaras[11].id, tipo: "substituto" as const },
      { nome: "Dr. Felipe Moreira", varaId: createdVaras[12].id, tipo: "titular" as const },
      { nome: "Dra. Juliana Carvalho", varaId: createdVaras[13].id, tipo: "titular" as const },
    ];

    const createdJuizes: Juiz[] = [];
    for (const j of juizData) {
      const juiz = await this.createJuiz(j);
      createdJuizes.push(juiz);
    }

    const resultados: DecisionResult[] = ["favoravel", "desfavoravel", "parcial"];
    const partes = ["V.tal", "OI", "Serede", "Sprink", "Empreiteira ABC", "Telecom XYZ"];
    
    const generateProcessNumber = (index: number, year: number) => {
      const seq = String(index).padStart(7, '0');
      const dig = String(Math.floor(Math.random() * 100)).padStart(2, '0');
      const vara = String(Math.floor(Math.random() * 50) + 1).padStart(4, '0');
      const trt = String(Math.floor(Math.random() * 24) + 1).padStart(2, '0');
      return `${seq}-${dig}.${year}.5.${trt}.${vara}`;
    };

    const julgamentoPatterns: { juizIndex: number; favoraveis: number; desfavoraveis: number; parciais: number }[] = [
      { juizIndex: 0, favoraveis: 8, desfavoraveis: 2, parciais: 2 },
      { juizIndex: 1, favoraveis: 5, desfavoraveis: 4, parciais: 3 },
      { juizIndex: 2, favoraveis: 3, desfavoraveis: 7, parciais: 2 },
      { juizIndex: 3, favoraveis: 6, desfavoraveis: 2, parciais: 4 },
      { juizIndex: 4, favoraveis: 9, desfavoraveis: 1, parciais: 2 },
      { juizIndex: 5, favoraveis: 4, desfavoraveis: 5, parciais: 3 },
      { juizIndex: 6, favoraveis: 2, desfavoraveis: 8, parciais: 2 },
      { juizIndex: 7, favoraveis: 7, desfavoraveis: 3, parciais: 2 },
      { juizIndex: 8, favoraveis: 5, desfavoraveis: 5, parciais: 2 },
      { juizIndex: 9, favoraveis: 10, desfavoraveis: 1, parciais: 1 },
      { juizIndex: 10, favoraveis: 3, desfavoraveis: 6, parciais: 3 },
      { juizIndex: 11, favoraveis: 6, desfavoraveis: 4, parciais: 2 },
      { juizIndex: 12, favoraveis: 8, desfavoraveis: 2, parciais: 4 },
      { juizIndex: 13, favoraveis: 4, desfavoraveis: 6, parciais: 2 },
      { juizIndex: 14, favoraveis: 7, desfavoraveis: 2, parciais: 3 },
      { juizIndex: 15, favoraveis: 5, desfavoraveis: 3, parciais: 4 },
    ];

    let processIndex = 1;
    for (const pattern of julgamentoPatterns) {
      const juiz = createdJuizes[pattern.juizIndex];
      if (!juiz) continue;

      for (let i = 0; i < pattern.favoraveis; i++) {
        const year = 2022 + Math.floor(Math.random() * 3);
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        await this.createJulgamento({
          juizId: juiz.id,
          numeroProcesso: generateProcessNumber(processIndex++, year),
          resultado: "favoravel",
          dataJulgamento: new Date(year, month, day),
          parte: partes[Math.floor(Math.random() * partes.length)],
        });
      }

      for (let i = 0; i < pattern.desfavoraveis; i++) {
        const year = 2022 + Math.floor(Math.random() * 3);
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        await this.createJulgamento({
          juizId: juiz.id,
          numeroProcesso: generateProcessNumber(processIndex++, year),
          resultado: "desfavoravel",
          dataJulgamento: new Date(year, month, day),
          parte: partes[Math.floor(Math.random() * partes.length)],
        });
      }

      for (let i = 0; i < pattern.parciais; i++) {
        const year = 2022 + Math.floor(Math.random() * 3);
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        await this.createJulgamento({
          juizId: juiz.id,
          numeroProcesso: generateProcessNumber(processIndex++, year),
          resultado: "parcial",
          dataJulgamento: new Date(year, month, day),
          parte: partes[Math.floor(Math.random() * partes.length)],
        });
      }
    }

    console.log(`Dados de demonstração inseridos: ${createdTRTs.length} TRTs, ${createdVaras.length} Varas, ${createdJuizes.length} Juízes, ${processIndex - 1} Julgamentos`);
  }
}

export const storage = new MemStorage();
