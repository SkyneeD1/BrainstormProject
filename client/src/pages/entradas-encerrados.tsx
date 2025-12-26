import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CheckSquare, TrendingUp, TrendingDown, Calendar as CalendarIcon, Building2, Briefcase, DollarSign, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMonths, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CasosEncerradosStats {
  total: number;
  mesAtual: number;
  mesAnterior: number;
  variacaoPercentual: number;
  porTribunal: Array<{ tribunal: string; quantidade: number; percentual: number }>;
  porEmpresa: Array<{ empresa: string; quantidade: number; percentual: number }>;
  porMes: Array<{ mes: string; ano: string; quantidade: number }>;
  valorTotalContingencia: number;
}

const EMPRESA_COLORS: Record<string, string> = {
  "V.TAL": "#f59e0b",
  "VTAL": "#f59e0b",
  "OI": "#3b82f6",
  "SEREDE": "#10b981",
  "OUTROS": "#6b7280",
  "SPRINK": "#ec4899",
};

const CHART_COLORS = [
  "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#10b981", 
  "#3b82f6", "#ef4444", "#84cc16", "#f97316", "#6366f1"
];

function getEmpresaColor(empresa: string): string {
  const upper = empresa?.toUpperCase() || "";
  return EMPRESA_COLORS[upper] || "#8b5cf6";
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

export default function EntradasEncerrados() {
  const [mesReferencia, setMesReferencia] = useState<Date>(startOfMonth(new Date()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const mesReferenciaStr = format(mesReferencia, 'yyyy-MM');
  const mesAnterior = subMonths(mesReferencia, 1);

  const { data: stats, isLoading } = useQuery<CasosEncerradosStats>({
    queryKey: ['/api/casos-encerrados/stats', mesReferenciaStr],
    queryFn: async () => {
      const response = await fetch(`/api/casos-encerrados/stats?mesReferencia=${mesReferenciaStr}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const handlePrevMonth = () => {
    setMesReferencia(subMonths(mesReferencia, 1));
  };

  const handleNextMonth = () => {
    setMesReferencia(addMonths(mesReferencia, 1));
  };

  const handleSelectMonth = (date: Date | undefined) => {
    if (date) {
      setMesReferencia(startOfMonth(date));
      setIsCalendarOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const timelineData = stats?.porMes.map((item, index) => ({
    ...item,
    mesLabel: `${getMonthName(item.mes)}/${item.ano.slice(2)}`,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  })) || [];

  const empresaData = stats?.porEmpresa.map(item => ({
    name: item.empresa,
    value: item.quantidade,
    percentual: item.percentual,
    color: getEmpresaColor(item.empresa),
  })) || [];

  const tribunalData = stats?.porTribunal.slice(0, 10).map((item, index) => ({
    tribunal: `TRT ${item.tribunal}`,
    quantidade: item.quantidade,
    percentual: item.percentual,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  })) || [];

  const isPositiveVariation = (stats?.variacaoPercentual || 0) >= 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-8 w-8 text-violet-500" />
          <div>
            <h1 className="text-2xl font-bold">Encerrados</h1>
            <p className="text-muted-foreground">Monitoramento de casos encerrados</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevMonth}
            data-testid="button-prev-month-encerrados"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="min-w-[200px] justify-center gap-2"
                data-testid="button-select-month-encerrados"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="capitalize font-medium">
                  {format(mesReferencia, "MMMM yyyy", { locale: ptBR })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={mesReferencia}
                onSelect={handleSelectMonth}
                locale={ptBR}
                defaultMonth={mesReferencia}
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNextMonth}
            data-testid="button-next-month-encerrados"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Encerrados</p>
              <p className="text-3xl font-bold" data-testid="text-total-encerrados">
                {formatNumber(stats?.total || 0)}
              </p>
            </div>
            <FileText className="h-10 w-10 text-violet-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {format(mesReferencia, "MMM/yy", { locale: ptBR }).toUpperCase()}
              </p>
              <p className="text-3xl font-bold" data-testid="text-mes-atual-encerrados">
                {formatNumber(stats?.mesAtual || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {isPositiveVariation ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${isPositiveVariation ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats?.variacaoPercentual || 0}%
                </span>
                <span className="text-xs text-muted-foreground">vs anterior</span>
              </div>
            </div>
            <CalendarIcon className="h-10 w-10 text-violet-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {format(mesAnterior, "MMM/yy", { locale: ptBR }).toUpperCase()}
              </p>
              <p className="text-3xl font-bold" data-testid="text-mes-anterior-encerrados">
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
              <p className="text-2xl font-bold" data-testid="text-valor-contingencia-encerrados">
                {formatCurrency(stats?.valorTotalContingencia || 0)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-violet-500/20" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-violet-500" />
            Evolução Mensal de Encerramentos
          </h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mesLabel" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), 'Casos']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                  {timelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-violet-500" />
            Distribuição por Empresa
          </h3>
          {empresaData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie
                    data={empresaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ percentual }) => `${percentual}%`}
                    labelLine={false}
                  >
                    {empresaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatNumber(value), 'Casos']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {empresaData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Briefcase className="h-5 w-5 text-violet-500" />
          Top 10 Tribunais - Encerramentos
        </h3>
        {tribunalData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tribunalData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis type="category" dataKey="tribunal" width={80} className="text-xs" />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'Casos']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                {tribunalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </Card>
    </div>
  );
}
