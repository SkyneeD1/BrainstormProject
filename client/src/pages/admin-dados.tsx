import { useQuery } from "@tanstack/react-query";
import { Database, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PassivoData, Processo } from "@shared/schema";

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDados() {
  const { data: passivoData, isLoading, error, refetch, isRefetching } = useQuery<PassivoData>({
    queryKey: ["/api/passivo"],
  });

  const handleExport = () => {
    if (!passivoData) return;
    
    const csvContent = [
      ["Empresa", "Fase Processual", "Classificação do Risco", "Nº Processos", "Valor Total Risco", "Ticket Médio"].join(","),
      ...passivoData.rawData.map((row) => [
        row.empresa,
        row.faseProcessual,
        row.classificacaoRisco,
        row.numeroProcessos,
        row.valorTotalRisco,
        (row.valorTotalRisco / row.numeroProcessos).toFixed(2),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "passivo_dados.csv";
    link.click();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Administração de Dados
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualização e gerenciamento dos dados do passivo
            </p>
          </div>
        </div>
        <Card className="p-6">
          <TableSkeleton />
        </Card>
      </div>
    );
  }

  if (error || !passivoData) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar dados</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados. Verifique se o arquivo Excel foi processado corretamente.
          </p>
          <Button onClick={() => refetch()} data-testid="button-retry">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            Administração de Dados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dados extraídos do arquivo brainstorm.xlsx - Base Dez/24
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total de Registros</p>
          <p className="text-2xl font-bold">{passivoData.rawData.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total de Processos</p>
          <p className="text-2xl font-bold">{passivoData.summary.totalProcessos.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor Total do Passivo</p>
          <p className="text-2xl font-bold">R$ {(passivoData.summary.totalPassivo / 1000000).toFixed(0)} mi</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold text-foreground">
            Tabela de Dados (Estilo Excel)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Visualização detalhada de todos os registros do passivo
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider">
                  Empresa
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider">
                  Fase Processual
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider">
                  Classificação do Risco
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider text-right">
                  Nº Processos
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider text-right">
                  Valor Total Risco (R$)
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider text-right">
                  Ticket Médio (R$)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passivoData.rawData.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                  data-testid={`row-data-${index}`}
                >
                  <TableCell className="font-medium">{row.empresa}</TableCell>
                  <TableCell>{row.faseProcessual}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      row.classificacaoRisco === "Remoto" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      row.classificacaoRisco === "Possível" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {row.classificacaoRisco}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.numeroProcessos.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.valorTotalRisco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {(row.valorTotalRisco / row.numeroProcessos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
