import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Database, Download, RefreshCw, AlertTriangle, Search, Upload, FileSpreadsheet, X, Trash2, Loader2, Scale, Calendar } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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
        </div>
      ))}
    </div>
  );
}

const MESES = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const currentYear = new Date().getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

function PassivoTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMes, setSelectedMes] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedAno, setSelectedAno] = useState<string>(String(currentYear));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: passivoData, isLoading, refetch, isRefetching } = useQuery<PassivoData>({
    queryKey: ["/api/passivo"],
  });

  const { data: periodos, refetch: refetchPeriodos } = useQuery<Array<{ mes: string; ano: string }>>({
    queryKey: ["/api/passivo/periodos"],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, mes, ano }: { file: File; mes: string; ano: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mes", mes);
      formData.append("ano", ano);
      const response = await fetch("/api/passivo/mensal/upload", { 
        method: "POST", 
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fazer upload");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Upload realizado", 
        description: `${data.count} processos importados para ${MESES.find(m => m.value === data.mes)?.label}/${data.ano}` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/passivo"] });
      queryClient.invalidateQueries({ queryKey: ["/api/passivo/periodos"] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", "/api/passivo"); },
    onSuccess: () => {
      toast({ title: "Todos os dados foram apagados" });
      queryClient.invalidateQueries({ queryKey: ["/api/passivo"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    },
  });

  const filteredData = passivoData?.rawData?.filter(row => 
    !searchTerm.trim() || row.numeroProcesso.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({ title: "Arquivo inválido", description: "Selecione um arquivo Excel", variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setUploadDialogOpen(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadConfirm = () => {
    if (!selectedFile || !selectedMes || !selectedAno) return;
    uploadMutation.mutate({ file: selectedFile, mes: selectedMes, ano: selectedAno });
  };

  const handleExport = () => {
    if (!passivoData) return;
    const csvContent = [
      ["NÚMERO DO PROCESSO", "PRÓPRIO/OI/TERCEIRO", "EMPRESA", "STATUS", "FASE", "VALOR TOTAL", "PROGNÓSTICO"].join(";"),
      ...passivoData.rawData.map((row) => [
        row.numeroProcesso, row.tipoOrigem, row.empresaOriginal, row.status, row.fase,
        row.valorTotal.toFixed(2).replace(".", ","), row.prognostico,
      ].join(";"))
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "passivo_dados.csv";
    link.click();
  };

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { setUploadDialogOpen(open); if (!open) setSelectedFile(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Selecionar Período
            </DialogTitle>
            <DialogDescription>
              Escolha o mês e ano que esta planilha representa. O arquivo selecionado: <strong>{selectedFile?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês</label>
              <Select value={selectedMes} onValueChange={setSelectedMes}>
                <SelectTrigger data-testid="select-mes">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={selectedAno} onValueChange={setSelectedAno}>
                <SelectTrigger data-testid="select-ano">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {ANOS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setSelectedFile(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleUploadConfirm} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-3">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx,.xls" className="hidden" data-testid="input-file-passivo" />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} data-testid="button-upload-passivo">
          {uploadMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          Importar XLSX
        </Button>
        {(passivoData?.rawData?.length || 0) > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" data-testid="button-delete-all-passivo">
                <Trash2 className="h-4 w-4 mr-2" />Apagar Todos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>Apagar todos os {passivoData?.rawData.length.toLocaleString('pt-BR')} registros do passivo?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteAllMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleteAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Apagar Todos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} data-testid="button-refresh-passivo">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />Atualizar
        </Button>
        <Button onClick={handleExport} data-testid="button-export-passivo"><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase mb-1">Total de Registros</p>
          <p className="text-2xl font-bold">{passivoData?.rawData?.length?.toLocaleString('pt-BR') || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase mb-1">Total de Processos</p>
          <p className="text-2xl font-bold">{passivoData?.summary?.totalProcessos?.toLocaleString('pt-BR') || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase mb-1">Valor Total</p>
          <p className="text-2xl font-bold">R$ {formatCurrencyValue(passivoData?.summary?.totalPassivo || 0)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" />Processos do Passivo</h2>
            <p className="text-xs text-muted-foreground">{filteredData.length.toLocaleString('pt-BR')} registros</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar processo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-9" data-testid="input-search-passivo" />
            {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary z-10">
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="text-xs uppercase min-w-[280px]">Processo</TableHead>
                <TableHead className="text-xs uppercase min-w-[100px]">Tipo</TableHead>
                <TableHead className="text-xs uppercase min-w-[150px]">Empresa</TableHead>
                <TableHead className="text-xs uppercase min-w-[100px]">Status</TableHead>
                <TableHead className="text-xs uppercase min-w-[100px]">Fase</TableHead>
                <TableHead className="text-xs uppercase text-right min-w-[120px]">Valor</TableHead>
                <TableHead className="text-xs uppercase min-w-[100px]">Prognóstico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum dado disponível</TableCell></TableRow>
              ) : (
                filteredData.slice(0, 100).map((row, index) => (
                  <TableRow key={row.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                    <TableCell className="font-mono text-sm">{row.numeroProcesso}</TableCell>
                    <TableCell>{row.tipoOrigem}</TableCell>
                    <TableCell>{row.empresaOriginal}</TableCell>
                    <TableCell><span className="px-2 py-1 text-xs rounded-full bg-muted">{row.status}</span></TableCell>
                    <TableCell><span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">{row.fase}</span></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrencyFull(row.valorTotal)}</TableCell>
                    <TableCell><span className="px-2 py-1 text-xs rounded-full bg-muted">{row.prognostico}</span></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filteredData.length > 100 && <div className="p-2 text-center text-xs text-muted-foreground border-t">Mostrando 100 de {filteredData.length} registros</div>}
      </Card>
    </div>
  );
}

export default function AdminDados() {
  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          Administração de Dados
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alimentação e gerenciamento de dados por módulo
        </p>
      </div>

      <PassivoTab />
    </div>
  );
}
