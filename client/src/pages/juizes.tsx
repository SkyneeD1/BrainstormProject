import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, User, Gavel, Trash2, Edit, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { JudgeAvatar, FavorabilidadeBar, FavorabilidadeBadge } from "@/components/judge-avatar";
import type { TRT, TRTComFavorabilidade, Julgamento, JuizComFavorabilidade } from "@shared/schema";

export default function JuizesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  
  const [showJuizDialog, setShowJuizDialog] = useState(false);
  const [showJulgamentoDialog, setShowJulgamentoDialog] = useState(false);
  const [selectedVaraId, setSelectedVaraId] = useState<string>("");
  const [selectedJuizId, setSelectedJuizId] = useState<string | null>(null);
  const [selectedJuiz, setSelectedJuiz] = useState<JuizComFavorabilidade | null>(null);
  const [editingJulgamento, setEditingJulgamento] = useState<Julgamento | null>(null);

  const { data: trtsData, isLoading: isLoadingTRTs } = useQuery<TRTComFavorabilidade[]>({
    queryKey: ["/api/favorabilidade/trts"],
  });

  const { data: juizesData, isLoading: isLoadingJuizes } = useQuery<JuizComFavorabilidade[]>({
    queryKey: ["/api/favorabilidade/juizes"],
  });

  const { data: julgamentosData } = useQuery<Julgamento[]>({
    queryKey: ["/api/juizes", selectedJuizId, "julgamentos"],
    enabled: !!selectedJuizId,
  });

  const createJuizMutation = useMutation({
    mutationFn: (data: { nome: string; varaId: string; tipo: string }) =>
      apiRequest("POST", "/api/juizes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/juizes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      setShowJuizDialog(false);
      toast({ title: "Juiz cadastrado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao cadastrar juiz", variant: "destructive" }),
  });

  const deleteJuizMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/juizes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/juizes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      toast({ title: "Juiz excluído com sucesso" });
    },
    onError: () => toast({ title: "Erro ao excluir juiz", variant: "destructive" }),
  });

  const createJulgamentoMutation = useMutation({
    mutationFn: (data: { juizId: string; numeroProcesso: string; resultado: string; dataJulgamento?: string; parte?: string }) =>
      apiRequest("POST", "/api/julgamentos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/juizes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/juizes", selectedJuizId, "julgamentos"] });
      setShowJulgamentoDialog(false);
      toast({ title: "Julgamento registrado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao registrar julgamento", variant: "destructive" }),
  });

  const updateJulgamentoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { resultado: string; dataJulgamento?: string; parte?: string } }) =>
      apiRequest("PATCH", `/api/julgamentos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/juizes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/juizes", selectedJuizId, "julgamentos"] });
      setEditingJulgamento(null);
      setShowJulgamentoDialog(false);
      toast({ title: "Julgamento atualizado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao atualizar julgamento", variant: "destructive" }),
  });

  const deleteJulgamentoMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/julgamentos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/juizes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/juizes", selectedJuizId, "julgamentos"] });
      toast({ title: "Julgamento excluído" });
    },
    onError: () => toast({ title: "Erro ao excluir julgamento", variant: "destructive" }),
  });

  const handleCreateJuiz = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createJuizMutation.mutate({
      nome: formData.get("nome") as string,
      varaId: formData.get("varaId") as string,
      tipo: formData.get("tipo") as string,
    });
  };

  const handleCreateJulgamento = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedJuizId) return;
    const formData = new FormData(e.currentTarget);
    
    if (editingJulgamento) {
      updateJulgamentoMutation.mutate({
        id: editingJulgamento.id,
        data: {
          resultado: formData.get("resultado") as string,
          dataJulgamento: formData.get("dataJulgamento") as string || undefined,
          parte: formData.get("parte") as string || undefined,
        },
      });
    } else {
      createJulgamentoMutation.mutate({
        juizId: selectedJuizId,
        numeroProcesso: formData.get("numeroProcesso") as string,
        resultado: formData.get("resultado") as string,
        dataJulgamento: formData.get("dataJulgamento") as string || undefined,
        parte: formData.get("parte") as string || undefined,
      });
    }
  };

  const handleEditJulgamento = (julgamento: Julgamento) => {
    setEditingJulgamento(julgamento);
    setShowJulgamentoDialog(true);
  };

  const handleCloseJulgamentoDialog = (open: boolean) => {
    if (!open) {
      setEditingJulgamento(null);
    }
    setShowJulgamentoDialog(open);
  };

  const getResultadoIcon = (resultado: string) => {
    switch (resultado) {
      case "favoravel":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "desfavoravel":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "parcial":
        return <MinusCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getResultadoLabel = (resultado: string) => {
    switch (resultado) {
      case "favoravel":
        return "Favorável";
      case "desfavoravel":
        return "Desfavorável";
      case "parcial":
        return "Parcial";
      default:
        return resultado;
    }
  };

  const allVaras = trtsData?.flatMap(trt => 
    trt.varas.map(vara => ({
      ...vara,
      trtNome: trt.nome,
      trtNumero: trt.numero,
    }))
  ) || [];

  if (isLoadingTRTs || isLoadingJuizes) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Diretório de Juízes</h1>
          <p className="text-muted-foreground">Gestão de magistrados e histórico de julgamentos</p>
        </div>
        {isAdmin && (
          <Dialog open={showJuizDialog} onOpenChange={setShowJuizDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-juiz">
                <Plus className="h-4 w-4 mr-2" />
                Novo Juiz
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Juiz</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateJuiz} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input id="nome" name="nome" placeholder="Dr(a). Nome Completo" required data-testid="input-juiz-nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="varaId">Vara</Label>
                  <Select name="varaId" required>
                    <SelectTrigger data-testid="select-juiz-vara">
                      <SelectValue placeholder="Selecione a vara" />
                    </SelectTrigger>
                    <SelectContent>
                      {allVaras.map((vara) => (
                        <SelectItem key={vara.id} value={vara.id}>
                          TRT-{vara.trtNumero} - {vara.nome} ({vara.cidade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select name="tipo" defaultValue="titular">
                    <SelectTrigger data-testid="select-juiz-tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="titular">Titular</SelectItem>
                      <SelectItem value="substituto">Substituto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createJuizMutation.isPending} data-testid="button-submit-juiz">
                  {createJuizMutation.isPending ? "Cadastrando..." : "Cadastrar Juiz"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {(!juizesData || juizesData.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum juiz cadastrado ainda.</p>
            {isAdmin && allVaras.length > 0 && (
              <Button className="mt-4" onClick={() => setShowJuizDialog(true)} data-testid="button-add-first-juiz">
                Cadastrar primeiro juiz
              </Button>
            )}
            {allVaras.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">Cadastre TRTs e Varas primeiro.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {juizesData.map((juiz) => (
            <Card key={juiz.id} className="hover-elevate" data-testid={`card-juiz-${juiz.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <JudgeAvatar nome={juiz.nome} favorabilidade={juiz.favorabilidade} />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{juiz.nome}</CardTitle>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <Badge variant={juiz.tipo === "titular" ? "default" : "secondary"} className="text-xs">
                        {juiz.tipo === "titular" ? "Titular" : "Substituto"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>{juiz.varaNome}</p>
                  <p className="text-xs">{juiz.trtNome}</p>
                </div>
                
                <FavorabilidadeBar favorabilidade={juiz.favorabilidade} />
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedJuiz(juiz);
                      setSelectedJuizId(juiz.id);
                    }}
                    data-testid={`button-view-juiz-${juiz.id}`}
                  >
                    <Gavel className="h-3 w-3 mr-1" />
                    Ver Julgamentos
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Deseja excluir este juiz e todos os seus julgamentos?")) {
                          deleteJuizMutation.mutate(juiz.id);
                        }
                      }}
                      data-testid={`button-delete-juiz-${juiz.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedJuiz} onOpenChange={(open) => {
        if (!open) {
          setSelectedJuiz(null);
          setSelectedJuizId(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedJuiz && (
                <>
                  <JudgeAvatar nome={selectedJuiz.nome} favorabilidade={selectedJuiz.favorabilidade} size="sm" showTooltip={false} />
                  <span>{selectedJuiz.nome}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedJuiz && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <FavorabilidadeBar favorabilidade={selectedJuiz.favorabilidade} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">Histórico de Julgamentos</h3>
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowJulgamentoDialog(true)} data-testid="button-add-julgamento">
                    <Plus className="h-3 w-3 mr-1" />
                    Novo Julgamento
                  </Button>
                )}
              </div>

              {julgamentosData && julgamentosData.length > 0 ? (
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Processo</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Parte</TableHead>
                        {isAdmin && <TableHead className="w-12"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {julgamentosData.map((j) => (
                        <TableRow key={j.id}>
                          <TableCell className="font-mono text-sm">{j.numeroProcesso}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getResultadoIcon(j.resultado)}
                              <span className="text-sm">{getResultadoLabel(j.resultado)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {j.dataJulgamento ? new Date(j.dataJulgamento).toLocaleDateString("pt-BR") : "-"}
                          </TableCell>
                          <TableCell className="text-sm">{j.parte || "-"}</TableCell>
                          {isAdmin && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditJulgamento(j)}
                                  data-testid={`button-edit-julgamento-${j.id}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Excluir este julgamento?")) {
                                      deleteJulgamentoMutation.mutate(j.id);
                                    }
                                  }}
                                  data-testid={`button-delete-julgamento-${j.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum julgamento registrado.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showJulgamentoDialog} onOpenChange={handleCloseJulgamentoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingJulgamento ? "Editar Julgamento" : "Registrar Julgamento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateJulgamento} className="space-y-4">
            {!editingJulgamento && (
              <div className="space-y-2">
                <Label htmlFor="numeroProcesso">Número do Processo</Label>
                <Input id="numeroProcesso" name="numeroProcesso" placeholder="0000000-00.0000.0.00.0000" required data-testid="input-julgamento-processo" />
              </div>
            )}
            {editingJulgamento && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Processo</p>
                <p className="font-mono">{editingJulgamento.numeroProcesso}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="resultado">Resultado</Label>
              <Select name="resultado" defaultValue={editingJulgamento?.resultado} required>
                <SelectTrigger data-testid="select-julgamento-resultado">
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="favoravel">Favorável</SelectItem>
                  <SelectItem value="desfavoravel">Desfavorável</SelectItem>
                  <SelectItem value="parcial">Parcialmente Favorável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataJulgamento">Data do Julgamento</Label>
              <Input 
                id="dataJulgamento" 
                name="dataJulgamento" 
                type="date" 
                defaultValue={editingJulgamento?.dataJulgamento ? new Date(editingJulgamento.dataJulgamento).toISOString().split('T')[0] : undefined}
                data-testid="input-julgamento-data" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parte">Parte (Reclamante)</Label>
              <Input 
                id="parte" 
                name="parte" 
                placeholder="Nome da parte" 
                defaultValue={editingJulgamento?.parte || ""}
                data-testid="input-julgamento-parte" 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={createJulgamentoMutation.isPending || updateJulgamentoMutation.isPending} 
              data-testid="button-submit-julgamento"
            >
              {(createJulgamentoMutation.isPending || updateJulgamentoMutation.isPending) 
                ? (editingJulgamento ? "Atualizando..." : "Registrando...") 
                : (editingJulgamento ? "Atualizar Julgamento" : "Registrar Julgamento")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
