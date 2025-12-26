import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Upload, FileSpreadsheet, Trash2, CheckCircle2, ArrowUpDown, CheckSquare, FileUp, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CasoNovo {
  id: string;
  numeroProcesso: string;
  dataDistribuicao: string | null;
  tribunal: string;
  empresa: string;
  valorContingencia: string | null;
}

interface CasoEncerrado {
  id: string;
  numeroProcesso: string;
  dataEncerramento: string | null;
  tribunal: string;
  empresa: string;
  valorContingencia: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
}

function getEmpresaBgColor(empresa: string): string {
  const upper = empresa?.toUpperCase() || "";
  if (upper.includes("V.TAL") || upper.includes("VTAL")) return "bg-amber-500";
  if (upper.includes("OI")) return "bg-blue-500";
  if (upper.includes("SEREDE")) return "bg-emerald-500";
  if (upper.includes("SPRINK")) return "bg-pink-500";
  return "bg-gray-500";
}

export default function AdminImportar() {
  const { toast } = useToast();
  const entradasFileRef = useRef<HTMLInputElement>(null);
  const encerradosFileRef = useRef<HTMLInputElement>(null);
  const [isUploadingEntradas, setIsUploadingEntradas] = useState(false);
  const [isUploadingEncerrados, setIsUploadingEncerrados] = useState(false);

  const { data: casosNovos = [] } = useQuery<CasoNovo[]>({
    queryKey: ['/api/casos-novos'],
  });

  const { data: casosEncerrados = [] } = useQuery<CasoEncerrado[]>({
    queryKey: ['/api/casos-encerrados'],
  });

  const uploadEntradasMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/casos-novos/upload', {
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
      queryClient.invalidateQueries({ queryKey: ['/api/casos-novos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-novos/stats'] });
      if (entradasFileRef.current) {
        entradasFileRef.current.value = '';
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
      setIsUploadingEntradas(false);
    }
  });

  const uploadEncerradosMutation = useMutation({
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
        description: data.message || `${data.count} casos encerrados importados com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-encerrados'] });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-encerrados/stats'] });
      if (encerradosFileRef.current) {
        encerradosFileRef.current.value = '';
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
      setIsUploadingEncerrados(false);
    }
  });

  const deleteAllEntradasMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/casos-novos', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dados limpos",
        description: "Todos os casos de entradas foram excluídos",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-novos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-novos/stats'] });
    },
    onError: () => {
      toast({
        title: "Erro ao limpar",
        description: "Não foi possível excluir os dados",
        variant: "destructive",
      });
    }
  });

  const deleteAllEncerradosMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/casos-encerrados', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dados limpos",
        description: "Todos os casos encerrados foram excluídos",
      });
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

  const handleEntradasFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingEntradas(true);
      uploadEntradasMutation.mutate(file);
    }
  };

  const handleEncerradosFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingEncerrados(true);
      uploadEncerradosMutation.mutate(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Importar Dados</h1>
          <p className="text-muted-foreground">Importação de planilhas para Entrada & Saídas</p>
        </div>
      </div>

      <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Formato esperado da planilha Excel</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Colunas na ordem: Número do Processo, Data (MM/DD/AA), Tribunal (TRT), Empresa, Valor da Contingência
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="entradas" className="w-full">
        <TabsList>
          <TabsTrigger value="entradas" className="flex items-center gap-2" data-testid="tab-import-entradas">
            <ArrowUpDown className="h-4 w-4" />
            Entradas
          </TabsTrigger>
          <TabsTrigger value="encerrados" className="flex items-center gap-2" data-testid="tab-import-encerrados">
            <CheckSquare className="h-4 w-4" />
            Encerrados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entradas" className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <Upload className="h-5 w-5 text-amber-500" />
                  Importar Planilha de Entradas
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione um arquivo Excel (.xlsx, .xls) ou CSV com os dados de novos casos
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    ref={entradasFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleEntradasFileChange}
                    disabled={isUploadingEntradas}
                    className="max-w-xs"
                    data-testid="input-file-upload-entradas"
                  />
                  {isUploadingEntradas && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full" />
                      <span className="text-sm">Processando...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  <span>{casosNovos.length} casos cadastrados</span>
                </div>
                
                {casosNovos.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar Todos
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpar todos os dados de entradas?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá excluir todos os {casosNovos.length} casos cadastrados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteAllEntradasMutation.mutate()}
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

          {casosNovos.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <FileSpreadsheet className="h-5 w-5 text-amber-500" />
                Dados Importados - Entradas ({casosNovos.length})
              </h3>
              <div className="rounded-md border overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Nº Processo</TableHead>
                      <TableHead>Data Distribuição</TableHead>
                      <TableHead>Tribunal</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Valor Contingência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {casosNovos.slice(0, 50).map((caso) => (
                      <TableRow key={caso.id}>
                        <TableCell className="font-mono text-xs">{caso.numeroProcesso}</TableCell>
                        <TableCell>{formatDate(caso.dataDistribuicao)}</TableCell>
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
              {casosNovos.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Mostrando 50 de {casosNovos.length} registros
                </p>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="encerrados" className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <Upload className="h-5 w-5 text-violet-500" />
                  Importar Planilha de Encerrados
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione um arquivo Excel (.xlsx, .xls) ou CSV com os dados de casos encerrados
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    ref={encerradosFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleEncerradosFileChange}
                    disabled={isUploadingEncerrados}
                    className="max-w-xs"
                    data-testid="input-file-upload-encerrados"
                  />
                  {isUploadingEncerrados && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full" />
                      <span className="text-sm">Processando...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-violet-500" />
                  <span>{casosEncerrados.length} casos cadastrados</span>
                </div>
                
                {casosEncerrados.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar Todos
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpar todos os dados de encerrados?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá excluir todos os {casosEncerrados.length} casos encerrados cadastrados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteAllEncerradosMutation.mutate()}
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

          {casosEncerrados.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <FileSpreadsheet className="h-5 w-5 text-violet-500" />
                Dados Importados - Encerrados ({casosEncerrados.length})
              </h3>
              <div className="rounded-md border overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Nº Processo</TableHead>
                      <TableHead>Data Encerramento</TableHead>
                      <TableHead>Tribunal</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Valor Contingência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {casosEncerrados.slice(0, 50).map((caso) => (
                      <TableRow key={caso.id}>
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
              {casosEncerrados.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Mostrando 50 de {casosEncerrados.length} registros
                </p>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
