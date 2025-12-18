import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Database, ChevronDown, ChevronRight, Plus, Edit2, Trash2, RefreshCw, Users, Building2, Gavel } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DecisaoRpac } from "@shared/schema";

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
  const [editData, setEditData] = useState({ resultado: decisao.resultado, observacoes: decisao.observacoes || "" });

  const updateMutation = useMutation({
    mutationFn: async (data: { resultado: string; observacoes?: string }) => apiRequest("PATCH", `/api/decisoes/${decisao.id}`, data),
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
    if (r.includes("FAVORÁVEL")) return "text-emerald-600 dark:text-emerald-400";
    if (r.includes("DESFAVORÁVEL")) return "text-red-600 dark:text-red-400";
    return "text-slate-500";
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted rounded">
        <span className="text-xs flex-1">{decisao.numeroProcesso}</span>
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
  const [newDecisao, setNewDecisao] = useState({ numeroProcesso: "", resultado: "EM ANÁLISE" });

  const createDecisaoMutation = useMutation({
    mutationFn: async (data: { desembargadorId: string; numeroProcesso: string; resultado: string }) => apiRequest("POST", "/api/decisoes", data),
    onSuccess: () => {
      toast({ title: "Decisão adicionada" });
      setNewDecisao({ numeroProcesso: "", resultado: "EM ANÁLISE" });
      setShowAddDecisao(false);
      onRefresh();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar decisão", description: error.message, variant: "destructive" });
    },
  });

  const updateVotoMutation = useMutation({
    mutationFn: async (voto: string) => apiRequest("PATCH", `/api/desembargadores/${desembargador.id}`, { voto }),
    onSuccess: () => {
      toast({ title: "Status atualizado" });
      onRefresh();
    },
  });

  const getVotoColor = (voto: string) => {
    const v = voto?.toUpperCase() || "";
    if (v.includes("FAVORÁVEL")) return "bg-emerald-500";
    if (v.includes("DESFAVORÁVEL")) return "bg-red-500";
    if (v === "SUSPEITO") return "bg-orange-500";
    return "bg-slate-400";
  };

  const favoraveis = desembargador.decisoes.filter(d => d.resultado?.toUpperCase().includes('FAVORÁVEL')).length;
  const desfavoraveis = desembargador.decisoes.filter(d => d.resultado?.toUpperCase().includes('DESFAVORÁVEL')).length;

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${getVotoColor(desembargador.voto)} flex-shrink-0`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{desembargador.nome}</span>
            <span className="text-xs text-muted-foreground">({desembargador.decisoes.length} decisões)</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-emerald-600 dark:text-emerald-400">{favoraveis} fav</span>
            <span className="text-xs text-red-600 dark:text-red-400">{desfavoraveis} desf</span>
          </div>
        </div>
        <Select value={desembargador.voto} onValueChange={(v) => updateVotoMutation.mutate(v)}>
          <SelectTrigger className="w-32 h-8 text-xs" data-testid={`select-voto-${desembargador.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FAVORÁVEL">Favorável</SelectItem>
            <SelectItem value="DESFAVORÁVEL">Desfavorável</SelectItem>
            <SelectItem value="EM ANÁLISE">Em Análise</SelectItem>
            <SelectItem value="SUSPEITO">Suspeito</SelectItem>
          </SelectContent>
        </Select>
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
            <div className="flex items-center gap-2 p-2 bg-muted rounded mb-2">
              <Input
                placeholder="Número do processo"
                className="h-8 text-xs flex-1"
                value={newDecisao.numeroProcesso}
                onChange={(e) => setNewDecisao(prev => ({ ...prev, numeroProcesso: e.target.value }))}
                data-testid="input-new-processo"
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
              <Button
                size="sm"
                className="h-8"
                onClick={() => createDecisaoMutation.mutate({ desembargadorId: desembargador.id, ...newDecisao })}
                disabled={!newDecisao.numeroProcesso.trim() || createDecisaoMutation.isPending}
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

      <div className="space-y-4">
        {data?.trts.map(trt => (
          <TRTSection key={trt.nome} trt={trt} onRefresh={() => refetch()} />
        ))}
      </div>
    </div>
  );
}
