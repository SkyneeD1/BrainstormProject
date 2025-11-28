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

// Report configuration schemas
export const reportWidgetTypeEnum = z.enum([
  "kpi-total", "kpi-passivo", "kpi-ticket", "kpi-risco", "kpi-recursal",
  "table-fase", "table-risco",
  "chart-fase", "chart-risco", "chart-empresa"
]);
export type ReportWidgetType = z.infer<typeof reportWidgetTypeEnum>;

export const reportWidgetSchema = z.object({
  id: z.string(),
  type: reportWidgetTypeEnum,
  title: z.string(),
});

export type ReportWidget = z.infer<typeof reportWidgetSchema>;

export const customReports = pgTable("custom_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: varchar("description"),
  widgets: jsonb("widgets").notNull().$type<ReportWidget[]>(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isPublic: varchar("is_public").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CustomReport = typeof customReports.$inferSelect;
export type InsertCustomReport = typeof customReports.$inferInsert;

export const createReportSchema = z.object({
  name: z.string().min(1, "Nome do relatório obrigatório"),
  description: z.string().optional(),
  widgets: z.array(reportWidgetSchema).min(1, "Adicione pelo menos um widget"),
  isPublic: z.boolean().default(false),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = createReportSchema.partial();
