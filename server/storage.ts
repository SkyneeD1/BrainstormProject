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
  DecisionResult,
  Audiencia,
  InsertAudiencia,
  EventoTimeline,
  Distribuido,
  InsertDistribuido,
  Encerrado,
  InsertEncerrado,
  SentencaMerito,
  InsertSentencaMerito,
  AcordaoMerito,
  InsertAcordaoMerito,
  BrainstormStats,
  Turma,
  InsertTurma,
  Desembargador,
  InsertDesembargador,
  TurmaComDesembargadores,
  MapaDecisoes,
  DecisaoRpac,
  InsertDecisaoRpac
} from "@shared/schema";
import { users, trts, varas, juizes, julgamentos, audiencias, distribuidos, encerrados, sentencasMerito, acordaosMerito, turmas, desembargadores, decisoesRpac, passivoMensal } from "@shared/schema";
import { and, gte, lte, inArray, sql } from "drizzle-orm";
import { parseExcelFile } from "./excel-parser";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPassivoData(): Promise<PassivoData>;
  setRawData(data: ProcessoRaw[]): Promise<void>;
  getRawData(): Promise<ProcessoRaw[]>;
  clearRawData(): Promise<void>;
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
  
  getAllAudiencias(): Promise<Audiencia[]>;
  getAudienciasByVara(varaId: string): Promise<Audiencia[]>;
  getAudiencia(id: string): Promise<Audiencia | undefined>;
  createAudiencia(audiencia: InsertAudiencia): Promise<Audiencia>;
  updateAudiencia(id: string, data: Partial<InsertAudiencia>): Promise<Audiencia | undefined>;
  deleteAudiencia(id: string): Promise<boolean>;
  
  getEventosTimeline(filters: {
    dataInicio?: string;
    dataFim?: string;
    trtId?: string;
    varaId?: string;
  }): Promise<EventoTimeline[]>;
  
  // Brainstorm
  getBrainstormStats(): Promise<BrainstormStats>;
  
  getAllDistribuidos(): Promise<Distribuido[]>;
  createDistribuido(data: InsertDistribuido): Promise<Distribuido>;
  createDistribuidosBatch(data: InsertDistribuido[]): Promise<Distribuido[]>;
  deleteDistribuido(id: string): Promise<boolean>;
  deleteDistribuidosBatch(ids: string[]): Promise<boolean>;
  deleteAllDistribuidos(): Promise<boolean>;
  
  getAllEncerrados(): Promise<Encerrado[]>;
  createEncerrado(data: InsertEncerrado): Promise<Encerrado>;
  createEncerradosBatch(data: InsertEncerrado[]): Promise<Encerrado[]>;
  deleteEncerrado(id: string): Promise<boolean>;
  deleteEncerradosBatch(ids: string[]): Promise<boolean>;
  deleteAllEncerrados(): Promise<boolean>;
  
  getAllSentencasMerito(): Promise<SentencaMerito[]>;
  createSentencaMerito(data: InsertSentencaMerito): Promise<SentencaMerito>;
  createSentencasMeritoBatch(data: InsertSentencaMerito[]): Promise<SentencaMerito[]>;
  deleteSentencaMerito(id: string): Promise<boolean>;
  deleteSentencasMeritoBatch(ids: string[]): Promise<boolean>;
  deleteAllSentencasMerito(): Promise<boolean>;
  
  getAllAcordaosMerito(): Promise<AcordaoMerito[]>;
  createAcordaoMerito(data: InsertAcordaoMerito): Promise<AcordaoMerito>;
  createAcordaosMeritoBatch(data: InsertAcordaoMerito[]): Promise<AcordaoMerito[]>;
  deleteAcordaoMerito(id: string): Promise<boolean>;
  deleteAcordaosMeritoBatch(ids: string[]): Promise<boolean>;
  deleteAllAcordaosMerito(): Promise<boolean>;
  
  initializeBrainstorm(): Promise<void>;
  
  // Mapas Estratégicos - Turmas e Desembargadores
  getAllTurmas(): Promise<Turma[]>;
  getTurma(id: string): Promise<Turma | undefined>;
  createTurma(turma: InsertTurma): Promise<Turma>;
  updateTurma(id: string, data: Partial<InsertTurma>): Promise<Turma | undefined>;
  deleteTurma(id: string): Promise<boolean>;
  
  getAllDesembargadores(): Promise<Desembargador[]>;
  getDesembargadoresByTurma(turmaId: string): Promise<Desembargador[]>;
  getDesembargador(id: string): Promise<Desembargador | undefined>;
  createDesembargador(desembargador: InsertDesembargador): Promise<Desembargador>;
  updateDesembargador(id: string, data: Partial<InsertDesembargador>): Promise<Desembargador | undefined>;
  deleteDesembargador(id: string): Promise<boolean>;
  
  getMapaDecisoesGeral(): Promise<MapaDecisoes>;
  
  // Decisões RPAC
  getAllDecisoesRpac(): Promise<DecisaoRpac[]>;
  getDecisoesRpacByDesembargador(desembargadorId: string): Promise<DecisaoRpac[]>;
  getDecisaoRpac(id: string): Promise<DecisaoRpac | undefined>;
  createDecisaoRpac(decisao: InsertDecisaoRpac): Promise<DecisaoRpac>;
  updateDecisaoRpac(id: string, data: Partial<InsertDecisaoRpac>): Promise<DecisaoRpac | undefined>;
  deleteDecisaoRpac(id: string): Promise<boolean>;
  
  // Dados completos para admin
  getMapaDecisoesAdminData(): Promise<{
    trts: Array<{
      nome: string;
      turmas: Array<{
        id: string;
        nome: string;
        desembargadores: Array<{
          id: string;
          nome: string;
          voto: string;
          decisoes: DecisaoRpac[];
        }>;
      }>;
    }>;
  }>;
  
  // Passivo Mensal
  getPassivoMensal(mes: string, ano: string): Promise<PassivoData | null>;
  savePassivoMensal(mes: string, ano: string, dados: PassivoData): Promise<void>;
  getAllPassivoMensalPeriodos(): Promise<Array<{ mes: string; ano: string }>>;
  deletePassivoMensal(mes: string, ano: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private rawData: ProcessoRaw[] = [];
  private initialized = false;

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

  async initializeBrainstorm(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    await this.loadBrainstormFromExcel();
    await this.loadMapaDecisoesFromExcel();
  }

  async setRawData(data: ProcessoRaw[]): Promise<void> {
    this.rawData = data;
  }

  async getRawData(): Promise<ProcessoRaw[]> {
    return this.rawData;
  }

  async clearRawData(): Promise<void> {
    this.rawData = [];
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

  async getAllAudiencias(): Promise<Audiencia[]> {
    return await db.select().from(audiencias);
  }

  async getAudienciasByVara(varaId: string): Promise<Audiencia[]> {
    return await db.select().from(audiencias).where(eq(audiencias.varaId, varaId));
  }

  async getAudiencia(id: string): Promise<Audiencia | undefined> {
    const [audiencia] = await db.select().from(audiencias).where(eq(audiencias.id, id));
    return audiencia;
  }

  async createAudiencia(audiencia: InsertAudiencia): Promise<Audiencia> {
    const [created] = await db.insert(audiencias).values(audiencia).returning();
    return created;
  }

  async updateAudiencia(id: string, data: Partial<InsertAudiencia>): Promise<Audiencia | undefined> {
    const [updated] = await db.update(audiencias).set(data).where(eq(audiencias.id, id)).returning();
    return updated;
  }

  async deleteAudiencia(id: string): Promise<boolean> {
    await db.delete(audiencias).where(eq(audiencias.id, id));
    return true;
  }

  async getEventosTimeline(filters: {
    dataInicio?: string;
    dataFim?: string;
    trtId?: string;
    varaId?: string;
  }): Promise<EventoTimeline[]> {
    const eventos: EventoTimeline[] = [];
    const allTrts = await this.getAllTRTs();
    
    for (const trt of allTrts) {
      if (filters.trtId && trt.id !== filters.trtId) continue;
      
      const trtVaras = await this.getVarasByTRT(trt.id);
      
      for (const vara of trtVaras) {
        if (filters.varaId && vara.id !== filters.varaId) continue;
        
        const varaJuizes = await this.getJuizesByVara(vara.id);
        
        for (const juiz of varaJuizes) {
          const julgamentosJuiz = await this.getJulgamentosByJuiz(juiz.id);
          
          for (const j of julgamentosJuiz) {
            if (!j.dataJulgamento) continue;
            
            const dataJulg = new Date(j.dataJulgamento);
            if (filters.dataInicio && dataJulg < new Date(filters.dataInicio)) continue;
            if (filters.dataFim && dataJulg > new Date(filters.dataFim)) continue;
            
            const resultadoLabel = j.resultado === 'favoravel' ? 'Favorável' :
              j.resultado === 'desfavoravel' ? 'Desfavorável' : 'Parcial';
            
            eventos.push({
              id: j.id,
              tipo: "decisao",
              data: j.dataJulgamento.toISOString(),
              numeroProcesso: j.numeroProcesso,
              descricao: `Decisão ${resultadoLabel}`,
              resultado: j.resultado,
              trtId: trt.id,
              trtNome: trt.nome,
              trtUF: trt.uf,
              varaId: vara.id,
              varaNome: vara.nome,
              varaCidade: vara.cidade,
              juizId: juiz.id,
              juizNome: juiz.nome,
              parte: j.parte || undefined,
            });
          }
        }
        
        const audienciasVara = await this.getAudienciasByVara(vara.id);
        
        for (const a of audienciasVara) {
          const dataAud = new Date(a.dataAudiencia);
          if (filters.dataInicio && dataAud < new Date(filters.dataInicio)) continue;
          if (filters.dataFim && dataAud > new Date(filters.dataFim)) continue;
          
          const tipoLabel = a.tipo === 'conciliacao' ? 'Conciliação' :
            a.tipo === 'instrucao' ? 'Instrução' : 'Julgamento';
          const statusLabel = a.status === 'agendada' ? 'Agendada' :
            a.status === 'realizada' ? 'Realizada' :
            a.status === 'adiada' ? 'Adiada' : 'Cancelada';
          
          let juizNome: string | undefined;
          if (a.juizId) {
            const juiz = await this.getJuiz(a.juizId);
            juizNome = juiz?.nome;
          }
          
          eventos.push({
            id: a.id,
            tipo: "audiencia",
            data: a.dataAudiencia.toISOString(),
            numeroProcesso: a.numeroProcesso,
            descricao: `Audiência de ${tipoLabel}`,
            status: a.status,
            trtId: trt.id,
            trtNome: trt.nome,
            trtUF: trt.uf,
            varaId: vara.id,
            varaNome: vara.nome,
            varaCidade: vara.cidade,
            juizId: a.juizId || undefined,
            juizNome,
            parte: a.parte || undefined,
          });
        }
      }
    }
    
    eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    return eventos;
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

  // Brainstorm methods
  async getBrainstormStats(): Promise<BrainstormStats> {
    const [distCount] = await db.select({ count: sql<number>`count(*)::int` }).from(distribuidos);
    const [encCount] = await db.select({ count: sql<number>`count(*)::int` }).from(encerrados);
    const [sentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(sentencasMerito);
    const [acordCount] = await db.select({ count: sql<number>`count(*)::int` }).from(acordaosMerito);
    
    return {
      distribuidos: distCount?.count || 0,
      encerrados: encCount?.count || 0,
      sentencasMerito: sentCount?.count || 0,
      acordaosMerito: acordCount?.count || 0,
    };
  }

  async getAllDistribuidos(): Promise<Distribuido[]> {
    return await db.select().from(distribuidos).orderBy(distribuidos.createdAt);
  }

  async createDistribuido(data: InsertDistribuido): Promise<Distribuido> {
    const [created] = await db.insert(distribuidos).values(data).returning();
    return created;
  }

  async createDistribuidosBatch(data: InsertDistribuido[]): Promise<Distribuido[]> {
    if (data.length === 0) return [];
    return await db.insert(distribuidos).values(data).returning();
  }

  async deleteDistribuido(id: string): Promise<boolean> {
    await db.delete(distribuidos).where(eq(distribuidos.id, id));
    return true;
  }

  async deleteDistribuidosBatch(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(distribuidos).where(inArray(distribuidos.id, ids));
    return true;
  }

  async deleteAllDistribuidos(): Promise<boolean> {
    await db.delete(distribuidos);
    return true;
  }

  async getAllEncerrados(): Promise<Encerrado[]> {
    return await db.select().from(encerrados).orderBy(encerrados.createdAt);
  }

  async createEncerrado(data: InsertEncerrado): Promise<Encerrado> {
    const [created] = await db.insert(encerrados).values(data).returning();
    return created;
  }

  async createEncerradosBatch(data: InsertEncerrado[]): Promise<Encerrado[]> {
    if (data.length === 0) return [];
    return await db.insert(encerrados).values(data).returning();
  }

  async deleteEncerrado(id: string): Promise<boolean> {
    await db.delete(encerrados).where(eq(encerrados.id, id));
    return true;
  }

  async deleteEncerradosBatch(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(encerrados).where(inArray(encerrados.id, ids));
    return true;
  }

  async deleteAllEncerrados(): Promise<boolean> {
    await db.delete(encerrados);
    return true;
  }

  async getAllSentencasMerito(): Promise<SentencaMerito[]> {
    return await db.select().from(sentencasMerito).orderBy(sentencasMerito.createdAt);
  }

  async createSentencaMerito(data: InsertSentencaMerito): Promise<SentencaMerito> {
    const [created] = await db.insert(sentencasMerito).values(data).returning();
    return created;
  }

  async createSentencasMeritoBatch(data: InsertSentencaMerito[]): Promise<SentencaMerito[]> {
    if (data.length === 0) return [];
    return await db.insert(sentencasMerito).values(data).returning();
  }

  async deleteSentencaMerito(id: string): Promise<boolean> {
    await db.delete(sentencasMerito).where(eq(sentencasMerito.id, id));
    return true;
  }

  async deleteSentencasMeritoBatch(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(sentencasMerito).where(inArray(sentencasMerito.id, ids));
    return true;
  }

  async deleteAllSentencasMerito(): Promise<boolean> {
    await db.delete(sentencasMerito);
    return true;
  }

  async getAllAcordaosMerito(): Promise<AcordaoMerito[]> {
    return await db.select().from(acordaosMerito).orderBy(acordaosMerito.createdAt);
  }

  async createAcordaoMerito(data: InsertAcordaoMerito): Promise<AcordaoMerito> {
    const [created] = await db.insert(acordaosMerito).values(data).returning();
    return created;
  }

  async createAcordaosMeritoBatch(data: InsertAcordaoMerito[]): Promise<AcordaoMerito[]> {
    if (data.length === 0) return [];
    return await db.insert(acordaosMerito).values(data).returning();
  }

  async deleteAcordaoMerito(id: string): Promise<boolean> {
    await db.delete(acordaosMerito).where(eq(acordaosMerito.id, id));
    return true;
  }

  async deleteAcordaosMeritoBatch(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(acordaosMerito).where(inArray(acordaosMerito.id, ids));
    return true;
  }

  async deleteAllAcordaosMerito(): Promise<boolean> {
    await db.delete(acordaosMerito);
    return true;
  }

  async loadBrainstormFromExcel(): Promise<void> {
    const XLSX = await import('xlsx');
    const fs = await import('fs');
    const path = await import('path');
    
    const excelPath = path.join(process.cwd(), 'attached_assets', 'planilha_brainstorm_1765139329599.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log('Planilha Brainstorm não encontrada');
      return;
    }

    const stats = await this.getBrainstormStats();
    const totalExisting = stats.distribuidos + stats.encerrados + stats.sentencasMerito + stats.acordaosMerito;
    
    if (totalExisting > 0) {
      console.log('Dados Brainstorm já carregados:', totalExisting, 'registros');
      return;
    }

    console.log('Carregando dados Brainstorm do Excel...');
    const workbook = XLSX.default.readFile(excelPath);

    const loadSheet = async (sheetName: string, insertFn: (data: any[]) => Promise<any>) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return 0;
      
      const data = XLSX.default.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      if (data.length <= 1) return 0;
      
      const headers = data[0] as string[];
      const rows = data.slice(1).filter(row => row.length > 0 && row[0]);
      
      return { headers, rows };
    };

    const distribuidosData = await loadSheet('DISTRIBUÍDOS', async () => {});
    if (distribuidosData && distribuidosData.rows.length > 0) {
      const items = distribuidosData.rows.map(row => ({
        numeroProcesso: String(row[0] || ''),
        reclamada: String(row[1] || ''),
        tipoEmpregado: String(row[2] || ''),
        empregadora: String(row[3] || ''),
      }));
      await this.createDistribuidosBatch(items);
      console.log(`  DISTRIBUÍDOS: ${items.length} registros`);
    }

    const encerradosData = await loadSheet('ENCERRADOS', async () => {});
    if (encerradosData && encerradosData.rows.length > 0) {
      const items = encerradosData.rows.map(row => ({
        numeroProcesso: String(row[0] || ''),
        reclamada: String(row[1] || ''),
        tipoEmpregado: String(row[2] || ''),
        empregadora: String(row[3] || ''),
      }));
      await this.createEncerradosBatch(items);
      console.log(`  ENCERRADOS: ${items.length} registros`);
    }

    const sentencasData = await loadSheet('SENTENÇA DE MÉRITO', async () => {});
    if (sentencasData && sentencasData.rows.length > 0) {
      const items = sentencasData.rows.map(row => ({
        numeroProcesso: String(row[0] || ''),
        empresa: String(row[1] || ''),
        tipoDecisao: String(row[2] || ''),
        favorabilidade: String(row[3] || ''),
        empregadora: String(row[4] || ''),
      }));
      await this.createSentencasMeritoBatch(items);
      console.log(`  SENTENÇA DE MÉRITO: ${items.length} registros`);
    }

    const acordaosData = await loadSheet('ACÓRDÃO DE MÉRITO', async () => {});
    if (acordaosData && acordaosData.rows.length > 0) {
      const items = acordaosData.rows.map(row => ({
        numeroProcesso: String(row[0] || ''),
        empresa: String(row[1] || ''),
        tipoDecisao: String(row[2] || ''),
        sinteseDecisao: String(row[3] || ''),
        empregadora: String(row[4] || ''),
      }));
      await this.createAcordaosMeritoBatch(items);
      console.log(`  ACÓRDÃO DE MÉRITO: ${items.length} registros`);
    }

    console.log('Dados Brainstorm carregados com sucesso!');
  }

  async loadMapaDecisoesFromExcel(): Promise<void> {
    const XLSX = await import('xlsx');
    const fs = await import('fs');
    const path = await import('path');
    
    const excelPath = path.join(process.cwd(), 'attached_assets', 'MAPA_-_TRTs_-_TURMAS_-_DESEMBARGADORES_1766076928183.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log('Planilha de Mapa de Decisões não encontrada');
      return;
    }

    const existingTurmas = await this.getAllTurmas();
    if (existingTurmas.length > 0) {
      console.log('Dados Mapa de Decisões já carregados:', existingTurmas.length, 'turmas');
      await this.seedFictionalDecisions();
      return;
    }

    console.log('Carregando dados Mapa de Decisões do Excel...');
    const workbook = XLSX.default.readFile(excelPath);

    let totalTurmas = 0;
    let totalDesembargadores = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      
      const data = XLSX.default.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      if (data.length <= 1) continue;
      
      const trtNome = sheetName.trim();
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        
        const turmaNome = String(row[0]).trim();
        const desembargadoresText = String(row[1] || '');
        
        if (!turmaNome) continue;
        
        const turma = await this.createTurma({
          nome: `${turmaNome} Turma`,
          regiao: trtNome,
        });
        totalTurmas++;
        
        const nomesSeparados = desembargadoresText
          .split(/[\r\n,]+/)
          .map(n => n.trim())
          .filter(n => n.length > 2);
        
        for (const nomeDesembargador of nomesSeparados) {
          const nomeClean = nomeDesembargador
            .replace(/\(.*?\)/g, '')
            .replace(/^\d+\.\s*/, '')
            .trim();
          
          if (nomeClean.length < 3) continue;
          
          await this.createDesembargador({
            turmaId: turma.id,
            nome: nomeClean,
            voto: 'EM ANÁLISE',
          });
          totalDesembargadores++;
        }
      }
      
      console.log(`  ${trtNome}: carregado`);
    }

    console.log(`Dados Mapa de Decisões carregados: ${totalTurmas} turmas, ${totalDesembargadores} desembargadores`);
    
    await this.seedFictionalDecisions();
  }

  async seedFictionalDecisions(): Promise<void> {
    const existingDecisoes = await db.select().from(decisoesRpac).limit(1);
    if (existingDecisoes.length > 0) {
      console.log('Decisões já existem, pulando seed');
      return;
    }

    console.log('Gerando decisões fictícias para teste da timeline...');
    
    const allDesembargadores = await this.getAllDesembargadores();
    const resultados = ['FAVORÁVEL', 'DESFAVORÁVEL'];
    let totalDecisoes = 0;

    for (const desembargador of allDesembargadores) {
      const numDecisoes = Math.floor(Math.random() * 5) + 2;
      
      for (let i = 0; i < numDecisoes; i++) {
        const daysAgo = Math.floor(Math.random() * 365);
        const dataDecisao = new Date();
        dataDecisao.setDate(dataDecisao.getDate() - daysAgo);
        
        const resultado = resultados[Math.floor(Math.random() * resultados.length)];
        const numeroProcesso = `${String(Math.floor(Math.random() * 9000000) + 1000000).padStart(7, '0')}-${String(Math.floor(Math.random() * 90) + 10)}.${2024 - Math.floor(daysAgo / 365)}.5.${String(Math.floor(Math.random() * 24) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 9000) + 1000)}`;
        
        await this.createDecisaoRpac({
          desembargadorId: desembargador.id,
          numeroProcesso,
          resultado,
          dataDecisao,
        });
        totalDecisoes++;
      }
    }

    console.log(`Geradas ${totalDecisoes} decisões fictícias para ${allDesembargadores.length} desembargadores`);
  }

  // Mapas Estratégicos - Turmas
  async getAllTurmas(instancia?: string): Promise<Turma[]> {
    let result;
    if (instancia && instancia !== 'todas') {
      result = await db.select().from(turmas).where(eq(turmas.instancia, instancia));
    } else {
      result = await db.select().from(turmas);
    }
    return this.sortTurmasNumerically(result);
  }

  async getTurma(id: string): Promise<Turma | undefined> {
    const [turma] = await db.select().from(turmas).where(eq(turmas.id, id));
    return turma;
  }

  async createTurma(turma: InsertTurma): Promise<Turma> {
    const [created] = await db.insert(turmas).values(turma).returning();
    return created;
  }

  async updateTurma(id: string, data: Partial<InsertTurma>): Promise<Turma | undefined> {
    const [updated] = await db.update(turmas).set(data).where(eq(turmas.id, id)).returning();
    return updated;
  }

  async deleteTurma(id: string): Promise<boolean> {
    await db.delete(turmas).where(eq(turmas.id, id));
    return true;
  }

  // Mapas Estratégicos - Desembargadores
  async getAllDesembargadores(): Promise<Desembargador[]> {
    return await db.select().from(desembargadores).orderBy(desembargadores.nome);
  }

  async getDesembargadoresByTurma(turmaId: string): Promise<Desembargador[]> {
    return await db.select().from(desembargadores).where(eq(desembargadores.turmaId, turmaId)).orderBy(desembargadores.nome);
  }

  async getDesembargador(id: string): Promise<Desembargador | undefined> {
    const [desembargador] = await db.select().from(desembargadores).where(eq(desembargadores.id, id));
    return desembargador;
  }

  async createDesembargador(desembargador: InsertDesembargador): Promise<Desembargador> {
    const [created] = await db.insert(desembargadores).values(desembargador).returning();
    return created;
  }

  async updateDesembargador(id: string, data: Partial<InsertDesembargador>): Promise<Desembargador | undefined> {
    const [updated] = await db.update(desembargadores).set(data).where(eq(desembargadores.id, id)).returning();
    return updated;
  }

  async deleteDesembargador(id: string): Promise<boolean> {
    await db.delete(desembargadores).where(eq(desembargadores.id, id));
    return true;
  }

  // Mapa de Decisões - agregação para visualização
  private calculateTurmaEstatisticas(desembargadoresList: Desembargador[]) {
    const total = desembargadoresList.length;
    const favoraveis = desembargadoresList.filter(d => this.isFavoravel(d.voto)).length;
    const desfavoraveis = desembargadoresList.filter(d => this.isDesfavoravel(d.voto)).length;
    const emAnalise = desembargadoresList.filter(d => this.isEmAnalise(d.voto)).length;
    const suspeitos = desembargadoresList.filter(d => this.normalizeResultado(d.voto) === 'SUSPEITO').length;

    return {
      total,
      favoraveis,
      desfavoraveis,
      emAnalise,
      suspeitos,
      percentualFavoravel: total > 0 ? Math.round((favoraveis / total) * 100) : 0,
      percentualDesfavoravel: total > 0 ? Math.round((desfavoraveis / total) * 100) : 0,
      percentualEmAnalise: total > 0 ? Math.round((emAnalise / total) * 100) : 0,
      percentualSuspeito: total > 0 ? Math.round((suspeitos / total) * 100) : 0,
    };
  }

  async getMapaDecisoesGeral(): Promise<MapaDecisoes> {
    const turmasList = await this.getAllTurmas();
    const turmasComDesembargadores: TurmaComDesembargadores[] = [];
    let todosDesembargadores: Desembargador[] = [];

    for (const turma of turmasList) {
      const desembargadoresTurma = await this.getDesembargadoresByTurma(turma.id);
      todosDesembargadores = [...todosDesembargadores, ...desembargadoresTurma];

      turmasComDesembargadores.push({
        id: turma.id,
        nome: turma.nome,
        regiao: turma.regiao,
        desembargadores: desembargadoresTurma.map(d => ({
          id: d.id,
          nome: d.nome,
          voto: d.voto,
        })),
        estatisticas: this.calculateTurmaEstatisticas(desembargadoresTurma),
      });
    }

    const estatisticasGerais = this.calculateTurmaEstatisticas(todosDesembargadores);

    return {
      turmas: turmasComDesembargadores,
      estatisticasGerais: {
        total: estatisticasGerais.total,
        favoraveis: estatisticasGerais.favoraveis,
        desfavoraveis: estatisticasGerais.desfavoraveis,
        emAnalise: estatisticasGerais.emAnalise,
        suspeitos: estatisticasGerais.suspeitos,
        percentualFavoravel: estatisticasGerais.percentualFavoravel,
        percentualDesfavoravel: estatisticasGerais.percentualDesfavoravel,
      },
    };
  }

  // Decisões RPAC CRUD
  async getAllDecisoesRpac(): Promise<DecisaoRpac[]> {
    return await db.select().from(decisoesRpac).orderBy(decisoesRpac.createdAt);
  }

  async getDecisoesRpacByDesembargador(desembargadorId: string): Promise<DecisaoRpac[]> {
    return await db.select().from(decisoesRpac).where(eq(decisoesRpac.desembargadorId, desembargadorId)).orderBy(decisoesRpac.createdAt);
  }

  async getDecisaoRpac(id: string): Promise<DecisaoRpac | undefined> {
    const [decisao] = await db.select().from(decisoesRpac).where(eq(decisoesRpac.id, id));
    return decisao;
  }

  async createDecisaoRpac(decisao: InsertDecisaoRpac): Promise<DecisaoRpac> {
    const [created] = await db.insert(decisoesRpac).values(decisao).returning();
    return created;
  }

  async updateDecisaoRpac(id: string, data: Partial<InsertDecisaoRpac>): Promise<DecisaoRpac | undefined> {
    const [updated] = await db.update(decisoesRpac).set(data).where(eq(decisoesRpac.id, id)).returning();
    return updated;
  }

  async deleteDecisaoRpac(id: string): Promise<boolean> {
    await db.delete(decisoesRpac).where(eq(decisoesRpac.id, id));
    return true;
  }

  // Dados completos para admin - hierarquia TRT → Turmas → Desembargadores → Decisões
  async getMapaDecisoesAdminData(instancia?: string): Promise<{
    trts: Array<{
      nome: string;
      turmas: Array<{
        id: string;
        nome: string;
        desembargadores: Array<{
          id: string;
          nome: string;
          voto: string;
          decisoes: DecisaoRpac[];
        }>;
      }>;
    }>;
  }> {
    const turmasList = await this.getAllTurmas(instancia || 'segunda');
    
    // Agrupar turmas por região (TRT)
    const trtMap = new Map<string, typeof turmasList>();
    for (const turma of turmasList) {
      const trtNome = turma.regiao || 'Sem Região';
      if (!trtMap.has(trtNome)) {
        trtMap.set(trtNome, []);
      }
      trtMap.get(trtNome)!.push(turma);
    }

    const trts: Array<{
      nome: string;
      turmas: Array<{
        id: string;
        nome: string;
        desembargadores: Array<{
          id: string;
          nome: string;
          voto: string;
          decisoes: DecisaoRpac[];
        }>;
      }>;
    }> = [];
    
    for (const [trtNome, turmasDoTrt] of Array.from(trtMap.entries())) {
      const turmasComDados = [];
      
      for (const turma of this.sortTurmasNumerically(turmasDoTrt)) {
        const desembargadoresTurma = await this.getDesembargadoresByTurma(turma.id);
        const desembargadoresComDecisoes = [];
        
        for (const desembargador of desembargadoresTurma) {
          const decisoes = await this.getDecisoesRpacByDesembargador(desembargador.id);
          desembargadoresComDecisoes.push({
            id: desembargador.id,
            nome: desembargador.nome,
            voto: desembargador.voto,
            decisoes,
          });
        }
        
        turmasComDados.push({
          id: turma.id,
          nome: turma.nome,
          desembargadores: desembargadoresComDecisoes,
        });
      }
      
      trts.push({
        nome: trtNome,
        turmas: turmasComDados,
      });
    }

    return { trts: trts.sort((a, b) => a.nome.localeCompare(b.nome)) };
  }

  // Analytics: Get TRTs with aggregated statistics
  // Helper: Normalize TRT name to extract number for consistent grouping
  private normalizeTRTKey(regiao: string | null): string {
    if (!regiao) return 'Sem Região';
    // Extract the TRT number from various formats:
    // "TRT1 - RJ", "TRT 13 - PB", "TRTR20 - SE", "TRT - 1" (display format)
    const match = regiao.match(/TRT[R]?\s*[-]?\s*(\d+)/i);
    if (match) {
      return `TRT_${match[1].padStart(2, '0')}`; // TRT_01, TRT_02, etc for sorting
    }
    return regiao;
  }

  // Helper: Format TRT display name
  private formatTRTDisplayName(regiao: string | null): string {
    if (!regiao) return 'Sem Região';
    const match = regiao.match(/TRT[R]?\s*[-]?\s*(\d+)/i);
    if (match) {
      return `TRT - ${match[1]}`;
    }
    return regiao;
  }

  async getTRTsComEstatisticas(responsabilidadeFilter?: string, empresaFilter?: string, instancia?: string, numeroProcesso?: string): Promise<Array<{
    nome: string;
    totalTurmas: number;
    totalDesembargadores: number;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    emAnalise: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas(instancia || 'segunda');
    const trtMap = new Map<string, { 
      displayName: string, 
      allTurmas: Set<string>, 
      allDesembargadores: Set<string>,
      turmasWithMatches: Set<string>, 
      desembargadoresWithMatches: Set<string>, 
      filteredDecisoes: DecisaoRpac[] 
    }>();

    const isFiltering = (responsabilidadeFilter && responsabilidadeFilter !== 'todas') || 
                        (empresaFilter && empresaFilter !== 'todas');

    for (const turma of turmasList) {
      const trtKey = this.normalizeTRTKey(turma.regiao);
      const displayName = this.formatTRTDisplayName(turma.regiao);
      
      if (!trtMap.has(trtKey)) {
        trtMap.set(trtKey, { 
          displayName, 
          allTurmas: new Set(), 
          allDesembargadores: new Set(),
          turmasWithMatches: new Set(), 
          desembargadoresWithMatches: new Set(), 
          filteredDecisoes: [] 
        });
      }
      
      // Always track this turma for the TRT
      trtMap.get(trtKey)!.allTurmas.add(turma.id);
      
      const desembargadores = await this.getDesembargadoresByTurma(turma.id);
      for (const d of desembargadores) {
        // Always track this desembargador for the TRT
        trtMap.get(trtKey)!.allDesembargadores.add(d.id);
        
        const decisoes = await this.getDecisoesRpacByDesembargador(d.id);
        // Filter decisoes by responsabilidade and empresa if filters are active
        let filteredDecisoes = decisoes;
        if (responsabilidadeFilter && responsabilidadeFilter !== 'todas') {
          filteredDecisoes = filteredDecisoes.filter(dec => this.matchesResponsabilidade(dec.responsabilidade, responsabilidadeFilter));
        }
        if (empresaFilter && empresaFilter !== 'todas') {
          filteredDecisoes = filteredDecisoes.filter(dec => dec.empresa === empresaFilter);
        }
        if (numeroProcesso && numeroProcesso.trim()) {
          filteredDecisoes = filteredDecisoes.filter(dec => 
            dec.numeroProcesso.toLowerCase().includes(numeroProcesso.toLowerCase())
          );
        }
        
        // If this judge has matching decisions, track them for counts
        if (filteredDecisoes.length > 0) {
          trtMap.get(trtKey)!.turmasWithMatches.add(turma.id);
          trtMap.get(trtKey)!.desembargadoresWithMatches.add(d.id);
          trtMap.get(trtKey)!.filteredDecisoes.push(...filteredDecisoes);
        }
      }
    }

    const result = [];
    for (const [key, data] of Array.from(trtMap.entries())) {
      // Skip TRTs with no matching decisions when filter is active
      if (isFiltering && data.filteredDecisoes.length === 0) {
        continue;
      }
      
      const favoraveis = data.filteredDecisoes.filter(d => this.isFavoravel(d.resultado)).length;
      const desfavoraveis = data.filteredDecisoes.filter(d => this.isDesfavoravel(d.resultado)).length;
      const emAnalise = data.filteredDecisoes.filter(d => this.isEmAnalise(d.resultado)).length;
      const total = data.filteredDecisoes.length;

      result.push({
        nome: data.displayName,
        totalTurmas: isFiltering ? data.turmasWithMatches.size : data.allTurmas.size,
        totalDesembargadores: isFiltering ? data.desembargadoresWithMatches.size : data.allDesembargadores.size,
        totalDecisoes: total,
        favoraveis,
        desfavoraveis,
        emAnalise,
        percentualFavoravel: total > 0 ? Math.round((favoraveis / total) * 100) : 0,
      });
    }

    return result.sort((a, b) => {
      const numA = parseInt(a.nome.match(/\d+/)?.[0] || '999');
      const numB = parseInt(b.nome.match(/\d+/)?.[0] || '999');
      return numA - numB;
    });
  }

  // Analytics: Get Turmas by TRT with statistics
  async getTurmasByTRT(trtNome: string, responsabilidadeFilter?: string, empresaFilter?: string, instancia?: string, numeroProcesso?: string): Promise<Array<{
    id: string;
    nome: string;
    totalDesembargadores: number;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas(instancia || 'segunda');
    // Normalize the input TRT name to match
    const inputKey = this.normalizeTRTKey(trtNome);
    const turmasDoTrt = turmasList.filter(t => {
      const turmaKey = this.normalizeTRTKey(t.regiao);
      return turmaKey === inputKey;
    });

    const isFiltering = (responsabilidadeFilter && responsabilidadeFilter !== 'todas') || 
                        (empresaFilter && empresaFilter !== 'todas') ||
                        (numeroProcesso && numeroProcesso.trim());

    const result = [];
    for (const turma of turmasDoTrt) {
      const desembargadores = await this.getDesembargadoresByTurma(turma.id);
      let totalDecisoes = 0;
      let favoraveis = 0;
      let desfavoraveis = 0;
      let desembargadoresComDecisoes = 0;

      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id);
        // Filter decisoes by responsabilidade, empresa, and numeroProcesso if filters are active
        let decisoes = allDecisoes;
        if (responsabilidadeFilter && responsabilidadeFilter !== 'todas') {
          decisoes = decisoes.filter(dec => this.matchesResponsabilidade(dec.responsabilidade, responsabilidadeFilter));
        }
        if (empresaFilter && empresaFilter !== 'todas') {
          decisoes = decisoes.filter(dec => dec.empresa === empresaFilter);
        }
        if (numeroProcesso && numeroProcesso.trim()) {
          decisoes = decisoes.filter(dec => dec.numeroProcesso.toLowerCase().includes(numeroProcesso.toLowerCase()));
        }
        
        if (decisoes.length > 0) {
          desembargadoresComDecisoes++;
        }
        totalDecisoes += decisoes.length;
        favoraveis += decisoes.filter(dec => this.isFavoravel(dec.resultado)).length;
        desfavoraveis += decisoes.filter(dec => this.isDesfavoravel(dec.resultado)).length;
      }

      // Skip turmas with no matching decisions when filter is active
      if (isFiltering && totalDecisoes === 0) {
        continue;
      }

      result.push({
        id: turma.id,
        nome: turma.nome,
        totalDesembargadores: isFiltering ? desembargadoresComDecisoes : desembargadores.length,
        totalDecisoes,
        favoraveis,
        desfavoraveis,
        percentualFavoravel: totalDecisoes > 0 ? Math.round((favoraveis / totalDecisoes) * 100) : 0,
      });
    }

    return this.sortTurmasNumerically(result);
  }

  // Analytics: Get Desembargadores by Turma with decisions
  async getDesembargadoresComDecisoesByTurma(turmaId: string): Promise<Array<{
    id: string;
    nome: string;
    voto: string;
    decisoes: DecisaoRpac[];
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>> {
    const desembargadores = await this.getDesembargadoresByTurma(turmaId);
    const result = [];

    for (const d of desembargadores) {
      const decisoes = await this.getDecisoesRpacByDesembargador(d.id);
      const favoraveis = decisoes.filter(dec => this.isFavoravel(dec.resultado)).length;
      const desfavoraveis = decisoes.filter(dec => this.isDesfavoravel(dec.resultado)).length;

      result.push({
        id: d.id,
        nome: d.nome,
        voto: d.voto,
        decisoes,
        favoraveis,
        desfavoraveis,
        percentualFavoravel: decisoes.length > 0 ? Math.round((favoraveis / decisoes.length) * 100) : 0,
      });
    }

    return result.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  // Helper: Normalize resultado text by removing accents for comparison
  private normalizeResultado(resultado: string | null | undefined): string {
    if (!resultado) return '';
    return resultado.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Helper: Sort turmas numerically by extracting number from name (e.g., "10ª Turma" -> 10)
  private sortTurmasNumerically<T extends { nome: string }>(items: T[]): T[] {
    return items.sort((a, b) => {
      const numA = parseInt(a.nome.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.nome.match(/\d+/)?.[0] || '0', 10);
      return numA - numB;
    });
  }

  // Helper: Check if resultado is favorable
  private isFavoravel(resultado: string | null | undefined): boolean {
    const normalized = this.normalizeResultado(resultado);
    return normalized.includes('FAVORAVEL') && !normalized.includes('DESFAVORAVEL');
  }

  // Helper: Check if resultado is unfavorable
  private isDesfavoravel(resultado: string | null | undefined): boolean {
    return this.normalizeResultado(resultado).includes('DESFAVORAVEL');
  }

  // Helper: Check if resultado is under analysis
  private isEmAnalise(resultado: string | null | undefined): boolean {
    return this.normalizeResultado(resultado).includes('ANALISE');
  }

  // Helper: Normalize responsabilidade by removing accents and lowercasing for comparison
  private normalizeResponsabilidade(value: string | null | undefined): string {
    if (!value) return '';
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Helper: Check if responsabilidade matches filter value (case-insensitive, accent-insensitive)
  private matchesResponsabilidade(decisaoResp: string | null | undefined, filterValue: string): boolean {
    const normalized = this.normalizeResponsabilidade(decisaoResp);
    const normalizedFilter = this.normalizeResponsabilidade(filterValue);
    return normalized === normalizedFilter;
  }

  // Helper: Filter decisoes by date range
  private filterDecisoesByDate(decisoes: DecisaoRpac[], dataInicio?: Date, dataFim?: Date): DecisaoRpac[] {
    if (!dataInicio && !dataFim) return decisoes;
    return decisoes.filter(dec => {
      const data = dec.dataDecisao || dec.createdAt;
      if (!data) return false;
      const date = new Date(data);
      if (dataInicio && date < dataInicio) return false;
      if (dataFim && date > dataFim) return false;
      return true;
    });
  }

  // Analytics: Top 5 Turmas by favorability
  async getTopTurmasFavorabilidade(limit: number = 5, dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string): Promise<Array<{
    id: string;
    nome: string;
    trt: string;
    totalDecisoes: number;
    favoraveis: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas();
    const turmasComStats = [];

    for (const turma of turmasList) {
      const desembargadores = await this.getDesembargadoresByTurma(turma.id);
      let totalDecisoes = 0;
      let favoraveis = 0;

      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id);
        let decisoes = this.filterDecisoesByDate(allDecisoes, dataInicio, dataFim);
        if (responsabilidadeFilter && responsabilidadeFilter !== 'todas') {
          decisoes = decisoes.filter(dec => this.matchesResponsabilidade(dec.responsabilidade, responsabilidadeFilter));
        }
        totalDecisoes += decisoes.length;
        favoraveis += decisoes.filter(dec => this.isFavoravel(dec.resultado)).length;
      }

      if (totalDecisoes > 0) {
        turmasComStats.push({
          id: turma.id,
          nome: turma.nome,
          trt: turma.regiao || 'Sem Região',
          totalDecisoes,
          favoraveis,
          percentualFavoravel: Math.round((favoraveis / totalDecisoes) * 100),
        });
      }
    }

    return turmasComStats
      .sort((a, b) => b.percentualFavoravel - a.percentualFavoravel)
      .slice(0, limit);
  }

  // Analytics: Top 5 Regiões (TRTs) by favorability
  async getTopRegioes(limit: number = 5, dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string): Promise<Array<{
    nome: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas();
    const trtMap = new Map<string, { totalDecisoes: number; favoraveis: number; desfavoraveis: number }>();

    for (const turma of turmasList) {
      const trtNome = this.formatTRTDisplayName(turma.regiao);
      if (!trtMap.has(trtNome)) {
        trtMap.set(trtNome, { totalDecisoes: 0, favoraveis: 0, desfavoraveis: 0 });
      }

      const desembargadores = await this.getDesembargadoresByTurma(turma.id);
      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id);
        let decisoes = this.filterDecisoesByDate(allDecisoes, dataInicio, dataFim);
        if (responsabilidadeFilter && responsabilidadeFilter !== 'todas') {
          decisoes = decisoes.filter(dec => this.matchesResponsabilidade(dec.responsabilidade, responsabilidadeFilter));
        }
        const stats = trtMap.get(trtNome)!;
        stats.totalDecisoes += decisoes.length;
        stats.favoraveis += decisoes.filter(dec => this.isFavoravel(dec.resultado)).length;
        stats.desfavoraveis += decisoes.filter(dec => this.isDesfavoravel(dec.resultado)).length;
      }
    }

    const result = [];
    const entries = Array.from(trtMap.entries());
    for (const [nome, stats] of entries) {
      if (stats.totalDecisoes > 0) {
        result.push({
          nome,
          totalDecisoes: stats.totalDecisoes,
          favoraveis: stats.favoraveis,
          desfavoraveis: stats.desfavoraveis,
          percentualFavoravel: Math.round((stats.favoraveis / stats.totalDecisoes) * 100),
        });
      }
    }

    return result
      .sort((a, b) => b.percentualFavoravel - a.percentualFavoravel)
      .slice(0, limit);
  }

  // Analytics: Top 5 Desembargadores by favorability
  async getTopDesembargadores(limit: number = 5, dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string): Promise<Array<{
    id: string;
    nome: string;
    turma: string;
    trt: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas();
    const desembargadoresStats = [];

    for (const turma of turmasList) {
      const desembargadores = await this.getDesembargadoresByTurma(turma.id);
      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id);
        let decisoes = this.filterDecisoesByDate(allDecisoes, dataInicio, dataFim);
        if (responsabilidadeFilter && responsabilidadeFilter !== 'todas') {
          decisoes = decisoes.filter(dec => this.matchesResponsabilidade(dec.responsabilidade, responsabilidadeFilter));
        }
        const favoraveis = decisoes.filter(dec => this.isFavoravel(dec.resultado)).length;
        const desfavoraveis = decisoes.filter(dec => this.isDesfavoravel(dec.resultado)).length;

        if (decisoes.length > 0) {
          desembargadoresStats.push({
            id: d.id,
            nome: d.nome,
            turma: turma.nome,
            trt: this.formatTRTDisplayName(turma.regiao),
            totalDecisoes: decisoes.length,
            favoraveis,
            desfavoraveis,
            percentualFavoravel: Math.round((favoraveis / decisoes.length) * 100),
          });
        }
      }
    }

    return desembargadoresStats
      .sort((a, b) => b.percentualFavoravel - a.percentualFavoravel)
      .slice(0, limit);
  }

  // Analytics: General favorability statistics
  async getEstatisticasGerais(dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string): Promise<{
    totalTRTs: number;
    totalTurmas: number;
    totalDesembargadores: number;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    emAnalise: number;
    percentualFavoravel: number;
    percentualDesfavoravel: number;
    upiSim: number;
    upiNao: number;
    solidarias: number;
    subsidiarias: number;
  }> {
    const turmasList = await this.getAllTurmas();
    const trtSet = new Set(turmasList.map(t => t.regiao || 'Sem Região'));
    let totalDesembargadores = 0;
    let totalDecisoes = 0;
    let favoraveis = 0;
    let desfavoraveis = 0;
    let emAnalise = 0;
    let upiSim = 0;
    let upiNao = 0;
    let solidarias = 0;
    let subsidiarias = 0;

    for (const turma of turmasList) {
      const desembargadores = await this.getDesembargadoresByTurma(turma.id);
      totalDesembargadores += desembargadores.length;

      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id);
        let decisoes = this.filterDecisoesByDate(allDecisoes, dataInicio, dataFim);
        
        // Filter by responsabilidade if specified
        if (responsabilidadeFilter && responsabilidadeFilter !== 'todas') {
          decisoes = decisoes.filter(dec => this.matchesResponsabilidade(dec.responsabilidade, responsabilidadeFilter));
        }
        
        totalDecisoes += decisoes.length;
        for (const dec of decisoes) {
          const resultado = dec.resultado?.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
          if (resultado.includes('FAVORAVEL') && !resultado.includes('DESFAVORAVEL')) {
            favoraveis++;
          } else if (resultado.includes('DESFAVORAVEL')) {
            desfavoraveis++;
          } else if (resultado.includes('ANALISE')) {
            emAnalise++;
          }
          
          // Count UPI and Responsabilidade
          if (dec.upi === 'sim') {
            upiSim++;
          } else {
            upiNao++;
          }
          if (this.matchesResponsabilidade(dec.responsabilidade, 'solidaria')) {
            solidarias++;
          } else {
            subsidiarias++;
          }
        }
      }
    }

    return {
      totalTRTs: trtSet.size,
      totalTurmas: turmasList.length,
      totalDesembargadores,
      totalDecisoes,
      favoraveis,
      desfavoraveis,
      emAnalise,
      percentualFavoravel: totalDecisoes > 0 ? Math.round((favoraveis / totalDecisoes) * 100) : 0,
      percentualDesfavoravel: totalDecisoes > 0 ? Math.round((desfavoraveis / totalDecisoes) * 100) : 0,
      upiSim,
      upiNao,
      solidarias,
      subsidiarias,
    };
  }

  // Analytics: Timeline data by month
  async getTimelineData(dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string): Promise<Array<{
    mes: string;
    ano: number;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
    percentualDesfavoravel: number;
  }>> {
    const allDecisoes = await this.getAllDecisoesRpac();
    const monthlyData = new Map<string, { total: number; favoraveis: number; desfavoraveis: number }>();

    for (const decisao of allDecisoes) {
      // Filter by responsabilidade if specified
      if (responsabilidadeFilter && responsabilidadeFilter !== 'todas') {
        if (!this.matchesResponsabilidade(decisao.responsabilidade, responsabilidadeFilter)) {
          continue;
        }
      }
      
      const data = decisao.dataDecisao || decisao.createdAt;
      if (!data) continue;

      const date = new Date(data);
      
      if (dataInicio && date < dataInicio) continue;
      if (dataFim && date > dataFim) continue;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, { total: 0, favoraveis: 0, desfavoraveis: 0 });
      }

      const stats = monthlyData.get(key)!;
      stats.total++;
      if (this.isFavoravel(decisao.resultado)) {
        stats.favoraveis++;
      }
      if (this.isDesfavoravel(decisao.resultado)) {
        stats.desfavoraveis++;
      }
    }

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const result = [];

    for (const [key, stats] of Array.from(monthlyData.entries())) {
      const [ano, mesNum] = key.split('-').map(Number);
      result.push({
        mes: meses[mesNum - 1],
        ano,
        totalDecisoes: stats.total,
        favoraveis: stats.favoraveis,
        desfavoraveis: stats.desfavoraveis,
        percentualFavoravel: stats.total > 0 ? Math.round((stats.favoraveis / stats.total) * 100) : 0,
        percentualDesfavoravel: stats.total > 0 ? Math.round((stats.desfavoraveis / stats.total) * 100) : 0,
      });
    }

    return result.sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return meses.indexOf(a.mes) - meses.indexOf(b.mes);
    });
  }

  // Analytics: Statistics by empresa
  async getEstatisticasPorEmpresa(dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string): Promise<Array<{
    empresa: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    emAnalise: number;
    percentualFavoravel: number;
    percentualDesfavoravel: number;
  }>> {
    const allDecisoes = await this.getAllDecisoesRpac();
    const empresaMap = new Map<string, { total: number; favoraveis: number; desfavoraveis: number; emAnalise: number }>();

    for (const decisao of allDecisoes) {
      // Filter by responsabilidade if specified
      if (responsabilidadeFilter && responsabilidadeFilter !== 'todas') {
        if (!this.matchesResponsabilidade(decisao.responsabilidade, responsabilidadeFilter)) {
          continue;
        }
      }

      // Filter by date if specified
      const data = decisao.dataDecisao || decisao.createdAt;
      if (data) {
        const date = new Date(data);
        if (dataInicio && date < dataInicio) continue;
        if (dataFim && date > dataFim) continue;
      }

      const empresa = decisao.empresa || 'Não Informado';
      
      if (!empresaMap.has(empresa)) {
        empresaMap.set(empresa, { total: 0, favoraveis: 0, desfavoraveis: 0, emAnalise: 0 });
      }

      const stats = empresaMap.get(empresa)!;
      stats.total++;
      if (this.isFavoravel(decisao.resultado)) {
        stats.favoraveis++;
      }
      if (this.isDesfavoravel(decisao.resultado)) {
        stats.desfavoraveis++;
      }
      if (this.isEmAnalise(decisao.resultado)) {
        stats.emAnalise++;
      }
    }

    const result = [];
    for (const [empresa, stats] of Array.from(empresaMap.entries())) {
      result.push({
        empresa,
        totalDecisoes: stats.total,
        favoraveis: stats.favoraveis,
        desfavoraveis: stats.desfavoraveis,
        emAnalise: stats.emAnalise,
        percentualFavoravel: stats.total > 0 ? Math.round((stats.favoraveis / stats.total) * 100) : 0,
        percentualDesfavoravel: stats.total > 0 ? Math.round((stats.desfavoraveis / stats.total) * 100) : 0,
      });
    }

    return result.sort((a, b) => b.totalDecisoes - a.totalDecisoes);
  }

  async getPassivoMensal(mes: string, ano: string): Promise<PassivoData | null> {
    const result = await db.select().from(passivoMensal).where(
      and(
        eq(passivoMensal.mes, mes),
        eq(passivoMensal.ano, ano)
      )
    );
    
    if (result.length === 0) return null;
    return result[0].dados as PassivoData;
  }

  async savePassivoMensal(mes: string, ano: string, dados: PassivoData): Promise<void> {
    const existing = await db.select().from(passivoMensal).where(
      and(
        eq(passivoMensal.mes, mes),
        eq(passivoMensal.ano, ano)
      )
    );

    if (existing.length > 0) {
      await db.update(passivoMensal)
        .set({ dados, updatedAt: new Date() })
        .where(
          and(
            eq(passivoMensal.mes, mes),
            eq(passivoMensal.ano, ano)
          )
        );
    } else {
      await db.insert(passivoMensal).values({
        mes,
        ano,
        dados
      });
    }
  }

  async getAllPassivoMensalPeriodos(): Promise<Array<{ mes: string; ano: string }>> {
    const results = await db.select({
      mes: passivoMensal.mes,
      ano: passivoMensal.ano
    }).from(passivoMensal).orderBy(passivoMensal.ano, passivoMensal.mes);
    
    return results;
  }

  async deletePassivoMensal(mes: string, ano: string): Promise<boolean> {
    const result = await db.delete(passivoMensal).where(
      and(
        eq(passivoMensal.mes, mes),
        eq(passivoMensal.ano, ano)
      )
    );
    return true;
  }
}

export const storage = new MemStorage();
