import type { 
  Processo, 
  FaseData, 
  RiscoData, 
  EmpresaFaseData, 
  DashboardSummary,
  PassivoData,
  FaseProcessual,
  ClassificacaoRisco,
  Empresa
} from "@shared/schema";
import { parseExcelFile } from "./excel-parser";

export interface IStorage {
  getPassivoData(): Promise<PassivoData>;
  setRawData(data: Processo[]): Promise<void>;
  getRawData(): Promise<Processo[]>;
}

export class MemStorage implements IStorage {
  private rawData: Processo[] = [];

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

  async setRawData(data: Processo[]): Promise<void> {
    this.rawData = data;
  }

  async getRawData(): Promise<Processo[]> {
    return this.rawData;
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
      current.valor += p.valorTotalRisco;
      faseMap.set(p.faseProcessual, current);
    });

    const totalProcessos = this.rawData.length;
    const totalValor = this.rawData.reduce((sum, p) => sum + p.valorTotalRisco, 0);

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
      current.valor += p.valorTotalRisco;
      riscoMap.set(p.classificacaoRisco, current);
    });

    const totalProcessos = this.rawData.length;
    const totalValor = this.rawData.reduce((sum, p) => sum + p.valorTotalRisco, 0);

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
        current.valor += p.valorTotalRisco;
        faseMap.set(p.faseProcessual, current);
      }
    });

    const totalProcessos = this.rawData.length;
    const totalValor = this.rawData.reduce((sum, p) => sum + p.valorTotalRisco, 0);

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
    const totalValor = this.rawData.reduce((sum, p) => sum + p.valorTotalRisco, 0);
    
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
}

export const storage = new MemStorage();
