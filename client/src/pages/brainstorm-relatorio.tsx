import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSpreadsheet, FileInput, FileOutput, Scale, Gavel } from "lucide-react";
import type { BrainstormStats } from "@shared/schema";

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

export default function BrainstormRelatorio() {
  const { data: stats, isLoading } = useQuery<BrainstormStats>({
    queryKey: ['/api/brainstorm/stats'],
  });

  const total = stats 
    ? stats.distribuidos + stats.encerrados + stats.sentencasMerito + stats.acordaosMerito 
    : 0;

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
