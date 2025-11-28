import { z } from "zod";
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

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
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").default("viewer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: roleEnum.default("viewer"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updatePasswordSchema = z.object({
  newPassword: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

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
