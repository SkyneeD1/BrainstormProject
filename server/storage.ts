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
  UserTenant,
  InsertUserTenant,
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
  InsertDecisaoRpac,
  CasoNovo,
  InsertCasoNovo,
  CasoEncerrado,
  InsertCasoEncerrado,
  Tenant,
  InsertTenant
} from "@shared/schema";
import { users, userTenants, trts, varas, juizes, julgamentos, audiencias, distribuidos, encerrados, sentencasMerito, acordaosMerito, turmas, desembargadores, decisoesRpac, passivoMensal, casosNovos, casosEncerrados, tenants } from "@shared/schema";
import { and, gte, lte, inArray, sql } from "drizzle-orm";
import { parseExcelFile } from "./excel-parser";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Tenant methods
  getAllTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByCode(code: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined>;
  seedDefaultTenants(): Promise<void>;
  
  getPassivoData(tenantId: string): Promise<PassivoData>;
  setRawData(tenantId: string, data: ProcessoRaw[]): Promise<void>;
  getRawData(tenantId: string): Promise<ProcessoRaw[]>;
  clearRawData(tenantId: string): Promise<void>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameAndTenant(username: string, tenantId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<User | undefined>;
  updateUser(id: string, data: { role?: string; modulePermissions?: string[] }): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  
  // User-Tenant many-to-many methods
  getUserTenants(userId: string): Promise<Tenant[]>;
  addUserToTenant(userId: string, tenantId: string, isDefault?: boolean): Promise<UserTenant>;
  removeUserFromTenant(userId: string, tenantId: string): Promise<boolean>;
  setUserDefaultTenant(userId: string, tenantId: string): Promise<boolean>;
  isUserInTenant(userId: string, tenantId: string): Promise<boolean>;
  
  getAllTRTs(tenantId: string): Promise<TRT[]>;
  getTRT(id: string, tenantId: string): Promise<TRT | undefined>;
  createTRT(tenantId: string, trt: Omit<InsertTRT, 'tenantId'>): Promise<TRT>;
  updateTRT(id: string, data: Partial<Omit<InsertTRT, 'tenantId'>>, tenantId: string): Promise<TRT | undefined>;
  deleteTRT(id: string, tenantId: string): Promise<boolean>;
  
  getVarasByTRT(trtId: string, tenantId: string): Promise<Vara[]>;
  getVara(id: string, tenantId: string): Promise<Vara | undefined>;
  createVara(vara: InsertVara): Promise<Vara>;
  updateVara(id: string, data: Partial<InsertVara>, tenantId: string): Promise<Vara | undefined>;
  deleteVara(id: string, tenantId: string): Promise<boolean>;
  
  getJuizesByVara(varaId: string, tenantId: string): Promise<Juiz[]>;
  getJuiz(id: string, tenantId: string): Promise<Juiz | undefined>;
  createJuiz(juiz: InsertJuiz): Promise<Juiz>;
  updateJuiz(id: string, data: Partial<InsertJuiz>, tenantId: string): Promise<Juiz | undefined>;
  deleteJuiz(id: string, tenantId: string): Promise<boolean>;
  
  getJulgamentosByJuiz(juizId: string, tenantId: string): Promise<Julgamento[]>;
  getJulgamento(id: string, tenantId: string): Promise<Julgamento | undefined>;
  createJulgamento(julgamento: InsertJulgamento): Promise<Julgamento>;
  updateJulgamento(id: string, data: Partial<InsertJulgamento>, tenantId: string): Promise<Julgamento | undefined>;
  deleteJulgamento(id: string, tenantId: string): Promise<boolean>;
  
  getJuizFavorabilidade(juizId: string, tenantId: string): Promise<Favorabilidade>;
  getAllJuizesComFavorabilidade(tenantId: string): Promise<JuizComFavorabilidade[]>;
  getAllTRTsComFavorabilidade(tenantId: string): Promise<TRTComFavorabilidade[]>;
  
  getAllAudiencias(tenantId: string): Promise<Audiencia[]>;
  getAudienciasByVara(varaId: string, tenantId: string): Promise<Audiencia[]>;
  getAudiencia(id: string, tenantId: string): Promise<Audiencia | undefined>;
  createAudiencia(tenantId: string, audiencia: Omit<InsertAudiencia, 'tenantId'>): Promise<Audiencia>;
  updateAudiencia(id: string, data: Partial<Omit<InsertAudiencia, 'tenantId'>>, tenantId: string): Promise<Audiencia | undefined>;
  deleteAudiencia(id: string, tenantId: string): Promise<boolean>;
  
  getEventosTimeline(tenantId: string, filters: {
    dataInicio?: string;
    dataFim?: string;
    trtId?: string;
    varaId?: string;
  }): Promise<EventoTimeline[]>;
  
  // Brainstorm
  getBrainstormStats(tenantId: string): Promise<BrainstormStats>;
  
  getAllDistribuidos(tenantId: string): Promise<Distribuido[]>;
  createDistribuido(tenantId: string, data: Omit<InsertDistribuido, 'tenantId'>): Promise<Distribuido>;
  createDistribuidosBatch(tenantId: string, data: Omit<InsertDistribuido, 'tenantId'>[]): Promise<Distribuido[]>;
  deleteDistribuido(id: string, tenantId: string): Promise<boolean>;
  deleteDistribuidosBatch(ids: string[], tenantId: string): Promise<boolean>;
  deleteAllDistribuidos(tenantId: string): Promise<boolean>;
  
  getAllEncerrados(tenantId: string): Promise<Encerrado[]>;
  createEncerrado(tenantId: string, data: Omit<InsertEncerrado, 'tenantId'>): Promise<Encerrado>;
  createEncerradosBatch(tenantId: string, data: Omit<InsertEncerrado, 'tenantId'>[]): Promise<Encerrado[]>;
  deleteEncerrado(id: string, tenantId: string): Promise<boolean>;
  deleteEncerradosBatch(ids: string[], tenantId: string): Promise<boolean>;
  deleteAllEncerrados(tenantId: string): Promise<boolean>;
  
  getAllSentencasMerito(tenantId: string): Promise<SentencaMerito[]>;
  createSentencaMerito(tenantId: string, data: Omit<InsertSentencaMerito, 'tenantId'>): Promise<SentencaMerito>;
  createSentencasMeritoBatch(tenantId: string, data: Omit<InsertSentencaMerito, 'tenantId'>[]): Promise<SentencaMerito[]>;
  deleteSentencaMerito(id: string, tenantId: string): Promise<boolean>;
  deleteSentencasMeritoBatch(ids: string[], tenantId: string): Promise<boolean>;
  deleteAllSentencasMerito(tenantId: string): Promise<boolean>;
  
  getAllAcordaosMerito(tenantId: string): Promise<AcordaoMerito[]>;
  createAcordaoMerito(tenantId: string, data: Omit<InsertAcordaoMerito, 'tenantId'>): Promise<AcordaoMerito>;
  createAcordaosMeritoBatch(tenantId: string, data: Omit<InsertAcordaoMerito, 'tenantId'>[]): Promise<AcordaoMerito[]>;
  deleteAcordaoMerito(id: string, tenantId: string): Promise<boolean>;
  deleteAcordaosMeritoBatch(ids: string[], tenantId: string): Promise<boolean>;
  deleteAllAcordaosMerito(tenantId: string): Promise<boolean>;
  
  // Mapas Estratégicos - Turmas e Desembargadores
  getAllTurmas(tenantId: string, instancia?: string): Promise<Turma[]>;
  getTurma(id: string, tenantId: string): Promise<Turma | undefined>;
  getTurmaByName(nome: string, tenantId: string): Promise<Turma | undefined>;
  findOrCreateTurma(tenantId: string, nome: string, regiao?: string, instancia?: string): Promise<Turma>;
  createTurma(tenantId: string, turma: InsertTurma): Promise<Turma>;
  updateTurma(id: string, data: Partial<InsertTurma>, tenantId: string): Promise<Turma | undefined>;
  deleteTurma(id: string, tenantId: string): Promise<boolean>;
  
  getAllDesembargadores(tenantId: string): Promise<Desembargador[]>;
  getDesembargadoresByTurma(turmaId: string, tenantId: string): Promise<Desembargador[]>;
  getDesembargador(id: string, tenantId: string): Promise<Desembargador | undefined>;
  getDesembargadorByName(nome: string, tenantId: string): Promise<Desembargador | undefined>;
  findOrCreateDesembargador(tenantId: string, nome: string, turmaId: string): Promise<Desembargador>;
  createDesembargador(tenantId: string, desembargador: InsertDesembargador): Promise<Desembargador>;
  updateDesembargador(id: string, data: Partial<InsertDesembargador>, tenantId: string): Promise<Desembargador | undefined>;
  deleteDesembargador(id: string, tenantId: string): Promise<boolean>;
  
  // Smart import with auto-creation
  importDecisaoWithAutoCreate(tenantId: string, data: {
    dataDecisao: string;
    numeroProcesso: string;
    local: string;
    turma: string;
    relator: string;
    resultado: string;
    responsabilidade?: string;
    upi?: string;
    empresa: string;
    instancia?: string;
  }): Promise<{ decisao: DecisaoRpac; turmaCreated: boolean; desembargadorCreated: boolean }>;
  
  getMapaDecisoesGeral(tenantId: string): Promise<MapaDecisoes>;
  
  // Decisões RPAC
  getAllDecisoesRpac(tenantId: string): Promise<DecisaoRpac[]>;
  getDecisoesRpacByDesembargador(desembargadorId: string, tenantId: string): Promise<DecisaoRpac[]>;
  getDecisaoRpac(id: string, tenantId: string): Promise<DecisaoRpac | undefined>;
  createDecisaoRpac(tenantId: string, decisao: InsertDecisaoRpac): Promise<DecisaoRpac>;
  updateDecisaoRpac(id: string, data: Partial<InsertDecisaoRpac>, tenantId: string): Promise<DecisaoRpac | undefined>;
  deleteDecisaoRpac(id: string, tenantId: string): Promise<boolean>;
  
  // Dados completos para admin
  getMapaDecisoesAdminData(tenantId: string, instancia?: string): Promise<{
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
  getPassivoMensal(tenantId: string, mes: string, ano: string): Promise<PassivoData | null>;
  savePassivoMensal(tenantId: string, mes: string, ano: string, dados: PassivoData): Promise<void>;
  getAllPassivoMensalPeriodos(tenantId: string): Promise<Array<{ mes: string; ano: string }>>;
  deletePassivoMensal(tenantId: string, mes: string, ano: string): Promise<boolean>;
  
  // Casos Novos - Entrada & Saídas
  getAllCasosNovos(tenantId: string): Promise<CasoNovo[]>;
  getCasoNovo(id: string, tenantId: string): Promise<CasoNovo | undefined>;
  createCasoNovo(tenantId: string, caso: InsertCasoNovo): Promise<CasoNovo>;
  createCasosNovosBatch(tenantId: string, casos: InsertCasoNovo[]): Promise<CasoNovo[]>;
  deleteCasoNovo(id: string, tenantId: string): Promise<boolean>;
  deleteCasosNovosBatch(ids: string[], tenantId: string): Promise<boolean>;
  deleteAllCasosNovos(tenantId: string): Promise<boolean>;
  getCasosNovosStats(tenantId: string, mesReferencia?: string): Promise<{
    total: number;
    mesAtual: number;
    mesAnterior: number;
    variacaoPercentual: number;
    porTribunal: Array<{ tribunal: string; quantidade: number; percentual: number }>;
    porEmpresa: Array<{ empresa: string; quantidade: number; percentual: number }>;
    porMes: Array<{ mes: string; ano: string; quantidade: number }>;
    valorTotalContingencia: number;
  }>;
  
  // Casos Encerrados - Entrada & Saídas
  getAllCasosEncerrados(tenantId: string): Promise<CasoEncerrado[]>;
  getCasoEncerrado(id: string, tenantId: string): Promise<CasoEncerrado | undefined>;
  createCasoEncerrado(tenantId: string, caso: InsertCasoEncerrado): Promise<CasoEncerrado>;
  createCasosEncerradosBatch(tenantId: string, casos: InsertCasoEncerrado[]): Promise<CasoEncerrado[]>;
  deleteCasoEncerrado(id: string, tenantId: string): Promise<boolean>;
  deleteCasosEncerradosBatch(ids: string[], tenantId: string): Promise<boolean>;
  deleteAllCasosEncerrados(tenantId: string): Promise<boolean>;
  getCasosEncerradosStats(tenantId: string, mesReferencia?: string): Promise<{
    total: number;
    mesAtual: number;
    mesAnterior: number;
    variacaoPercentual: number;
    porTribunal: Array<{ tribunal: string; quantidade: number; percentual: number }>;
    porEmpresa: Array<{ empresa: string; quantidade: number; percentual: number }>;
    porMes: Array<{ mes: string; ano: string; quantidade: number }>;
    valorTotalContingencia: number;
  }>;
}

export class MemStorage implements IStorage {
  private rawDataByTenant: Map<string, ProcessoRaw[]> = new Map();
  private initialized = false;

  constructor() {
    // Don't auto-load data from Excel - system should start clean
    // Data will be imported by admin through the import functionality
  }

  async initializeBrainstorm(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    // Don't auto-load data - system should start clean
    // await this.loadBrainstormFromExcel();
    // await this.loadMapaDecisoesFromExcel();
    console.log('Sistema iniciado sem dados pré-carregados');
  }

  async setRawData(tenantId: string, data: ProcessoRaw[]): Promise<void> {
    this.rawDataByTenant.set(tenantId, data);
  }

  async getRawData(tenantId: string): Promise<ProcessoRaw[]> {
    return this.rawDataByTenant.get(tenantId) || [];
  }

  async clearRawData(tenantId: string): Promise<void> {
    this.rawDataByTenant.delete(tenantId);
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

  async updateUser(id: string, data: { role?: string; modulePermissions?: string[] }): Promise<User | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    if (data.modulePermissions !== undefined) {
      updateData.modulePermissions = data.modulePermissions;
    }
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async getUserByUsernameAndTenant(username: string, tenantId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.tenantId, tenantId)));
    return user;
  }

  // User-Tenant many-to-many methods
  async getUserTenants(userId: string): Promise<Tenant[]> {
    const results = await db
      .select({
        id: tenants.id,
        code: tenants.code,
        name: tenants.name,
        primaryColor: tenants.primaryColor,
        backgroundColor: tenants.backgroundColor,
        logoUrl: tenants.logoUrl,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
      })
      .from(userTenants)
      .innerJoin(tenants, eq(userTenants.tenantId, tenants.id))
      .where(eq(userTenants.userId, userId));
    return results;
  }

  async addUserToTenant(userId: string, tenantId: string, isDefault: boolean = false): Promise<UserTenant> {
    // Check if already exists
    const existing = await db
      .select()
      .from(userTenants)
      .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [created] = await db
      .insert(userTenants)
      .values({ userId, tenantId, isDefault: isDefault ? "true" : "false" })
      .returning();
    return created;
  }

  async removeUserFromTenant(userId: string, tenantId: string): Promise<boolean> {
    await db
      .delete(userTenants)
      .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)));
    return true;
  }

  async setUserDefaultTenant(userId: string, tenantId: string): Promise<boolean> {
    // First, set all to non-default
    await db
      .update(userTenants)
      .set({ isDefault: "false" })
      .where(eq(userTenants.userId, userId));
    
    // Then set the specified one as default
    await db
      .update(userTenants)
      .set({ isDefault: "true" })
      .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)));
    
    return true;
  }

  async isUserInTenant(userId: string, tenantId: string): Promise<boolean> {
    const results = await db
      .select()
      .from(userTenants)
      .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)));
    return results.length > 0;
  }

  // Tenant methods
  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).where(eq(tenants.isActive, "true"));
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByCode(code: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.code, code));
    return tenant;
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const [tenant] = await db
      .insert(tenants)
      .values(tenantData)
      .returning();
    return tenant;
  }

  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [tenant] = await db
      .update(tenants)
      .set(data)
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async seedDefaultTenants(): Promise<void> {
    try {
      // Check if V.tal tenant exists
      const existingVtal = await this.getTenantByCode("vtal");
      if (!existingVtal) {
        await this.createTenant({
          code: "vtal",
          name: "V.tal",
          primaryColor: "#ffd700",
          backgroundColor: "#0a1628",
          logoUrl: "https://vtal.com/wp-content/uploads/2025/02/logo-vtal-footer.png",
        });
        console.log("Default tenant V.tal created");
      } else if (!existingVtal.logoUrl) {
        await db.update(tenants)
          .set({ logoUrl: "https://vtal.com/wp-content/uploads/2025/02/logo-vtal-footer.png" })
          .where(eq(tenants.id, existingVtal.id));
        console.log("V.tal tenant logo updated");
      }

      // Check if NIO tenant exists
      const existingNio = await this.getTenantByCode("nio");
      if (!existingNio) {
        await this.createTenant({
          code: "nio",
          name: "NIO",
          primaryColor: "#01DA01",
          backgroundColor: "#182B1B",
          logoUrl: "/nio-logo.svg",
        });
        console.log("Default tenant NIO created");
      } else if (!existingNio.logoUrl) {
        await db.update(tenants)
          .set({ logoUrl: "/nio-logo.svg" })
          .where(eq(tenants.id, existingNio.id));
        console.log("NIO tenant logo updated");
      }
    } catch (error) {
      console.error("Error seeding default tenants:", error);
    }
  }

  async getPassivoData(tenantId: string): Promise<PassivoData> {
    const rawData = this.rawDataByTenant.get(tenantId) || [];
    const fases = this.calculateFaseData(rawData);
    const riscos = this.calculateRiscoData(rawData);
    const empresas = this.calculateEmpresaData(rawData);
    const summary = this.calculateSummary(rawData);

    return {
      fases,
      riscos,
      empresas,
      summary,
      rawData,
    };
  }

  private calculateFaseData(rawData: ProcessoRaw[]): FaseData[] {
    const faseMap = new Map<FaseProcessual, { processos: number; valor: number }>();
    
    const fases: FaseProcessual[] = ["Conhecimento", "Recursal", "Execução"];
    fases.forEach(f => faseMap.set(f, { processos: 0, valor: 0 }));

    rawData.forEach(p => {
      const current = faseMap.get(p.faseProcessual) || { processos: 0, valor: 0 };
      current.processos += 1;
      current.valor += p.valorTotal;
      faseMap.set(p.faseProcessual, current);
    });

    const totalProcessos = rawData.length;
    const totalValor = rawData.reduce((sum, p) => sum + p.valorTotal, 0);

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

  private calculateRiscoData(rawData: ProcessoRaw[]): RiscoData[] {
    const riscoMap = new Map<ClassificacaoRisco, { processos: number; valor: number }>();
    
    const riscos: ClassificacaoRisco[] = ["Remoto", "Possível", "Provável"];
    riscos.forEach(r => riscoMap.set(r, { processos: 0, valor: 0 }));

    rawData.forEach(p => {
      const current = riscoMap.get(p.classificacaoRisco) || { processos: 0, valor: 0 };
      current.processos += 1;
      current.valor += p.valorTotal;
      riscoMap.set(p.classificacaoRisco, current);
    });

    const totalProcessos = rawData.length;
    const totalValor = rawData.reduce((sum, p) => sum + p.valorTotal, 0);

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

  private calculateEmpresaData(rawData: ProcessoRaw[]): EmpresaFaseData[] {
    const empresas: Empresa[] = ["V.tal", "OI", "Serede", "Sprink", "Outros Terceiros"];
    const fases: FaseProcessual[] = ["Conhecimento", "Recursal", "Execução"];
    
    const empresaMap = new Map<Empresa, Map<FaseProcessual, { processos: number; valor: number }>>();
    
    empresas.forEach(emp => {
      const faseMap = new Map<FaseProcessual, { processos: number; valor: number }>();
      fases.forEach(f => faseMap.set(f, { processos: 0, valor: 0 }));
      empresaMap.set(emp, faseMap);
    });

    rawData.forEach(p => {
      const faseMap = empresaMap.get(p.empresa);
      if (faseMap) {
        const current = faseMap.get(p.faseProcessual) || { processos: 0, valor: 0 };
        current.processos += 1;
        current.valor += p.valorTotal;
        faseMap.set(p.faseProcessual, current);
      }
    });

    const totalProcessos = rawData.length;
    const totalValor = rawData.reduce((sum, p) => sum + p.valorTotal, 0);

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

  private calculateSummary(rawData: ProcessoRaw[]): DashboardSummary {
    const totalProcessos = rawData.length;
    const totalValor = rawData.reduce((sum, p) => sum + p.valorTotal, 0);
    
    const riscoProvavel = rawData.filter(p => p.classificacaoRisco === "Provável").length;
    const faseRecursal = rawData.filter(p => p.faseProcessual === "Recursal").length;

    return {
      totalProcessos,
      totalPassivo: Math.round(totalValor),
      ticketMedioGlobal: totalProcessos > 0 ? Math.round(totalValor / totalProcessos) : 0,
      percentualRiscoProvavel: totalProcessos > 0 ? Math.round((riscoProvavel / totalProcessos) * 100) : 0,
      percentualFaseRecursal: totalProcessos > 0 ? Math.round((faseRecursal / totalProcessos) * 100) : 0,
    };
  }

  async getAllTRTs(tenantId: string): Promise<TRT[]> {
    return await db.select().from(trts).where(eq(trts.tenantId, tenantId)).orderBy(trts.numero);
  }

  async getTRT(id: string, tenantId: string): Promise<TRT | undefined> {
    const [trt] = await db.select().from(trts).where(and(eq(trts.id, id), eq(trts.tenantId, tenantId)));
    return trt;
  }

  async createTRT(tenantId: string, trt: Omit<InsertTRT, 'tenantId'>): Promise<TRT> {
    const [created] = await db.insert(trts).values({ ...trt, tenantId }).returning();
    return created;
  }

  async updateTRT(id: string, data: Partial<Omit<InsertTRT, 'tenantId'>>, tenantId: string): Promise<TRT | undefined> {
    const [updated] = await db.update(trts).set(data).where(and(eq(trts.id, id), eq(trts.tenantId, tenantId))).returning();
    return updated;
  }

  async deleteTRT(id: string, tenantId: string): Promise<boolean> {
    await db.delete(trts).where(and(eq(trts.id, id), eq(trts.tenantId, tenantId)));
    return true;
  }

  async getVarasByTRT(trtId: string, tenantId: string): Promise<Vara[]> {
    return await db.select().from(varas).where(and(eq(varas.trtId, trtId), eq(varas.tenantId, tenantId)));
  }

  async getVara(id: string, tenantId: string): Promise<Vara | undefined> {
    const [vara] = await db.select().from(varas).where(and(eq(varas.id, id), eq(varas.tenantId, tenantId)));
    return vara;
  }

  async createVara(vara: InsertVara): Promise<Vara> {
    const [created] = await db.insert(varas).values(vara).returning();
    return created;
  }

  async updateVara(id: string, data: Partial<InsertVara>, tenantId: string): Promise<Vara | undefined> {
    const [updated] = await db.update(varas).set(data).where(and(eq(varas.id, id), eq(varas.tenantId, tenantId))).returning();
    return updated;
  }

  async deleteVara(id: string, tenantId: string): Promise<boolean> {
    await db.delete(varas).where(and(eq(varas.id, id), eq(varas.tenantId, tenantId)));
    return true;
  }

  async getJuizesByVara(varaId: string, tenantId: string): Promise<Juiz[]> {
    return await db.select().from(juizes).where(and(eq(juizes.varaId, varaId), eq(juizes.tenantId, tenantId)));
  }

  async getJuiz(id: string, tenantId: string): Promise<Juiz | undefined> {
    const [juiz] = await db.select().from(juizes).where(and(eq(juizes.id, id), eq(juizes.tenantId, tenantId)));
    return juiz;
  }

  async createJuiz(juiz: InsertJuiz): Promise<Juiz> {
    const [created] = await db.insert(juizes).values(juiz).returning();
    return created;
  }

  async updateJuiz(id: string, data: Partial<InsertJuiz>, tenantId: string): Promise<Juiz | undefined> {
    const [updated] = await db.update(juizes).set(data).where(and(eq(juizes.id, id), eq(juizes.tenantId, tenantId))).returning();
    return updated;
  }

  async deleteJuiz(id: string, tenantId: string): Promise<boolean> {
    await db.delete(juizes).where(and(eq(juizes.id, id), eq(juizes.tenantId, tenantId)));
    return true;
  }

  async getJulgamentosByJuiz(juizId: string, tenantId: string): Promise<Julgamento[]> {
    return await db.select().from(julgamentos).where(and(eq(julgamentos.juizId, juizId), eq(julgamentos.tenantId, tenantId)));
  }

  async getJulgamento(id: string, tenantId: string): Promise<Julgamento | undefined> {
    const [julgamento] = await db.select().from(julgamentos).where(and(eq(julgamentos.id, id), eq(julgamentos.tenantId, tenantId)));
    return julgamento;
  }

  async createJulgamento(julgamento: InsertJulgamento): Promise<Julgamento> {
    const [created] = await db.insert(julgamentos).values(julgamento).returning();
    return created;
  }

  async updateJulgamento(id: string, data: Partial<InsertJulgamento>, tenantId: string): Promise<Julgamento | undefined> {
    const [updated] = await db.update(julgamentos).set(data).where(and(eq(julgamentos.id, id), eq(julgamentos.tenantId, tenantId))).returning();
    return updated;
  }

  async deleteJulgamento(id: string, tenantId: string): Promise<boolean> {
    await db.delete(julgamentos).where(and(eq(julgamentos.id, id), eq(julgamentos.tenantId, tenantId)));
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

  async getJuizFavorabilidade(juizId: string, tenantId: string): Promise<Favorabilidade> {
    const julgamentosData = await this.getJulgamentosByJuiz(juizId, tenantId);
    return this.calculateFavorabilidade(julgamentosData);
  }

  async getAllJuizesComFavorabilidade(tenantId: string): Promise<JuizComFavorabilidade[]> {
    const allTrts = await this.getAllTRTs(tenantId);
    const result: JuizComFavorabilidade[] = [];

    for (const trt of allTrts) {
      const trtVaras = await this.getVarasByTRT(trt.id, tenantId);
      for (const vara of trtVaras) {
        const varaJuizes = await this.getJuizesByVara(vara.id, tenantId);
        for (const juiz of varaJuizes) {
          const favorabilidade = await this.getJuizFavorabilidade(juiz.id, tenantId);
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

  async getAllTRTsComFavorabilidade(tenantId: string): Promise<TRTComFavorabilidade[]> {
    const allTrts = await this.getAllTRTs(tenantId);
    const result: TRTComFavorabilidade[] = [];

    for (const trt of allTrts) {
      const trtVaras = await this.getVarasByTRT(trt.id, tenantId);
      const varasComFavorabilidade: VaraComFavorabilidade[] = [];
      let trtJulgamentos: Julgamento[] = [];

      for (const vara of trtVaras) {
        const varaJuizes = await this.getJuizesByVara(vara.id, tenantId);
        const juizesComFavorabilidade: JuizComFavorabilidade[] = [];
        let varaJulgamentos: Julgamento[] = [];

        for (const juiz of varaJuizes) {
          const julgamentosJuiz = await this.getJulgamentosByJuiz(juiz.id, tenantId);
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

  async getAllAudiencias(tenantId: string): Promise<Audiencia[]> {
    return await db.select().from(audiencias).where(eq(audiencias.tenantId, tenantId));
  }

  async getAudienciasByVara(varaId: string, tenantId: string): Promise<Audiencia[]> {
    return await db.select().from(audiencias).where(and(eq(audiencias.varaId, varaId), eq(audiencias.tenantId, tenantId)));
  }

  async getAudiencia(id: string, tenantId: string): Promise<Audiencia | undefined> {
    const [audiencia] = await db.select().from(audiencias).where(and(eq(audiencias.id, id), eq(audiencias.tenantId, tenantId)));
    return audiencia;
  }

  async createAudiencia(tenantId: string, audiencia: Omit<InsertAudiencia, 'tenantId'>): Promise<Audiencia> {
    const [created] = await db.insert(audiencias).values({ ...audiencia, tenantId }).returning();
    return created;
  }

  async updateAudiencia(id: string, data: Partial<Omit<InsertAudiencia, 'tenantId'>>, tenantId: string): Promise<Audiencia | undefined> {
    const [updated] = await db.update(audiencias).set(data).where(and(eq(audiencias.id, id), eq(audiencias.tenantId, tenantId))).returning();
    return updated;
  }

  async deleteAudiencia(id: string, tenantId: string): Promise<boolean> {
    await db.delete(audiencias).where(and(eq(audiencias.id, id), eq(audiencias.tenantId, tenantId)));
    return true;
  }

  async getEventosTimeline(tenantId: string, filters: {
    dataInicio?: string;
    dataFim?: string;
    trtId?: string;
    varaId?: string;
  }): Promise<EventoTimeline[]> {
    const eventos: EventoTimeline[] = [];
    const allTrts = await this.getAllTRTs(tenantId);
    
    for (const trt of allTrts) {
      if (filters.trtId && trt.id !== filters.trtId) continue;
      
      const trtVaras = await this.getVarasByTRT(trt.id, tenantId);
      
      for (const vara of trtVaras) {
        if (filters.varaId && vara.id !== filters.varaId) continue;
        
        const varaJuizes = await this.getJuizesByVara(vara.id, tenantId);
        
        for (const juiz of varaJuizes) {
          const julgamentosJuiz = await this.getJulgamentosByJuiz(juiz.id, tenantId);
          
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
        
        const audienciasVara = await this.getAudienciasByVara(vara.id, tenantId);
        
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
            const juiz = await this.getJuiz(a.juizId, tenantId);
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

  // LEGACY: seedDemoData method commented out - requires tenantId after multi-tenant migration
  // If needed in future, this method should accept a tenantId parameter
  /*
  async seedDemoData(): Promise<void> {
    // ... legacy seeding code removed for multi-tenant compatibility
    console.log("seedDemoData is disabled - use admin import functionality instead");
  }
  */

  // Brainstorm methods
  async getBrainstormStats(tenantId: string): Promise<BrainstormStats> {
    const [distCount] = await db.select({ count: sql<number>`count(*)::int` }).from(distribuidos).where(eq(distribuidos.tenantId, tenantId));
    const [encCount] = await db.select({ count: sql<number>`count(*)::int` }).from(encerrados).where(eq(encerrados.tenantId, tenantId));
    const [sentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(sentencasMerito).where(eq(sentencasMerito.tenantId, tenantId));
    const [acordCount] = await db.select({ count: sql<number>`count(*)::int` }).from(acordaosMerito).where(eq(acordaosMerito.tenantId, tenantId));
    
    return {
      distribuidos: distCount?.count || 0,
      encerrados: encCount?.count || 0,
      sentencasMerito: sentCount?.count || 0,
      acordaosMerito: acordCount?.count || 0,
    };
  }

  async getAllDistribuidos(tenantId: string): Promise<Distribuido[]> {
    return await db.select().from(distribuidos).where(eq(distribuidos.tenantId, tenantId)).orderBy(distribuidos.createdAt);
  }

  async createDistribuido(tenantId: string, data: Omit<InsertDistribuido, 'tenantId'>): Promise<Distribuido> {
    const [created] = await db.insert(distribuidos).values({ ...data, tenantId }).returning();
    return created;
  }

  async createDistribuidosBatch(tenantId: string, data: Omit<InsertDistribuido, 'tenantId'>[]): Promise<Distribuido[]> {
    if (data.length === 0) return [];
    const dataWithTenant = data.map(d => ({ ...d, tenantId }));
    return await db.insert(distribuidos).values(dataWithTenant).returning();
  }

  async deleteDistribuido(id: string, tenantId: string): Promise<boolean> {
    await db.delete(distribuidos).where(and(eq(distribuidos.id, id), eq(distribuidos.tenantId, tenantId)));
    return true;
  }

  async deleteDistribuidosBatch(ids: string[], tenantId: string): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(distribuidos).where(and(inArray(distribuidos.id, ids), eq(distribuidos.tenantId, tenantId)));
    return true;
  }

  async deleteAllDistribuidos(tenantId: string): Promise<boolean> {
    await db.delete(distribuidos).where(eq(distribuidos.tenantId, tenantId));
    return true;
  }

  async getAllEncerrados(tenantId: string): Promise<Encerrado[]> {
    return await db.select().from(encerrados).where(eq(encerrados.tenantId, tenantId)).orderBy(encerrados.createdAt);
  }

  async createEncerrado(tenantId: string, data: Omit<InsertEncerrado, 'tenantId'>): Promise<Encerrado> {
    const [created] = await db.insert(encerrados).values({ ...data, tenantId }).returning();
    return created;
  }

  async createEncerradosBatch(tenantId: string, data: Omit<InsertEncerrado, 'tenantId'>[]): Promise<Encerrado[]> {
    if (data.length === 0) return [];
    const dataWithTenant = data.map(d => ({ ...d, tenantId }));
    return await db.insert(encerrados).values(dataWithTenant).returning();
  }

  async deleteEncerrado(id: string, tenantId: string): Promise<boolean> {
    await db.delete(encerrados).where(and(eq(encerrados.id, id), eq(encerrados.tenantId, tenantId)));
    return true;
  }

  async deleteEncerradosBatch(ids: string[], tenantId: string): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(encerrados).where(and(inArray(encerrados.id, ids), eq(encerrados.tenantId, tenantId)));
    return true;
  }

  async deleteAllEncerrados(tenantId: string): Promise<boolean> {
    await db.delete(encerrados).where(eq(encerrados.tenantId, tenantId));
    return true;
  }

  async getAllSentencasMerito(tenantId: string): Promise<SentencaMerito[]> {
    return await db.select().from(sentencasMerito).where(eq(sentencasMerito.tenantId, tenantId)).orderBy(sentencasMerito.createdAt);
  }

  async createSentencaMerito(tenantId: string, data: Omit<InsertSentencaMerito, 'tenantId'>): Promise<SentencaMerito> {
    const [created] = await db.insert(sentencasMerito).values({ ...data, tenantId }).returning();
    return created;
  }

  async createSentencasMeritoBatch(tenantId: string, data: Omit<InsertSentencaMerito, 'tenantId'>[]): Promise<SentencaMerito[]> {
    if (data.length === 0) return [];
    const dataWithTenant = data.map(d => ({ ...d, tenantId }));
    return await db.insert(sentencasMerito).values(dataWithTenant).returning();
  }

  async deleteSentencaMerito(id: string, tenantId: string): Promise<boolean> {
    await db.delete(sentencasMerito).where(and(eq(sentencasMerito.id, id), eq(sentencasMerito.tenantId, tenantId)));
    return true;
  }

  async deleteSentencasMeritoBatch(ids: string[], tenantId: string): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(sentencasMerito).where(and(inArray(sentencasMerito.id, ids), eq(sentencasMerito.tenantId, tenantId)));
    return true;
  }

  async deleteAllSentencasMerito(tenantId: string): Promise<boolean> {
    await db.delete(sentencasMerito).where(eq(sentencasMerito.tenantId, tenantId));
    return true;
  }

  async getAllAcordaosMerito(tenantId: string): Promise<AcordaoMerito[]> {
    return await db.select().from(acordaosMerito).where(eq(acordaosMerito.tenantId, tenantId)).orderBy(acordaosMerito.createdAt);
  }

  async createAcordaoMerito(tenantId: string, data: Omit<InsertAcordaoMerito, 'tenantId'>): Promise<AcordaoMerito> {
    const [created] = await db.insert(acordaosMerito).values({ ...data, tenantId }).returning();
    return created;
  }

  async createAcordaosMeritoBatch(tenantId: string, data: Omit<InsertAcordaoMerito, 'tenantId'>[]): Promise<AcordaoMerito[]> {
    if (data.length === 0) return [];
    const dataWithTenant = data.map(d => ({ ...d, tenantId }));
    return await db.insert(acordaosMerito).values(dataWithTenant).returning();
  }

  async deleteAcordaoMerito(id: string, tenantId: string): Promise<boolean> {
    await db.delete(acordaosMerito).where(and(eq(acordaosMerito.id, id), eq(acordaosMerito.tenantId, tenantId)));
    return true;
  }

  async deleteAcordaosMeritoBatch(ids: string[], tenantId: string): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(acordaosMerito).where(and(inArray(acordaosMerito.id, ids), eq(acordaosMerito.tenantId, tenantId)));
    return true;
  }

  async deleteAllAcordaosMerito(tenantId: string): Promise<boolean> {
    await db.delete(acordaosMerito).where(eq(acordaosMerito.tenantId, tenantId));
    return true;
  }

  // LEGACY: loadBrainstormFromExcel method commented out - requires tenantId after multi-tenant migration
  // If needed in future, this method should accept a tenantId parameter
  /*
  async loadBrainstormFromExcel(): Promise<void> {
    // ... legacy seeding code removed for multi-tenant compatibility
    console.log("loadBrainstormFromExcel is disabled - use admin import functionality instead");
  }
  */

  // LEGACY: loadMapaDecisoesFromExcel method commented out - requires tenantId after multi-tenant migration
  // If needed in future, this method should accept a tenantId parameter
  /*
  async loadMapaDecisoesFromExcel(): Promise<void> {
    // ... legacy seeding code removed for multi-tenant compatibility
    console.log("loadMapaDecisoesFromExcel is disabled - use admin import functionality instead");
  }
  */

  // LEGACY: seedFictionalDecisions method commented out - requires tenantId after multi-tenant migration
  // If needed in future, this method should accept a tenantId parameter
  /*
  async seedFictionalDecisions(): Promise<void> {
    // ... legacy seeding code removed for multi-tenant compatibility
    console.log("seedFictionalDecisions is disabled - use admin import functionality instead");
  }
  */

  // Mapas Estratégicos - Turmas
  async getAllTurmas(tenantId: string, instancia?: string): Promise<Turma[]> {
    let result;
    if (instancia && instancia !== 'todas') {
      result = await db.select().from(turmas).where(
        and(eq(turmas.tenantId, tenantId), eq(turmas.instancia, instancia))
      );
    } else {
      result = await db.select().from(turmas).where(eq(turmas.tenantId, tenantId));
    }
    return this.sortTurmasNumerically(result);
  }

  async getTurma(id: string, tenantId: string): Promise<Turma | undefined> {
    const [turma] = await db.select().from(turmas).where(and(eq(turmas.id, id), eq(turmas.tenantId, tenantId)));
    return turma;
  }

  async getTurmaByName(nome: string, tenantId: string): Promise<Turma | undefined> {
    const normalizedNome = nome.trim().toLowerCase();
    const allTurmas = await db.select().from(turmas).where(eq(turmas.tenantId, tenantId));
    return allTurmas.find(t => t.nome.trim().toLowerCase() === normalizedNome);
  }

  async findOrCreateTurma(tenantId: string, nome: string, regiao?: string, instancia?: string): Promise<Turma> {
    const existing = await this.getTurmaByName(nome, tenantId);
    if (existing) {
      return existing;
    }
    return await this.createTurma(tenantId, {
      nome: nome.trim(),
      regiao: regiao?.trim() || null,
      instancia: instancia || '2ª Instância',
    });
  }

  async createTurma(tenantId: string, turma: InsertTurma): Promise<Turma> {
    const [created] = await db.insert(turmas).values({ ...turma, tenantId }).returning();
    return created;
  }

  async updateTurma(id: string, data: Partial<InsertTurma>, tenantId: string): Promise<Turma | undefined> {
    const [updated] = await db.update(turmas).set(data).where(and(eq(turmas.id, id), eq(turmas.tenantId, tenantId))).returning();
    return updated;
  }

  async deleteTurma(id: string, tenantId: string): Promise<boolean> {
    await db.delete(turmas).where(and(eq(turmas.id, id), eq(turmas.tenantId, tenantId)));
    return true;
  }

  // Mapas Estratégicos - Desembargadores
  async getAllDesembargadores(tenantId: string): Promise<Desembargador[]> {
    return await db.select().from(desembargadores).where(eq(desembargadores.tenantId, tenantId)).orderBy(desembargadores.nome);
  }

  async getDesembargadoresByTurma(turmaId: string, tenantId: string): Promise<Desembargador[]> {
    return await db.select().from(desembargadores).where(and(eq(desembargadores.turmaId, turmaId), eq(desembargadores.tenantId, tenantId))).orderBy(desembargadores.nome);
  }

  async getDesembargador(id: string, tenantId: string): Promise<Desembargador | undefined> {
    const [desembargador] = await db.select().from(desembargadores).where(and(eq(desembargadores.id, id), eq(desembargadores.tenantId, tenantId)));
    return desembargador;
  }

  async getDesembargadorByName(nome: string, tenantId: string): Promise<Desembargador | undefined> {
    const normalizedNome = nome.trim().toLowerCase();
    const allDesembargadores = await db.select().from(desembargadores).where(eq(desembargadores.tenantId, tenantId));
    return allDesembargadores.find(d => d.nome.trim().toLowerCase() === normalizedNome);
  }

  async findOrCreateDesembargador(tenantId: string, nome: string, turmaId: string): Promise<Desembargador> {
    const existing = await this.getDesembargadorByName(nome, tenantId);
    if (existing) {
      return existing;
    }
    return await this.createDesembargador(tenantId, {
      nome: nome.trim(),
      turmaId,
      voto: 'EM ANÁLISE',
    });
  }

  async createDesembargador(tenantId: string, desembargador: InsertDesembargador): Promise<Desembargador> {
    const [created] = await db.insert(desembargadores).values({ ...desembargador, tenantId }).returning();
    return created;
  }

  async updateDesembargador(id: string, data: Partial<InsertDesembargador>, tenantId: string): Promise<Desembargador | undefined> {
    const [updated] = await db.update(desembargadores).set(data).where(and(eq(desembargadores.id, id), eq(desembargadores.tenantId, tenantId))).returning();
    return updated;
  }

  async deleteDesembargador(id: string, tenantId: string): Promise<boolean> {
    await db.delete(desembargadores).where(and(eq(desembargadores.id, id), eq(desembargadores.tenantId, tenantId)));
    return true;
  }

  // Smart import with auto-creation of Turma and Desembargador
  async importDecisaoWithAutoCreate(tenantId: string, data: {
    dataDecisao: string;
    numeroProcesso: string;
    local: string;
    turma: string;
    relator: string;
    resultado: string;
    responsabilidade?: string;
    upi?: string;
    empresa: string;
    instancia?: string;
  }): Promise<{ decisao: DecisaoRpac; turmaCreated: boolean; desembargadorCreated: boolean }> {
    let turmaCreated = false;
    let desembargadorCreated = false;

    // 1. Find or create Turma
    let turmaEntity = await this.getTurmaByName(data.turma, tenantId);
    if (!turmaEntity) {
      turmaEntity = await this.createTurma(tenantId, {
        nome: data.turma.trim(),
        regiao: data.local?.trim() || null,
        instancia: data.instancia || '2ª Instância',
      });
      turmaCreated = true;
    }

    // 2. Find or create Desembargador
    let desembargadorEntity = await this.getDesembargadorByName(data.relator, tenantId);
    if (!desembargadorEntity) {
      desembargadorEntity = await this.createDesembargador(tenantId, {
        nome: data.relator.trim(),
        turmaId: turmaEntity.id,
        voto: 'EM ANÁLISE',
      });
      desembargadorCreated = true;
    }

    // 3. Parse date
    let dataDecisao: Date | undefined;
    if (data.dataDecisao) {
      // Try DD/MM/YYYY format first
      const parts = data.dataDecisao.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        dataDecisao = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Try ISO format as fallback
        dataDecisao = new Date(data.dataDecisao);
      }
      if (isNaN(dataDecisao.getTime())) {
        dataDecisao = undefined;
      }
    }

    // 4. Normalize resultado
    const normalizedResultado = this.normalizeResultado(data.resultado);

    // 5. Create the decisao
    const decisao = await this.createDecisaoRpac(tenantId, {
      desembargadorId: desembargadorEntity.id,
      numeroProcesso: data.numeroProcesso.trim(),
      dataDecisao: dataDecisao,
      resultado: normalizedResultado,
      responsabilidade: data.responsabilidade?.toLowerCase().includes('solidár') ? 'solidaria' : 'subsidiaria',
      upi: data.upi?.toLowerCase() === 'sim' ? 'sim' : 'nao',
      empresa: data.empresa.trim() || 'V.tal',
    });

    return { decisao, turmaCreated, desembargadorCreated };
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

  async getMapaDecisoesGeral(tenantId: string): Promise<MapaDecisoes> {
    const turmasList = await this.getAllTurmas(tenantId);
    const turmasComDesembargadores: TurmaComDesembargadores[] = [];
    let todosDesembargadores: Desembargador[] = [];

    for (const turma of turmasList) {
      const desembargadoresTurma = await this.getDesembargadoresByTurma(turma.id, tenantId);
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
  async getAllDecisoesRpac(tenantId: string): Promise<DecisaoRpac[]> {
    return await db.select().from(decisoesRpac).where(eq(decisoesRpac.tenantId, tenantId)).orderBy(decisoesRpac.createdAt);
  }

  async getDecisoesRpacByDesembargador(desembargadorId: string, tenantId: string): Promise<DecisaoRpac[]> {
    return await db.select().from(decisoesRpac).where(and(eq(decisoesRpac.desembargadorId, desembargadorId), eq(decisoesRpac.tenantId, tenantId))).orderBy(decisoesRpac.createdAt);
  }

  async getDecisaoRpac(id: string, tenantId: string): Promise<DecisaoRpac | undefined> {
    const [decisao] = await db.select().from(decisoesRpac).where(and(eq(decisoesRpac.id, id), eq(decisoesRpac.tenantId, tenantId)));
    return decisao;
  }

  async createDecisaoRpac(tenantId: string, decisao: InsertDecisaoRpac): Promise<DecisaoRpac> {
    const [created] = await db.insert(decisoesRpac).values({ ...decisao, tenantId }).returning();
    return created;
  }

  async updateDecisaoRpac(id: string, data: Partial<InsertDecisaoRpac>, tenantId: string): Promise<DecisaoRpac | undefined> {
    const [updated] = await db.update(decisoesRpac).set(data).where(and(eq(decisoesRpac.id, id), eq(decisoesRpac.tenantId, tenantId))).returning();
    return updated;
  }

  async deleteDecisaoRpac(id: string, tenantId: string): Promise<boolean> {
    await db.delete(decisoesRpac).where(and(eq(decisoesRpac.id, id), eq(decisoesRpac.tenantId, tenantId)));
    return true;
  }

  // Dados completos para admin - hierarquia TRT → Turmas → Desembargadores → Decisões
  async getMapaDecisoesAdminData(tenantId: string, instancia?: string): Promise<{
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
    const turmasList = await this.getAllTurmas(tenantId, instancia || 'segunda');
    
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
        const desembargadoresTurma = await this.getDesembargadoresByTurma(turma.id, tenantId);
        const desembargadoresComDecisoes = [];
        
        for (const desembargador of desembargadoresTurma) {
          const decisoes = await this.getDecisoesRpacByDesembargador(desembargador.id, tenantId);
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

  async getTRTsComEstatisticas(tenantId: string, responsabilidadeFilter?: string, empresaFilter?: string, instancia?: string, numeroProcesso?: string): Promise<Array<{
    nome: string;
    totalTurmas: number;
    totalDesembargadores: number;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    emAnalise: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas(tenantId, instancia || 'segunda');
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
      
      const desembargadores = await this.getDesembargadoresByTurma(turma.id, tenantId);
      for (const d of desembargadores) {
        // Always track this desembargador for the TRT
        trtMap.get(trtKey)!.allDesembargadores.add(d.id);
        
        const decisoes = await this.getDecisoesRpacByDesembargador(d.id, tenantId);
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
  async getTurmasByTRT(tenantId: string, trtNome: string, responsabilidadeFilter?: string, empresaFilter?: string, instancia?: string, numeroProcesso?: string): Promise<Array<{
    id: string;
    nome: string;
    totalDesembargadores: number;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas(tenantId, instancia || 'segunda');
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
      const desembargadores = await this.getDesembargadoresByTurma(turma.id, tenantId);
      let totalDecisoes = 0;
      let favoraveis = 0;
      let desfavoraveis = 0;
      let desembargadoresComDecisoes = 0;

      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id, tenantId);
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
  async getDesembargadoresComDecisoesByTurma(turmaId: string, tenantId: string): Promise<Array<{
    id: string;
    nome: string;
    voto: string;
    decisoes: DecisaoRpac[];
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>> {
    const desembargadores = await this.getDesembargadoresByTurma(turmaId, tenantId);
    const result = [];

    for (const d of desembargadores) {
      const decisoes = await this.getDecisoesRpacByDesembargador(d.id, tenantId);
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
  async getTopTurmasFavorabilidade(tenantId: string, limit: number = 5, dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string, instancia: string = 'segunda'): Promise<Array<{
    id: string;
    nome: string;
    trt: string;
    totalDecisoes: number;
    favoraveis: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas(tenantId);
    const turmasComStats = [];

    for (const turma of turmasList) {
      // Filter by instancia
      if (turma.instancia !== instancia) continue;
      
      const desembargadores = await this.getDesembargadoresByTurma(turma.id, tenantId);
      let totalDecisoes = 0;
      let favoraveis = 0;

      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id, tenantId);
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
  async getTopRegioes(tenantId: string, limit: number = 5, dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string, instancia: string = 'segunda'): Promise<Array<{
    nome: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas(tenantId);
    const trtMap = new Map<string, { totalDecisoes: number; favoraveis: number; desfavoraveis: number }>();

    for (const turma of turmasList) {
      // Filter by instancia
      if (turma.instancia !== instancia) continue;
      
      const trtNome = this.formatTRTDisplayName(turma.regiao);
      if (!trtMap.has(trtNome)) {
        trtMap.set(trtNome, { totalDecisoes: 0, favoraveis: 0, desfavoraveis: 0 });
      }

      const desembargadores = await this.getDesembargadoresByTurma(turma.id, tenantId);
      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id, tenantId);
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
  async getTopDesembargadores(tenantId: string, limit: number = 5, dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string, instancia: string = 'segunda'): Promise<Array<{
    id: string;
    nome: string;
    turma: string;
    trt: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>> {
    const turmasList = await this.getAllTurmas(tenantId);
    const desembargadoresStats = [];

    for (const turma of turmasList) {
      // Filter by instancia
      if (turma.instancia !== instancia) continue;
      
      const desembargadores = await this.getDesembargadoresByTurma(turma.id, tenantId);
      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id, tenantId);
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
  async getEstatisticasGerais(tenantId: string, dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string, instancia: string = 'segunda'): Promise<{
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
    const allTurmas = await this.getAllTurmas(tenantId);
    // Filter turmas by instancia
    const turmasList = allTurmas.filter(t => t.instancia === instancia);
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
      const desembargadores = await this.getDesembargadoresByTurma(turma.id, tenantId);
      totalDesembargadores += desembargadores.length;

      for (const d of desembargadores) {
        const allDecisoes = await this.getDecisoesRpacByDesembargador(d.id, tenantId);
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
  async getTimelineData(tenantId: string, dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string, instancia: string = 'segunda'): Promise<Array<{
    mes: string;
    ano: number;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
    percentualDesfavoravel: number;
  }>> {
    // Get all turmas and filter by instancia to get desembargador IDs
    const allTurmas = await this.getAllTurmas(tenantId);
    const turmasFiltered = allTurmas.filter(t => t.instancia === instancia);
    const desembargadorIds = new Set<string>();
    
    for (const turma of turmasFiltered) {
      const desembs = await this.getDesembargadoresByTurma(turma.id, tenantId);
      for (const d of desembs) {
        desembargadorIds.add(d.id);
      }
    }
    
    const allDecisoes = await this.getAllDecisoesRpac(tenantId);
    const monthlyData = new Map<string, { total: number; favoraveis: number; desfavoraveis: number }>();

    for (const decisao of allDecisoes) {
      // Filter by instancia (only include decisoes from desembargadores in this instancia)
      if (!desembargadorIds.has(decisao.desembargadorId)) continue;
      
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
  async getEstatisticasPorEmpresa(tenantId: string, dataInicio?: Date, dataFim?: Date, responsabilidadeFilter?: string, instancia: string = 'segunda'): Promise<Array<{
    empresa: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    emAnalise: number;
    percentualFavoravel: number;
    percentualDesfavoravel: number;
  }>> {
    // Get all turmas and filter by instancia to get desembargador IDs
    const allTurmas = await this.getAllTurmas(tenantId);
    const turmasFiltered = allTurmas.filter(t => t.instancia === instancia);
    const desembargadorIds = new Set<string>();
    
    for (const turma of turmasFiltered) {
      const desembs = await this.getDesembargadoresByTurma(turma.id, tenantId);
      for (const d of desembs) {
        desembargadorIds.add(d.id);
      }
    }
    
    const allDecisoes = await this.getAllDecisoesRpac(tenantId);
    const empresaMap = new Map<string, { total: number; favoraveis: number; desfavoraveis: number; emAnalise: number }>();

    for (const decisao of allDecisoes) {
      // Filter by instancia (only include decisoes from desembargadores in this instancia)
      if (!desembargadorIds.has(decisao.desembargadorId)) continue;
      
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

  async getPassivoMensal(tenantId: string, mes: string, ano: string): Promise<PassivoData | null> {
    const result = await db.select().from(passivoMensal).where(
      and(
        eq(passivoMensal.tenantId, tenantId),
        eq(passivoMensal.mes, mes),
        eq(passivoMensal.ano, ano)
      )
    );
    
    if (result.length === 0) return null;
    return result[0].dados as PassivoData;
  }

  async savePassivoMensal(tenantId: string, mes: string, ano: string, dados: PassivoData): Promise<void> {
    const existing = await db.select().from(passivoMensal).where(
      and(
        eq(passivoMensal.tenantId, tenantId),
        eq(passivoMensal.mes, mes),
        eq(passivoMensal.ano, ano)
      )
    );

    if (existing.length > 0) {
      await db.update(passivoMensal)
        .set({ dados, updatedAt: new Date() })
        .where(
          and(
            eq(passivoMensal.tenantId, tenantId),
            eq(passivoMensal.mes, mes),
            eq(passivoMensal.ano, ano)
          )
        );
    } else {
      await db.insert(passivoMensal).values({
        tenantId,
        mes,
        ano,
        dados
      });
    }
  }

  async getAllPassivoMensalPeriodos(tenantId: string): Promise<Array<{ mes: string; ano: string }>> {
    const results = await db.select({
      mes: passivoMensal.mes,
      ano: passivoMensal.ano
    }).from(passivoMensal).where(eq(passivoMensal.tenantId, tenantId)).orderBy(passivoMensal.ano, passivoMensal.mes);
    
    return results;
  }

  async deletePassivoMensal(tenantId: string, mes: string, ano: string): Promise<boolean> {
    const result = await db.delete(passivoMensal).where(
      and(
        eq(passivoMensal.tenantId, tenantId),
        eq(passivoMensal.mes, mes),
        eq(passivoMensal.ano, ano)
      )
    );
    return true;
  }

  // Casos Novos - Entrada & Saídas
  async getAllCasosNovos(tenantId: string): Promise<CasoNovo[]> {
    return await db.select().from(casosNovos).where(eq(casosNovos.tenantId, tenantId)).orderBy(casosNovos.dataDistribuicao);
  }

  async getCasoNovo(id: string, tenantId: string): Promise<CasoNovo | undefined> {
    const [caso] = await db.select().from(casosNovos).where(and(eq(casosNovos.id, id), eq(casosNovos.tenantId, tenantId)));
    return caso;
  }

  async createCasoNovo(tenantId: string, caso: InsertCasoNovo): Promise<CasoNovo> {
    const dataDistribuicao = caso.dataDistribuicao ? new Date(caso.dataDistribuicao) : undefined;
    const [created] = await db.insert(casosNovos).values({
      ...caso,
      tenantId,
      dataDistribuicao: dataDistribuicao
    }).returning();
    return created;
  }

  async createCasosNovosBatch(tenantId: string, casos: InsertCasoNovo[]): Promise<CasoNovo[]> {
    if (casos.length === 0) return [];
    
    const casosWithDates = casos.map(c => ({
      ...c,
      tenantId,
      dataDistribuicao: c.dataDistribuicao ? new Date(c.dataDistribuicao) : undefined
    }));
    
    const created = await db.insert(casosNovos).values(casosWithDates).returning();
    return created;
  }

  async deleteCasoNovo(id: string, tenantId: string): Promise<boolean> {
    await db.delete(casosNovos).where(and(eq(casosNovos.id, id), eq(casosNovos.tenantId, tenantId)));
    return true;
  }

  async deleteCasosNovosBatch(ids: string[], tenantId: string): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(casosNovos).where(and(inArray(casosNovos.id, ids), eq(casosNovos.tenantId, tenantId)));
    return true;
  }

  async deleteAllCasosNovos(tenantId: string): Promise<boolean> {
    await db.delete(casosNovos).where(eq(casosNovos.tenantId, tenantId));
    return true;
  }

  async getCasosNovosStats(tenantId: string, mesReferencia?: string): Promise<{
    total: number;
    mesAtual: number;
    mesAnterior: number;
    variacaoPercentual: number;
    porTribunal: Array<{ tribunal: string; quantidade: number; percentual: number }>;
    porEmpresa: Array<{ empresa: string; quantidade: number; percentual: number }>;
    porMes: Array<{ mes: string; ano: string; quantidade: number }>;
    valorTotalContingencia: number;
  }> {
    const allCasos = await this.getAllCasosNovos(tenantId);
    const total = allCasos.length;

    // Parse mesReferencia (format: YYYY-MM) or default to current month
    let refYear: number;
    let refMonth: number;
    
    if (mesReferencia) {
      const [year, month] = mesReferencia.split('-').map(Number);
      refYear = year;
      refMonth = month - 1; // JavaScript months are 0-indexed
    } else {
      const now = new Date();
      refYear = now.getFullYear();
      refMonth = now.getMonth();
    }
    
    // Calculate previous month
    const prevMonth = refMonth === 0 ? 11 : refMonth - 1;
    const prevYear = refMonth === 0 ? refYear - 1 : refYear;

    let mesAtual = 0;
    let mesAnterior = 0;
    let valorTotal = 0;

    const tribunalMap = new Map<string, number>();
    const empresaMap = new Map<string, number>();
    const mesMap = new Map<string, number>();

    for (const caso of allCasos) {
      if (caso.valorContingencia) {
        const valorStr = caso.valorContingencia.trim().replace(/,/g, '');
        const valor = parseFloat(valorStr);
        if (!isNaN(valor)) {
          valorTotal += valor;
        }
      }

      const tribunal = caso.tribunal || 'Não Informado';
      tribunalMap.set(tribunal, (tribunalMap.get(tribunal) || 0) + 1);

      const empresa = caso.empresa || 'Não Informado';
      empresaMap.set(empresa, (empresaMap.get(empresa) || 0) + 1);

      if (caso.dataDistribuicao) {
        const date = new Date(caso.dataDistribuicao);
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const ano = String(date.getFullYear());
        const key = `${mes}-${ano}`;
        mesMap.set(key, (mesMap.get(key) || 0) + 1);

        // Count for selected reference month ("Mês Atual")
        if (date.getMonth() === refMonth && date.getFullYear() === refYear) {
          mesAtual++;
        }
        // Count for previous month ("Mês Anterior")
        if (date.getMonth() === prevMonth && date.getFullYear() === prevYear) {
          mesAnterior++;
        }
      }
    }

    // Calculate percentage variation
    const variacaoPercentual = mesAnterior > 0 
      ? Math.round(((mesAtual - mesAnterior) / mesAnterior) * 100)
      : mesAtual > 0 ? 100 : 0;

    // Convert maps to arrays with percentages
    const porTribunal = Array.from(tribunalMap.entries())
      .map(([tribunal, quantidade]) => ({
        tribunal,
        quantidade,
        percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const porEmpresa = Array.from(empresaMap.entries())
      .map(([empresa, quantidade]) => ({
        empresa,
        quantidade,
        percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const porMes = Array.from(mesMap.entries())
      .map(([key, quantidade]) => {
        const [mes, ano] = key.split('-');
        return { mes, ano, quantidade };
      })
      .sort((a, b) => {
        const dateA = new Date(parseInt(a.ano), parseInt(a.mes) - 1);
        const dateB = new Date(parseInt(b.ano), parseInt(b.mes) - 1);
        return dateA.getTime() - dateB.getTime();
      });

    return {
      total,
      mesAtual,
      mesAnterior,
      variacaoPercentual,
      porTribunal,
      porEmpresa,
      porMes,
      valorTotalContingencia: valorTotal
    };
  }

  // Casos Encerrados - Entrada & Saídas
  async getAllCasosEncerrados(tenantId: string): Promise<CasoEncerrado[]> {
    return await db.select().from(casosEncerrados).where(eq(casosEncerrados.tenantId, tenantId)).orderBy(casosEncerrados.dataEncerramento);
  }

  async getCasoEncerrado(id: string, tenantId: string): Promise<CasoEncerrado | undefined> {
    const [caso] = await db.select().from(casosEncerrados).where(and(eq(casosEncerrados.id, id), eq(casosEncerrados.tenantId, tenantId)));
    return caso;
  }

  async createCasoEncerrado(tenantId: string, caso: InsertCasoEncerrado): Promise<CasoEncerrado> {
    const dataEncerramento = caso.dataEncerramento ? new Date(caso.dataEncerramento) : undefined;
    const [created] = await db.insert(casosEncerrados).values({
      ...caso,
      tenantId,
      dataEncerramento: dataEncerramento
    }).returning();
    return created;
  }

  async createCasosEncerradosBatch(tenantId: string, casos: InsertCasoEncerrado[]): Promise<CasoEncerrado[]> {
    if (casos.length === 0) return [];
    
    const casosWithDates = casos.map(c => ({
      ...c,
      tenantId,
      dataEncerramento: c.dataEncerramento ? new Date(c.dataEncerramento) : undefined
    }));
    
    const created = await db.insert(casosEncerrados).values(casosWithDates).returning();
    return created;
  }

  async deleteCasoEncerrado(id: string, tenantId: string): Promise<boolean> {
    await db.delete(casosEncerrados).where(and(eq(casosEncerrados.id, id), eq(casosEncerrados.tenantId, tenantId)));
    return true;
  }

  async deleteCasosEncerradosBatch(ids: string[], tenantId: string): Promise<boolean> {
    if (ids.length === 0) return true;
    await db.delete(casosEncerrados).where(and(inArray(casosEncerrados.id, ids), eq(casosEncerrados.tenantId, tenantId)));
    return true;
  }

  async deleteAllCasosEncerrados(tenantId: string): Promise<boolean> {
    await db.delete(casosEncerrados).where(eq(casosEncerrados.tenantId, tenantId));
    return true;
  }

  async getCasosEncerradosStats(tenantId: string, mesReferencia?: string): Promise<{
    total: number;
    mesAtual: number;
    mesAnterior: number;
    variacaoPercentual: number;
    porTribunal: Array<{ tribunal: string; quantidade: number; percentual: number }>;
    porEmpresa: Array<{ empresa: string; quantidade: number; percentual: number }>;
    porMes: Array<{ mes: string; ano: string; quantidade: number }>;
    valorTotalContingencia: number;
  }> {
    const allCasos = await this.getAllCasosEncerrados(tenantId);
    const total = allCasos.length;

    // Parse mesReferencia (format: YYYY-MM) or default to current month
    let refYear: number;
    let refMonth: number;
    
    if (mesReferencia) {
      const [year, month] = mesReferencia.split('-').map(Number);
      refYear = year;
      refMonth = month - 1; // JavaScript months are 0-indexed
    } else {
      const now = new Date();
      refYear = now.getFullYear();
      refMonth = now.getMonth();
    }
    
    // Calculate previous month
    const prevMonth = refMonth === 0 ? 11 : refMonth - 1;
    const prevYear = refMonth === 0 ? refYear - 1 : refYear;

    let mesAtual = 0;
    let mesAnterior = 0;
    let valorTotal = 0;

    const tribunalMap = new Map<string, number>();
    const empresaMap = new Map<string, number>();
    const mesMap = new Map<string, number>();

    for (const caso of allCasos) {
      if (caso.valorContingencia) {
        const valorStr = caso.valorContingencia.trim().replace(/,/g, '');
        const valor = parseFloat(valorStr);
        if (!isNaN(valor)) {
          valorTotal += valor;
        }
      }

      const tribunal = caso.tribunal || 'Não Informado';
      tribunalMap.set(tribunal, (tribunalMap.get(tribunal) || 0) + 1);

      const empresa = caso.empresa || 'Não Informado';
      empresaMap.set(empresa, (empresaMap.get(empresa) || 0) + 1);

      if (caso.dataEncerramento) {
        const date = new Date(caso.dataEncerramento);
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const ano = String(date.getFullYear());
        const key = `${mes}-${ano}`;
        mesMap.set(key, (mesMap.get(key) || 0) + 1);

        // Count for selected reference month ("Mês Atual")
        if (date.getMonth() === refMonth && date.getFullYear() === refYear) {
          mesAtual++;
        }
        // Count for previous month ("Mês Anterior")
        if (date.getMonth() === prevMonth && date.getFullYear() === prevYear) {
          mesAnterior++;
        }
      }
    }

    const variacaoPercentual = mesAnterior > 0 
      ? Math.round(((mesAtual - mesAnterior) / mesAnterior) * 100)
      : mesAtual > 0 ? 100 : 0;

    const porTribunal = Array.from(tribunalMap.entries())
      .map(([tribunal, quantidade]) => ({
        tribunal,
        quantidade,
        percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const porEmpresa = Array.from(empresaMap.entries())
      .map(([empresa, quantidade]) => ({
        empresa,
        quantidade,
        percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const porMes = Array.from(mesMap.entries())
      .map(([key, quantidade]) => {
        const [mes, ano] = key.split('-');
        return { mes, ano, quantidade };
      })
      .sort((a, b) => {
        const dateA = new Date(parseInt(a.ano), parseInt(a.mes) - 1);
        const dateB = new Date(parseInt(b.ano), parseInt(b.mes) - 1);
        return dateA.getTime() - dateB.getTime();
      });

    return {
      total,
      mesAtual,
      mesAnterior,
      variacaoPercentual,
      porTribunal,
      porEmpresa,
      porMes,
      valorTotalContingencia: valorTotal
    };
  }
}

export const storage = new MemStorage();
