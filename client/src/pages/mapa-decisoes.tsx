import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
}

interface TimelineData {
  mes: string;
  ano: number;
  totalDecisoes: number;
  favoraveis: number;
  desfavoraveis: number;
  percentualFavoravel: number;
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

function TRTGrid({ trts, onSelect }: { trts: TRTData[]; onSelect: (trt: string) => void }) {
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
              <span className="text-muted-foreground">{trt.totalTurmas} turmas</span>
              <span className="text-muted-foreground">{trt.totalDesembargadores} des.</span>
            </div>
            <Progress 
              value={trt.percentualFavoravel} 
              className="h-2"
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

function TurmasList({ turmas, trtNome, onSelect, onBack }: { 
  turmas: TurmaData[]; 
  trtNome: string;
  onSelect: (turmaId: string, turmaNome: string) => void;
  onBack: () => void;
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
          <p className="text-sm text-muted-foreground">{turmas.length} turmas disponíveis</p>
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
                <p className="text-xs text-muted-foreground">Desemb.</p>
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
            <Progress value={turma.percentualFavoravel} className="h-2 mt-3" />
            <p className="text-xs text-center mt-2 text-muted-foreground">
              {turma.percentualFavoravel}% favorabilidade ({turma.totalDecisoes} decisões)
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DesembargadorView({ desembargadores, turmaNome, trtNome, onBack }: {
  desembargadores: DesembargadorData[];
  turmaNome: string;
  trtNome: string;
  onBack: () => void;
}) {
  const [selectedDesembargador, setSelectedDesembargador] = useState<DesembargadorData | null>(null);

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
            Desembargadores
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Lista de Desembargadores</h3>
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
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Decisões</h3>
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
              
              {selectedDesembargador.decisoes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma decisão registrada
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedDesembargador.decisoes.map((decisao) => (
                    <div key={decisao.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
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

function AnalyticsPanel() {
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const buildUrl = (base: string) => {
    if (dataInicio && dataFim) {
      return `${base}?dataInicio=${dataInicio}&dataFim=${dataFim}`;
    }
    return base;
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
    queryKey: ["/api/mapa-decisoes/analytics/estatisticas", { dataInicio, dataFim }],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/estatisticas")),
  });

  const { data: topTurmas, isLoading: loadingTop } = useQuery<TopTurma[]>({
    queryKey: ["/api/mapa-decisoes/analytics/top-turmas", { dataInicio, dataFim }],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/top-turmas")),
  });

  const { data: topRegioes, isLoading: loadingRegioes } = useQuery<Array<{
    nome: string;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
  }>>({
    queryKey: ["/api/mapa-decisoes/analytics/top-regioes", { dataInicio, dataFim }],
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
    queryKey: ["/api/mapa-decisoes/analytics/top-desembargadores", { dataInicio, dataFim }],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/top-desembargadores")),
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery<TimelineData[]>({
    queryKey: ["/api/mapa-decisoes/analytics/timeline", { dataInicio, dataFim }],
    queryFn: () => fetchWithCredentials(buildUrl("/api/mapa-decisoes/analytics/timeline")),
  });

  if (loadingEstat || loadingTop || loadingTimeline || loadingRegioes || loadingDesemb) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const pieData = estatisticas ? [
    { name: "Favoráveis", value: estatisticas.favoraveis, color: COLORS.favoravel },
    { name: "Desfavoráveis", value: estatisticas.desfavoraveis, color: COLORS.desfavoravel },
    { name: "Em Análise", value: estatisticas.emAnalise, color: COLORS.emAnalise },
  ] : [];

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Período de Análise
          </h3>
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
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard 
          title="Total TRTs" 
          value={estatisticas?.totalTRTs || 0} 
          icon={Building2} 
        />
        <KPICard 
          title="Total Turmas" 
          value={estatisticas?.totalTurmas || 0} 
          icon={Users} 
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
            Top 5 Turmas - Favorabilidade
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhuma decisão registrada
            </div>
          )}
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
            Top 5 Desembargadores - Favorabilidade
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
              Nenhum desembargador com decisões registradas
            </p>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          Linha do Tempo - Favorabilidade por Mês
        </h3>
        {timeline && timeline.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === "percentualFavoravel" ? "Favorabilidade" : name
                  ]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="percentualFavoravel" 
                  name="Favorabilidade %" 
                  stroke={COLORS.favoravel} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.favoravel }}
                />
              </LineChart>
            </ResponsiveContainer>

            {timeline.length >= 2 && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Mês Anterior</p>
                  <p className="text-2xl font-bold">
                    {timeline[timeline.length - 2]?.percentualFavoravel || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeline[timeline.length - 2]?.mes}/{timeline[timeline.length - 2]?.ano}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Mês Atual</p>
                  <p className="text-2xl font-bold">
                    {timeline[timeline.length - 1]?.percentualFavoravel || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
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
    </div>
  );
}

export default function MapaDecisoesPage() {
  const [selectedTRT, setSelectedTRT] = useState<string | null>(null);
  const [selectedTurma, setSelectedTurma] = useState<{ id: string; nome: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"navegacao" | "analytics">("navegacao");

  const { data: trts, isLoading: loadingTRTs } = useQuery<TRTData[]>({
    queryKey: ["/api/mapa-decisoes/trts"],
  });

  const { data: turmas, isLoading: loadingTurmas } = useQuery<TurmaData[]>({
    queryKey: ["/api/mapa-decisoes/turmas", selectedTRT],
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

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Gavel className="h-7 w-7 text-primary" />
          Mapa de Decisões
        </h1>
        <p className="text-muted-foreground mt-1">
          Análise de favorabilidade por TRT, Turma e Desembargador
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "navegacao" | "analytics")} className="space-y-6">
        <TabsList>
          <TabsTrigger value="navegacao" className="flex items-center gap-2" data-testid="tab-navegacao">
            <Building2 className="h-4 w-4" />
            Navegação por TRT
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4" />
            Análises e Gráficos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="navegacao" className="space-y-6">
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
              />
            )
          ) : trts ? (
            <TRTGrid trts={trts} onSelect={handleSelectTRT} />
          ) : null}
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
