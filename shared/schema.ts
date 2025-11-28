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
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("viewer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  role: roleEnum.optional().default("viewer"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
