import { useQuery } from "@tanstack/react-query";
import { FileText, TrendingUp, AlertTriangle, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/kpi-card";
import { DataTableFase } from "@/components/data-table-fase";
import { DataTableRisco } from "@/components/data-table-risco";
import { DataTableOrigem } from "@/components/data-table-origem";
import { BarChartFase } from "@/components/charts/bar-chart-fase";
import { PieChartRisco } from "@/components/charts/pie-chart-risco";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { EmpresaBarChart } from "@/components/charts/empresa-bar-chart";
import { EmpresaPieChart } from "@/components/charts/empresa-pie-chart";
import { formatProcessos, formatCurrency, formatPercentage } from "@/lib/formatters";
import type { PassivoData } from "@shared/schema";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5">
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px] rounded-md" />
        <Skeleton className="h-[350px] rounded-md" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: passivoData, isLoading, error } = useQuery<PassivoData>({
    queryKey: ["/api/passivo"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Contencioso – Passivo sob Gestão</h1>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !passivoData) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar dados</h2>
          <p className="text-muted-foreground">
            Não foi possível carregar os dados do passivo. Verifique se o arquivo Excel foi carregado corretamente.
          </p>
        </Card>
      </div>
    );
  }

  const { fases, riscos, empresas, summary } = passivoData;

  const faseTotals = {
    processos: summary.totalProcessos,
    valorTotal: summary.totalPassivo,
    ticketMedio: summary.ticketMedioGlobal,
  };

  const riscoTotals = {
    processos: summary.totalProcessos,
    valorTotal: summary.totalPassivo,
    ticketMedio: summary.ticketMedioGlobal,
  };

  const empresaTotals = {
    processos: summary.totalProcessos,
    valorTotal: summary.totalPassivo,
    conhecimento: {
      processos: fases.find(f => f.fase === "Conhecimento")?.processos || 0,
      valor: fases.find(f => f.fase === "Conhecimento")?.valorTotal || 0,
    },
    recursal: {
      processos: fases.find(f => f.fase === "Recursal")?.processos || 0,
      valor: fases.find(f => f.fase === "Recursal")?.valorTotal || 0,
    },
    execucao: {
      processos: fases.find(f => f.fase === "Execução")?.processos || 0,
      valor: fases.find(f => f.fase === "Execução")?.valorTotal || 0,
    },
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Contencioso – Passivo sob Gestão
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Baseado nos dados de Dezembro/24
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            V.tal
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Processos"
          value={formatProcessos(summary.totalProcessos)}
          icon={FileText}
          accentColor="yellow"
        />
        <KPICard
          title="Total do Passivo"
          value={formatCurrency(summary.totalPassivo)}
          icon={TrendingUp}
          accentColor="blue"
        />
        <KPICard
          title="% Risco Provável"
          value={formatPercentage(summary.percentualRiscoProvavel)}
          icon={AlertTriangle}
          accentColor="red"
        />
        <KPICard
          title="% Fase Recursal"
          value={formatPercentage(summary.percentualFaseRecursal)}
          icon={Scale}
          accentColor="green"
        />
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="visao-geral" data-testid="tab-visao-geral" className="data-[state=active]:bg-card">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="por-origem" data-testid="tab-por-origem" className="data-[state=active]:bg-card">
            Detalhamento por Origem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 bg-chart-2 rounded-full" />
                Visão por Fase Processual
              </h2>
              <DataTableFase data={fases} totals={faseTotals} />
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 bg-chart-4 rounded-full" />
                Visão por Classificação de Risco
              </h2>
              <DataTableRisco data={riscos} totals={riscoTotals} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BarChartFase
              data={fases}
              title="Nº de Processos por Fase"
              dataKey="processos"
            />
            <BarChartFase
              data={fases}
              title="Valor Total por Fase (mi R$)"
              dataKey="valorTotal"
              formatValue={(v) => `R$ ${v.toFixed(0)} mi`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PieChartRisco
              data={riscos}
              title="Distribuição por Classificação de Risco"
            />
            <GroupedBarChart
              data={fases}
              title="Ticket Médio por Fase (k R$)"
            />
          </div>
        </TabsContent>

        <TabsContent value="por-origem" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Detalhamento por Origem / Empresa
              </h2>
              <p className="text-xs text-muted-foreground">
                A SEREDE representa 58% do valor total estimado do passivo trabalhista
              </p>
            </div>
            <DataTableOrigem data={empresas} totals={empresaTotals} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmpresaPieChart
              data={empresas}
              title="Distribuição por Empresa (Valor)"
            />
            <EmpresaBarChart
              data={empresas}
              title="Valor Total por Empresa (mi R$)"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
