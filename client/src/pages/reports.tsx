import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  FileText, 
  Trash2, 
  Edit, 
  BarChart3, 
  PieChart, 
  LayoutGrid, 
  TableIcon,
  Eye,
  Download,
  Globe,
  Lock,
  X,
  Save
} from "lucide-react";
import type { CustomReport, PassivoData, ReportWidget, ReportWidgetType } from "@shared/schema";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { KPICard } from "@/components/kpi-card";
import { DataTableFase } from "@/components/data-table-fase";
import { DataTableRisco } from "@/components/data-table-risco";
import { BarChartFase } from "@/components/charts/bar-chart-fase";
import { PieChartRisco } from "@/components/charts/pie-chart-risco";
import { EmpresaBarChart } from "@/components/charts/empresa-bar-chart";

const AVAILABLE_WIDGETS: { type: ReportWidgetType; title: string; category: string; icon: typeof BarChart3 }[] = [
  { type: "kpi-total", title: "Total de Processos", category: "KPIs", icon: LayoutGrid },
  { type: "kpi-passivo", title: "Passivo Total", category: "KPIs", icon: LayoutGrid },
  { type: "kpi-ticket", title: "Ticket Médio", category: "KPIs", icon: LayoutGrid },
  { type: "kpi-risco", title: "% Risco Provável", category: "KPIs", icon: LayoutGrid },
  { type: "kpi-recursal", title: "% Fase Recursal", category: "KPIs", icon: LayoutGrid },
  { type: "table-fase", title: "Tabela por Fase", category: "Tabelas", icon: TableIcon },
  { type: "table-risco", title: "Tabela por Risco", category: "Tabelas", icon: TableIcon },
  { type: "chart-fase", title: "Gráfico por Fase", category: "Gráficos", icon: BarChart3 },
  { type: "chart-risco", title: "Gráfico por Risco", category: "Gráficos", icon: PieChart },
  { type: "chart-empresa", title: "Gráfico por Empresa", category: "Gráficos", icon: BarChart3 },
];

function formatValue(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2).replace(".", ",")} bi`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2).replace(".", ",")} mi`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(0).replace(".", ",")} mil`;
  }
  return value.toLocaleString("pt-BR");
}

function WidgetRenderer({ widget, data }: { widget: ReportWidget; data: PassivoData }) {
  const totals = {
    processos: data.summary.totalProcessos,
    valorTotal: data.summary.totalPassivo,
    ticketMedio: data.summary.ticketMedioGlobal,
  };

  switch (widget.type) {
    case "kpi-total":
      return (
        <KPICard
          title="Total de Processos"
          value={data.summary.totalProcessos.toLocaleString("pt-BR")}
          subtitle="processos ativos"
        />
      );
    case "kpi-passivo":
      return (
        <KPICard
          title="Passivo Total"
          value={`R$ ${formatValue(data.summary.totalPassivo)}`}
        />
      );
    case "kpi-ticket":
      return (
        <KPICard
          title="Ticket Médio"
          value={`R$ ${formatValue(data.summary.ticketMedioGlobal)}`}
        />
      );
    case "kpi-risco":
      return (
        <KPICard
          title="Risco Provável"
          value={`${data.summary.percentualRiscoProvavel}%`}
          subtitle="dos processos"
        />
      );
    case "kpi-recursal":
      return (
        <KPICard
          title="Fase Recursal"
          value={`${data.summary.percentualFaseRecursal}%`}
          subtitle="dos processos"
        />
      );
    case "table-fase":
      return (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Processos por Fase</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableFase data={data.fases} totals={totals} />
          </CardContent>
        </Card>
      );
    case "table-risco":
      return (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Processos por Risco</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableRisco data={data.riscos} totals={totals} />
          </CardContent>
        </Card>
      );
    case "chart-fase":
      return (
        <BarChartFase data={data.fases} title="Distribuição por Fase" dataKey="processos" />
      );
    case "chart-risco":
      return (
        <PieChartRisco data={data.riscos} title="Distribuição por Risco" />
      );
    case "chart-empresa":
      return (
        <EmpresaBarChart data={data.empresas} title="Valor por Empresa de Origem" />
      );
    default:
      return null;
  }
}

function ReportBuilder({ 
  report, 
  onClose 
}: { 
  report?: CustomReport; 
  onClose: () => void;
}) {
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [name, setName] = useState(report?.name || "");
  const [description, setDescription] = useState(report?.description || "");
  const [isPublic, setIsPublic] = useState(report?.isPublic === "true");
  const [widgets, setWidgets] = useState<ReportWidget[]>(
    (report?.widgets as unknown as ReportWidget[]) || []
  );

  const { data: passivoData, isLoading: isLoadingData } = useQuery<PassivoData>({
    queryKey: ["/api/passivo"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; widgets: ReportWidget[]; isPublic: boolean }) => {
      return await apiRequest("POST", "/api/reports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Relatório criado com sucesso" });
      onClose();
    },
    onError: () => {
      toast({ title: "Erro ao criar relatório", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; widgets: ReportWidget[]; isPublic: boolean }) => {
      return await apiRequest("PATCH", `/api/reports/${report!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Relatório atualizado com sucesso" });
      onClose();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar relatório", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Informe um nome para o relatório", variant: "destructive" });
      return;
    }
    if (widgets.length === 0) {
      toast({ title: "Adicione pelo menos um widget", variant: "destructive" });
      return;
    }

    const data = { name, description, widgets, isPublic };
    if (report) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    
    toast({ title: "Gerando PDF..." });
    
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${name || "relatorio"}.pdf`);
      
      toast({ title: "PDF exportado com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  const addWidget = (type: ReportWidgetType) => {
    const widgetInfo = AVAILABLE_WIDGETS.find(w => w.type === type);
    if (!widgetInfo) return;
    
    setWidgets([...widgets, {
      id: `${type}-${Date.now()}`,
      type,
      title: widgetInfo.title,
    }]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const isWidgetAdded = (type: ReportWidgetType) => {
    return widgets.some(w => w.type === type);
  };

  const groupedWidgets = AVAILABLE_WIDGETS.reduce((acc, widget) => {
    if (!acc[widget.category]) acc[widget.category] = [];
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_WIDGETS>);

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-name">Nome do Relatório</Label>
            <Input
              id="report-name"
              data-testid="input-report-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Resumo Mensal"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="report-description">Descrição (opcional)</Label>
            <Textarea
              id="report-description"
              data-testid="input-report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do relatório"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <Label htmlFor="report-public">Público</Label>
            </div>
            <Switch
              id="report-public"
              data-testid="switch-report-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="h-px bg-border" />

          <div>
            <h3 className="font-medium mb-3">Adicionar Widgets</h3>
            <div className="space-y-4">
              {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => (
                <div key={category}>
                  <h4 className="text-sm text-muted-foreground mb-2">{category}</h4>
                  <div className="space-y-1">
                    {categoryWidgets.map((widget) => {
                      const Icon = widget.icon;
                      const added = isWidgetAdded(widget.type);
                      return (
                        <button
                          key={widget.type}
                          data-testid={`button-add-widget-${widget.type}`}
                          onClick={() => addWidget(widget.type)}
                          disabled={added}
                          className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors ${
                            added 
                              ? "opacity-50 cursor-not-allowed bg-muted" 
                              : "hover-elevate"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{widget.title}</span>
                          {added && <Badge variant="secondary" className="text-xs">Adicionado</Badge>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Prévia do Relatório</h2>
            <Badge variant="outline">{widgets.length} widget(s)</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid="button-export-pdf"
              onClick={handleExportPdf}
              disabled={widgets.length === 0 || isLoadingData}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button
              size="sm"
              data-testid="button-save-report"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {report ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div ref={previewRef} className="min-h-full bg-background p-4">
            {widgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum widget adicionado</p>
                <p className="text-sm">Selecione widgets no painel lateral para construir seu relatório</p>
              </div>
            ) : isLoadingData ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {widgets.map((w) => (
                  <Skeleton key={w.id} className="h-48" />
                ))}
              </div>
            ) : passivoData ? (
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {widgets.filter(w => w.type.startsWith("kpi-")).map((widget) => (
                    <div key={widget.id} className="relative group">
                      <button
                        data-testid={`button-remove-widget-${widget.id}`}
                        onClick={() => removeWidget(widget.id)}
                        className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <WidgetRenderer widget={widget} data={passivoData} />
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  {widgets.filter(w => w.type.startsWith("table-") || w.type.startsWith("chart-")).map((widget) => (
                    <div key={widget.id} className="relative group">
                      <button
                        data-testid={`button-remove-widget-${widget.id}`}
                        onClick={() => removeWidget(widget.id)}
                        className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <WidgetRenderer widget={widget} data={passivoData} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function ReportCard({ 
  report, 
  onView, 
  onEdit, 
  onDelete 
}: { 
  report: CustomReport; 
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const widgetCount = ((report.widgets as unknown as ReportWidget[]) || []).length;

  return (
    <Card className="hover-elevate transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{report.name}</CardTitle>
            {report.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {report.description}
              </CardDescription>
            )}
          </div>
          {report.isPublic === "true" ? (
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LayoutGrid className="h-4 w-4" />
          <span>{widgetCount} widget(s)</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onView} data-testid={`button-view-report-${report.id}`}>
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit} data-testid={`button-edit-report-${report.id}`}>
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} data-testid={`button-delete-report-${report.id}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function ReportViewer({ 
  report, 
  onClose 
}: { 
  report: CustomReport; 
  onClose: () => void;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { data: passivoData, isLoading } = useQuery<PassivoData>({
    queryKey: ["/api/passivo"],
  });

  const widgets = (report.widgets as unknown as ReportWidget[]) || [];

  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    
    toast({ title: "Gerando PDF..." });
    
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${report.name}.pdf`);
      
      toast({ title: "PDF exportado com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold">{report.name}</h2>
          {report.description && (
            <p className="text-sm text-muted-foreground">{report.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf} data-testid="button-export-viewer-pdf">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div ref={previewRef} className="min-h-full bg-background p-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {widgets.map((w) => (
                <Skeleton key={w.id} className="h-48" />
              ))}
            </div>
          ) : passivoData ? (
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {widgets.filter(w => w.type.startsWith("kpi-")).map((widget) => (
                  <WidgetRenderer key={widget.id} widget={widget} data={passivoData} />
                ))}
              </div>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {widgets.filter(w => w.type.startsWith("table-") || w.type.startsWith("chart-")).map((widget) => (
                  <WidgetRenderer key={widget.id} widget={widget} data={passivoData} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function Reports() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedReport, setSelectedReport] = useState<CustomReport | undefined>();

  const { data: reports, isLoading } = useQuery<CustomReport[]>({
    queryKey: ["/api/reports"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Relatório excluído com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir relatório", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    setSelectedReport(undefined);
    setMode("create");
  };

  const handleEdit = (report: CustomReport) => {
    setSelectedReport(report);
    setMode("edit");
  };

  const handleView = (report: CustomReport) => {
    setSelectedReport(report);
    setMode("view");
  };

  const handleDelete = (report: CustomReport) => {
    if (confirm(`Deseja excluir o relatório "${report.name}"?`)) {
      deleteMutation.mutate(report.id);
    }
  };

  const handleClose = () => {
    setSelectedReport(undefined);
    setMode("list");
  };

  if (mode === "create" || mode === "edit") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b border-border bg-card/50">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-lg font-semibold">
            {mode === "create" ? "Novo Relatório" : "Editar Relatório"}
          </h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ReportBuilder report={selectedReport} onClose={handleClose} />
        </div>
      </div>
    );
  }

  if (mode === "view" && selectedReport) {
    return (
      <div className="h-full">
        <ReportViewer report={selectedReport} onClose={handleClose} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Personalizados</h1>
          <p className="text-muted-foreground">
            Crie e gerencie seus relatórios personalizados
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-report">
          <Plus className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !reports || reports.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhum relatório criado</h3>
            <p className="text-sm mb-4">
              Comece criando seu primeiro relatório personalizado
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Relatório
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={() => handleView(report)}
              onEdit={() => handleEdit(report)}
              onDelete={() => handleDelete(report)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
