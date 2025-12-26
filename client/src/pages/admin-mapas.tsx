import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Database, ChevronDown, ChevronRight, Plus, Edit2, Trash2, RefreshCw, Users, Building2, Gavel, Table, FolderTree, Upload, FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DecisaoRpac, Desembargador } from "@shared/schema";

function FavorabilityAvatar({ percentual, size = 40 }: { percentual: number; size?: number }) {
  const greenAngle = (percentual / 100) * 360;
  return (
    <div 
      className="relative rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#ef4444" />
        {percentual > 0 && (
          <path
            d={`M50,50 L50,0 A50,50 0 ${greenAngle > 180 ? 1 : 0},1 ${50 + 50 * Math.sin((greenAngle * Math.PI) / 180)},${50 - 50 * Math.cos((greenAngle * Math.PI) / 180)} Z`}
            fill="#10b981"
          />
        )}
        <circle cx="50" cy="50" r="30" fill="white" className="dark:fill-slate-800" />
        <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="bold" className="fill-slate-700 dark:fill-slate-200">
          {percentual}
        </text>
      </svg>
    </div>
  );
}

interface DesembargadorComDecisoes {
  id: string;
  nome: string;
  voto: string;
  decisoes: DecisaoRpac[];
}

interface TurmaComDesembargadores {
  id: string;
  nome: string;
  desembargadores: DesembargadorComDecisoes[];
}

interface TRTData {
  nome: string;
  turmas: TurmaComDesembargadores[];
}

interface AdminData {
  trts: TRTData[];
}

function DecisaoItem({ decisao, onRefresh }: { decisao: DecisaoRpac; onRefresh: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    resultado: decisao.resultado, 
    observacoes: decisao.observacoes || "",
    dataDecisao: decisao.dataDecisao ? new Date(decisao.dataDecisao).toISOString().split('T')[0] : "",
    upi: decisao.upi || "nao",
    responsabilidade: decisao.responsabilidade || "subsidiaria",
    empresa: decisao.empresa || "V.tal"
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { resultado: string; observacoes?: string; dataDecisao?: string; upi?: string; responsabilidade?: string; empresa?: string }) => apiRequest("PATCH", `/api/decisoes/${decisao.id}`, data),
    onSuccess: () => {
      toast({ title: "Decisão atualizada" });
      setEditing(false);
      onRefresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/decisoes/${decisao.id}`),
    onSuccess: () => {
      toast({ title: "Decisão excluída" });
      onRefresh();
    },
  });

  const getResultadoColor = (resultado: string) => {
    const r = resultado?.toUpperCase() || "";
    // Check DESFAVORÁVEL first since it contains "FAVORÁVEL"
    if (r.includes("DESFAVORÁVEL")) return "text-red-600 dark:text-red-400";
    if (r.includes("FAVORÁVEL")) return "text-emerald-600 dark:text-emerald-400";
    return "text-slate-500";
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted rounded flex-wrap">
        <span className="text-xs font-mono">{decisao.numeroProcesso}</span>
        <Input
          type="date"
          className="h-7 text-xs w-32"
          value={editData.dataDecisao}
          onChange={(e) => setEditData(prev => ({ ...prev, dataDecisao: e.target.value }))}
          data-testid="input-edit-data"
        />
        <Select value={editData.resultado} onValueChange={(v) => setEditData(prev => ({ ...prev, resultado: v }))}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FAVORÁVEL">Favorável</SelectItem>
            <SelectItem value="DESFAVORÁVEL">Desfavorável</SelectItem>
            <SelectItem value="EM ANÁLISE">Em Análise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={editData.upi} onValueChange={(v) => setEditData(prev => ({ ...prev, upi: v }))}>
          <SelectTrigger className="w-24 h-7 text-xs">
            <SelectValue placeholder="UPI" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sim">UPI: Sim</SelectItem>
            <SelectItem value="nao">UPI: Não</SelectItem>
          </SelectContent>
        </Select>
        <Select value={editData.responsabilidade} onValueChange={(v) => setEditData(prev => ({ ...prev, responsabilidade: v }))}>
          <SelectTrigger className="w-28 h-7 text-xs">
            <SelectValue placeholder="Resp." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solidaria">Solidária</SelectItem>
            <SelectItem value="subsidiaria">Subsidiária</SelectItem>
          </SelectContent>
        </Select>
        <Select value={editData.empresa} onValueChange={(v) => setEditData(prev => ({ ...prev, empresa: v }))}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="V.tal">V.tal</SelectItem>
            <SelectItem value="OI">OI</SelectItem>
            <SelectItem value="Serede">Serede</SelectItem>
            <SelectItem value="Sprink">Sprink</SelectItem>
            <SelectItem value="Outros Terceiros">Outros</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-7" onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending}>
          Salvar
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded group">
      <span className="text-xs flex-1 font-mono">{decisao.numeroProcesso}</span>
      <span className={`text-xs font-semibold ${getResultadoColor(decisao.resultado)}`}>{decisao.resultado}</span>
      {decisao.upi === "sim" && (
        <Badge variant="outline" className="text-[10px] h-5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">UPI</Badge>
      )}
      <Badge variant="secondary" className="text-[10px] h-5">
        {decisao.responsabilidade === "solidaria" ? "Solid." : "Subsid."}
      </Badge>
      {decisao.empresa && (
        <Badge variant="outline" className="text-[10px] h-5 bg-slate-100 dark:bg-slate-800">{decisao.empresa}</Badge>
      )}
      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)} data-testid={`button-edit-decisao-${decisao.id}`}>
          <Edit2 className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" data-testid={`button-delete-decisao-${decisao.id}`}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Decisão</AlertDialogTitle>
              <AlertDialogDescription>Tem certeza que deseja excluir a decisão do processo {decisao.numeroProcesso}?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate()}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function DesembargadorCard({ desembargador, onRefresh }: { desembargador: DesembargadorComDecisoes; onRefresh: () => void }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showAddDecisao, setShowAddDecisao] = useState(false);
  const [newDecisao, setNewDecisao] = useState({ 
    numeroProcesso: "", 
    resultado: "EM ANÁLISE", 
    dataDecisao: new Date().toISOString().split('T')[0],
    upi: "nao",
    responsabilidade: "subsidiaria",
    empresa: "V.tal"
  });

  const createDecisaoMutation = useMutation({
    mutationFn: async (data: { desembargadorId: string; numeroProcesso: string; resultado: string; dataDecisao: string; upi: string; responsabilidade: string; empresa: string }) => apiRequest("POST", "/api/decisoes", data),
    onSuccess: () => {
      toast({ title: "Decisão adicionada" });
      setNewDecisao({ numeroProcesso: "", resultado: "EM ANÁLISE", dataDecisao: new Date().toISOString().split('T')[0], upi: "nao", responsabilidade: "subsidiaria", empresa: "V.tal" });
      setShowAddDecisao(false);
      onRefresh();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar decisão", description: error.message, variant: "destructive" });
    },
  });

  const favoraveis = desembargador.decisoes.filter(d => d.resultado?.toUpperCase().includes('FAVORÁVEL') && !d.resultado?.toUpperCase().includes('DESFAVORÁVEL')).length;
  const desfavoraveis = desembargador.decisoes.filter(d => d.resultado?.toUpperCase().includes('DESFAVORÁVEL')).length;
  const total = favoraveis + desfavoraveis;
  const percentualFavoravel = total > 0 ? Math.round((favoraveis / total) * 100) : 0;

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center gap-3">
        <FavorabilityAvatar percentual={percentualFavoravel} size={32} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{desembargador.nome}</span>
            <span className="text-xs text-muted-foreground">({desembargador.decisoes.length} decisões)</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-emerald-600 dark:text-emerald-400">{favoraveis} fav</span>
            <span className="text-xs text-red-600 dark:text-red-400">{desfavoraveis} desf</span>
            <Badge variant={percentualFavoravel >= 50 ? "default" : "secondary"} className="text-xs">
              {percentualFavoravel}% favorável
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)} data-testid={`button-expand-${desembargador.id}`}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Processos / Decisões</span>
            <Button variant="outline" size="sm" className="h-7" onClick={() => setShowAddDecisao(true)} data-testid={`button-add-decisao-${desembargador.id}`}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>

          {showAddDecisao && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded mb-2 flex-wrap">
              <Input
                placeholder="Número do processo"
                className="h-8 text-xs flex-1 min-w-[150px]"
                value={newDecisao.numeroProcesso}
                onChange={(e) => setNewDecisao(prev => ({ ...prev, numeroProcesso: e.target.value }))}
                data-testid="input-new-processo"
              />
              <Input
                type="date"
                className="h-8 text-xs w-32"
                value={newDecisao.dataDecisao}
                onChange={(e) => setNewDecisao(prev => ({ ...prev, dataDecisao: e.target.value }))}
                data-testid="input-new-data"
              />
              <Select value={newDecisao.resultado} onValueChange={(v) => setNewDecisao(prev => ({ ...prev, resultado: v }))}>
                <SelectTrigger className="w-32 h-8 text-xs" data-testid="select-new-resultado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAVORÁVEL">Favorável</SelectItem>
                  <SelectItem value="DESFAVORÁVEL">Desfavorável</SelectItem>
                  <SelectItem value="EM ANÁLISE">Em Análise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newDecisao.upi} onValueChange={(v) => setNewDecisao(prev => ({ ...prev, upi: v }))}>
                <SelectTrigger className="w-24 h-8 text-xs" data-testid="select-new-upi">
                  <SelectValue placeholder="UPI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">UPI: Sim</SelectItem>
                  <SelectItem value="nao">UPI: Não</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newDecisao.responsabilidade} onValueChange={(v) => setNewDecisao(prev => ({ ...prev, responsabilidade: v }))}>
                <SelectTrigger className="w-28 h-8 text-xs" data-testid="select-new-responsabilidade">
                  <SelectValue placeholder="Resp." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solidaria">Solidária</SelectItem>
                  <SelectItem value="subsidiaria">Subsidiária</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newDecisao.empresa} onValueChange={(v) => setNewDecisao(prev => ({ ...prev, empresa: v }))}>
                <SelectTrigger className="w-28 h-8 text-xs" data-testid="select-new-empresa">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="V.tal">V.tal</SelectItem>
                  <SelectItem value="OI">OI</SelectItem>
                  <SelectItem value="Serede">Serede</SelectItem>
                  <SelectItem value="Sprink">Sprink</SelectItem>
                  <SelectItem value="Outros Terceiros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8"
                onClick={() => createDecisaoMutation.mutate({ desembargadorId: desembargador.id, ...newDecisao })}
                disabled={!newDecisao.numeroProcesso.trim() || !newDecisao.dataDecisao || createDecisaoMutation.isPending}
                data-testid="button-save-decisao"
              >
                Salvar
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowAddDecisao(false)}>
                Cancelar
              </Button>
            </div>
          )}

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {desembargador.decisoes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhuma decisão registrada</p>
            ) : (
              desembargador.decisoes.map(decisao => (
                <DecisaoItem key={decisao.id} decisao={decisao} onRefresh={onRefresh} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TurmaSection({ turma, onRefresh }: { turma: TurmaComDesembargadores; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-card">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
        data-testid={`turma-header-${turma.id}`}
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Users className="h-4 w-4 text-primary" />
        <span className="font-semibold">{turma.nome}</span>
        <span className="text-sm text-muted-foreground">({turma.desembargadores.length} desembargadores)</span>
      </div>

      {expanded && (
        <div className="p-3 pt-0 space-y-2">
          {turma.desembargadores.map(desembargador => (
            <DesembargadorCard key={desembargador.id} desembargador={desembargador} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function SpreadsheetView({ data, onRefresh }: { data: AdminData | undefined; onRefresh: () => void }) {
  const { toast } = useToast();
  const [empresaFilter, setEmpresaFilter] = useState<string>("todas");
  const [responsabilidadeFilter, setResponsabilidadeFilter] = useState<string>("todas");
  const [resultadoFilter, setResultadoFilter] = useState<string>("todos");
  
  const allDesembargadores: { id: string; nome: string; turma: string; trt: string }[] = [];
  data?.trts.forEach(trt => {
    trt.turmas.forEach(turma => {
      turma.desembargadores.forEach(d => {
        allDesembargadores.push({ id: d.id, nome: d.nome, turma: turma.nome, trt: trt.nome });
      });
    });
  });

  const allDecisoes: (DecisaoRpac & { desembargadorNome: string; turmaNome: string; trtNome: string })[] = [];
  data?.trts.forEach(trt => {
    trt.turmas.forEach(turma => {
      turma.desembargadores.forEach(d => {
        d.decisoes.forEach(dec => {
          allDecisoes.push({ 
            ...dec, 
            desembargadorNome: d.nome, 
            turmaNome: turma.nome, 
            trtNome: trt.nome 
          });
        });
      });
    });
  });

  const filteredDecisoes = allDecisoes.filter(dec => {
    if (empresaFilter !== "todas" && dec.empresa !== empresaFilter) return false;
    if (responsabilidadeFilter !== "todas" && dec.responsabilidade !== responsabilidadeFilter) return false;
    if (resultadoFilter !== "todos") {
      const r = dec.resultado?.toUpperCase() || "";
      if (resultadoFilter === "favoravel" && !r.includes("FAVORÁVEL")) return false;
      if (resultadoFilter === "desfavoravel" && !r.includes("DESFAVORÁVEL")) return false;
    }
    return true;
  });

  const [batchRows, setBatchRows] = useState<Array<{
    desembargadorId: string;
    numeroProcesso: string;
    dataDecisao: string;
    resultado: string;
    upi: string;
    responsabilidade: string;
    empresa: string;
  }>>([{ desembargadorId: "", numeroProcesso: "", dataDecisao: new Date().toISOString().split('T')[0], resultado: "EM ANÁLISE", upi: "nao", responsabilidade: "subsidiaria", empresa: "V.tal" }]);

  const batchMutation = useMutation({
    mutationFn: async (decisoes: typeof batchRows) => {
      const response = await apiRequest("POST", "/api/decisoes/batch", { decisoes });
      return response.json() as Promise<{ success: number; errors: number }>;
    },
    onSuccess: (data: { success: number; errors: number }) => {
      toast({ title: `${data.success} decisões adicionadas` + (data.errors > 0 ? `, ${data.errors} erros` : "") });
      setBatchRows([{ desembargadorId: "", numeroProcesso: "", dataDecisao: new Date().toISOString().split('T')[0], resultado: "EM ANÁLISE", upi: "nao", responsabilidade: "subsidiaria", empresa: "V.tal" }]);
      onRefresh();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar decisões", description: error.message, variant: "destructive" });
    },
  });

  const addRow = () => {
    setBatchRows(prev => [...prev, { desembargadorId: "", numeroProcesso: "", dataDecisao: new Date().toISOString().split('T')[0], resultado: "EM ANÁLISE", upi: "nao", responsabilidade: "subsidiaria", empresa: "V.tal" }]);
  };

  const removeRow = (index: number) => {
    setBatchRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: string, value: string) => {
    setBatchRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const getResultadoColor = (resultado: string) => {
    const r = resultado?.toUpperCase() || "";
    if (r.includes("DESFAVORÁVEL")) return "text-red-600 dark:text-red-400";
    if (r.includes("FAVORÁVEL")) return "text-emerald-600 dark:text-emerald-400";
    return "text-slate-500";
  };

  const validRows = batchRows.filter(r => r.desembargadorId && r.numeroProcesso.trim());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Skip header row, parse remaining rows
        const newRows: Array<{ desembargadorId: string; numeroProcesso: string; dataDecisao: string; resultado: string; upi: string; responsabilidade: string; empresa: string }> = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 2) continue;

          // Expected columns: Desembargador, NumeroProcesso, Data, Resultado, UPI, Responsabilidade, Empresa
          const desembargadorNome = String(row[0] || "").trim();
          const numeroProcesso = String(row[1] || "").trim();
          const dataDecisao = row[2] ? formatExcelDate(row[2]) : new Date().toISOString().split('T')[0];
          const resultado = normalizeResultado(String(row[3] || "EM ANÁLISE"));
          const upi = String(row[4] || "").toLowerCase().includes("sim") ? "sim" : "nao";
          const responsabilidade = String(row[5] || "").toLowerCase().includes("solidária") || String(row[5] || "").toLowerCase().includes("solidaria") ? "solidaria" : "subsidiaria";
          const empresa = normalizeEmpresa(String(row[6] || "V.tal"));

          // Find matching desembargador by name
          const matchingDesemb = allDesembargadores.find(d => 
            d.nome.toLowerCase().includes(desembargadorNome.toLowerCase()) ||
            desembargadorNome.toLowerCase().includes(d.nome.toLowerCase())
          );

          if (matchingDesemb && numeroProcesso) {
            newRows.push({
              desembargadorId: matchingDesemb.id,
              numeroProcesso,
              dataDecisao,
              resultado,
              upi,
              responsabilidade,
              empresa
            });
          }
        }

        const unmatchedDesemb = jsonData.slice(1)
          .filter(row => row && row.length >= 2 && row[1])
          .filter(row => {
            const nome = String(row[0] || "").trim();
            return !allDesembargadores.find(d => 
              d.nome.toLowerCase().includes(nome.toLowerCase()) ||
              nome.toLowerCase().includes(d.nome.toLowerCase())
            );
          })
          .map(row => String(row[0] || "").trim());

        if (newRows.length > 0) {
          setBatchRows(prev => [...prev.filter(r => r.desembargadorId && r.numeroProcesso), ...newRows]);
          if (unmatchedDesemb.length > 0) {
            toast({ 
              title: `${newRows.length} linhas importadas`, 
              description: `${unmatchedDesemb.length} não encontrados: ${unmatchedDesemb.slice(0, 3).join(", ")}${unmatchedDesemb.length > 3 ? "..." : ""}` 
            });
          } else {
            toast({ title: `${newRows.length} linhas importadas do Excel` });
          }
        } else {
          toast({ 
            title: "Nenhuma linha válida encontrada", 
            description: unmatchedDesemb.length > 0 ? `Desembargadores não encontrados: ${unmatchedDesemb.slice(0, 3).join(", ")}` : undefined,
            variant: "destructive" 
          });
        }
      } catch (error) {
        toast({ title: "Erro ao ler arquivo Excel", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const formatExcelDate = (value: unknown): string => {
    if (typeof value === "number") {
      // Excel serial date number
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const normalizeResultado = (value: string): string => {
    const upper = value.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (upper.includes("DESFAVORAVEL")) return "DESFAVORÁVEL";
    if (upper.includes("FAVORAVEL")) return "FAVORÁVEL";
    return "EM ANÁLISE";
  };

  const normalizeEmpresa = (value: string): string => {
    const lower = value.toLowerCase();
    if (lower.includes("v.tal") || lower.includes("vtal")) return "V.tal";
    if (lower.includes("oi")) return "OI";
    if (lower.includes("serede")) return "Serede";
    if (lower.includes("sprink")) return "Sprink";
    if (lower.includes("terceiros") || lower.includes("outros")) return "Outros Terceiros";
    return "V.tal";
  };

  const downloadTemplate = () => {
    const templateData = [
      ["Desembargador", "Numero Processo", "Data (YYYY-MM-DD)", "Resultado", "UPI", "Responsabilidade", "Empresa"],
      ["Nome do Desembargador", "0000000-00.0000.0.00.0000", "2024-01-15", "FAVORÁVEL", "sim", "solidaria", "V.tal"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_decisoes.xlsx");
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Adicionar Decisões em Lote
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleExcelImport}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Importar Excel
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-1" />
              Baixar Template
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Desembargador</th>
                <th className="text-left p-2 font-medium">Nº Processo</th>
                <th className="text-left p-2 font-medium">Data</th>
                <th className="text-left p-2 font-medium">Resultado</th>
                <th className="text-left p-2 font-medium">UPI</th>
                <th className="text-left p-2 font-medium">Resp.</th>
                <th className="text-left p-2 font-medium">Empresa</th>
                <th className="text-left p-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {batchRows.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-1">
                    <Select value={row.desembargadorId} onValueChange={(v) => updateRow(index, "desembargadorId", v)}>
                      <SelectTrigger className="h-8 text-xs w-48">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allDesembargadores.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.nome} ({d.turma})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Input className="h-8 text-xs w-40" value={row.numeroProcesso} onChange={(e) => updateRow(index, "numeroProcesso", e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
                  </td>
                  <td className="p-1">
                    <Input type="date" className="h-8 text-xs w-32" value={row.dataDecisao} onChange={(e) => updateRow(index, "dataDecisao", e.target.value)} />
                  </td>
                  <td className="p-1">
                    <Select value={row.resultado} onValueChange={(v) => updateRow(index, "resultado", v)}>
                      <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FAVORÁVEL">Favorável</SelectItem>
                        <SelectItem value="DESFAVORÁVEL">Desfavorável</SelectItem>
                        <SelectItem value="EM ANÁLISE">Em Análise</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Select value={row.upi} onValueChange={(v) => updateRow(index, "upi", v)}>
                      <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Select value={row.responsabilidade} onValueChange={(v) => updateRow(index, "responsabilidade", v)}>
                      <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solidaria">Solidária</SelectItem>
                        <SelectItem value="subsidiaria">Subsidiária</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Select value={row.empresa} onValueChange={(v) => updateRow(index, "empresa", v)}>
                      <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="V.tal">V.tal</SelectItem>
                        <SelectItem value="OI">OI</SelectItem>
                        <SelectItem value="Serede">Serede</SelectItem>
                        <SelectItem value="Sprink">Sprink</SelectItem>
                        <SelectItem value="Outros Terceiros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRow(index)} disabled={batchRows.length === 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Linha
          </Button>
          <Button size="sm" onClick={() => batchMutation.mutate(validRows)} disabled={validRows.length === 0 || batchMutation.isPending}>
            Salvar {validRows.length} decisão(ões)
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Table className="h-5 w-5" />
            Todas as Decisões ({filteredDecisoes.length})
          </h3>
          <div className="flex items-center gap-2">
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="V.tal">V.tal</SelectItem>
                <SelectItem value="OI">OI</SelectItem>
                <SelectItem value="Serede">Serede</SelectItem>
                <SelectItem value="Sprink">Sprink</SelectItem>
                <SelectItem value="Outros Terceiros">Outros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={responsabilidadeFilter} onValueChange={setResponsabilidadeFilter}>
              <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Resp." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="solidaria">Solidária</SelectItem>
                <SelectItem value="subsidiaria">Subsidiária</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resultadoFilter} onValueChange={setResultadoFilter}>
              <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Resultado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="favoravel">Favorável</SelectItem>
                <SelectItem value="desfavoravel">Desfavorável</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b">
                <th className="text-left p-2 font-medium">TRT</th>
                <th className="text-left p-2 font-medium">Turma</th>
                <th className="text-left p-2 font-medium">Desembargador</th>
                <th className="text-left p-2 font-medium">Nº Processo</th>
                <th className="text-left p-2 font-medium">Data</th>
                <th className="text-left p-2 font-medium">Resultado</th>
                <th className="text-left p-2 font-medium">UPI</th>
                <th className="text-left p-2 font-medium">Resp.</th>
                <th className="text-left p-2 font-medium">Empresa</th>
              </tr>
            </thead>
            <tbody>
              {filteredDecisoes.map((dec) => (
                <tr key={dec.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">{dec.trtNome}</td>
                  <td className="p-2">{dec.turmaNome}</td>
                  <td className="p-2">{dec.desembargadorNome}</td>
                  <td className="p-2 font-mono text-xs">{dec.numeroProcesso}</td>
                  <td className="p-2">{dec.dataDecisao ? new Date(dec.dataDecisao).toLocaleDateString("pt-BR") : "-"}</td>
                  <td className={`p-2 font-semibold ${getResultadoColor(dec.resultado)}`}>{dec.resultado}</td>
                  <td className="p-2">{dec.upi === "sim" ? "Sim" : "Não"}</td>
                  <td className="p-2">{dec.responsabilidade === "solidaria" ? "Solid." : "Subsid."}</td>
                  <td className="p-2">{dec.empresa || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TRTSection({ trt, onRefresh }: { trt: TRTData; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const totalDesembargadores = trt.turmas.reduce((acc, t) => acc + t.desembargadores.length, 0);
  const totalDecisoes = trt.turmas.reduce((acc, t) => acc + t.desembargadores.reduce((a, d) => a + d.decisoes.length, 0), 0);

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
        data-testid={`trt-header-${trt.nome}`}
      >
        {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        <Building2 className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h3 className="font-bold text-lg">{trt.nome}</h3>
          <p className="text-sm text-muted-foreground">
            {trt.turmas.length} turmas • {totalDesembargadores} desembargadores • {totalDecisoes} decisões
          </p>
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-3">
          {trt.turmas.map(turma => (
            <TurmaSection key={turma.id} turma={turma} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AdminMapasPage() {
  const { data, isLoading, refetch } = useQuery<AdminData>({
    queryKey: ["/api/mapa-decisoes/admin"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const totalTRTs = data?.trts.length || 0;
  const totalTurmas = data?.trts.reduce((acc, t) => acc + t.turmas.length, 0) || 0;
  const totalDesembargadores = data?.trts.reduce((acc, t) => acc + t.turmas.reduce((a, tu) => a + tu.desembargadores.length, 0), 0) || 0;
  const totalDecisoes = data?.trts.reduce((acc, t) => acc + t.turmas.reduce((a, tu) => a + tu.desembargadores.reduce((d, de) => d + de.decisoes.length, 0), 0), 0) || 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Database className="h-7 w-7 text-primary" />
            Dados - Mapa de Decisões
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie TRTs, Turmas, Desembargadores e Decisões</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{totalTRTs}</p>
          <p className="text-sm text-muted-foreground">TRTs</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{totalTurmas}</p>
          <p className="text-sm text-muted-foreground">Turmas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{totalDesembargadores}</p>
          <p className="text-sm text-muted-foreground">Desembargadores</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{totalDecisoes}</p>
          <p className="text-sm text-muted-foreground">Decisões</p>
        </Card>
      </div>

      <Tabs defaultValue="arvore" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="arvore" className="flex items-center gap-2" data-testid="tab-arvore">
            <FolderTree className="h-4 w-4" />
            Árvore TRT/Turmas
          </TabsTrigger>
          <TabsTrigger value="planilha" className="flex items-center gap-2" data-testid="tab-planilha">
            <Table className="h-4 w-4" />
            Planilha de Decisões
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="arvore">
          <div className="space-y-4">
            {data?.trts.map(trt => (
              <TRTSection key={trt.nome} trt={trt} onRefresh={() => refetch()} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="planilha">
          <SpreadsheetView data={data} onRefresh={() => refetch()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
