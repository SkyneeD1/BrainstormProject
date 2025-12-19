import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, Minus, Scale, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyValue, formatProcessos } from "@/lib/formatters";
import type { PassivoData } from "@shared/schema";

const MESES_LABEL: Record<string, string> = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
};

interface ComparacaoData {
  mes1: { mes: string; ano: string; dados: PassivoData };
  mes2: { mes: string; ano: string; dados: PassivoData };
  diferenca: {
    processos: number;
    percentualProcessos: number;
    valorTotal: number;
    percentualValor: number;
  };
}

function ComparacaoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}

function DiferencaIndicator({ valor, percentual, inverter = false }: { valor: number; percentual: number; inverter?: boolean }) {
  const isPositivo = inverter ? valor < 0 : valor > 0;
  const isNeutro = valor === 0;
  
  if (isNeutro) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm font-medium">Sem variação</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-1 ${isPositivo ? "text-green-600" : "text-red-600"}`}>
      {isPositivo ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
      <span className="text-sm font-bold">
        {valor > 0 ? "+" : ""}{valor.toLocaleString("pt-BR")} ({percentual > 0 ? "+" : ""}{percentual}%)
      </span>
    </div>
  );
}

export default function PassivoComparacao() {
  const [periodo1, setPeriodo1] = useState<string>("");
  const [periodo2, setPeriodo2] = useState<string>("");

  const { data: periodos, isLoading: loadingPeriodos } = useQuery<Array<{ mes: string; ano: string }>>({
    queryKey: ["/api/passivo/periodos"],
  });

  const [mes1, ano1] = periodo1 ? periodo1.split("-") : [null, null];
  const [mes2, ano2] = periodo2 ? periodo2.split("-") : [null, null];

  const { data: comparacao, isLoading: loadingComparacao, error } = useQuery<ComparacaoData>({
    queryKey: ["/api/passivo/comparar", mes1, ano1, mes2, ano2],
    queryFn: async () => {
      if (!mes1 || !ano1 || !mes2 || !ano2) return null;
      const res = await fetch(
        `/api/passivo/comparar?mes1=${mes1}&ano1=${ano1}&mes2=${mes2}&ano2=${ano2}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao comparar");
      }
      return res.json();
    },
    enabled: Boolean(mes1 && ano1 && mes2 && ano2),
  });

  const formatPeriodo = (mes: string, ano: string) => `${MESES_LABEL[mes]} ${ano}`;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Comparação de Períodos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare os dados do passivo entre dois meses diferentes
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Período 1 (Base)</label>
            <Select value={periodo1} onValueChange={setPeriodo1}>
              <SelectTrigger className="w-[180px]" data-testid="select-periodo1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {periodos?.map((p) => (
                  <SelectItem key={`${p.mes}-${p.ano}`} value={`${p.mes}-${p.ano}`}>
                    {MESES_LABEL[p.mes]} {p.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Período 2 (Comparar)</label>
            <Select value={periodo2} onValueChange={setPeriodo2}>
              <SelectTrigger className="w-[180px]" data-testid="select-periodo2">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {periodos?.map((p) => (
                  <SelectItem key={`${p.mes}-${p.ano}`} value={`${p.mes}-${p.ano}`}>
                    {MESES_LABEL[p.mes]} {p.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(!periodos || periodos.length === 0) && !loadingPeriodos && (
            <p className="text-sm text-muted-foreground">
              Nenhum período disponível. Importe dados na página de Dados.
            </p>
          )}
        </div>
      </Card>

      {loadingComparacao && <ComparacaoSkeleton />}

      {error && (
        <Card className="p-6 text-center">
          <p className="text-destructive">{(error as Error).message}</p>
        </Card>
      )}

      {comparacao && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Resumo da Variação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total de Processos</p>
                <p className="text-2xl font-bold">
                  {comparacao.mes1.dados.summary.totalProcessos.toLocaleString("pt-BR")}
                  <span className="text-muted-foreground mx-2">→</span>
                  {comparacao.mes2.dados.summary.totalProcessos.toLocaleString("pt-BR")}
                </p>
                <DiferencaIndicator 
                  valor={comparacao.diferenca.processos} 
                  percentual={comparacao.diferenca.percentualProcessos}
                  inverter={true}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Valor Total do Passivo</p>
                <p className="text-2xl font-bold">
                  R$ {formatCurrencyValue(comparacao.mes1.dados.summary.totalPassivo)}
                  <span className="text-muted-foreground mx-2">→</span>
                  R$ {formatCurrencyValue(comparacao.mes2.dados.summary.totalPassivo)}
                </p>
                <DiferencaIndicator 
                  valor={comparacao.diferenca.valorTotal} 
                  percentual={comparacao.diferenca.percentualValor}
                  inverter={true}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  R$ {formatCurrencyValue(comparacao.mes1.dados.summary.ticketMedioGlobal)}
                  <span className="text-muted-foreground mx-2">→</span>
                  R$ {formatCurrencyValue(comparacao.mes2.dados.summary.ticketMedioGlobal)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Risco Provável</p>
                <p className="text-2xl font-bold">
                  {comparacao.mes1.dados.summary.percentualRiscoProvavel}%
                  <span className="text-muted-foreground mx-2">→</span>
                  {comparacao.mes2.dados.summary.percentualRiscoProvavel}%
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {formatPeriodo(comparacao.mes1.mes, comparacao.mes1.ano)}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Por Fase Processual</p>
                  <div className="space-y-2">
                    {comparacao.mes1.dados.fases.map((fase) => (
                      <div key={fase.fase} className="flex justify-between items-center">
                        <span className="text-sm">{fase.fase}</span>
                        <div className="text-right">
                          <span className="font-medium">{fase.processos.toLocaleString("pt-BR")} processos</span>
                          <span className="text-muted-foreground ml-2">({fase.percentualProcessos}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Por Risco</p>
                  <div className="space-y-2">
                    {comparacao.mes1.dados.riscos.map((risco) => (
                      <div key={risco.risco} className="flex justify-between items-center">
                        <span className="text-sm">{risco.risco}</span>
                        <div className="text-right">
                          <span className="font-medium">{risco.processos.toLocaleString("pt-BR")} processos</span>
                          <span className="text-muted-foreground ml-2">({risco.percentualProcessos}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {formatPeriodo(comparacao.mes2.mes, comparacao.mes2.ano)}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Por Fase Processual</p>
                  <div className="space-y-2">
                    {comparacao.mes2.dados.fases.map((fase) => (
                      <div key={fase.fase} className="flex justify-between items-center">
                        <span className="text-sm">{fase.fase}</span>
                        <div className="text-right">
                          <span className="font-medium">{fase.processos.toLocaleString("pt-BR")} processos</span>
                          <span className="text-muted-foreground ml-2">({fase.percentualProcessos}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Por Risco</p>
                  <div className="space-y-2">
                    {comparacao.mes2.dados.riscos.map((risco) => (
                      <div key={risco.risco} className="flex justify-between items-center">
                        <span className="text-sm">{risco.risco}</span>
                        <div className="text-right">
                          <span className="font-medium">{risco.processos.toLocaleString("pt-BR")} processos</span>
                          <span className="text-muted-foreground ml-2">({risco.percentualProcessos}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {!comparacao && !loadingComparacao && periodo1 && periodo2 && (
        <Card className="p-8 text-center">
          <Scale className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Selecione dois períodos diferentes para comparar os dados do passivo.
          </p>
        </Card>
      )}

      {!periodo1 && !periodo2 && !loadingPeriodos && periodos && periodos.length > 0 && (
        <Card className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Selecione dois períodos acima para visualizar a comparação.
          </p>
        </Card>
      )}
    </div>
  );
}
