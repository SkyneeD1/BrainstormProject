import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Map, Users, Building2, Plus, Edit2, Trash2, Check, X, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { TRT, MapaDecisoes, Turma, Desembargador } from "@shared/schema";

function TurmasView({ mapa }: { mapa: MapaDecisoes }) {
  const getVotoColor = (voto: string) => {
    const v = voto?.toUpperCase() || "";
    if (v.includes("FAVORÁVEL")) return "bg-emerald-500";
    if (v.includes("DESFAVORÁVEL")) return "bg-red-500";
    if (v === "SUSPEITO") return "bg-orange-500";
    return "bg-slate-400";
  };

  const getVotoTagClass = (voto: string) => {
    const v = voto?.toUpperCase() || "";
    if (v.includes("FAVORÁVEL")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (v.includes("DESFAVORÁVEL")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (v === "SUSPEITO") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  };

  if (mapa.turmas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma turma cadastrada para este TRT</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mapa.turmas.sort((a, b) => a.nome.localeCompare(b.nome)).map((turma) => (
        <Card key={turma.id} className="p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-foreground">{turma.nome}</h2>
          
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Favoráveis</span>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{turma.estatisticas.percentualFavoravel}%</span>
            </div>
            <Progress value={turma.estatisticas.percentualFavoravel} className="h-2.5 bg-slate-200 dark:bg-slate-700" />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Desfavoráveis</span>
              <span className="text-sm font-medium text-red-700 dark:text-red-400">{turma.estatisticas.percentualDesfavoravel}%</span>
            </div>
            <Progress value={turma.estatisticas.percentualDesfavoravel} className="h-2.5 bg-slate-200 dark:bg-slate-700 [&>div]:bg-red-500" />
          </div>
          
          <div className="mb-5">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-muted-foreground">Em Análise</span>
              <span className="text-sm font-medium text-muted-foreground">{turma.estatisticas.percentualEmAnalise}%</span>
            </div>
            <Progress value={turma.estatisticas.percentualEmAnalise} className="h-2.5 bg-slate-200 dark:bg-slate-700 [&>div]:bg-slate-400" />
          </div>
          
          <div className="mt-auto border-t pt-4">
            <h3 className="font-semibold mb-2 text-muted-foreground">Membros ({turma.desembargadores.length}):</h3>
            <ul className="space-y-2 max-h-[200px] overflow-y-auto">
              {turma.desembargadores.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${getVotoColor(d.voto)} flex-shrink-0`} />
                    <span className="text-sm text-foreground">{d.nome}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getVotoTagClass(d.voto)}`}>
                    {d.voto}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DesembargadoresView({ mapa }: { mapa: MapaDecisoes }) {
  const { estatisticasGerais } = mapa;
  const allDesembargadores = mapa.turmas.flatMap(t => 
    t.desembargadores.map(d => ({ ...d, turmaNome: t.nome }))
  );

  const getVotoColor = (voto: string) => {
    const v = voto?.toUpperCase() || "";
    if (v.includes("FAVORÁVEL")) return "bg-emerald-500";
    if (v.includes("DESFAVORÁVEL")) return "bg-red-500";
    if (v === "SUSPEITO") return "bg-orange-500";
    return "bg-slate-400";
  };

  const getVotoTagClass = (voto: string) => {
    const v = voto?.toUpperCase() || "";
    if (v.includes("FAVORÁVEL")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (v.includes("DESFAVORÁVEL")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (v === "SUSPEITO") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center text-foreground">Visão Geral - Todos os Desembargadores</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{estatisticasGerais.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{estatisticasGerais.favoraveis}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Favoráveis</p>
          </div>
          <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{estatisticasGerais.desfavoraveis}</p>
            <p className="text-xs text-red-600 dark:text-red-500">Desfavoráveis</p>
          </div>
          <div className="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{estatisticasGerais.emAnalise}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Em Análise</p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Favoráveis</span>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{estatisticasGerais.percentualFavoravel}%</span>
          </div>
          <Progress value={estatisticasGerais.percentualFavoravel} className="h-3 bg-slate-200 dark:bg-slate-700" />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-red-700 dark:text-red-400">Desfavoráveis</span>
            <span className="text-sm font-medium text-red-700 dark:text-red-400">{estatisticasGerais.percentualDesfavoravel}%</span>
          </div>
          <Progress value={estatisticasGerais.percentualDesfavoravel} className="h-3 bg-slate-200 dark:bg-slate-700 [&>div]:bg-red-500" />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Lista de Desembargadores ({allDesembargadores.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-xs uppercase text-muted-foreground">Status</th>
                <th className="text-left py-2 px-3 text-xs uppercase text-muted-foreground">Nome</th>
                <th className="text-left py-2 px-3 text-xs uppercase text-muted-foreground">Turma</th>
                <th className="text-left py-2 px-3 text-xs uppercase text-muted-foreground">Voto</th>
              </tr>
            </thead>
            <tbody>
              {allDesembargadores.sort((a, b) => a.nome.localeCompare(b.nome)).map((d) => (
                <tr key={d.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3">
                    <span className={`w-3 h-3 rounded-full ${getVotoColor(d.voto)} inline-block`} />
                  </td>
                  <td className="py-2 px-3 font-medium">{d.nome}</td>
                  <td className="py-2 px-3 text-muted-foreground">{d.turmaNome}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getVotoTagClass(d.voto)}`}>
                      {d.voto}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TRTSelector({ trts, selectedTrtId, onSelect }: { 
  trts: TRT[]; 
  selectedTrtId: string | null; 
  onSelect: (id: string) => void;
}) {
  return (
    <Select value={selectedTrtId || ""} onValueChange={onSelect}>
      <SelectTrigger className="w-full md:w-[300px]" data-testid="select-trt">
        <SelectValue placeholder="Selecione um TRT" />
      </SelectTrigger>
      <SelectContent>
        {trts.map((trt) => (
          <SelectItem key={trt.id} value={trt.id} data-testid={`select-trt-${trt.id}`}>
            TRT {trt.numero} - {trt.uf}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AdminPanel({ selectedTrtId, onDataChanged }: { selectedTrtId: string | null; onDataChanged: () => void }) {
  const { toast } = useToast();
  const [newTurmaNome, setNewTurmaNome] = useState("");
  const [newDesembargador, setNewDesembargador] = useState({ nome: "", turmaId: "", voto: "EM ANÁLISE" });
  const [dialogOpen, setDialogOpen] = useState<"turma" | "desembargador" | null>(null);

  const { data: turmas } = useQuery<Turma[]>({
    queryKey: ["/api/trts", selectedTrtId, "turmas"],
    enabled: !!selectedTrtId,
  });

  const createTurmaMutation = useMutation({
    mutationFn: async (data: { trtId: string; nome: string }) => {
      return apiRequest("POST", "/api/turmas", data);
    },
    onSuccess: () => {
      toast({ title: "Turma criada com sucesso" });
      setNewTurmaNome("");
      setDialogOpen(null);
      onDataChanged();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar turma", description: error.message, variant: "destructive" });
    },
  });

  const createDesembargadorMutation = useMutation({
    mutationFn: async (data: { turmaId: string; nome: string; voto: string }) => {
      return apiRequest("POST", "/api/desembargadores", data);
    },
    onSuccess: () => {
      toast({ title: "Desembargador criado com sucesso" });
      setNewDesembargador({ nome: "", turmaId: "", voto: "EM ANÁLISE" });
      setDialogOpen(null);
      onDataChanged();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar desembargador", description: error.message, variant: "destructive" });
    },
  });

  if (!selectedTrtId) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={dialogOpen === "turma"} onOpenChange={(open) => setDialogOpen(open ? "turma" : null)}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" data-testid="button-add-turma">
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Nome da turma (ex: 1ª Turma)"
              value={newTurmaNome}
              onChange={(e) => setNewTurmaNome(e.target.value)}
              data-testid="input-turma-nome"
            />
            <Button
              onClick={() => createTurmaMutation.mutate({ trtId: selectedTrtId, nome: newTurmaNome })}
              disabled={!newTurmaNome.trim() || createTurmaMutation.isPending}
              data-testid="button-save-turma"
            >
              {createTurmaMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen === "desembargador"} onOpenChange={(open) => setDialogOpen(open ? "desembargador" : null)}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" data-testid="button-add-desembargador">
            <Plus className="h-4 w-4 mr-2" />
            Novo Desembargador
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Desembargador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={newDesembargador.turmaId} onValueChange={(v) => setNewDesembargador(prev => ({ ...prev, turmaId: v }))}>
              <SelectTrigger data-testid="select-desembargador-turma">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Nome do desembargador"
              value={newDesembargador.nome}
              onChange={(e) => setNewDesembargador(prev => ({ ...prev, nome: e.target.value }))}
              data-testid="input-desembargador-nome"
            />
            <Select value={newDesembargador.voto} onValueChange={(v) => setNewDesembargador(prev => ({ ...prev, voto: v }))}>
              <SelectTrigger data-testid="select-desembargador-voto">
                <SelectValue placeholder="Status do voto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FAVORÁVEL">Favorável</SelectItem>
                <SelectItem value="DESFAVORÁVEL">Desfavorável</SelectItem>
                <SelectItem value="EM ANÁLISE">Em Análise</SelectItem>
                <SelectItem value="SUSPEITO">Suspeito</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => createDesembargadorMutation.mutate(newDesembargador)}
              disabled={!newDesembargador.nome.trim() || !newDesembargador.turmaId || createDesembargadorMutation.isPending}
              data-testid="button-save-desembargador"
            >
              {createDesembargadorMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MapaDecisoesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedTrtId, setSelectedTrtId] = useState<string | null>(null);

  const { data: trts, isLoading: loadingTrts } = useQuery<TRT[]>({
    queryKey: ["/api/trts"],
  });

  const { data: mapa, isLoading: loadingMapa, refetch: refetchMapa } = useQuery<MapaDecisoes>({
    queryKey: ["/api/mapa-decisoes", selectedTrtId],
    enabled: !!selectedTrtId,
  });

  const handleDataChanged = () => {
    refetchMapa();
    queryClient.invalidateQueries({ queryKey: ["/api/trts", selectedTrtId, "turmas"] });
  };

  if (loadingTrts) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
          <Map className="h-8 w-8 text-primary" />
          Mapa de Decisões
        </h1>
        {mapa && (
          <p className="mt-2 text-xl text-primary font-semibold">
            TRT {mapa.trt.numero} - {mapa.trt.nome}
          </p>
        )}
      </header>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <TRTSelector 
          trts={trts || []} 
          selectedTrtId={selectedTrtId} 
          onSelect={setSelectedTrtId} 
        />
        
        <div className="flex items-center gap-2">
          {isAdmin && <AdminPanel selectedTrtId={selectedTrtId} onDataChanged={handleDataChanged} />}
          <Button variant="ghost" size="sm" onClick={() => refetchMapa()} data-testid="button-refresh-mapa">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!selectedTrtId ? (
        <Card className="p-12 text-center">
          <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">Selecione um TRT</h2>
          <p className="text-muted-foreground">Escolha uma região para visualizar o mapa de decisões</p>
        </Card>
      ) : loadingMapa ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : mapa ? (
        <Tabs defaultValue="turmas" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-card shadow-md">
              <TabsTrigger value="turmas" className="text-lg font-semibold px-6" data-testid="tab-turmas">
                Turmas
              </TabsTrigger>
              <TabsTrigger value="desembargadores" className="text-lg font-semibold px-6" data-testid="tab-desembargadores">
                Desembargadores
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="turmas">
            <TurmasView mapa={mapa} />
          </TabsContent>

          <TabsContent value="desembargadores">
            <DesembargadoresView mapa={mapa} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Não foi possível carregar o mapa de decisões</p>
        </Card>
      )}
    </div>
  );
}
