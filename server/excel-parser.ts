import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import type { Processo, FaseProcessual, ClassificacaoRisco, Empresa } from "@shared/schema";
import { randomUUID } from "crypto";

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

export function parseExcelFile(filePath: string): Processo[] {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`Arquivo Excel não encontrado: ${absolutePath}`);
    return [];
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  if (rawData.length < 2) {
    console.error("Planilha vazia ou sem dados");
    return [];
  }

  const processos: Processo[] = [];

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

    const processo: Processo = {
      id: randomUUID(),
      empresa: normalizeEmpresa(empresaOriginal, tipoOrigem),
      faseProcessual: normalizeFase(fase),
      classificacaoRisco: normalizeRisco(prognostico),
      numeroProcessos: 1,
      valorTotalRisco: Math.round(valorTotal),
    };

    processos.push(processo);
  }

  console.log(`Carregados ${processos.length} processos da planilha`);
  return processos;
}
