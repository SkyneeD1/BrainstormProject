import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, FileDown } from "lucide-react";
import {
  Building2,
  Users,
  Gavel,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  FileText,
  Award,
  Scale,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { exportPageAsHTML, exportMapaDecisoesInteractiveHTML, type MapaDecisoesExportData } from "@/lib/dom-export";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import type { DecisaoRpac } from "@shared/schema";
import { BrazilMap } from "@/components/brazil-map";
import { MapPin } from "lucide-react";

interface EstadoData {
  uf: string;
  estado: string;
  trtCodigo: string;
  trtNome: string;
  regiao: string;
  totalDecisoes: number;
  favoraveis: number;
  desfavoraveis: number;
  percentualFavoravel: number;
  totalComarcas: number;
  totalRelatores: number;
}

// Label configuration for different instances
function getLabels(instancia: "primeira" | "segunda") {
  if (instancia === "primeira") {
    return {
      pageTitle: "1ª Instância",
      level1: "Comarca",
      level1Plural: "Comarcas",
      level2: "Vara",
      level2Plural: "Varas",
      level3: "Juiz",
      level3Plural: "Juízes",
      level3Short: "juízes",
      description: "Análise de favorabilidade por Comarca, Vara e Juiz",
      navButton: "Navegação por Comarca",
      totalLevel1: "Total Comarcas",
      totalLevel2: "Total Varas",
      totalLevel3: "Total Juízes",
      top5Level2: "Top 5 Varas - Favorabilidade",
      top5Level3: "Top 5 Juízes - Favorabilidade",
      treeTitle: "Árvore Comarcas/Varas",
      listTitle: "Lista de Juízes",
    };
  }
  return {
    pageTitle: "2ª Instância",
    level1: "TRT",
    level1Plural: "TRTs",
    level2: "Turma",
    level2Plural: "Turmas",
    level3: "Desembargador",
    level3Plural: "Desembargadores",
    level3Short: "des.",
    description: "Análise de favorabilidade por TRT, Turma e Desembargador",
    navButton: "Navegação por TRT",
    totalLevel1: "Total TRTs",
    totalLevel2: "Total Turmas",
    totalLevel3: "Total Desembargadores",
    top5Level2: "Top 5 Turmas - Favorabilidade",
    top5Level3: "Top 5 Desembargadores - Favorabilidade",
    treeTitle: "Árvore TRT/Turmas",
    listTitle: "Lista de Desembargadores",
  };
}

function FavorabilityAvatar({ percentual, size = 40 }: { percentual: number; size?: number }) {
  const greenAngle = (percentual / 100) * 360;
  return (
    <div 
      className="relative rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#ef4444" />
        {percentual > 0 && (
          <path
            d={`M50,50 L50,0 A50,50 0 ${greenAngle > 180 ? 1 : 0},1 ${50 + 50 * Math.sin((greenAngle * Math.PI) / 180)},${50 - 50 * Math.cos((greenAngle * Math.PI) / 180)} Z`}
            fill="#10b981"
          />
        )}
        <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-slate-800" />
        <text x="50" y="56" textAnchor="middle" fontSize="18" fontWeight="bold" className="fill-slate-700 dark:fill-slate-200">
          {percentual}
        </text>
      </svg>
    </div>
  );
}

interface TRTData {
  nome: string;
  totalTurmas: number;
  totalDesembargadores: number;
  totalDecisoes: number;
  favoraveis: number;
  desfavoraveis: number;
  emAnalise: number;
  percentualFavoravel: number;
}

interface TurmaData {
  id: string;
  nome: string;
  totalDesembargadores: number;
  totalDecisoes: number;
  favoraveis: number;
  desfavoraveis: number;
  percentualFavoravel: number;
}

interface DesembargadorData {
  id: string;
  nome: string;
  voto: string;
  decisoes: DecisaoRpac[];
  favoraveis: number;
  desfavoraveis: number;
  percentualFavoravel: number;
}

interface TopTurma {
  id: string;
  nome: string;
  trt: string;
  totalDecisoes: number;
  favoraveis: number;
  percentualFavoravel: number;
}

interface Estatisticas {
  totalTRTs: number;
  totalTurmas: number;
  totalDesembargadores: number;
  totalDecisoes: number;
  favoraveis: number;
  desfavoraveis: number;
  emAnalise: number;
  percentualFavoravel: number;
  percentualDesfavoravel: number;
  upiSim: number;
  upiNao: number;
  solidarias: number;
  subsidiarias: number;
}

interface TimelineData {
  mes: string;
  ano: number;
  totalDecisoes: number;
  favoraveis: number;
  desfavoraveis: number;
  percentualFavoravel: number;
  percentualDesfavoravel: number;
}

const COLORS = {
  favoravel: "#10b981",
  desfavoravel: "#ef4444",
  emAnalise: "#6b7280",
  suspeito: "#f59e0b",
};

function KPICard({ title, value, subtitle, icon: Icon, trend }: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${
          trend === "up" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
          trend === "down" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
          "bg-muted text-muted-foreground"
        }`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

type Labels = ReturnType<typeof getLabels>;

function TRTGrid({ trts, onSelect, labels }: { trts: TRTData[]; onSelect: (trt: string) => void; labels: Labels }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {trts.map((trt) => (
        <Card
          key={trt.nome}
          className="p-4 cursor-pointer hover-elevate transition-all relative"
          onClick={() => onSelect(trt.nome)}
          data-testid={`card-trt-${trt.nome}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm truncate">{trt.nome}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{trt.totalTurmas} {labels.level2Plural.toLowerCase()}</span>
              <span className="text-muted-foreground">{trt.totalDesembargadores} {labels.level3Short}</span>
            </div>
            <Progress 
              value={trt.percentualFavoravel} 
              className="h-2 bg-red-500"
              indicatorClassName="bg-emerald-500"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {trt.percentualFavoravel}% fav
              </span>
              <span className="text-muted-foreground">{trt.totalDecisoes} dec.</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground absolute top-4 right-3" />
        </Card>
      ))}
    </div>
  );
}

function TurmasList({ turmas, trtNome, onSelect, onBack, labels }: { 
  turmas: TurmaData[]; 
  trtNome: string;
  onSelect: (turmaId: string, turmaNome: string) => void;
  onBack: () => void;
  labels: Labels;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-trts">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {trtNome}
          </h2>
          <p className="text-sm text-muted-foreground">{turmas.length} {labels.level2Plural.toLowerCase()} disponíveis</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmas.map((turma) => (
          <Card
            key={turma.id}
            className="p-4 cursor-pointer hover-elevate transition-all"
            onClick={() => onSelect(turma.id, turma.nome)}
            data-testid={`card-turma-${turma.id}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">{turma.nome}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold">{turma.totalDesembargadores}</p>
                <p className="text-xs text-muted-foreground">{labels.level3Plural}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{turma.favoraveis}</p>
                <p className="text-xs text-muted-foreground">Favoráveis</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{turma.desfavoraveis}</p>
                <p className="text-xs text-muted-foreground">Desfavoráveis</p>
              </div>
            </div>
            <Progress value={turma.percentualFavoravel} className="h-2 mt-3 bg-red-500" indicatorClassName="bg-emerald-500" />
            <p className="text-xs text-center mt-2 text-muted-foreground">
              {turma.percentualFavoravel}% favorabilidade ({turma.totalDecisoes} decisões)
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DesembargadorView({ desembargadores, turmaNome, trtNome, onBack, labels, responsabilidadeFilter = "todas" }: {
  desembargadores: DesembargadorData[];
  turmaNome: string;
  trtNome: string;
  onBack: () => void;
  labels: Labels;
  responsabilidadeFilter?: string;
}) {
  const [selectedDesembargador, setSelectedDesembargador] = useState<DesembargadorData | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>("todas");

  const filteredDecisoes = selectedDesembargador?.decisoes.filter(d => {
    // Filter by empresa
    if (empresaFilter !== "todas" && d.empresa !== empresaFilter) return false;
    // Filter by responsabilidade
    if (responsabilidadeFilter !== "todas" && d.responsabilidade !== responsabilidadeFilter) return false;
    return true;
  }) || [];

  const getVotoColor = (voto: string) => {
    const v = voto?.toUpperCase() || "";
    if (v.includes("FAVORÁVEL") && !v.includes("DESFAVORÁVEL")) return "bg-emerald-500";
    if (v.includes("DESFAVORÁVEL")) return "bg-red-500";
    if (v === "SUSPEITO") return "bg-orange-500";
    return "bg-slate-400";
  };

  const getResultadoStyle = (resultado: string) => {
    const r = resultado?.toUpperCase() || "";
    if (r.includes("FAVORÁVEL") && !r.includes("DESFAVORÁVEL")) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    }
    if (r.includes("DESFAVORÁVEL")) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-turmas">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{trtNome}</span>
            <ChevronRight className="h-4 w-4" />
            <span>{turmaNome}</span>
          </div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            {labels.level3Plural}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">{labels.listTitle}</h3>
          {desembargadores.map((d) => (
            <Card
              key={d.id}
              className={`p-4 cursor-pointer transition-all ${selectedDesembargador?.id === d.id ? "ring-2 ring-primary" : "hover-elevate"}`}
              onClick={() => setSelectedDesembargador(d)}
              data-testid={`card-desembargador-${d.id}`}
            >
              <div className="flex items-center gap-3">
                <FavorabilityAvatar percentual={d.percentualFavoravel} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{d.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      {d.favoraveis} fav
                    </span>
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {d.desfavoraveis} desf
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({d.decisoes.length} total)
                    </span>
                  </div>
                </div>
                <Badge variant={d.percentualFavoravel >= 50 ? "default" : "secondary"}>
                  {d.percentualFavoravel}%
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Decisões</h3>
            {selectedDesembargador && (
              <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                <SelectTrigger className="h-8 text-xs w-32" data-testid="select-empresa-filter">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="V.tal">V.tal</SelectItem>
                  <SelectItem value="NIO">NIO</SelectItem>
                  <SelectItem value="OI">OI</SelectItem>
                  <SelectItem value="Serede">Serede</SelectItem>
                  <SelectItem value="Sprink">Sprink</SelectItem>
                  <SelectItem value="Outros Terceiros">Outros</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          {selectedDesembargador ? (
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <FavorabilityAvatar percentual={selectedDesembargador.percentualFavoravel} size={48} />
                <div>
                  <p className="font-bold">{selectedDesembargador.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDesembargador.favoraveis} favoráveis | {selectedDesembargador.desfavoraveis} desfavoráveis | {selectedDesembargador.percentualFavoravel}% favorabilidade
                  </p>
                </div>
              </div>
              
              {filteredDecisoes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {(empresaFilter !== "todas" || responsabilidadeFilter !== "todas") 
                    ? "Nenhuma decisão encontrada com os filtros selecionados" 
                    : "Nenhuma decisão registrada"}
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredDecisoes.map((decisao) => (
                    <div key={decisao.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm truncate">{decisao.numeroProcesso}</p>
                          {decisao.dataDecisao && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(decisao.dataDecisao).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                        <Badge className={getResultadoStyle(decisao.resultado)}>
                          {decisao.resultado}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-7">
                        {decisao.upi && (
                          <Badge variant="outline" className="text-xs">
                            UPI: {decisao.upi === "sim" ? "Sim" : "Não"}
                          </Badge>
                        )}
                        {decisao.responsabilidade && (
                          <Badge variant="outline" className="text-xs">
                            Resp: {decisao.responsabilidade === "solidaria" ? "Solidária" : "Subsidiária"}
                          </Badge>
                        )}
                        {decisao.empresa && (
                          <Badge variant="secondary" className="text-xs">
                            {decisao.empresa}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <Gavel className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Selecione um desembargador para ver suas decisões
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel({ labels, instancia }: { labels: Labels; instancia: "primeira" | "segunda" }) {
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [responsabilidadeFilter, setResponsabilidadeFilter] = useState<string>("todas");

  const buildUrl = (base: string) => {
    const params = new URLSearchParams();
    params.append("instancia", instancia);
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);
    if (responsabilidadeFilter && responsabilidadeFilter !== "todas") {
      params.append("responsabilidade", responsabilidadeFilter);
    }
    const queryString = params.toString();
    return queryString ? `${base}?${queryString}` : base;
  };

  const fetchWithCredentials = async (url: string) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text}`);
    }
    return res.json();
  };

  const { data: estatisticas, isLoading: loadingEstat } = useQuery<Estatisticas>({
    queryKey: ["/api/mapa-decisoes/analytics/estatisticas", instancia, dataInicio, dataFim, responsabilidadeFilter],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/estatisticas")),
  });

  const { data: topTurmas, isLoading: loadingTop } = useQuery<TopTurma[]>({
    queryKey: ["/api/mapa-decisoes/analytics/top-turmas", instancia, dataInicio, dataFim, responsabilidadeFilter],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/top-turmas")),
  });

  const { data: topRegioes, isLoading: loadingRegioes } = useQuery<Array<{
    nome: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>>({
    queryKey: ["/api/mapa-decisoes/analytics/top-regioes", instancia, dataInicio, dataFim, responsabilidadeFilter],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/top-regioes")),
  });

  const { data: topDesembargadores, isLoading: loadingDesemb } = useQuery<Array<{
    id: string;
    nome: string;
    turma: string;
    trt: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>>({
    queryKey: ["/api/mapa-decisoes/analytics/top-desembargadores", instancia, dataInicio, dataFim, responsabilidadeFilter],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/top-desembargadores")),
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery<TimelineData[]>({
    queryKey: ["/api/mapa-decisoes/analytics/timeline", instancia, dataInicio, dataFim, responsabilidadeFilter],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/timeline")),
  });

  const { data: empresaStats, isLoading: loadingEmpresa } = useQuery<Array<{
    empresa: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    emAnalise: number;
    percentualFavoravel: number;
    percentualDesfavoravel: number;
  }>>({
    queryKey: ["/api/mapa-decisoes/analytics/por-empresa", instancia, dataInicio, dataFim, responsabilidadeFilter],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/por-empresa")),
  });

  if (loadingEstat || loadingTop || loadingTimeline || loadingRegioes || loadingDesemb || loadingEmpresa) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const pieData = estatisticas ? [
    { name: `Favoráveis (${estatisticas.favoraveis})`, value: estatisticas.favoraveis, color: COLORS.favoravel },
    { name: `Desfavoráveis (${estatisticas.desfavoraveis})`, value: estatisticas.desfavoraveis, color: COLORS.desfavoravel },
  ] : [];

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Filtros de Análise
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">De:</label>
              <Input
                type="date"
                className="w-36 h-8"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                data-testid="input-periodo-inicio"
              />
              <label className="text-sm text-muted-foreground">Até:</label>
              <Input
                type="date"
                className="w-36 h-8"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                data-testid="input-periodo-fim"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm text-muted-foreground">Responsabilidade:</label>
              <Select value={responsabilidadeFilter} onValueChange={setResponsabilidadeFilter}>
                <SelectTrigger className="w-36 h-8" data-testid="select-analytics-responsabilidade">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="solidaria">Solidária</SelectItem>
                  <SelectItem value="subsidiaria">Subsidiária</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {responsabilidadeFilter !== "todas" && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              Filtrando: {responsabilidadeFilter === "solidaria" ? "Solidária" : "Subsidiária"}
            </Badge>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard 
          title={labels.totalLevel1} 
          value={estatisticas?.totalTRTs || 0} 
          icon={Building2} 
        />
        <KPICard 
          title={labels.totalLevel2} 
          value={estatisticas?.totalTurmas || 0} 
          icon={Users} 
        />
        <KPICard 
          title={labels.totalLevel3} 
          value={estatisticas?.totalDesembargadores || 0} 
          icon={Gavel} 
        />
        <KPICard 
          title="Favorabilidade" 
          value={`${estatisticas?.percentualFavoravel || 0}%`} 
          subtitle={`${estatisticas?.favoraveis || 0} decisões`}
          icon={TrendingUp} 
          trend="up"
        />
        <KPICard 
          title="Desfavorabilidade" 
          value={`${estatisticas?.percentualDesfavoravel || 0}%`} 
          subtitle={`${estatisticas?.desfavoraveis || 0} decisões`}
          icon={TrendingDown} 
          trend="down"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-primary" />
            {labels.top5Level2}
          </h3>
          {topTurmas && topTurmas.length > 0 ? (
            <div className="space-y-3">
              {topTurmas.map((turma, index) => (
                <div key={turma.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-yellow-500 text-white" :
                    index === 1 ? "bg-slate-400 text-white" :
                    index === 2 ? "bg-amber-600 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{turma.nome}</p>
                    <p className="text-xs text-muted-foreground">{turma.trt}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {turma.percentualFavoravel}%
                    </p>
                    <p className="text-xs text-muted-foreground">{turma.totalDecisoes} dec.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma turma com decisões registradas
            </p>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-primary" />
            Distribuição de Resultados
          </h3>
          {pieData.some(d => d.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} decisões`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.favoravel }} />
                  <span className="text-sm">Favoráveis: <strong>{estatisticas?.favoraveis || 0}</strong> ({estatisticas?.percentualFavoravel || 0}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.desfavoravel }} />
                  <span className="text-sm">Desfavoráveis: <strong>{estatisticas?.desfavoraveis || 0}</strong> ({estatisticas?.percentualDesfavoravel || 0}%)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhuma decisão registrada
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            Teses UPI
          </h3>
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {estatisticas?.upiSim || 0}
              </p>
              <p className="text-sm text-muted-foreground">Com UPI</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-500">
                {estatisticas?.upiNao || 0}
              </p>
              <p className="text-sm text-muted-foreground">Sem UPI</p>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {estatisticas?.totalDecisoes ? Math.round((estatisticas.upiSim / estatisticas.totalDecisoes) * 100) : 0}% das decisões possuem tese UPI
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-primary" />
            Responsabilidade Solidária
          </h3>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                {estatisticas?.solidarias || 0}
              </p>
              <p className="text-sm text-muted-foreground">Casos</p>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {estatisticas?.totalDecisoes ? Math.round((estatisticas.solidarias / estatisticas.totalDecisoes) * 100) : 0}% do total de decisões
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-primary" />
            Responsabilidade Subsidiária
          </h3>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {estatisticas?.subsidiarias || 0}
              </p>
              <p className="text-sm text-muted-foreground">Casos</p>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {estatisticas?.totalDecisoes ? Math.round((estatisticas.subsidiarias / estatisticas.totalDecisoes) * 100) : 0}% do total de decisões
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            Top 5 Regiões - Favorabilidade
          </h3>
          {topRegioes && topRegioes.length > 0 ? (
            <div className="space-y-3">
              {topRegioes.map((regiao, index) => (
                <div key={regiao.nome} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-yellow-500 text-white" :
                    index === 1 ? "bg-slate-400 text-white" :
                    index === 2 ? "bg-amber-600 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{regiao.nome}</p>
                    <p className="text-xs text-muted-foreground">{regiao.totalDecisoes} decisões</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {regiao.percentualFavoravel}%
                    </p>
                    <p className="text-xs text-muted-foreground">{regiao.favoraveis} fav.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma região com decisões registradas
            </p>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Gavel className="h-5 w-5 text-primary" />
            {labels.top5Level3}
          </h3>
          {topDesembargadores && topDesembargadores.length > 0 ? (
            <div className="space-y-3">
              {topDesembargadores.map((desemb, index) => (
                <div key={desemb.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-yellow-500 text-white" :
                    index === 1 ? "bg-slate-400 text-white" :
                    index === 2 ? "bg-amber-600 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{desemb.nome}</p>
                    <p className="text-xs text-muted-foreground">{desemb.turma} - {desemb.trt}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {desemb.percentualFavoravel}%
                    </p>
                    <p className="text-xs text-muted-foreground">{desemb.totalDecisoes} dec.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum {labels.level3.toLowerCase()} com decisões registradas
            </p>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          Linha do Tempo - Decisões por Mês
        </h3>
        {timeline && timeline.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value,
                    name === "favoraveis" ? "Favoráveis" : 
                    name === "desfavoraveis" ? "Desfavoráveis" : 
                    name === "totalDecisoes" ? "Total" : name
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload as TimelineData;
                      return `${label}/${data.ano}`;
                    }
                    return `Mês: ${label}`;
                  }}
                />
                <Legend />
                <Bar dataKey="favoraveis" name="Favoráveis" fill={COLORS.favoravel} />
                <Bar dataKey="desfavoraveis" name="Desfavoráveis" fill={COLORS.desfavoravel} />
              </BarChart>
            </ResponsiveContainer>

            {timeline.length >= 2 && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Mês Anterior</p>
                  <div className="flex justify-center gap-4">
                    <div>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {timeline[timeline.length - 2]?.favoraveis || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Favoráveis</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {timeline[timeline.length - 2]?.desfavoraveis || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Desfavoráveis</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeline[timeline.length - 2]?.mes}/{timeline[timeline.length - 2]?.ano}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Mês Atual</p>
                  <div className="flex justify-center gap-4">
                    <div>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {timeline[timeline.length - 1]?.favoraveis || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Favoráveis</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {timeline[timeline.length - 1]?.desfavoraveis || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Desfavoráveis</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeline[timeline.length - 1]?.mes}/{timeline[timeline.length - 1]?.ano}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum dado de timeline disponível
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            Decisões por Empresa
          </h3>
          {empresaStats && empresaStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={empresaStats} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="empresa" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="favoraveis" name="Favoráveis" fill={COLORS.favoravel} stackId="a" />
                <Bar dataKey="desfavoraveis" name="Desfavoráveis" fill={COLORS.desfavoravel} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nenhuma decisão por empresa
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            Favorabilidade por Empresa
          </h3>
          {empresaStats && empresaStats.length > 0 ? (
            <div className="space-y-4">
              {empresaStats.map((emp) => (
                <div key={emp.empresa} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{emp.empresa}</span>
                    <span className="text-muted-foreground">{emp.totalDecisoes} decisões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={emp.percentualFavoravel} 
                      className="h-3 flex-1"
                      indicatorClassName="bg-emerald-500"
                    />
                    <span className="text-sm font-medium w-12 text-right text-emerald-600 dark:text-emerald-400">
                      {emp.percentualFavoravel}%
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400">{emp.favoraveis} fav</span>
                    <span className="text-red-600 dark:text-red-400">{emp.desfavoraveis} desf</span>
                    <span>{emp.emAnalise} análise</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nenhuma decisão por empresa
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function MapaDecisoesPage() {
  const [location] = useLocation();
  const instancia = location.includes("primeira-instancia") ? "primeira" : "segunda" as const;
  const labels = getLabels(instancia);
  const { isAdmin, tenant } = useAuth();
  
  const [selectedEstado, setSelectedEstado] = useState<{ uf: string; nome: string } | null>(null);
  const [selectedTRT, setSelectedTRT] = useState<string | null>(null);
  const [selectedTurma, setSelectedTurma] = useState<{ id: string; nome: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"mapa" | "navegacao" | "analytics">("mapa");
  const [responsabilidadeFilter, setResponsabilidadeFilter] = useState<string>("todas");
  const [empresaNavFilter, setEmpresaNavFilter] = useState<string>("todas");
  const [numeroProcessoFilter, setNumeroProcessoFilter] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset navigation state when switching between instances
  useEffect(() => {
    setSelectedEstado(null);
    setSelectedTRT(null);
    setSelectedTurma(null);
  }, [instancia]);

  // Query for estados (map view)
  const { data: estados, isLoading: loadingEstados } = useQuery<EstadoData[]>({
    queryKey: ["/api/mapa-decisoes/estados", instancia],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("instancia", instancia);
      const res = await fetch(`/api/mapa-decisoes/estados?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch estados');
      return res.json();
    },
  });

  const { data: trts, isLoading: loadingTRTs } = useQuery<TRTData[]>({
    queryKey: ["/api/mapa-decisoes/trts", instancia, responsabilidadeFilter, empresaNavFilter, numeroProcessoFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("instancia", instancia);
      if (responsabilidadeFilter !== "todas") params.append("responsabilidade", responsabilidadeFilter);
      if (empresaNavFilter !== "todas") params.append("empresa", empresaNavFilter);
      if (numeroProcessoFilter.trim()) params.append("numeroProcesso", numeroProcessoFilter.trim());
      const queryString = `?${params.toString()}`;
      const res = await fetch(`/api/mapa-decisoes/trts${queryString}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch TRTs');
      return res.json();
    },
  });

  const { data: turmas, isLoading: loadingTurmas } = useQuery<TurmaData[]>({
    queryKey: ["/api/mapa-decisoes/turmas", selectedTRT, instancia, responsabilidadeFilter, empresaNavFilter, numeroProcessoFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("instancia", instancia);
      if (responsabilidadeFilter !== "todas") params.append("responsabilidade", responsabilidadeFilter);
      if (empresaNavFilter !== "todas") params.append("empresa", empresaNavFilter);
      if (numeroProcessoFilter.trim()) params.append("numeroProcesso", numeroProcessoFilter.trim());
      const queryString = `?${params.toString()}`;
      const res = await fetch(`/api/mapa-decisoes/turmas/${encodeURIComponent(selectedTRT!)}${queryString}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch turmas');
      return res.json();
    },
    enabled: !!selectedTRT,
  });

  const { data: desembargadores, isLoading: loadingDesembargadores } = useQuery<DesembargadorData[]>({
    queryKey: ["/api/mapa-decisoes/desembargadores", selectedTurma?.id],
    enabled: !!selectedTurma,
  });

  const handleSelectTRT = (trt: string) => {
    setSelectedTRT(trt);
    setSelectedTurma(null);
  };

  const handleSelectTurma = (turmaId: string, turmaNome: string) => {
    setSelectedTurma({ id: turmaId, nome: turmaNome });
  };

  const handleBackToTRTs = () => {
    setSelectedTRT(null);
    setSelectedTurma(null);
  };

  const handleBackToTurmas = () => {
    setSelectedTurma(null);
  };

  const handleExportHTML = async () => {
    if (!trts || !tenant) return;
    setIsExporting(true);
    
    try {
      const tenantName = tenant.name || tenant.code;
      const tenantColor = tenant.primaryColor || "#ffd700";
      
      // Fetch all data for export
      const params = new URLSearchParams();
      params.append("instancia", instancia);
      
      const exportDataRes = await fetch(`/api/mapa-decisoes/export-hierarchy?${params.toString()}`, { credentials: 'include' });
      if (!exportDataRes.ok) throw new Error('Failed to fetch export data');
      const exportData = await exportDataRes.json();
      
      const mapaData: MapaDecisoesExportData = {
        trts: exportData.trts,
        labels: {
          pageTitle: labels.pageTitle,
          level1: labels.level1,
          level1Plural: labels.level1Plural,
          level2: labels.level2,
          level3: labels.level3,
        },
        instancia,
      };
      
      await exportMapaDecisoesInteractiveHTML(mapaData, {
        title: `Mapa de Decisões - ${labels.pageTitle}`,
        tenant: tenantName,
        tenantColor
      });
    } catch (error) {
      console.error("Error exporting:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto" ref={contentRef}>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Gavel className="h-7 w-7 text-primary" />
            {labels.pageTitle}
          </h1>
          <p className="text-muted-foreground mt-1">
            {labels.description}
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            onClick={handleExportHTML}
            disabled={isExporting || loadingTRTs || !trts}
            data-testid="button-export-html"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar HTML"}
          </Button>
        )}
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "mapa" | "navegacao" | "analytics")} className="space-y-6">
        <TabsList>
          <TabsTrigger value="mapa" className="flex items-center gap-2" data-testid="tab-mapa">
            <MapPin className="h-4 w-4" />
            Mapa de Estados
          </TabsTrigger>
          <TabsTrigger value="navegacao" className="flex items-center gap-2" data-testid="tab-navegacao">
            <Building2 className="h-4 w-4" />
            {labels.navButton}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4" />
            Análises e Gráficos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" style={{ color: tenant?.primaryColor || "#ffd700" }} />
              Decisões por Estado
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Clique em um estado para ver os detalhes das decisões. Os estados são identificados automaticamente pelo número do processo.
            </p>
            {loadingEstados ? (
              <div className="flex items-center justify-center h-[400px]">
                <Skeleton className="h-[400px] w-full max-w-[800px]" />
              </div>
            ) : estados && estados.length > 0 ? (
              <BrazilMap
                estados={estados}
                onSelectEstado={(uf, estado) => {
                  setSelectedEstado({ uf, nome: estado });
                  setActiveTab("navegacao");
                }}
                selectedUF={selectedEstado?.uf}
                tenantColor={tenant?.primaryColor || "#ffd700"}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <MapPin className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma decisão encontrada.</p>
                <p className="text-sm">Importe decisões para visualizar o mapa.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="navegacao" className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Responsabilidade:</span>
              <Select value={responsabilidadeFilter} onValueChange={setResponsabilidadeFilter}>
                <SelectTrigger className="w-36" data-testid="select-responsabilidade-filter">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="solidaria">Solidária</SelectItem>
                  <SelectItem value="subsidiaria">Subsidiária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Empresa:</span>
              <Select value={empresaNavFilter} onValueChange={setEmpresaNavFilter}>
                <SelectTrigger className="w-36" data-testid="select-empresa-filter">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="V.tal">V.tal</SelectItem>
                  <SelectItem value="NIO">NIO</SelectItem>
                  <SelectItem value="OI">OI</SelectItem>
                  <SelectItem value="Serede">Serede</SelectItem>
                  <SelectItem value="Sprink">Sprink</SelectItem>
                  <SelectItem value="Outros Terceiros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Nº Processo:</span>
              <Input
                type="text"
                placeholder="Buscar por número..."
                value={numeroProcessoFilter}
                onChange={(e) => setNumeroProcessoFilter(e.target.value)}
                className="w-44"
                data-testid="input-numero-processo-filter"
              />
            </div>
            <div className="flex items-center gap-2">
              {responsabilidadeFilter !== "todas" && (
                <Badge variant="secondary" className="text-xs">
                  {responsabilidadeFilter === "solidaria" ? "Solidária" : "Subsidiária"}
                </Badge>
              )}
              {empresaNavFilter !== "todas" && (
                <Badge variant="secondary" className="text-xs">
                  {empresaNavFilter}
                </Badge>
              )}
              {numeroProcessoFilter.trim() && (
                <Badge variant="secondary" className="text-xs">
                  Processo: {numeroProcessoFilter.trim()}
                </Badge>
              )}
            </div>
          </div>

          {loadingTRTs ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : selectedTurma && desembargadores ? (
            <DesembargadorView
              desembargadores={desembargadores}
              turmaNome={selectedTurma.nome}
              trtNome={selectedTRT || ""}
              onBack={handleBackToTurmas}
              labels={labels}
              responsabilidadeFilter={responsabilidadeFilter}
            />
          ) : selectedTRT && turmas ? (
            loadingTurmas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : (
              <TurmasList
                turmas={turmas}
                trtNome={selectedTRT}
                onSelect={handleSelectTurma}
                onBack={handleBackToTRTs}
                labels={labels}
              />
            )
          ) : trts ? (
            <TRTGrid trts={trts} onSelect={handleSelectTRT} labels={labels} />
          ) : null}
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsPanel labels={labels} instancia={instancia} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
