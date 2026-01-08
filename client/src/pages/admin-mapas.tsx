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

// Label configuration for different instances
function getLabels(instancia: "primeira" | "segunda") {
  if (instancia === "primeira") {
    return {
      pageTitle: "1ª Instância",
      level1: "Comarca",
      level1Plural: "Comarcas",
      level2: "Vara",
      level2Plural: "Varas",
      level3: "Juiz",
      level3Plural: "Juízes",
      level3Short: "juiz",
      description: "Gerencie Comarcas, Varas, Juízes e Decisões",
      treeTab: "Árvore Comarca/Varas",
      spreadsheetColumn: "Juiz",
    };
  }
  return {
    pageTitle: "2ª Instância",
    level1: "TRT",
    level1Plural: "TRTs",
    level2: "Turma",
    level2Plural: "Turmas",
    level3: "Desembargador",
    level3Plural: "Desembargadores",
    level3Short: "desemb",
    description: "Gerencie TRTs, Turmas, Desembargadores e Decisões",
    treeTab: "Árvore TRT/Turmas",
    spreadsheetColumn: "Desembargador",
  };
}

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

function DesembargadorCard({ desembargador, onRefresh, labels }: { desembargador: DesembargadorComDecisoes; onRefresh: () => void; labels: Labels }) {
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

  const deleteDesembMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/desembargadores/${desembargador.id}`),
    onSuccess: () => {
      toast({ title: `${labels.level3} excluído` });
      onRefresh();
    },
    onError: () => {
      toast({ title: `Erro ao excluir ${labels.level3.toLowerCase()}`, variant: "destructive" });
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" data-testid={`button-delete-desemb-${desembargador.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {labels.level3}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação excluirá "{desembargador.nome}" e todas as decisões associadas. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteDesembMutation.mutate()}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

type Labels = ReturnType<typeof getLabels>;

function TurmaSection({ turma, onRefresh, labels }: { turma: TurmaComDesembargadores; onRefresh: () => void; labels: Labels }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showAddDesemb, setShowAddDesemb] = useState(false);
  const [newDesembNome, setNewDesembNome] = useState("");

  const createDesembMutation = useMutation({
    mutationFn: async (data: { nome: string; turmaId: string }) => apiRequest("POST", "/api/desembargadores", data),
    onSuccess: () => {
      toast({ title: `${labels.level3} criado com sucesso` });
      setShowAddDesemb(false);
      setNewDesembNome("");
      onRefresh();
    },
    onError: () => {
      toast({ title: `Erro ao criar ${labels.level3.toLowerCase()}`, variant: "destructive" });
    },
  });

  const deleteTurmaMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/turmas/${turma.id}`),
    onSuccess: () => {
      toast({ title: `${labels.level2} excluída` });
      onRefresh();
    },
    onError: () => {
      toast({ title: `Erro ao excluir ${labels.level2.toLowerCase()}`, variant: "destructive" });
    },
  });

  const sortedDesembargadores = [...turma.desembargadores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return (
    <div className="border rounded-lg bg-card">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
        data-testid={`turma-header-${turma.id}`}
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Users className="h-4 w-4 text-primary" />
        <span className="font-semibold flex-1">{turma.nome}</span>
        <span className="text-sm text-muted-foreground">({turma.desembargadores.length} {labels.level3Plural.toLowerCase()})</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); setShowAddDesemb(true); setExpanded(true); }}
          data-testid={`button-add-desemb-${turma.id}`}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-delete-turma-${turma.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {labels.level2}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação excluirá "{turma.nome}" e todos os {labels.level3Plural.toLowerCase()} associados. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteTurmaMutation.mutate()}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {expanded && (
        <div className="p-3 pt-0 space-y-2">
          {showAddDesemb && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Input
                placeholder={`Nome do ${labels.level3.toLowerCase()}...`}
                value={newDesembNome}
                onChange={(e) => setNewDesembNome(e.target.value)}
                className="flex-1 h-8"
                data-testid="input-new-desemb-nome"
              />
              <Button
                size="sm"
                className="h-8"
                onClick={() => createDesembMutation.mutate({ nome: newDesembNome, turmaId: turma.id })}
                disabled={!newDesembNome.trim() || createDesembMutation.isPending}
                data-testid="button-save-desemb"
              >
                Salvar
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowAddDesemb(false); setNewDesembNome(""); }}>
                Cancelar
              </Button>
            </div>
          )}
          {sortedDesembargadores.map(desembargador => (
            <DesembargadorCard key={desembargador.id} desembargador={desembargador} onRefresh={onRefresh} labels={labels} />
          ))}
        </div>
      )}
    </div>
  );
}

function SpreadsheetView({ data, onRefresh, labels }: { data: AdminData | undefined; onRefresh: () => void; labels: Labels }) {
  const { toast } = useToast();
  const [empresaFilter, setEmpresaFilter] = useState<string>("todas");
  const [responsabilidadeFilter, setResponsabilidadeFilter] = useState<string>("todas");
  const [resultadoFilter, setResultadoFilter] = useState<string>("todos");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
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

  const smartImportMutation = useMutation({
    mutationFn: async (decisoes: Array<{ dataDecisao: string; numeroProcesso: string; local: string; turma: string; relator: string; resultado: string; responsabilidade: string; upi: string; empresa: string }>) => {
      const response = await apiRequest("POST", "/api/decisoes/smart-import", { decisoes });
      return response.json() as Promise<{ success: number; errors: number; turmasCreated: number; desembargadoresCreated: number; errorDetails: Array<{ index: number; error: string }> }>;
    },
    onSuccess: (data) => {
      let message = `${data.success} decisões importadas`;
      if (data.turmasCreated > 0) message += `, ${data.turmasCreated} turmas criadas`;
      if (data.desembargadoresCreated > 0) message += `, ${data.desembargadoresCreated} desembargadores criados`;
      if (data.errors > 0) message += `, ${data.errors} erros`;
      toast({ title: message });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao importar decisões", description: error.message, variant: "destructive" });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest("DELETE", "/api/decisoes/batch", { ids });
      return response.json() as Promise<{ success: boolean; deleted: number }>;
    },
    onSuccess: (data) => {
      toast({ title: `${data.deleted} decisões excluídas` });
      setSelectedIds(new Set());
      onRefresh();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir decisões", description: error.message, variant: "destructive" });
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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDecisoes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDecisoes.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        // New column structure: Data, Numero Processo, Local, Turma, Relator, Resultado, Responsabilidade, UPI, Empresa
        const decisoesToImport: Array<{ dataDecisao: string; numeroProcesso: string; local: string; turma: string; relator: string; resultado: string; responsabilidade: string; upi: string; empresa: string }> = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 5) continue;

          const dataDecisao = row[0] ? formatExcelDate(row[0]) : "";
          const numeroProcesso = String(row[1] || "").trim();
          const local = String(row[2] || "").trim();
          const turma = String(row[3] || "").trim();
          const relator = String(row[4] || "").trim();
          const resultado = normalizeResultado(String(row[5] || "EM ANÁLISE"));
          // Normalize responsabilidade - remove accents and check for "solidaria"
          const respRaw = String(row[6] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const responsabilidade = respRaw.includes("solidaria") ? "solidaria" : "subsidiaria";
          const upi = String(row[7] || "").toLowerCase().includes("sim") ? "sim" : "nao";
          const empresa = normalizeEmpresa(String(row[8] || "V.tal"));

          // Only require turma, relator and numeroProcesso
          if (turma && relator && numeroProcesso) {
            decisoesToImport.push({
              dataDecisao,
              numeroProcesso,
              local,
              turma,
              relator,
              resultado,
              responsabilidade,
              upi,
              empresa
            });
          }
        }

        if (decisoesToImport.length > 0) {
          // Use smart import endpoint - auto-creates turmas and desembargadores
          smartImportMutation.mutate(decisoesToImport);
        } else {
          toast({ 
            title: "Nenhuma linha válida encontrada", 
            description: "Verifique se a planilha contém as colunas: Data, Nº Processo, Local, Turma, Relator, Resultado, Responsabilidade, UPI, Empresa",
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
    if (lower.includes("nio")) return "NIO";
    if (lower.includes("oi")) return "OI";
    if (lower.includes("serede")) return "Serede";
    if (lower.includes("sprink")) return "Sprink";
    if (lower.includes("terceiros") || lower.includes("outros")) return "Outros Terceiros";
    return "V.tal";
  };

  const downloadTemplate = () => {
    const templateData = [
      ["Data (DD/MM/AAAA)", "Numero Processo", "Local", "Turma", "Relator", "Resultado", "Responsabilidade", "UPI", "Empresa"],
      ["15/01/2024", "0000000-00.0000.0.00.0000", "TRT-2", "1ª Turma", "Nome do Relator", "FAVORÁVEL", "subsidiaria", "nao", "V.tal"],
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
                <th className="text-left p-2 font-medium">Data</th>
                <th className="text-left p-2 font-medium">Nº Processo</th>
                <th className="text-left p-2 font-medium">{labels.level3}</th>
                <th className="text-left p-2 font-medium">Resultado</th>
                <th className="text-left p-2 font-medium">Responsabilidade</th>
                <th className="text-left p-2 font-medium">UPI</th>
                <th className="text-left p-2 font-medium">Empresa</th>
                <th className="text-left p-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {batchRows.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-1">
                    <Input type="date" className="h-8 text-xs w-32" value={row.dataDecisao} onChange={(e) => updateRow(index, "dataDecisao", e.target.value)} />
                  </td>
                  <td className="p-1">
                    <Input className="h-8 text-xs w-40" value={row.numeroProcesso} onChange={(e) => updateRow(index, "numeroProcesso", e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
                  </td>
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
                    <Select value={row.responsabilidade} onValueChange={(v) => updateRow(index, "responsabilidade", v)}>
                      <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solidaria">Solidária</SelectItem>
                        <SelectItem value="subsidiaria">Subsidiária</SelectItem>
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
                    <Select value={row.empresa} onValueChange={(v) => updateRow(index, "empresa", v)}>
                      <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="V.tal">V.tal</SelectItem>
                        <SelectItem value="NIO">NIO</SelectItem>
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
            {selectedIds.size > 0 && (
              <Badge variant="secondary" className="ml-2">{selectedIds.size} selecionada(s)</Badge>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" data-testid="button-delete-selected">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir Selecionados ({selectedIds.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir {selectedIds.size} decisões?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação excluirá permanentemente {selectedIds.size} decisão(ões) selecionada(s). Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => batchDeleteMutation.mutate(Array.from(selectedIds))}
                      disabled={batchDeleteMutation.isPending}
                    >
                      {batchDeleteMutation.isPending ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="V.tal">V.tal</SelectItem>
                <SelectItem value="NIO">NIO</SelectItem>
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
                <th className="text-left p-2 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={filteredDecisoes.length > 0 && selectedIds.size === filteredDecisoes.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                    data-testid="checkbox-select-all"
                  />
                </th>
                <th className="text-left p-2 font-medium">Data</th>
                <th className="text-left p-2 font-medium">Nº Processo</th>
                <th className="text-left p-2 font-medium">Local</th>
                <th className="text-left p-2 font-medium">Turma</th>
                <th className="text-left p-2 font-medium">Relator</th>
                <th className="text-left p-2 font-medium">Resultado</th>
                <th className="text-left p-2 font-medium">Responsabilidade</th>
                <th className="text-left p-2 font-medium">UPI</th>
                <th className="text-left p-2 font-medium">Empresa</th>
              </tr>
            </thead>
            <tbody>
              {filteredDecisoes.map((dec) => (
                <tr key={dec.id} className={`border-b hover:bg-muted/50 ${selectedIds.has(dec.id) ? 'bg-muted/30' : ''}`}>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(dec.id)}
                      onChange={() => toggleSelect(dec.id)}
                      className="h-4 w-4 rounded border-gray-300"
                      data-testid={`checkbox-decisao-${dec.id}`}
                    />
                  </td>
                  <td className="p-2">{dec.dataDecisao ? new Date(dec.dataDecisao).toLocaleDateString("pt-BR") : "-"}</td>
                  <td className="p-2 font-mono text-xs">{dec.numeroProcesso}</td>
                  <td className="p-2">{dec.trtNome}</td>
                  <td className="p-2">{dec.turmaNome}</td>
                  <td className="p-2">{dec.desembargadorNome}</td>
                  <td className={`p-2 font-semibold ${getResultadoColor(dec.resultado)}`}>{dec.resultado}</td>
                  <td className="p-2">{dec.responsabilidade === "solidaria" ? "Solidária" : "Subsidiária"}</td>
                  <td className="p-2">{dec.upi === "sim" ? "Sim" : "Não"}</td>
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

function TRTSection({ trt, onRefresh, labels, instancia }: { trt: TRTData; onRefresh: () => void; labels: Labels; instancia: string }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showAddTurma, setShowAddTurma] = useState(false);
  const [newTurmaNome, setNewTurmaNome] = useState("");

  const totalLevel3 = trt.turmas.reduce((acc, t) => acc + t.desembargadores.length, 0);
  const totalDecisoes = trt.turmas.reduce((acc, t) => acc + t.desembargadores.reduce((a, d) => a + d.decisoes.length, 0), 0);

  const createTurmaMutation = useMutation({
    mutationFn: async (data: { nome: string; regiao: string; instancia: string }) => apiRequest("POST", "/api/turmas", data),
    onSuccess: () => {
      toast({ title: `${labels.level2} criada com sucesso` });
      setShowAddTurma(false);
      setNewTurmaNome("");
      onRefresh();
    },
    onError: () => {
      toast({ title: `Erro ao criar ${labels.level2.toLowerCase()}`, variant: "destructive" });
    },
  });

  const sortedTurmas = [...trt.turmas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));

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
            {trt.turmas.length} {labels.level2Plural.toLowerCase()} • {totalLevel3} {labels.level3Plural.toLowerCase()} • {totalDecisoes} decisões
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => { e.stopPropagation(); setShowAddTurma(true); setExpanded(true); }}
          data-testid={`button-add-turma-${trt.nome}`}
        >
          <Plus className="h-4 w-4 mr-1" />
          {labels.level2}
        </Button>
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-3">
          {showAddTurma && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Input
                placeholder={`Nome da ${labels.level2.toLowerCase()}...`}
                value={newTurmaNome}
                onChange={(e) => setNewTurmaNome(e.target.value)}
                className="flex-1"
                data-testid="input-new-turma-nome"
              />
              <Button
                size="sm"
                onClick={() => createTurmaMutation.mutate({ nome: newTurmaNome, regiao: trt.nome, instancia })}
                disabled={!newTurmaNome.trim() || createTurmaMutation.isPending}
                data-testid="button-save-turma"
              >
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAddTurma(false); setNewTurmaNome(""); }}>
                Cancelar
              </Button>
            </div>
          )}
          {sortedTurmas.map(turma => (
            <TurmaSection key={turma.id} turma={turma} onRefresh={onRefresh} labels={labels} />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AdminMapasPage() {
  const { toast } = useToast();
  const [instanciaTab, setInstanciaTab] = useState<string>("segunda");
  const [showAddTRT, setShowAddTRT] = useState(false);
  const [newTRTNome, setNewTRTNome] = useState("");
  const [newTurmaNome, setNewTurmaNome] = useState("");

  const { data, isLoading, refetch } = useQuery<AdminData>({
    queryKey: ["/api/mapa-decisoes/admin", instanciaTab],
    queryFn: async ({ queryKey }) => {
      const inst = queryKey[1] as string;
      const res = await fetch(`/api/mapa-decisoes/admin?instancia=${inst}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch admin data');
      return res.json();
    },
  });

  const createTRTMutation = useMutation({
    mutationFn: async (data: { nome: string; regiao: string; instancia: string }) => apiRequest("POST", "/api/turmas", data),
    onSuccess: () => {
      const labels = getLabels(instanciaTab as "primeira" | "segunda");
      toast({ title: `${labels.level1} criado com sucesso` });
      setShowAddTRT(false);
      setNewTRTNome("");
      setNewTurmaNome("");
      refetch();
    },
    onError: () => {
      const labels = getLabels(instanciaTab as "primeira" | "segunda");
      toast({ title: `Erro ao criar ${labels.level1.toLowerCase()}`, variant: "destructive" });
    },
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

  const labels = getLabels(instanciaTab as "primeira" | "segunda");
  const totalLevel1 = data?.trts.length || 0;
  const totalLevel2 = data?.trts.reduce((acc, t) => acc + t.turmas.length, 0) || 0;
  const totalLevel3 = data?.trts.reduce((acc, t) => acc + t.turmas.reduce((a, tu) => a + tu.desembargadores.length, 0), 0) || 0;
  const totalDecisoes = data?.trts.reduce((acc, t) => acc + t.turmas.reduce((a, tu) => a + tu.desembargadores.reduce((d, de) => d + de.decisoes.length, 0), 0), 0) || 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Database className="h-7 w-7 text-primary" />
            Dados - {labels.pageTitle}
          </h1>
          <p className="text-muted-foreground mt-1">{labels.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={instanciaTab} onValueChange={setInstanciaTab}>
            <TabsList>
              <TabsTrigger value="primeira" data-testid="tab-primeira-instancia">1ª Instância</TabsTrigger>
              <TabsTrigger value="segunda" data-testid="tab-segunda-instancia">2ª Instância</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{totalLevel1}</p>
          <p className="text-sm text-muted-foreground">{labels.level1Plural}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{totalLevel2}</p>
          <p className="text-sm text-muted-foreground">{labels.level2Plural}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{totalLevel3}</p>
          <p className="text-sm text-muted-foreground">{labels.level3Plural}</p>
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
            {labels.treeTab}
          </TabsTrigger>
          <TabsTrigger value="planilha" className="flex items-center gap-2" data-testid="tab-planilha">
            <Table className="h-4 w-4" />
            Planilha de Decisões
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="arvore">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showAddTRT} onOpenChange={setShowAddTRT}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-add-trt">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo {labels.level1}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo {labels.level1}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do {labels.level1}</label>
                      <Input
                        placeholder={`Ex: ${instanciaTab === 'segunda' ? 'TRT - 1' : 'Comarca de São Paulo'}`}
                        value={newTRTNome}
                        onChange={(e) => setNewTRTNome(e.target.value)}
                        data-testid="input-new-trt-nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primeira {labels.level2} (opcional)</label>
                      <Input
                        placeholder={`Ex: ${instanciaTab === 'segunda' ? '1ª Turma' : '1ª Vara do Trabalho'}`}
                        value={newTurmaNome}
                        onChange={(e) => setNewTurmaNome(e.target.value)}
                        data-testid="input-new-trt-turma"
                      />
                      <p className="text-xs text-muted-foreground">
                        Para criar um {labels.level1}, é necessário criar pelo menos uma {labels.level2}.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => { setShowAddTRT(false); setNewTRTNome(""); setNewTurmaNome(""); }}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => createTRTMutation.mutate({ nome: newTurmaNome || `${labels.level2} 1`, regiao: newTRTNome, instancia: instanciaTab })}
                      disabled={!newTRTNome.trim() || createTRTMutation.isPending}
                      data-testid="button-save-trt"
                    >
                      Criar {labels.level1}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {[...(data?.trts || [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true })).map(trt => (
              <TRTSection key={trt.nome} trt={trt} onRefresh={() => refetch()} labels={labels} instancia={instanciaTab} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="planilha">
          <SpreadsheetView data={data} onRefresh={() => refetch()} labels={labels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
