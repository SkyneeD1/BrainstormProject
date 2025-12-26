import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileSpreadsheet, Trash2, AlertTriangle, Download, FileText, CheckCircle2 } from "lucide-react";
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

interface CasoNovo {
  id: string;
  numeroProcesso: string;
  dataDistribuicao: string | null;
  tribunal: string;
  empresa: string;
  valorContingencia: string | null;
  createdAt: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
}

function getEmpresaColor(empresa: string): string {
  const upper = empresa?.toUpperCase() || "";
  if (upper.includes("V.TAL") || upper.includes("VTAL")) return "bg-amber-500";
  if (upper.includes("OI")) return "bg-blue-500";
  if (upper.includes("SEREDE")) return "bg-emerald-500";
  if (upper.includes("SPRINK")) return "bg-pink-500";
  return "bg-gray-500";
}

export default function EntradasImportar() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  const { data: casos = [], isLoading } = useQuery<CasoNovo[]>({
    queryKey: ['/api/casos-novos'],
  });

  const uploadMutation = useMutation({
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
      return apiRequest('POST', '/api/casos-novos/delete-batch', { ids });
    },
    onSuccess: () => {
      toast({
        title: "Itens excluídos",
        description: `${selectedIds.size} itens excluídos com sucesso`,
      });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/casos-novos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/casos-novos/stats'] });
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
      return apiRequest('DELETE', '/api/casos-novos');
    },
    onSuccess: () => {
      toast({
        title: "Dados limpos",
        description: "Todos os casos foram excluídos",
      });
      setSelectedIds(new Set());
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Importar Dados</h1>
          <p className="text-muted-foreground">Importe casos novos em lote através de planilha Excel</p>
        </div>
      </div>

      {isAdmin && (
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload de Planilha
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Formato esperado: número do processo, data da distribuição, tribunal, empresa, valor da contingência
              </p>
              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="max-w-xs"
                  data-testid="input-file-upload"
                />
                {isUploading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
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
                        Esta ação não pode ser desfeita.
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
            <FileText className="h-5 w-5 text-primary" />
            Casos Cadastrados ({casos.length})
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
            <p className="text-lg font-medium">Nenhum caso cadastrado</p>
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
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                  )}
                  <TableHead>Nº Processo</TableHead>
                  <TableHead>Data Distribuição</TableHead>
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
                          data-testid={`checkbox-caso-${caso.id}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-xs">{caso.numeroProcesso}</TableCell>
                    <TableCell>{formatDate(caso.dataDistribuicao)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">TRT {caso.tribunal}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getEmpresaColor(caso.empresa)} text-white`}>
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
    </div>
  );
}
