import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Upload, FileSpreadsheet, Trash2, FileText, CheckCircle2, TrendingUp, TrendingDown, Calendar, Building2, Briefcase, DollarSign, CheckSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CasoEncerrado {
  id: string;
  numeroProcesso: string;
  dataEncerramento: string | null;
  tribunal: string;
  empresa: string;
  valorContingencia: string | null;
  createdAt: string;
}

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

function getEmpresaColor(empresa: string): string {
  const upper = empresa?.toUpperCase() || "";
  return EMPRESA_COLORS[upper] || "#8b5cf6";
}

function getEmpresaBgColor(empresa: string): string {
  const upper = empresa?.toUpperCase() || "";
  if (upper.includes("V.TAL") || upper.includes("VTAL")) return "bg-amber-500";
  if (upper.includes("OI")) return "bg-blue-500";
  if (upper.includes("SEREDE")) return "bg-emerald-500";
  if (upper.includes("SPRINK")) return "bg-pink-500";
  return "bg-gray-500";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
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
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  const { data: casos = [], isLoading: isLoadingCasos } = useQuery<CasoEncerrado[]>({
    queryKey: ['/api/casos-encerrados'],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<CasosEncerradosStats>({
    queryKey: ['/api/casos-encerrados/stats'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/casos-encerrados/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao importar arquivo');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Importação concluída",
        description: data.message || `${data.count} casos importados com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-encerrados'] });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-encerrados/stats'] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const deleteBatchMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiRequest('POST', '/api/casos-encerrados/delete-batch', { ids });
    },
    onSuccess: () => {
      toast({
        title: "Itens excluídos",
        description: `${selectedIds.size} itens excluídos com sucesso`,
      });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/casos-encerrados'] });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-encerrados/stats'] });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir os itens selecionados",
        variant: "destructive",
      });
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/casos-encerrados');
    },
    onSuccess: () => {
      toast({
        title: "Dados limpos",
        description: "Todos os casos foram excluídos",
      });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/casos-encerrados'] });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-encerrados/stats'] });
    },
    onError: () => {
      toast({
        title: "Erro ao limpar",
        description: "Não foi possível excluir os dados",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(casos.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      deleteBatchMutation.mutate(Array.from(selectedIds));
    }
  };

  const isLoading = isLoadingCasos || isLoadingStats;

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
        <CheckSquare className="h-8 w-8 text-emerald-500" />
        <div>
          <h1 className="text-2xl font-bold">Casos Encerrados</h1>
          <p className="text-muted-foreground">Monitoramento de casos finalizados</p>
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
            <FileText className="h-10 w-10 text-emerald-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Encerrados Mês Atual</p>
              <p className="text-3xl font-bold" data-testid="text-mes-atual">
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
                <span className="text-xs text-muted-foreground">vs mês anterior</span>
              </div>
            </div>
            <Calendar className="h-10 w-10 text-emerald-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Encerrados Mês Anterior</p>
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
            <DollarSign className="h-10 w-10 text-emerald-500/20" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts" data-testid="tab-charts">Gráficos</TabsTrigger>
          <TabsTrigger value="dados" data-testid="tab-dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Evolução Mensal
              </h3>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mesLabel" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [formatNumber(value), 'Encerrados']}
                      labelFormatter={(label) => `Período: ${label}`}
                    />
                    <Bar dataKey="quantidade" name="Casos Encerrados" fill="#10b981" radius={[4, 4, 0, 0]} />
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
                <Briefcase className="h-5 w-5 text-emerald-500" />
                Por Empresa
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
              <Building2 className="h-5 w-5 text-emerald-500" />
              Por TRT (Top 10)
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
                  <Bar dataKey="quantidade" name="Casos" fill="#10b981" radius={[0, 4, 4, 0]}>
                    {tribunalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${150 + index * 5}, 70%, ${40 + index * 3}%)`} />
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
        </TabsContent>

        <TabsContent value="dados" className="space-y-6">
          {isAdmin && (
            <Card className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <Upload className="h-5 w-5 text-emerald-500" />
                    Importar Planilha de Encerrados
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Formato: número do processo, data de encerramento, tribunal, empresa, valor contingência
                  </p>
                  <div className="flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="max-w-xs"
                      data-testid="input-file-upload-encerrados"
                    />
                    {isUploading && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                        <span className="text-sm">Processando...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>{casos.length} casos cadastrados</span>
                  </div>
                  
                  {casos.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar Todos
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá excluir todos os {casos.length} casos cadastrados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAllMutation.mutate()}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Excluir Tudo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                Casos Encerrados ({casos.length})
              </h3>
              
              {isAdmin && selectedIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Selecionados ({selectedIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir itens selecionados?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá excluir {selectedIds.size} itens selecionados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSelected}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {casos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum caso encerrado</p>
                <p className="text-sm">Importe uma planilha Excel para começar</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      {isAdmin && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedIds.size === casos.length && casos.length > 0}
                            onCheckedChange={handleSelectAll}
                            data-testid="checkbox-select-all-encerrados"
                          />
                        </TableHead>
                      )}
                      <TableHead>Nº Processo</TableHead>
                      <TableHead>Data Encerramento</TableHead>
                      <TableHead>Tribunal</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Valor Contingência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {casos.map((caso) => (
                      <TableRow key={caso.id}>
                        {isAdmin && (
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(caso.id)}
                              onCheckedChange={(checked) => handleSelectItem(caso.id, !!checked)}
                              data-testid={`checkbox-encerrado-${caso.id}`}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-xs">{caso.numeroProcesso}</TableCell>
                        <TableCell>{formatDate(caso.dataEncerramento)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">TRT {caso.tribunal}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getEmpresaBgColor(caso.empresa)} text-white`}>
                            {caso.empresa}
                          </Badge>
                        </TableCell>
                        <TableCell>{caso.valorContingencia || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
