import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Building2, Scale, Trash2, Edit, MapPin, Database } from "lucide-react";
import { FavorabilidadeBar, FavorabilidadeBadge } from "@/components/judge-avatar";
import type { TRT, Vara, TRTComFavorabilidade } from "@shared/schema";

export default function TRTsVarasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  
  const [showTRTDialog, setShowTRTDialog] = useState(false);
  const [showVaraDialog, setShowVaraDialog] = useState(false);
  const [selectedTRTId, setSelectedTRTId] = useState<string | null>(null);
  const [editingTRT, setEditingTRT] = useState<TRT | null>(null);
  const [editingVara, setEditingVara] = useState<Vara | null>(null);

  const { data: trtsData, isLoading } = useQuery<TRTComFavorabilidade[]>({
    queryKey: ["/api/favorabilidade/trts"],
  });

  const createTRTMutation = useMutation({
    mutationFn: (data: { numero: string; nome: string; uf: string }) =>
      apiRequest("POST", "/api/trts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      setShowTRTDialog(false);
      toast({ title: "TRT criado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao criar TRT", variant: "destructive" }),
  });

  const updateTRTMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TRT> }) =>
      apiRequest("PATCH", `/api/trts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      setEditingTRT(null);
      toast({ title: "TRT atualizado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao atualizar TRT", variant: "destructive" }),
  });

  const deleteTRTMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/trts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      toast({ title: "TRT excluído com sucesso" });
    },
    onError: () => toast({ title: "Erro ao excluir TRT", variant: "destructive" }),
  });

  const createVaraMutation = useMutation({
    mutationFn: (data: { nome: string; cidade: string; trtId: string }) =>
      apiRequest("POST", "/api/varas", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      setShowVaraDialog(false);
      setSelectedTRTId(null);
      toast({ title: "Vara criada com sucesso" });
    },
    onError: () => toast({ title: "Erro ao criar Vara", variant: "destructive" }),
  });

  const deleteVaraMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/varas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      toast({ title: "Vara excluída com sucesso" });
    },
    onError: () => toast({ title: "Erro ao excluir Vara", variant: "destructive" }),
  });

  const seedDemoMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed-demo", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/trts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorabilidade/juizes"] });
      toast({ title: "Dados de demonstração inseridos com sucesso" });
    },
    onError: () => toast({ title: "Dados já existem ou erro ao inserir", variant: "destructive" }),
  });

  const handleCreateTRT = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTRTMutation.mutate({
      numero: formData.get("numero") as string,
      nome: formData.get("nome") as string,
      uf: formData.get("uf") as string,
    });
  };

  const handleCreateVara = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTRTId) return;
    const formData = new FormData(e.currentTarget);
    createVaraMutation.mutate({
      nome: formData.get("nome") as string,
      cidade: formData.get("cidade") as string,
      trtId: selectedTRTId,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">TRTs e Varas</h1>
          <p className="text-muted-foreground">Gestão de Tribunais Regionais do Trabalho e Varas</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            {(!trtsData || trtsData.length === 0) && (
              <Button 
                variant="outline"
                onClick={() => seedDemoMutation.mutate()}
                disabled={seedDemoMutation.isPending}
                data-testid="button-seed-demo"
              >
                <Database className="h-4 w-4 mr-2" />
                {seedDemoMutation.isPending ? "Inserindo..." : "Carregar Dados Demo"}
              </Button>
            )}
            <Dialog open={showTRTDialog} onOpenChange={setShowTRTDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-trt">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo TRT
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar TRT</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTRT} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número do TRT</Label>
                  <Input id="numero" name="numero" type="number" min="1" max="24" required data-testid="input-trt-numero" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" name="nome" placeholder="TRT da 1ª Região" required data-testid="input-trt-nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input id="uf" name="uf" placeholder="RJ" maxLength={2} required data-testid="input-trt-uf" />
                </div>
                <Button type="submit" className="w-full" disabled={createTRTMutation.isPending} data-testid="button-submit-trt">
                  {createTRTMutation.isPending ? "Criando..." : "Criar TRT"}
                </Button>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {(!trtsData || trtsData.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum TRT cadastrado ainda.</p>
            {isAdmin && (
              <Button className="mt-4" onClick={() => setShowTRTDialog(true)} data-testid="button-add-first-trt">
                Adicionar primeiro TRT
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {trtsData.map((trt) => (
            <AccordionItem key={trt.id} value={trt.id} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover-elevate" data-testid={`accordion-trt-${trt.id}`}>
                <div className="flex flex-wrap items-center gap-4 flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">TRT-{trt.numero}</span>
                    <Badge variant="outline">{trt.uf}</Badge>
                  </div>
                  <span className="text-muted-foreground">{trt.nome}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Badge variant="secondary">{trt.varas.length} varas</Badge>
                    {trt.favorabilidade.totalJulgamentos > 0 && (
                      <FavorabilidadeBadge percentual={trt.favorabilidade.percentualFavoravel} variant="compact" />
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {trt.favorabilidade.totalJulgamentos > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Favorabilidade Geral do TRT</p>
                      <FavorabilidadeBar favorabilidade={trt.favorabilidade} />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium">Varas</h3>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTRTId(trt.id);
                            setShowVaraDialog(true);
                          }}
                          data-testid={`button-add-vara-${trt.id}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Vara
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Deseja excluir este TRT e todas as suas varas?")) {
                              deleteTRTMutation.mutate(trt.id);
                            }
                          }}
                          data-testid={`button-delete-trt-${trt.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {trt.varas.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma vara cadastrada neste TRT.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {trt.varas.map((vara) => (
                        <Card key={vara.id} className="hover-elevate" data-testid={`card-vara-${vara.id}`}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Scale className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-sm">{vara.nome}</CardTitle>
                              </div>
                              {isAdmin && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Deseja excluir esta vara?")) {
                                      deleteVaraMutation.mutate(vara.id);
                                    }
                                  }}
                                  data-testid={`button-delete-vara-${vara.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {vara.cidade}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {vara.juizes.length} juízes
                            </Badge>
                            {vara.favorabilidade.totalJulgamentos > 0 && (
                              <FavorabilidadeBar favorabilidade={vara.favorabilidade} showLabels={false} height="sm" />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={showVaraDialog} onOpenChange={(open) => {
        setShowVaraDialog(open);
        if (!open) setSelectedTRTId(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Vara</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateVara} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vara-nome">Nome da Vara</Label>
              <Input id="vara-nome" name="nome" placeholder="1ª Vara do Trabalho" required data-testid="input-vara-nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vara-cidade">Cidade</Label>
              <Input id="vara-cidade" name="cidade" placeholder="São Paulo" required data-testid="input-vara-cidade" />
            </div>
            <Button type="submit" className="w-full" disabled={createVaraMutation.isPending} data-testid="button-submit-vara">
              {createVaraMutation.isPending ? "Criando..." : "Criar Vara"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
