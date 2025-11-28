import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Database, Download, RefreshCw, AlertTriangle, Search, Upload, FileSpreadsheet, X, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PassivoData } from "@shared/schema";
import { formatCurrencyFull, formatCurrencyValue } from "@/lib/formatters";

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
          <Skeleton className="h-8 flex-1" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDados() {
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: passivoData, isLoading, error, refetch, isRefetching } = useQuery<PassivoData>({
    queryKey: ["/api/passivo"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/passivo/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fazer upload");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload realizado com sucesso",
        description: `${data.count} processos importados`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/passivo"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sem permissão",
          description: "Você precisa ser administrador para fazer upload",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredData = useMemo(() => {
    if (!passivoData?.rawData) return [];
    if (!searchTerm.trim()) return passivoData.rawData;
    
    const term = searchTerm.toLowerCase().trim();
    return passivoData.rawData.filter(row => 
      row.numeroProcesso.toLowerCase().includes(term)
    );
  }, [passivoData?.rawData, searchTerm]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
          variant: "destructive",
        });
        return;
      }
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    if (!passivoData) return;
    
    const csvContent = [
      ["NÚMERO DO PROCESSO (PADRÃO CNJ)", "PRÓPRIO/OI/TERCEIRO", "EMPRESA EMPREGADORA / TERCEIRA", "STATUS", "FASE", "VALOR TOTAL (NOVO)", "PROGNÓSTICO DE PERDA"].join(";"),
      ...passivoData.rawData.map((row) => [
        row.numeroProcesso,
        row.tipoOrigem,
        row.empresaOriginal,
        row.status,
        row.fase,
        row.valorTotal.toFixed(2).replace(".", ","),
        row.prognostico,
      ].join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "passivo_dados.csv";
    link.click();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
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
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            Administração de Dados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dados extraídos da planilha brainstorm.xlsx - Base Dez/24
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls"
            className="hidden"
            data-testid="input-file-upload"
          />
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              data-testid="button-upload"
            >
              {uploadMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Importar XLSX
            </Button>
          )}
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
          <p className="text-2xl font-bold">{passivoData.rawData.length.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total de Processos</p>
          <p className="text-2xl font-bold">{passivoData.summary.totalProcessos.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor Total do Passivo</p>
          <p className="text-2xl font-bold">R$ {formatCurrencyValue(passivoData.summary.totalPassivo)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Tabela de Dados (Estilo Excel)
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredData.length === passivoData.rawData.length 
                  ? `${passivoData.rawData.length.toLocaleString('pt-BR')} registros` 
                  : `${filteredData.length.toLocaleString('pt-BR')} de ${passivoData.rawData.length.toLocaleString('pt-BR')} registros`
                }
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar número do processo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9"
                data-testid="input-search"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary z-10">
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider min-w-[280px]">
                  Número do Processo (Padrão CNJ)
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider min-w-[120px]">
                  Próprio/OI/Terceiro
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider min-w-[180px]">
                  Empresa Empregadora / Terceira
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider min-w-[100px]">
                  Status
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider min-w-[120px]">
                  Fase
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider text-right min-w-[150px]">
                  Valor Total (Novo)
                </TableHead>
                <TableHead className="text-secondary-foreground font-semibold text-xs uppercase tracking-wider min-w-[120px]">
                  Prognóstico de Perda
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Nenhum processo encontrado com esse número" : "Nenhum dado disponível"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                    data-testid={`row-data-${index}`}
                  >
                    <TableCell className="font-mono text-sm">{row.numeroProcesso}</TableCell>
                    <TableCell>{row.tipoOrigem}</TableCell>
                    <TableCell className="font-medium">{row.empresaOriginal}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.status === "ACORDO" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        row.status === "ATIVO" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        row.status === "ENCERRADO" ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.fase.toUpperCase().includes("CONHECIMENTO") ? "bg-primary/20 text-primary" :
                        row.fase.toUpperCase().includes("RECURSAL") ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {row.fase}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrencyFull(row.valorTotal)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.prognostico.toUpperCase().includes("REMOTO") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        row.prognostico.toUpperCase().includes("POSS") ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {row.prognostico}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
