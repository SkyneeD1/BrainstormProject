import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Map, Users, Building2, Plus, Edit2, Trash2, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { MapaDecisoes, Turma, Desembargador, TurmaComDesembargadores } from "@shared/schema";

function TurmasView({ turmas, isAdmin, onRefresh }: { turmas: TurmaComDesembargadores[]; isAdmin: boolean; onRefresh: () => void }) {
  const { toast } = useToast();
  const [editingTurma, setEditingTurma] = useState<{id: string; nome: string; regiao: string} | null>(null);

  const deleteTurmaMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/turmas/${id}`),
    onSuccess: () => {
      toast({ title: "Turma excluída com sucesso" });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir turma", description: error.message, variant: "destructive" });
    },
  });

  const updateTurmaMutation = useMutation({
    mutationFn: async (data: { id: string; nome: string; regiao: string }) => {
      return apiRequest("PATCH", `/api/turmas/${data.id}`, { nome: data.nome, regiao: data.regiao });
    },
    onSuccess: () => {
      toast({ title: "Turma atualizada com sucesso" });
      setEditingTurma(null);
      onRefresh();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar turma", description: error.message, variant: "destructive" });
    },
  });

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

  if (turmas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma turma cadastrada</p>
        {isAdmin && <p className="text-sm mt-2">Clique em "Nova Turma" para adicionar</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {turmas.sort((a, b) => a.nome.localeCompare(b.nome)).map((turma) => (
        <Card key={turma.id} className="p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{turma.nome}</h2>
              {turma.regiao && <p className="text-sm text-muted-foreground">{turma.regiao}</p>}
            </div>
            {isAdmin && (
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setEditingTurma({ id: turma.id, nome: turma.nome, regiao: turma.regiao || "" })}
                  data-testid={`button-edit-turma-${turma.id}`}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" data-testid={`button-delete-turma-${turma.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a turma "{turma.nome}"? Todos os desembargadores associados serão excluídos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTurmaMutation.mutate(turma.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          
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

      <Dialog open={!!editingTurma} onOpenChange={(open) => !open && setEditingTurma(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
          </DialogHeader>
          {editingTurma && (
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nome da turma"
                value={editingTurma.nome}
                onChange={(e) => setEditingTurma(prev => prev ? { ...prev, nome: e.target.value } : null)}
                data-testid="input-edit-turma-nome"
              />
              <Input
                placeholder="Região (opcional)"
                value={editingTurma.regiao}
                onChange={(e) => setEditingTurma(prev => prev ? { ...prev, regiao: e.target.value } : null)}
                data-testid="input-edit-turma-regiao"
              />
              <DialogFooter>
                <Button
                  onClick={() => editingTurma && updateTurmaMutation.mutate(editingTurma)}
                  disabled={!editingTurma.nome.trim() || updateTurmaMutation.isPending}
                  data-testid="button-save-edit-turma"
                >
                  {updateTurmaMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DesembargadoresView({ turmas, isAdmin, onRefresh }: { turmas: TurmaComDesembargadores[]; isAdmin: boolean; onRefresh: () => void }) {
  const { toast } = useToast();
  const [editingDesembargador, setEditingDesembargador] = useState<{id: string; nome: string; voto: string; turmaId: string} | null>(null);

  const allDesembargadores = turmas.flatMap(t => 
    t.desembargadores.map(d => ({ ...d, turmaNome: t.nome, turmaId: t.id }))
  );

  const deleteDesembargadorMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/desembargadores/${id}`),
    onSuccess: () => {
      toast({ title: "Desembargador excluído com sucesso" });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir desembargador", description: error.message, variant: "destructive" });
    },
  });

  const updateDesembargadorMutation = useMutation({
    mutationFn: async (data: { id: string; nome: string; voto: string }) => {
      return apiRequest("PATCH", `/api/desembargadores/${data.id}`, { nome: data.nome, voto: data.voto });
    },
    onSuccess: () => {
      toast({ title: "Desembargador atualizado com sucesso" });
      setEditingDesembargador(null);
      onRefresh();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar desembargador", description: error.message, variant: "destructive" });
    },
  });

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

  const totalDesembargadores = allDesembargadores.length;
  const favoraveis = allDesembargadores.filter(d => d.voto?.toUpperCase().includes('FAVORÁVEL')).length;
  const desfavoraveis = allDesembargadores.filter(d => d.voto?.toUpperCase().includes('DESFAVORÁVEL')).length;
  const emAnalise = allDesembargadores.filter(d => d.voto?.toUpperCase() === 'EM ANÁLISE').length;
  const suspeitos = allDesembargadores.filter(d => d.voto?.toUpperCase() === 'SUSPEITO').length;

  return (
    <div className="space-y-6">
      <Card className="p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center text-foreground">Visão Geral - Todos os Desembargadores</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{totalDesembargadores}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{favoraveis}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Favoráveis</p>
          </div>
          <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{desfavoraveis}</p>
            <p className="text-xs text-red-600 dark:text-red-500">Desfavoráveis</p>
          </div>
          <div className="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{emAnalise}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Em Análise</p>
          </div>
          <div className="text-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{suspeitos}</p>
            <p className="text-xs text-orange-600 dark:text-orange-500">Suspeitos</p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Favoráveis</span>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {totalDesembargadores > 0 ? Math.round((favoraveis / totalDesembargadores) * 100) : 0}%
            </span>
          </div>
          <Progress value={totalDesembargadores > 0 ? (favoraveis / totalDesembargadores) * 100 : 0} className="h-3 bg-slate-200 dark:bg-slate-700" />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-red-700 dark:text-red-400">Desfavoráveis</span>
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              {totalDesembargadores > 0 ? Math.round((desfavoraveis / totalDesembargadores) * 100) : 0}%
            </span>
          </div>
          <Progress value={totalDesembargadores > 0 ? (desfavoraveis / totalDesembargadores) * 100 : 0} className="h-3 bg-slate-200 dark:bg-slate-700 [&>div]:bg-red-500" />
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
                {isAdmin && <th className="text-right py-2 px-3 text-xs uppercase text-muted-foreground">Ações</th>}
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
                  {isAdmin && (
                    <td className="py-2 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => setEditingDesembargador({ id: d.id, nome: d.nome, voto: d.voto, turmaId: d.turmaId })}
                          data-testid={`button-edit-desembargador-${d.id}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" data-testid={`button-delete-desembargador-${d.id}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Desembargador</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o desembargador "{d.nome}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteDesembargadorMutation.mutate(d.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editingDesembargador} onOpenChange={(open) => !open && setEditingDesembargador(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Desembargador</DialogTitle>
          </DialogHeader>
          {editingDesembargador && (
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nome do desembargador"
                value={editingDesembargador.nome}
                onChange={(e) => setEditingDesembargador(prev => prev ? { ...prev, nome: e.target.value } : null)}
                data-testid="input-edit-desembargador-nome"
              />
              <Select 
                value={editingDesembargador.voto} 
                onValueChange={(v) => setEditingDesembargador(prev => prev ? { ...prev, voto: v } : null)}
              >
                <SelectTrigger data-testid="select-edit-desembargador-voto">
                  <SelectValue placeholder="Status do voto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAVORÁVEL">Favorável</SelectItem>
                  <SelectItem value="DESFAVORÁVEL">Desfavorável</SelectItem>
                  <SelectItem value="EM ANÁLISE">Em Análise</SelectItem>
                  <SelectItem value="SUSPEITO">Suspeito</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button
                  onClick={() => editingDesembargador && updateDesembargadorMutation.mutate(editingDesembargador)}
                  disabled={!editingDesembargador.nome.trim() || updateDesembargadorMutation.isPending}
                  data-testid="button-save-edit-desembargador"
                >
                  {updateDesembargadorMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminPanel({ turmas, onDataChanged }: { turmas: TurmaComDesembargadores[]; onDataChanged: () => void }) {
  const { toast } = useToast();
  const [newTurma, setNewTurma] = useState({ nome: "", regiao: "" });
  const [newDesembargador, setNewDesembargador] = useState({ nome: "", turmaId: "", voto: "EM ANÁLISE" });
  const [dialogOpen, setDialogOpen] = useState<"turma" | "desembargador" | null>(null);

  const createTurmaMutation = useMutation({
    mutationFn: async (data: { nome: string; regiao?: string }) => {
      return apiRequest("POST", "/api/turmas", data);
    },
    onSuccess: () => {
      toast({ title: "Turma criada com sucesso" });
      setNewTurma({ nome: "", regiao: "" });
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
              value={newTurma.nome}
              onChange={(e) => setNewTurma(prev => ({ ...prev, nome: e.target.value }))}
              data-testid="input-turma-nome"
            />
            <Input
              placeholder="Região (opcional, ex: TRT-1)"
              value={newTurma.regiao}
              onChange={(e) => setNewTurma(prev => ({ ...prev, regiao: e.target.value }))}
              data-testid="input-turma-regiao"
            />
            <DialogFooter>
              <Button
                onClick={() => createTurmaMutation.mutate({ nome: newTurma.nome, regiao: newTurma.regiao || undefined })}
                disabled={!newTurma.nome.trim() || createTurmaMutation.isPending}
                data-testid="button-save-turma"
              >
                {createTurmaMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
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
                {turmas.map((t) => (
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
            <DialogFooter>
              <Button
                onClick={() => createDesembargadorMutation.mutate(newDesembargador)}
                disabled={!newDesembargador.nome.trim() || !newDesembargador.turmaId || createDesembargadorMutation.isPending}
                data-testid="button-save-desembargador"
              >
                {createDesembargadorMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MapaDecisoesPage() {
  const { isAdmin } = useAuth();

  const { data: mapa, isLoading, refetch } = useQuery<MapaDecisoes>({
    queryKey: ["/api/mapa-decisoes"],
  });

  const handleDataChanged = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mx-auto" />
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
        <p className="mt-2 text-muted-foreground">
          Gestão de Turmas e Desembargadores
        </p>
      </header>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {mapa && mapa.turmas.length > 0 && (
            <span>{mapa.turmas.length} turmas cadastradas</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && mapa && <AdminPanel turmas={mapa.turmas} onDataChanged={handleDataChanged} />}
          <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-mapa">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!mapa || mapa.turmas.length === 0 ? (
        <Card className="p-12 text-center">
          <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">Nenhuma turma cadastrada</h2>
          <p className="text-muted-foreground">
            {isAdmin ? "Clique em 'Nova Turma' para começar a cadastrar" : "Aguardando cadastro de turmas pelo administrador"}
          </p>
        </Card>
      ) : (
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
            <TurmasView turmas={mapa.turmas} isAdmin={isAdmin} onRefresh={handleDataChanged} />
          </TabsContent>

          <TabsContent value="desembargadores">
            <DesembargadoresView turmas={mapa.turmas} isAdmin={isAdmin} onRefresh={handleDataChanged} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
