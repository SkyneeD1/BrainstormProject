import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowUpDown, TrendingUp, TrendingDown, Calendar as CalendarIcon, Building2, Briefcase, DollarSign, FileText, Filter, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CasosNovosStats {
  total: number;
  mesAtual: number;
  mesAnterior: number;
  variacaoPercentual: number;
  porTribunal: Array<{ tribunal: string; quantidade: number; percentual: number }>;
  porEmpresa: Array<{ empresa: string; quantidade: number; percentual: number }>;
  porMes: Array<{ mes: string; ano: string; quantidade: number }>;
  valorTotalContingencia: number;
}

const COLORS = {
  vtal: "#f59e0b",
  oi: "#3b82f6",
  serede: "#10b981",
  outros: "#6b7280",
  default: "#8b5cf6",
};

const EMPRESA_COLORS: Record<string, string> = {
  "V.TAL": COLORS.vtal,
  "VTAL": COLORS.vtal,
  "OI": COLORS.oi,
  "SEREDE": COLORS.serede,
  "OUTROS": COLORS.outros,
  "SPRINK": "#ec4899",
};

function getEmpresaColor(empresa: string): string {
  const upper = empresa.toUpperCase();
  return EMPRESA_COLORS[upper] || COLORS.default;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function getMonthName(mes: string): string {
  const months: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  };
  return months[mes] || mes;
}

export default function EntradasDashboard() {
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio.toISOString());
    if (dataFim) params.append('dataFim', dataFim.toISOString());
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const { data: stats, isLoading } = useQuery<CasosNovosStats>({
    queryKey: ['/api/casos-novos/stats', dataInicio?.toISOString(), dataFim?.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/casos-novos/stats${buildQueryString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const handleClearFilter = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    setDataInicio(startOfMonth(now));
    setDataFim(endOfMonth(now));
    setIsFilterOpen(false);
  };

  const handlePresetLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1);
    setDataInicio(startOfMonth(lastMonth));
    setDataFim(endOfMonth(lastMonth));
    setIsFilterOpen(false);
  };

  const handlePresetLast3Months = () => {
    const now = new Date();
    setDataInicio(startOfMonth(subMonths(now, 2)));
    setDataFim(endOfMonth(now));
    setIsFilterOpen(false);
  };

  const hasFilter = dataInicio || dataFim;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const timelineData = stats?.porMes.map(item => ({
    ...item,
    mesLabel: `${getMonthName(item.mes)}/${item.ano.slice(2)}`,
  })) || [];

  const empresaData = stats?.porEmpresa.map(item => ({
    name: item.empresa,
    value: item.quantidade,
    percentual: item.percentual,
    color: getEmpresaColor(item.empresa),
  })) || [];

  const tribunalData = stats?.porTribunal.slice(0, 10).map(item => ({
    tribunal: `TRT ${item.tribunal}`,
    quantidade: item.quantidade,
    percentual: item.percentual,
  })) || [];

  const isPositiveVariation = (stats?.variacaoPercentual || 0) >= 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ArrowUpDown className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Entradas</h1>
            <p className="text-muted-foreground">Monitoramento de novos casos distribuídos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasFilter && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-md text-sm">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span>
                {dataInicio ? format(dataInicio, 'dd/MM/yy', { locale: ptBR }) : '...'} 
                {' - '}
                {dataFim ? format(dataFim, 'dd/MM/yy', { locale: ptBR }) : '...'}
              </span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleClearFilter}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-filter-entradas">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar Período
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePresetThisMonth}>
                    Mês Atual
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePresetLastMonth}>
                    Mês Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePresetLast3Months}>
                    Últimos 3 Meses
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Data Início</p>
                    <Calendar
                      mode="single"
                      selected={dataInicio}
                      onSelect={setDataInicio}
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Data Fim</p>
                    <Calendar
                      mode="single"
                      selected={dataFim}
                      onSelect={setDataFim}
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleClearFilter}>
                    Limpar
                  </Button>
                  <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Casos</p>
              <p className="text-3xl font-bold" data-testid="text-total-casos">
                {formatNumber(stats?.total || 0)}
              </p>
            </div>
            <FileText className="h-10 w-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mês Atual</p>
              <p className="text-3xl font-bold" data-testid="text-mes-atual">
                {formatNumber(stats?.mesAtual || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {isPositiveVariation ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                )}
                <span className={`text-sm font-medium ${isPositiveVariation ? 'text-red-500' : 'text-emerald-500'}`}>
                  {stats?.variacaoPercentual || 0}%
                </span>
                <span className="text-xs text-muted-foreground">vs mês anterior</span>
              </div>
            </div>
            <CalendarIcon className="h-10 w-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mês Anterior</p>
              <p className="text-3xl font-bold" data-testid="text-mes-anterior">
                {formatNumber(stats?.mesAnterior || 0)}
              </p>
            </div>
            <CalendarIcon className="h-10 w-10 text-muted-foreground/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor Contingência</p>
              <p className="text-2xl font-bold" data-testid="text-valor-contingencia">
                {formatCurrency(stats?.valorTotalContingencia || 0)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-primary/20" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Evolução Mensal
          </h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mesLabel" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), 'Casos']}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Bar dataKey="quantidade" name="Casos Novos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-primary" />
            Distribuição por Empresa
          </h3>
          {empresaData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={empresaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {empresaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatNumber(value), 'Casos']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {empresaData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">
                      {item.name}: <strong>{formatNumber(item.value)}</strong> ({item.percentual}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          Distribuição por TRT (Top 10)
        </h3>
        {tribunalData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={tribunalData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis type="category" dataKey="tribunal" className="text-xs" width={80} />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${formatNumber(value)} casos (${props.payload.percentual}%)`,
                  ''
                ]}
              />
              <Bar dataKey="quantidade" name="Casos" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                {tribunalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${40 + index * 3}, 90%, ${50 + index * 2}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </Card>
    </div>
  );
}
