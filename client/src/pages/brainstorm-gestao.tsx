import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Table2, Plus, Trash2, Loader2, FileInput, FileOutput, Scale, Gavel, X, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import type { Distribuido, Encerrado, SentencaMerito, AcordaoMerito } from "@shared/schema";

type TableType = "distribuidos" | "encerrados" | "sentencas" | "acordaos";

const tableConfig = {
  distribuidos: {
    title: "DISTRIBUÍDOS",
    icon: FileInput,
    endpoint: "/api/brainstorm/distribuidos",
    color: "text-primary",
    fields: [
      { key: "numeroProcesso", label: "Número do Processo" },
      { key: "reclamada", label: "Reclamada" },
      { key: "tipoEmpregado", label: "Tipo Empregado" },
      { key: "empregadora", label: "Empregadora" },
    ],
  },
  encerrados: {
    title: "ENCERRADOS",
    icon: FileOutput,
    endpoint: "/api/brainstorm/encerrados",
    color: "text-green-600 dark:text-green-400",
    fields: [
      { key: "numeroProcesso", label: "Número do Processo" },
      { key: "reclamada", label: "Reclamada" },
      { key: "tipoEmpregado", label: "Tipo Empregado" },
      { key: "empregadora", label: "Empregadora" },
    ],
  },
  sentencas: {
    title: "SENTENÇA DE MÉRITO",
    icon: Scale,
    endpoint: "/api/brainstorm/sentencas-merito",
    color: "text-yellow-600 dark:text-yellow-400",
    fields: [
      { key: "numeroProcesso", label: "Número do Processo" },
      { key: "empresa", label: "Empresa" },
      { key: "tipoDecisao", label: "Tipo de Decisão" },
      { key: "favorabilidade", label: "Favorabilidade" },
      { key: "empregadora", label: "Empregadora" },
    ],
  },
  acordaos: {
    title: "ACÓRDÃO DE MÉRITO",
    icon: Gavel,
    endpoint: "/api/brainstorm/acordaos-merito",
    color: "text-red-600 dark:text-red-400",
    fields: [
      { key: "numeroProcesso", label: "Número do Processo" },
      { key: "empresa", label: "Empresa" },
      { key: "tipoDecisao", label: "Tipo de Decisão" },
      { key: "sinteseDecisao", label: "Síntese da Decisão" },
      { key: "empregadora", label: "Empregadora" },
    ],
  },
};

type DataItem = Distribuido | Encerrado | SentencaMerito | AcordaoMerito;

function DataTable({ tableType }: { tableType: TableType }) {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const config = tableConfig[tableType];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newRows, setNewRows] = useState<Record<string, string>[]>([]);

  const { data: items = [], isLoading } = useQuery<DataItem[]>({
    queryKey: [config.endpoint],
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", `${config.endpoint}/delete-batch`, { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.endpoint] });
      queryClient.invalidateQueries({ queryKey: ['/api/brainstorm/stats'] });
      setSelectedIds(new Set());
      toast({ title: "Itens excluídos com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir itens", variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", config.endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.endpoint] });
      queryClient.invalidateQueries({ queryKey: ['/api/brainstorm/stats'] });
      setSelectedIds(new Set());
      toast({ title: "Todos os itens foram excluídos" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir todos os itens", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, string>[]) => {
      await apiRequest("POST", `${config.endpoint}/batch`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.endpoint] });
      queryClient.invalidateQueries({ queryKey: ['/api/brainstorm/stats'] });
      setNewRows([]);
      toast({ title: "Itens adicionados com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar itens", variant: "destructive" });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((item) => item.id)));
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
    if (selectedIds.size === 0) return;
    deleteMutation.mutate(Array.from(selectedIds));
  };

  const handleAddRow = () => {
    const emptyRow: Record<string, string> = {};
    config.fields.forEach((field) => {
      emptyRow[field.key] = "";
    });
    setNewRows([...newRows, emptyRow]);
  };

  const handleUpdateNewRow = (index: number, key: string, value: string) => {
    const updated = [...newRows];
    updated[index][key] = value;
    setNewRows(updated);
  };

  const handleRemoveNewRow = (index: number) => {
    setNewRows(newRows.filter((_, i) => i !== index));
  };

  const handleSaveNewRows = () => {
    const validRows = newRows.filter((row) => 
      row.numeroProcesso && row.numeroProcesso.trim() !== ""
    );
    if (validRows.length === 0) {
      toast({ title: "Preencha pelo menos o número do processo", variant: "destructive" });
      return;
    }
    createMutation.mutate(validRows);
  };

  const Icon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <CardDescription>{items.length} registros</CardDescription>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${tableType}`}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Excluir ({selectedIds.size})
                </Button>
              )}
              {items.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      data-testid={`button-delete-all-${tableType}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Apagar Todos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Confirmar exclusão
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja apagar todos os {items.length} registros de {config.title}? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid={`button-cancel-delete-all-${tableType}`}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAllMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid={`button-confirm-delete-all-${tableType}`}
                      >
                        {deleteAllMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Apagar Todos
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                data-testid={`button-add-${tableType}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Linha
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={items.length > 0 && selectedIds.size === items.length}
                      onCheckedChange={handleSelectAll}
                      data-testid={`checkbox-select-all-${tableType}`}
                    />
                  </TableHead>
                )}
                {config.fields.map((field) => (
                  <TableHead key={field.key} className="whitespace-nowrap">
                    {field.label}
                  </TableHead>
                ))}
                {isAdmin && newRows.length > 0 && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {newRows.map((row, index) => (
                <TableRow key={`new-${index}`} className="bg-green-50 dark:bg-green-900/20">
                  {isAdmin && <TableCell />}
                  {config.fields.map((field) => (
                    <TableCell key={field.key}>
                      <Input
                        value={row[field.key] || ""}
                        onChange={(e) => handleUpdateNewRow(index, field.key, e.target.value)}
                        placeholder={field.label}
                        className="h-8 min-w-[120px]"
                        data-testid={`input-new-${tableType}-${field.key}-${index}`}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveNewRow(index)}
                      data-testid={`button-remove-new-row-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={config.fields.length + (isAdmin ? 2 : 0)} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 && newRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={config.fields.length + (isAdmin ? 2 : 0)} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          data-testid={`checkbox-item-${item.id}`}
                        />
                      </TableCell>
                    )}
                    {config.fields.map((field) => (
                      <TableCell key={field.key} className="whitespace-nowrap">
                        {(item as Record<string, any>)[field.key] || "-"}
                      </TableCell>
                    ))}
                    {isAdmin && newRows.length > 0 && <TableCell />}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {newRows.length > 0 && (
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setNewRows([])} data-testid={`button-cancel-${tableType}`}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNewRows} disabled={createMutation.isPending} data-testid={`button-save-${tableType}`}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar ({newRows.length} linhas)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BrainstormGestao() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Table2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Gestão de Dados Brainstorm</h1>
          <p className="text-muted-foreground">Adicione e remova registros das planilhas em lote</p>
        </div>
      </div>

      <Tabs defaultValue="distribuidos" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="distribuidos" className="gap-2" data-testid="tab-distribuidos">
            <FileInput className="h-4 w-4" />
            <span className="hidden sm:inline">Distribuídos</span>
          </TabsTrigger>
          <TabsTrigger value="encerrados" className="gap-2" data-testid="tab-encerrados">
            <FileOutput className="h-4 w-4" />
            <span className="hidden sm:inline">Encerrados</span>
          </TabsTrigger>
          <TabsTrigger value="sentencas" className="gap-2" data-testid="tab-sentencas">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Sentenças</span>
          </TabsTrigger>
          <TabsTrigger value="acordaos" className="gap-2" data-testid="tab-acordaos">
            <Gavel className="h-4 w-4" />
            <span className="hidden sm:inline">Acórdãos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="distribuidos">
          <DataTable tableType="distribuidos" />
        </TabsContent>
        <TabsContent value="encerrados">
          <DataTable tableType="encerrados" />
        </TabsContent>
        <TabsContent value="sentencas">
          <DataTable tableType="sentencas" />
        </TabsContent>
        <TabsContent value="acordaos">
          <DataTable tableType="acordaos" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
