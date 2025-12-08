import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSpreadsheet, FileInput, FileOutput, Scale, Gavel, Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { BrainstormStats } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

type EmployerData = {
  empregadora: string;
  sentencasFavoraveis: number;
  sentencasDesfavoraveis: number;
  sentencasParciais: number;
  acordaosFavoraveis: number;
  acordaosDesfavoraveis: number;
  acordaosParciais: number;
  totalFavoraveis: number;
  totalDesfavoraveis: number;
  totalParciais: number;
  total: number;
  taxaExito: number;
};

type EmployerComparisonResponse = {
  employers: EmployerData[];
  totals: {
    sentencasFavoraveis: number;
    sentencasDesfavoraveis: number;
    sentencasParciais: number;
    acordaosFavoraveis: number;
    acordaosDesfavoraveis: number;
    acordaosParciais: number;
    totalFavoraveis: number;
    totalDesfavoraveis: number;
    totalParciais: number;
    total: number;
    taxaExito: number;
  };
};

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color = "primary",
  isLoading = false 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  color?: "primary" | "green" | "red" | "yellow";
  isLoading?: boolean;
}) {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    green: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
    red: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
    yellow: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30",
  };

  return (
    <Card className="flex-1 min-w-[200px]">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold" data-testid={`text-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {value.toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmployerCard({ employer, isLoading }: { employer: EmployerData; isLoading: boolean }) {
  const getTaxaColor = (taxa: number) => {
    if (taxa >= 50) return "text-green-600 dark:text-green-400";
    if (taxa >= 30) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getTaxaIcon = (taxa: number) => {
    if (taxa >= 50) return TrendingUp;
    if (taxa >= 30) return Minus;
    return TrendingDown;
  };

  const TaxaIcon = getTaxaIcon(employer.taxaExito);

  return (
    <Card className="hover-elevate" data-testid={`card-employer-${employer.empregadora.toLowerCase().replace(/[.\s]/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{employer.empregadora}</span>
          </div>
          <div className={`flex items-center gap-1 ${getTaxaColor(employer.taxaExito)}`}>
            <TaxaIcon className="h-4 w-4" />
            <span className="font-bold text-lg">{employer.taxaExito}%</span>
          </div>
        </div>
        
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Favoráveis</span>
            <span className="font-medium text-green-600 dark:text-green-400">{employer.totalFavoraveis}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Parciais</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">{employer.totalParciais}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Desfavoráveis</span>
            <span className="font-medium text-red-600 dark:text-red-400">{employer.totalDesfavoraveis}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="font-bold">{employer.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BrainstormRelatorio() {
  const { data: stats, isLoading } = useQuery<BrainstormStats>({
    queryKey: ['/api/brainstorm/stats'],
  });

  const { data: comparison, isLoading: isLoadingComparison } = useQuery<EmployerComparisonResponse>({
    queryKey: ['/api/brainstorm/employer-comparison'],
  });

  const total = stats 
    ? stats.distribuidos + stats.encerrados + stats.sentencasMerito + stats.acordaosMerito 
    : 0;

  const chartData = comparison?.employers.map(emp => ({
    name: emp.empregadora,
    'Sentença Favorável': emp.sentencasFavoraveis,
    'Sentença Parcial': emp.sentencasParciais,
    'Sentença Desfavorável': emp.sentencasDesfavoraveis,
    'Acórdão Favorável': emp.acordaosFavoraveis,
    'Acórdão Parcial': emp.acordaosParciais,
    'Acórdão Desfavorável': emp.acordaosDesfavoraveis,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório Brainstorm</h1>
          <p className="text-muted-foreground">Quantidades das planilhas do módulo Brainstorm</p>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/20">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total de Registros</p>
              {isLoading ? (
                <Skeleton className="h-10 w-32 mt-1" />
              ) : (
                <p className="text-4xl font-bold text-primary" data-testid="text-total-registros">
                  {total.toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Distribuídos"
          value={stats?.distribuidos || 0}
          icon={FileInput}
          color="primary"
          isLoading={isLoading}
        />
        <KPICard
          title="Encerrados"
          value={stats?.encerrados || 0}
          icon={FileOutput}
          color="green"
          isLoading={isLoading}
        />
        <KPICard
          title="Sentença de Mérito"
          value={stats?.sentencasMerito || 0}
          icon={Scale}
          color="yellow"
          isLoading={isLoading}
        />
        <KPICard
          title="Acórdão de Mérito"
          value={stats?.acordaosMerito || 0}
          icon={Gavel}
          color="red"
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Comparativo de Resultados por Empregadora
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingComparison ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Sentença Favorável" stackId="sentenca" fill="#22c55e" />
                <Bar dataKey="Sentença Parcial" stackId="sentenca" fill="#fbbf24" />
                <Bar dataKey="Sentença Desfavorável" stackId="sentenca" fill="#f97316" />
                <Bar dataKey="Acórdão Favorável" stackId="acordao" fill="#16a34a" />
                <Bar dataKey="Acórdão Parcial" stackId="acordao" fill="#eab308" />
                <Bar dataKey="Acórdão Desfavorável" stackId="acordao" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxa de Êxito por Empregadora</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingComparison ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[160px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparison?.employers.map((employer) => (
                <EmployerCard 
                  key={employer.empregadora} 
                  employer={employer} 
                  isLoading={isLoadingComparison} 
                />
              ))}
            </div>
          )}
          
          {comparison?.totals && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-lg">TOTAL GERAL</span>
                <div className="flex items-center gap-2 text-primary">
                  <span className="font-bold text-2xl">{comparison.totals.taxaExito}%</span>
                  <span className="text-sm text-muted-foreground">taxa de êxito</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Total Decisões</span>
                  <span className="font-bold text-lg" data-testid="text-total-decisoes">
                    {comparison.totals.total}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Favoráveis</span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400" data-testid="text-total-favoraveis">
                    {comparison.totals.totalFavoraveis}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Parciais</span>
                  <span className="font-bold text-lg text-yellow-600 dark:text-yellow-400" data-testid="text-total-parciais">
                    {comparison.totals.totalParciais}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Desfavoráveis</span>
                  <span className="font-bold text-lg text-red-600 dark:text-red-400" data-testid="text-total-desfavoraveis">
                    {comparison.totals.totalDesfavoraveis}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Planilha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileInput className="h-5 w-5 text-primary" />
                <span className="font-medium">DISTRIBUÍDOS</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-lg font-bold" data-testid="text-count-distribuidos">
                  {stats?.distribuidos.toLocaleString('pt-BR') || 0}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileOutput className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium">ENCERRADOS</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-lg font-bold" data-testid="text-count-encerrados">
                  {stats?.encerrados.toLocaleString('pt-BR') || 0}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium">SENTENÇA DE MÉRITO</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-lg font-bold" data-testid="text-count-sentencas">
                  {stats?.sentencasMerito.toLocaleString('pt-BR') || 0}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Gavel className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="font-medium">ACÓRDÃO DE MÉRITO</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-lg font-bold" data-testid="text-count-acordaos">
                  {stats?.acordaosMerito.toLocaleString('pt-BR') || 0}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
