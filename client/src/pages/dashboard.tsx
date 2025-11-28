import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, TrendingUp, AlertTriangle, Scale, Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  const visaoGeralRef = useRef<HTMLDivElement>(null);
  const detalhamentoRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: passivoData, isLoading, error } = useQuery<PassivoData>({
    queryKey: ["/api/passivo"],
  });

  const exportToPDF = async () => {
    setIsExporting(true);
    toast({
      title: "Gerando PDF...",
      description: "Aguarde enquanto capturamos as telas",
    });

    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      if (visaoGeralRef.current) {
        pdf.setFontSize(16);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Contencioso - Passivo sob Gestao", margin, margin + 5);
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text("Visao Geral - Base Dez/24", margin, margin + 12);

        const canvas1 = await html2canvas(visaoGeralRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ebedef",
          logging: false,
        });

        const imgData1 = canvas1.toDataURL("image/png");
        const imgWidth = pageWidth - margin * 2;
        const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
        const maxHeight = pageHeight - margin * 2 - 20;
        const finalHeight1 = Math.min(imgHeight1, maxHeight);

        pdf.addImage(imgData1, "PNG", margin, margin + 18, imgWidth, finalHeight1);
      }

      if (detalhamentoRef.current) {
        pdf.addPage();

        pdf.setFontSize(16);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Contencioso - Passivo sob Gestao", margin, margin + 5);
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text("Detalhamento por Origem - Base Dez/24", margin, margin + 12);

        const canvas2 = await html2canvas(detalhamentoRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ebedef",
          logging: false,
        });

        const imgData2 = canvas2.toDataURL("image/png");
        const imgWidth = pageWidth - margin * 2;
        const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
        const maxHeight = pageHeight - margin * 2 - 20;
        const finalHeight2 = Math.min(imgHeight2, maxHeight);

        pdf.addImage(imgData2, "PNG", margin, margin + 18, imgWidth, finalHeight2);
      }

      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      
      pdf.save(`Contencioso_PassivoSobGestao_${timestamp}.pdf`);

      toast({
        title: "PDF exportado com sucesso!",
        description: "O arquivo foi baixado para seu computador",
      });
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
      toast({
        title: "Erro ao exportar PDF",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        <div className="flex items-center gap-3">
          <Button
            onClick={exportToPDF}
            disabled={isExporting}
            data-testid="button-export-pdf"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar PDF
          </Button>
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
          <div ref={visaoGeralRef} className="space-y-6 bg-background p-4 rounded-lg">
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
                title="Valor Total por Fase (R$)"
                dataKey="valorTotal"
                formatValue={(v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PieChartRisco
                data={riscos}
                title="Distribuição por Classificação de Risco"
              />
              <GroupedBarChart
                data={fases}
                title="Ticket Médio por Fase (R$)"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="por-origem" className="space-y-6">
          <div ref={detalhamentoRef} className="space-y-6 bg-background p-4 rounded-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
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
                title="Valor Total por Empresa (R$)"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
