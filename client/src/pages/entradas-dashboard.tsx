import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { ArrowUpDown, TrendingUp, TrendingDown, Calendar, Building2, Briefcase, DollarSign, FileText } from "lucide-react";

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
  const { data: stats, isLoading } = useQuery<CasosNovosStats>({
    queryKey: ['/api/casos-novos/stats'],
  });

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
      <div className="flex items-center gap-3 mb-6">
        <ArrowUpDown className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Entrada & Saídas</h1>
          <p className="text-muted-foreground">Monitoramento de novos casos distribuídos</p>
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
            <Calendar className="h-10 w-10 text-primary/20" />
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
            <Calendar className="h-10 w-10 text-muted-foreground/20" />
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
            <Calendar className="h-5 w-5 text-primary" />
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
              <Bar dataKey="quantidade" name="Casos" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {tribunalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 10}, 70%, ${50 + index * 3}%)`} />
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
