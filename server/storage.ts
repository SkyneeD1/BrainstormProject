import { randomUUID } from "crypto";
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

export interface IStorage {
  getPassivoData(): Promise<PassivoData>;
  setRawData(data: Processo[]): Promise<void>;
  getRawData(): Promise<Processo[]>;
}

export class MemStorage implements IStorage {
  private rawData: Processo[] = [];

  constructor() {
    this.initializeWithSlideData();
  }

  private initializeWithSlideData(): void {
    const slideData: Omit<Processo, "id">[] = [
      { empresa: "V.tal", faseProcessual: "Conhecimento", classificacaoRisco: "Remoto", numeroProcessos: 126, valorTotalRisco: 79000000 },
      { empresa: "V.tal", faseProcessual: "Recursal", classificacaoRisco: "Possível", numeroProcessos: 66, valorTotalRisco: 13000000 },
      { empresa: "V.tal", faseProcessual: "Execução", classificacaoRisco: "Provável", numeroProcessos: 6, valorTotalRisco: 1000000 },
      
      { empresa: "OI", faseProcessual: "Conhecimento", classificacaoRisco: "Remoto", numeroProcessos: 72, valorTotalRisco: 60000000 },
      { empresa: "OI", faseProcessual: "Recursal", classificacaoRisco: "Possível", numeroProcessos: 14, valorTotalRisco: 133000000 },
      { empresa: "OI", faseProcessual: "Execução", classificacaoRisco: "Provável", numeroProcessos: 6, valorTotalRisco: 6000000 },
      
      { empresa: "Serede", faseProcessual: "Conhecimento", classificacaoRisco: "Remoto", numeroProcessos: 242, valorTotalRisco: 101000000 },
      { empresa: "Serede", faseProcessual: "Recursal", classificacaoRisco: "Possível", numeroProcessos: 445, valorTotalRisco: 35000000 },
      { empresa: "Serede", faseProcessual: "Execução", classificacaoRisco: "Provável", numeroProcessos: 182, valorTotalRisco: 64000000 },
      
      { empresa: "Sprink", faseProcessual: "Conhecimento", classificacaoRisco: "Remoto", numeroProcessos: 173, valorTotalRisco: 30000000 },
      { empresa: "Sprink", faseProcessual: "Recursal", classificacaoRisco: "Possível", numeroProcessos: 343, valorTotalRisco: 70000000 },
      { empresa: "Sprink", faseProcessual: "Execução", classificacaoRisco: "Provável", numeroProcessos: 64, valorTotalRisco: 6000000 },
      
      { empresa: "Outros Terceiros", faseProcessual: "Conhecimento", classificacaoRisco: "Remoto", numeroProcessos: 44, valorTotalRisco: 36000000 },
      { empresa: "Outros Terceiros", faseProcessual: "Recursal", classificacaoRisco: "Possível", numeroProcessos: 95, valorTotalRisco: 5000000 },
      { empresa: "Outros Terceiros", faseProcessual: "Execução", classificacaoRisco: "Provável", numeroProcessos: 31, valorTotalRisco: 11000000 },
    ];

    this.rawData = slideData.map((d) => ({
      ...d,
      id: randomUUID(),
    }));
  }

  async setRawData(data: Processo[]): Promise<void> {
    this.rawData = data;
  }

  async getRawData(): Promise<Processo[]> {
    return this.rawData;
  }

  async getPassivoData(): Promise<PassivoData> {
    const fases = this.getSlidesFaseData();
    const riscos = this.getSlidesRiscoData();
    const empresas = this.getSlidesEmpresaData();
    const summary = this.getSlidesSummary();

    return {
      fases,
      riscos,
      empresas,
      summary,
      rawData: this.rawData,
    };
  }

  private getSlidesFaseData(): FaseData[] {
    return [
      {
        fase: "Conhecimento",
        processos: 657,
        percentualProcessos: 39,
        valorTotal: 144000000,
        percentualValor: 38,
        ticketMedio: 537000,
      },
      {
        fase: "Recursal",
        processos: 809,
        percentualProcessos: 47,
        valorTotal: 147000000,
        percentualValor: 39,
        ticketMedio: 202000,
      },
      {
        fase: "Execução",
        processos: 239,
        percentualProcessos: 14,
        valorTotal: 83000000,
        percentualValor: 22,
        ticketMedio: 346000,
      },
    ];
  }

  private getSlidesRiscoData(): RiscoData[] {
    return [
      {
        risco: "Remoto",
        processos: 657,
        percentualProcessos: 39,
        valorTotal: 144000000,
        percentualValor: 38,
        ticketMedio: 537000,
      },
      {
        risco: "Possível",
        processos: 809,
        percentualProcessos: 47,
        valorTotal: 147000000,
        percentualValor: 39,
        ticketMedio: 202000,
      },
      {
        risco: "Provável",
        processos: 239,
        percentualProcessos: 14,
        valorTotal: 83000000,
        percentualValor: 22,
        ticketMedio: 346000,
      },
    ];
  }

  private getSlidesSummary(): DashboardSummary {
    return {
      totalProcessos: 1705,
      totalPassivo: 374000000,
      ticketMedioGlobal: 351000,
      percentualRiscoProvavel: 14,
      percentualFaseRecursal: 47,
    };
  }

  private getSlidesEmpresaData(): EmpresaFaseData[] {
    return [
      {
        empresa: "V.tal",
        conhecimento: { processos: 126, valor: 79000000, percentualValor: 13 },
        recursal: { processos: 66, valor: 13000000, percentualValor: 2 },
        execucao: { processos: 6, valor: 1000000, percentualValor: 0 },
        total: { processos: 198, percentualProcessos: 100, valor: 94000000, percentualValor: 15 },
      },
      {
        empresa: "OI",
        conhecimento: { processos: 72, valor: 60000000, percentualValor: 10 },
        recursal: { processos: 14, valor: 133000000, percentualValor: 17 },
        execucao: { processos: 6, valor: 6000000, percentualValor: 1 },
        total: { processos: 92, percentualProcessos: 100, valor: 219000000, percentualValor: 17 },
      },
      {
        empresa: "Serede",
        conhecimento: { processos: 242, valor: 101000000, percentualValor: 29 },
        recursal: { processos: 445, valor: 35000000, percentualValor: 18 },
        execucao: { processos: 182, valor: 64000000, percentualValor: 11 },
        total: { processos: 869, percentualProcessos: 58, valor: 343000000, percentualValor: 58 },
      },
      {
        empresa: "Sprink",
        conhecimento: { processos: 173, valor: 30000000, percentualValor: 5 },
        recursal: { processos: 343, valor: 70000000, percentualValor: 1 },
        execucao: { processos: 64, valor: 6000000, percentualValor: 0 },
        total: { processos: 580, percentualProcessos: 2, valor: 106000000, percentualValor: 2 },
      },
      {
        empresa: "Outros Terceiros",
        conhecimento: { processos: 44, valor: 36000000, percentualValor: 6 },
        recursal: { processos: 95, valor: 5000000, percentualValor: 1 },
        execucao: { processos: 31, valor: 11000000, percentualValor: 2 },
        total: { processos: 313, percentualProcessos: 9, valor: 313000000, percentualValor: 9 },
      },
    ];
  }
}

export const storage = new MemStorage();
