import { z } from "zod";
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================
// MULTI-TENANT (EMPRESAS) SYSTEM
// ============================================

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(), // "vtal", "nio"
  name: varchar("name").notNull(), // "V.tal", "NIO"
  primaryColor: varchar("primary_color").notNull(), // "#ffd700", "#01DA01"
  backgroundColor: varchar("background_color").notNull(), // "#0a1628", "#182B1B"
  logoUrl: varchar("logo_url"),
  isActive: varchar("is_active").default("true").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export const insertTenantSchema = z.object({
  code: z.string().min(1, "Código da empresa é obrigatório"),
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  primaryColor: z.string().min(4, "Cor primária é obrigatória"),
  backgroundColor: z.string().min(4, "Cor de fundo é obrigatória"),
  logoUrl: z.string().optional(),
});

export type CreateTenantInput = z.infer<typeof insertTenantSchema>;

// ============================================
// EXISTING SCHEMAS
// ============================================

export const faseProcessualEnum = z.enum(["Conhecimento", "Recursal", "Execução"]);
export const classificacaoRiscoEnum = z.enum(["Remoto", "Possível", "Provável"]);
export const empresaEnum = z.enum(["V.tal", "OI", "Serede", "Sprink", "Outros Terceiros"]);

export type FaseProcessual = z.infer<typeof faseProcessualEnum>;
export type ClassificacaoRisco = z.infer<typeof classificacaoRiscoEnum>;
export type Empresa = z.infer<typeof empresaEnum>;

export const processoRawSchema = z.object({
  id: z.string(),
  numeroProcesso: z.string(),
  tipoOrigem: z.string(),
  empresaOriginal: z.string(),
  status: z.string(),
  fase: z.string(),
  valorTotal: z.number(),
  prognostico: z.string(),
  empresa: empresaEnum,
  faseProcessual: faseProcessualEnum,
  classificacaoRisco: classificacaoRiscoEnum,
});

export type ProcessoRaw = z.infer<typeof processoRawSchema>;

export const processoSchema = z.object({
  id: z.string(),
  empresa: empresaEnum,
  faseProcessual: faseProcessualEnum,
  classificacaoRisco: classificacaoRiscoEnum,
  numeroProcessos: z.number(),
  valorTotalRisco: z.number(),
});

export type Processo = z.infer<typeof processoSchema>;

export const faseDataSchema = z.object({
  fase: faseProcessualEnum,
  processos: z.number(),
  percentualProcessos: z.number(),
  valorTotal: z.number(),
  percentualValor: z.number(),
  ticketMedio: z.number(),
});

export type FaseData = z.infer<typeof faseDataSchema>;

export const riscoDataSchema = z.object({
  risco: classificacaoRiscoEnum,
  processos: z.number(),
  percentualProcessos: z.number(),
  valorTotal: z.number(),
  percentualValor: z.number(),
  ticketMedio: z.number(),
});

export type RiscoData = z.infer<typeof riscoDataSchema>;

export const empresaFaseDataSchema = z.object({
  empresa: empresaEnum,
  conhecimento: z.object({
    processos: z.number(),
    valor: z.number(),
    percentualValor: z.number(),
  }),
  recursal: z.object({
    processos: z.number(),
    valor: z.number(),
    percentualValor: z.number(),
  }),
  execucao: z.object({
    processos: z.number(),
    valor: z.number(),
    percentualValor: z.number(),
  }),
  total: z.object({
    processos: z.number(),
    percentualProcessos: z.number(),
    valor: z.number(),
    percentualValor: z.number(),
  }),
});

export type EmpresaFaseData = z.infer<typeof empresaFaseDataSchema>;

export const dashboardSummarySchema = z.object({
  totalProcessos: z.number(),
  totalPassivo: z.number(),
  ticketMedioGlobal: z.number(),
  percentualRiscoProvavel: z.number(),
  percentualFaseRecursal: z.number(),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

export const passivoDataSchema = z.object({
  fases: z.array(faseDataSchema),
  riscos: z.array(riscoDataSchema),
  empresas: z.array(empresaFaseDataSchema),
  summary: dashboardSummarySchema,
  rawData: z.array(processoRawSchema),
});

export type PassivoData = z.infer<typeof passivoDataSchema>;

export const roleEnum = z.enum(["admin", "viewer"]);
export type Role = z.infer<typeof roleEnum>;

export const AVAILABLE_MODULES = [
  { id: "passivo", name: "Passivo Sob Gestão" },
  { id: "entradas", name: "Entrada & Saídas - Entradas" },
  { id: "encerrados", name: "Entrada & Saídas - Encerrados" },
  { id: "mapas", name: "Mapas Estratégicos" },
] as const;

export const moduleIdEnum = z.enum(["passivo", "entradas", "encerrados", "mapas"]);
export type ModuleId = z.infer<typeof moduleIdEnum>;

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  username: varchar("username").notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").default("viewer").notNull(),
  modulePermissions: varchar("module_permissions").array().default(sql`ARRAY[]::varchar[]`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_users_tenant").on(table.tenantId),
  index("IDX_users_username_tenant").on(table.username, table.tenantId),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
  tenantCode: z.string().min(1, "Empresa é obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Session user with tenant info
export const sessionUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.string(),
  modulePermissions: z.array(z.string()).default([]),
  tenantId: z.string(),
  tenantCode: z.string(),
  tenantName: z.string(),
  tenantPrimaryColor: z.string(),
  tenantBackgroundColor: z.string(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export const createUserSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: roleEnum.default("viewer"),
  modulePermissions: z.array(z.string()).default([]),
  tenantId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  role: roleEnum.optional(),
  modulePermissions: z.array(z.string()).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updatePasswordSchema = z.object({
  newPassword: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const selfChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(4, "Nova senha deve ter pelo menos 4 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type SelfChangePasswordInput = z.infer<typeof selfChangePasswordSchema>;

export const updateRoleSchema = z.object({
  role: roleEnum,
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const judgeTypeEnum = z.enum(["titular", "substituto"]);
export type JudgeType = z.infer<typeof judgeTypeEnum>;

export const decisionResultEnum = z.enum(["favoravel", "desfavoravel", "parcial"]);
export type DecisionResult = z.infer<typeof decisionResultEnum>;

export const trts = pgTable("trts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numero: varchar("numero").notNull(),
  nome: varchar("nome").notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type TRT = typeof trts.$inferSelect;
export type InsertTRT = typeof trts.$inferInsert;

export const insertTRTSchema = z.object({
  numero: z.string().min(1, "Número do TRT é obrigatório"),
  nome: z.string().min(1, "Nome do TRT é obrigatório"),
  uf: z.string().length(2, "UF deve ter 2 caracteres"),
});

export type CreateTRTInput = z.infer<typeof insertTRTSchema>;

export const varas = pgTable("varas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trtId: varchar("trt_id").notNull().references(() => trts.id, { onDelete: "cascade" }),
  nome: varchar("nome").notNull(),
  cidade: varchar("cidade").notNull(),
  endereco: varchar("endereco"),
  latitude: varchar("latitude"),
  longitude: varchar("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Vara = typeof varas.$inferSelect;
export type InsertVara = typeof varas.$inferInsert;

export const insertVaraSchema = z.object({
  trtId: z.string().min(1, "TRT é obrigatório"),
  nome: z.string().min(1, "Nome da vara é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  endereco: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export type CreateVaraInput = z.infer<typeof insertVaraSchema>;

export const juizes = pgTable("juizes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  varaId: varchar("vara_id").notNull().references(() => varas.id, { onDelete: "cascade" }),
  nome: varchar("nome").notNull(),
  tipo: varchar("tipo").notNull(),
  dataEntrada: timestamp("data_entrada"),
  dataSaida: timestamp("data_saida"),
  observacoes: varchar("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Juiz = typeof juizes.$inferSelect;
export type InsertJuiz = typeof juizes.$inferInsert;

export const insertJuizSchema = z.object({
  varaId: z.string().min(1, "Vara é obrigatória"),
  nome: z.string().min(1, "Nome do juiz é obrigatório"),
  tipo: judgeTypeEnum,
  dataEntrada: z.string().optional(),
  dataSaida: z.string().optional(),
  observacoes: z.string().optional(),
});

export type CreateJuizInput = z.infer<typeof insertJuizSchema>;

export const julgamentos = pgTable("julgamentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  juizId: varchar("juiz_id").notNull().references(() => juizes.id, { onDelete: "cascade" }),
  numeroProcesso: varchar("numero_processo").notNull(),
  dataJulgamento: timestamp("data_julgamento"),
  parte: varchar("parte"),
  resultado: varchar("resultado").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Julgamento = typeof julgamentos.$inferSelect;
export type InsertJulgamento = typeof julgamentos.$inferInsert;

export const insertJulgamentoSchema = z.object({
  juizId: z.string().min(1, "Juiz é obrigatório"),
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  dataJulgamento: z.string().optional(),
  parte: z.string().optional(),
  resultado: decisionResultEnum,
});

export type CreateJulgamentoInput = z.infer<typeof insertJulgamentoSchema>;

export const favorabilidadeSchema = z.object({
  totalJulgamentos: z.number(),
  favoraveis: z.number(),
  desfavoraveis: z.number(),
  parciais: z.number(),
  percentualFavoravel: z.number(),
  percentualDesfavoravel: z.number(),
});

export type Favorabilidade = z.infer<typeof favorabilidadeSchema>;

export const juizComFavorabilidadeSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: z.string(),
  varaId: z.string(),
  varaNome: z.string(),
  trtId: z.string(),
  trtNome: z.string(),
  trtUF: z.string(),
  favorabilidade: favorabilidadeSchema,
});

export type JuizComFavorabilidade = z.infer<typeof juizComFavorabilidadeSchema>;

export const varaComFavorabilidadeSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cidade: z.string(),
  trtId: z.string(),
  juizes: z.array(juizComFavorabilidadeSchema),
  favorabilidade: favorabilidadeSchema,
});

export type VaraComFavorabilidade = z.infer<typeof varaComFavorabilidadeSchema>;

export const trtComFavorabilidadeSchema = z.object({
  id: z.string(),
  numero: z.string(),
  nome: z.string(),
  uf: z.string(),
  varas: z.array(varaComFavorabilidadeSchema),
  favorabilidade: favorabilidadeSchema,
});

export type TRTComFavorabilidade = z.infer<typeof trtComFavorabilidadeSchema>;

export const statusAudienciaEnum = z.enum(["agendada", "realizada", "adiada", "cancelada"]);
export type StatusAudiencia = z.infer<typeof statusAudienciaEnum>;

export const tipoAudienciaEnum = z.enum(["conciliacao", "instrucao", "julgamento"]);
export type TipoAudiencia = z.infer<typeof tipoAudienciaEnum>;

export const audiencias = pgTable("audiencias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  varaId: varchar("vara_id").notNull().references(() => varas.id, { onDelete: "cascade" }),
  juizId: varchar("juiz_id").references(() => juizes.id, { onDelete: "set null" }),
  numeroProcesso: varchar("numero_processo").notNull(),
  dataAudiencia: timestamp("data_audiencia").notNull(),
  tipo: varchar("tipo").notNull(),
  status: varchar("status").notNull(),
  parte: varchar("parte"),
  observacoes: varchar("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Audiencia = typeof audiencias.$inferSelect;
export type InsertAudiencia = typeof audiencias.$inferInsert;

export const insertAudienciaSchema = z.object({
  varaId: z.string().min(1, "Vara é obrigatória"),
  juizId: z.string().optional(),
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  dataAudiencia: z.string().min(1, "Data da audiência é obrigatória"),
  tipo: tipoAudienciaEnum,
  status: statusAudienciaEnum,
  parte: z.string().optional(),
  observacoes: z.string().optional(),
});

export type CreateAudienciaInput = z.infer<typeof insertAudienciaSchema>;

export const eventoTimelineSchema = z.object({
  id: z.string(),
  tipo: z.enum(["decisao", "audiencia"]),
  data: z.string(),
  numeroProcesso: z.string(),
  descricao: z.string(),
  resultado: z.string().optional(),
  status: z.string().optional(),
  trtId: z.string(),
  trtNome: z.string(),
  trtUF: z.string(),
  varaId: z.string(),
  varaNome: z.string(),
  varaCidade: z.string(),
  juizId: z.string().optional(),
  juizNome: z.string().optional(),
  parte: z.string().optional(),
});

export type EventoTimeline = z.infer<typeof eventoTimelineSchema>;

// Brainstorm Module - 4 spreadsheet tables

export const distribuidos = pgTable("distribuidos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroProcesso: varchar("numero_processo").notNull(),
  reclamada: varchar("reclamada"),
  tipoEmpregado: varchar("tipo_empregado"),
  empregadora: varchar("empregadora"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Distribuido = typeof distribuidos.$inferSelect;
export type InsertDistribuido = typeof distribuidos.$inferInsert;

export const insertDistribuidoSchema = z.object({
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  reclamada: z.string().optional(),
  tipoEmpregado: z.string().optional(),
  empregadora: z.string().optional(),
});

export type CreateDistribuidoInput = z.infer<typeof insertDistribuidoSchema>;

export const encerrados = pgTable("encerrados", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroProcesso: varchar("numero_processo").notNull(),
  reclamada: varchar("reclamada"),
  tipoEmpregado: varchar("tipo_empregado"),
  empregadora: varchar("empregadora"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Encerrado = typeof encerrados.$inferSelect;
export type InsertEncerrado = typeof encerrados.$inferInsert;

export const insertEncerradoSchema = z.object({
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  reclamada: z.string().optional(),
  tipoEmpregado: z.string().optional(),
  empregadora: z.string().optional(),
});

export type CreateEncerradoInput = z.infer<typeof insertEncerradoSchema>;

export const sentencasMerito = pgTable("sentencas_merito", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroProcesso: varchar("numero_processo").notNull(),
  empresa: varchar("empresa"),
  tipoDecisao: varchar("tipo_decisao"),
  favorabilidade: varchar("favorabilidade"),
  empregadora: varchar("empregadora"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SentencaMerito = typeof sentencasMerito.$inferSelect;
export type InsertSentencaMerito = typeof sentencasMerito.$inferInsert;

export const insertSentencaMeritoSchema = z.object({
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  empresa: z.string().optional(),
  tipoDecisao: z.string().optional(),
  favorabilidade: z.string().optional(),
  empregadora: z.string().optional(),
});

export type CreateSentencaMeritoInput = z.infer<typeof insertSentencaMeritoSchema>;

export const acordaosMerito = pgTable("acordaos_merito", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroProcesso: varchar("numero_processo").notNull(),
  empresa: varchar("empresa"),
  tipoDecisao: varchar("tipo_decisao"),
  sinteseDecisao: varchar("sintese_decisao"),
  empregadora: varchar("empregadora"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AcordaoMerito = typeof acordaosMerito.$inferSelect;
export type InsertAcordaoMerito = typeof acordaosMerito.$inferInsert;

export const insertAcordaoMeritoSchema = z.object({
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  empresa: z.string().optional(),
  tipoDecisao: z.string().optional(),
  sinteseDecisao: z.string().optional(),
  empregadora: z.string().optional(),
});

export type CreateAcordaoMeritoInput = z.infer<typeof insertAcordaoMeritoSchema>;

export const brainstormStatsSchema = z.object({
  distribuidos: z.number(),
  encerrados: z.number(),
  sentencasMerito: z.number(),
  acordaosMerito: z.number(),
});

export type BrainstormStats = z.infer<typeof brainstormStatsSchema>;

// Mapas Estratégicos Module - Turma → Desembargador → Decisões structure

export const votoStatusEnum = z.enum(["FAVORÁVEL", "DESFAVORÁVEL", "EM ANÁLISE", "SUSPEITO"]);
export type VotoStatus = z.infer<typeof votoStatusEnum>;

export const instanciaEnum = z.enum(["primeira", "segunda"]);
export type Instancia = z.infer<typeof instanciaEnum>;

export const turmas = pgTable("turmas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome").notNull(),
  regiao: varchar("regiao"),
  instancia: varchar("instancia").default("segunda").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Turma = typeof turmas.$inferSelect;
export type InsertTurma = typeof turmas.$inferInsert;

export const insertTurmaSchema = z.object({
  nome: z.string().min(1, "Nome da turma é obrigatório"),
  regiao: z.string().optional(),
  instancia: instanciaEnum.default("segunda"),
});

export type CreateTurmaInput = z.infer<typeof insertTurmaSchema>;

export const desembargadores = pgTable("desembargadores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  turmaId: varchar("turma_id").notNull().references(() => turmas.id, { onDelete: "cascade" }),
  nome: varchar("nome").notNull(),
  voto: varchar("voto").notNull().default("EM ANÁLISE"),
  observacoes: varchar("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Desembargador = typeof desembargadores.$inferSelect;
export type InsertDesembargador = typeof desembargadores.$inferInsert;

export const insertDesembargadorSchema = z.object({
  turmaId: z.string().min(1, "Turma é obrigatória"),
  nome: z.string().min(1, "Nome do desembargador é obrigatório"),
  voto: votoStatusEnum.default("EM ANÁLISE"),
  observacoes: z.string().optional(),
});

export type CreateDesembargadorInput = z.infer<typeof insertDesembargadorSchema>;

// Enum para responsabilidade
export const responsabilidadeEnum = z.enum(["solidaria", "subsidiaria"]);
export type Responsabilidade = z.infer<typeof responsabilidadeEnum>;

// Decisões RPAC - para rastrear decisões específicas
export const decisoesRpac = pgTable("decisoes_rpac", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  desembargadorId: varchar("desembargador_id").notNull().references(() => desembargadores.id, { onDelete: "cascade" }),
  numeroProcesso: varchar("numero_processo").notNull(),
  dataDecisao: timestamp("data_decisao"),
  resultado: varchar("resultado").notNull(),
  upi: varchar("upi").default("nao"),
  responsabilidade: varchar("responsabilidade").default("subsidiaria"),
  empresa: varchar("empresa").default("V.tal"),
  observacoes: varchar("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DecisaoRpac = typeof decisoesRpac.$inferSelect;
export type InsertDecisaoRpac = typeof decisoesRpac.$inferInsert;

export const upiEnum = z.enum(["sim", "nao"]);
export type UPI = z.infer<typeof upiEnum>;

export const insertDecisaoRpacSchema = z.object({
  desembargadorId: z.string().min(1, "Desembargador é obrigatório"),
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  dataDecisao: z.string().optional(),
  resultado: votoStatusEnum,
  upi: upiEnum.default("nao"),
  responsabilidade: responsabilidadeEnum.default("subsidiaria"),
  empresa: empresaEnum.default("V.tal"),
  observacoes: z.string().optional(),
});

export type CreateDecisaoRpacInput = z.infer<typeof insertDecisaoRpacSchema>;

// Carteira RPAC - processos em carteira
export const carteiraRpac = pgTable("carteira_rpac", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  turmaId: varchar("turma_id").references(() => turmas.id, { onDelete: "set null" }),
  numeroProcesso: varchar("numero_processo").notNull(),
  parte: varchar("parte"),
  status: varchar("status"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CarteiraRpacItem = typeof carteiraRpac.$inferSelect;
export type InsertCarteiraRpac = typeof carteiraRpac.$inferInsert;

export const insertCarteiraRpacSchema = z.object({
  turmaId: z.string().optional(),
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  parte: z.string().optional(),
  status: z.string().optional(),
});

export type CreateCarteiraRpacInput = z.infer<typeof insertCarteiraRpacSchema>;

// Schemas de visualização para o Mapa de Decisões
export const desembargadorComDecisoesSchema = z.object({
  id: z.string(),
  nome: z.string(),
  voto: z.string(),
  turmaId: z.string(),
  turmaNome: z.string(),
  decisoes: z.array(z.object({
    id: z.string(),
    numeroProcesso: z.string(),
    dataDecisao: z.string().nullable(),
    resultado: z.string(),
    observacoes: z.string().nullable(),
  })),
  estatisticas: z.object({
    total: z.number(),
    favoraveis: z.number(),
    desfavoraveis: z.number(),
    emAnalise: z.number(),
    suspeitos: z.number(),
    percentualFavoravel: z.number(),
  }),
});

export type DesembargadorComDecisoes = z.infer<typeof desembargadorComDecisoesSchema>;

export const turmaComDesembargadoresSchema = z.object({
  id: z.string(),
  nome: z.string(),
  regiao: z.string().nullable(),
  desembargadores: z.array(z.object({
    id: z.string(),
    nome: z.string(),
    voto: z.string(),
  })),
  estatisticas: z.object({
    total: z.number(),
    favoraveis: z.number(),
    desfavoraveis: z.number(),
    emAnalise: z.number(),
    suspeitos: z.number(),
    percentualFavoravel: z.number(),
    percentualDesfavoravel: z.number(),
    percentualEmAnalise: z.number(),
    percentualSuspeito: z.number(),
  }),
});

export type TurmaComDesembargadores = z.infer<typeof turmaComDesembargadoresSchema>;

export const mapaDecisoesGeralSchema = z.object({
  turmas: z.array(turmaComDesembargadoresSchema),
  estatisticasGerais: z.object({
    total: z.number(),
    favoraveis: z.number(),
    desfavoraveis: z.number(),
    emAnalise: z.number(),
    suspeitos: z.number(),
    percentualFavoravel: z.number(),
    percentualDesfavoravel: z.number(),
  }),
});

export type MapaDecisoesGeral = z.infer<typeof mapaDecisoesGeralSchema>;

// Backwards compatibility
export const mapaDecisoesSchema = mapaDecisoesGeralSchema;
export type MapaDecisoes = MapaDecisoesGeral;

// Passivo Mensal - dados de passivo organizados por mês/ano
export const passivoMensal = pgTable("passivo_mensal", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mes: varchar("mes").notNull(), // "01" a "12"
  ano: varchar("ano").notNull(), // "2024", "2025", etc
  dados: jsonb("dados").notNull(), // PassivoData completo em JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_passivo_mensal_periodo").on(table.mes, table.ano),
]);

export type PassivoMensal = typeof passivoMensal.$inferSelect;
export type InsertPassivoMensal = typeof passivoMensal.$inferInsert;

export const insertPassivoMensalSchema = z.object({
  mes: z.string().regex(/^(0[1-9]|1[0-2])$/, "Mês deve ser de 01 a 12"),
  ano: z.string().regex(/^\d{4}$/, "Ano deve ter 4 dígitos"),
  dados: passivoDataSchema,
});

export type CreatePassivoMensalInput = z.infer<typeof insertPassivoMensalSchema>;

// Schema para comparação de meses
export const comparacaoMensalSchema = z.object({
  mes1: z.object({
    mes: z.string(),
    ano: z.string(),
    dados: passivoDataSchema,
  }),
  mes2: z.object({
    mes: z.string(),
    ano: z.string(),
    dados: passivoDataSchema,
  }),
  diferenca: z.object({
    processos: z.number(),
    percentualProcessos: z.number(),
    valorTotal: z.number(),
    percentualValor: z.number(),
  }),
});

export type ComparacaoMensal = z.infer<typeof comparacaoMensalSchema>;

// Módulo Entrada & Saídas - Casos Novos
export const casosNovos = pgTable("casos_novos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroProcesso: varchar("numero_processo").notNull(),
  dataDistribuicao: timestamp("data_distribuicao"),
  tribunal: varchar("tribunal").notNull(),
  empresa: varchar("empresa").notNull(),
  valorContingencia: varchar("valor_contingencia"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CasoNovo = typeof casosNovos.$inferSelect;
export type InsertCasoNovo = typeof casosNovos.$inferInsert;

export const insertCasoNovoSchema = z.object({
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  dataDistribuicao: z.string().optional(),
  tribunal: z.string().min(1, "Tribunal é obrigatório"),
  empresa: z.string().min(1, "Empresa é obrigatória"),
  valorContingencia: z.string().optional(),
});

export type CreateCasoNovoInput = z.infer<typeof insertCasoNovoSchema>;

// Módulo Entrada & Saídas - Casos Encerrados
export const casosEncerrados = pgTable("casos_encerrados", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroProcesso: varchar("numero_processo").notNull(),
  dataEncerramento: timestamp("data_encerramento"),
  tribunal: varchar("tribunal").notNull(),
  empresa: varchar("empresa").notNull(),
  valorContingencia: varchar("valor_contingencia"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CasoEncerrado = typeof casosEncerrados.$inferSelect;
export type InsertCasoEncerrado = typeof casosEncerrados.$inferInsert;

export const insertCasoEncerradoSchema = z.object({
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  dataEncerramento: z.string().optional(),
  tribunal: z.string().min(1, "Tribunal é obrigatório"),
  empresa: z.string().min(1, "Empresa é obrigatória"),
  valorContingencia: z.string().optional(),
});

export type CreateCasoEncerradoInput = z.infer<typeof insertCasoEncerradoSchema>;
