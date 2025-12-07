import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Gavel, Users, Filter, MapPin, Clock, FileText } from "lucide-react";
import type { EventoTimeline, TRT, Vara } from "@shared/schema";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TimelinePage() {
  const today = new Date();
  const [dataInicio, setDataInicio] = useState<string>(
    format(subMonths(startOfMonth(today), 6), "yyyy-MM-dd")
  );
  const [dataFim, setDataFim] = useState<string>(
    format(endOfMonth(today), "yyyy-MM-dd")
  );
  const [trtId, setTrtId] = useState<string>("all");
  const [varaId, setVaraId] = useState<string>("all");
  const [tipoFiltro, setTipoFiltro] = useState<string>("all");

  const { data: trts = [], isLoading: loadingTrts } = useQuery<TRT[]>({
    queryKey: ["/api/trts"],
  });

  const { data: varasDoTrt = [], isLoading: loadingVaras } = useQuery<Vara[]>({
    queryKey: ["/api/trts", trtId, "varas"],
    enabled: trtId !== "all",
  });

  const timelineUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);
    if (trtId && trtId !== "all") params.set("trtId", trtId);
    if (varaId && varaId !== "all") params.set("varaId", varaId);
    const qs = params.toString();
    return qs ? `/api/timeline?${qs}` : "/api/timeline";
  }, [dataInicio, dataFim, trtId, varaId]);

  const { data: eventos = [], isLoading: loadingEventos } = useQuery<EventoTimeline[]>({
    queryKey: [timelineUrl],
  });

  const eventosFiltrados = useMemo(() => {
    if (tipoFiltro === "all") return eventos;
    return eventos.filter((e) => e.tipo === tipoFiltro);
  }, [eventos, tipoFiltro]);

  const eventosAgrupados = useMemo(() => {
    const grupos: Record<string, EventoTimeline[]> = {};
    
    eventosFiltrados.forEach((evento) => {
      const data = format(parseISO(evento.data), "yyyy-MM");
      if (!grupos[data]) {
        grupos[data] = [];
      }
      grupos[data].push(evento);
    });

    return Object.entries(grupos)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([mes, items]) => ({
        mes,
        mesFormatado: format(parseISO(mes + "-01"), "MMMM yyyy", { locale: ptBR }),
        eventos: items.sort((a, b) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        ),
      }));
  }, [eventosFiltrados]);

  const stats = useMemo(() => {
    const decisoes = eventos.filter((e) => e.tipo === "decisao");
    const audiencias = eventos.filter((e) => e.tipo === "audiencia");
    const favoraveis = decisoes.filter((e) => e.resultado === "favoravel").length;
    const desfavoraveis = decisoes.filter((e) => e.resultado === "desfavoravel").length;
    
    return {
      totalEventos: eventos.length,
      totalDecisoes: decisoes.length,
      totalAudiencias: audiencias.length,
      favoraveis,
      desfavoraveis,
      percentualFavoravel: decisoes.length > 0 
        ? Math.round((favoraveis / decisoes.length) * 100) 
        : 0,
    };
  }, [eventos]);

  const handleTrtChange = (value: string) => {
    setTrtId(value);
    setVaraId("all");
  };

  const resetFilters = () => {
    setDataInicio(format(subMonths(startOfMonth(today), 6), "yyyy-MM-dd"));
    setDataFim(format(endOfMonth(today), "yyyy-MM-dd"));
    setTrtId("all");
    setVaraId("all");
    setTipoFiltro("all");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Linha do Tempo - Decisões e Audiências
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualize e filtre eventos judiciais por período, região e vara
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              data-testid="input-data-inicio"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              data-testid="input-data-fim"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="trt">TRT (Região)</Label>
            <Select value={trtId} onValueChange={handleTrtChange}>
              <SelectTrigger id="trt" data-testid="select-trt">
                <SelectValue placeholder="Todos os TRTs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os TRTs</SelectItem>
                {trts.map((trt) => (
                  <SelectItem key={trt.id} value={trt.id}>
                    TRT-{trt.numero} ({trt.uf})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vara">Vara</Label>
            <Select 
              value={varaId} 
              onValueChange={setVaraId}
              disabled={trtId === "all"}
            >
              <SelectTrigger id="vara" data-testid="select-vara">
                <SelectValue placeholder="Todas as Varas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Varas</SelectItem>
                {varasDoTrt.map((vara) => (
                  <SelectItem key={vara.id} value={vara.id}>
                    {vara.nome} - {vara.cidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Evento</Label>
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger id="tipo" data-testid="select-tipo">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                <SelectItem value="decisao">Decisões</SelectItem>
                <SelectItem value="audiencia">Audiências</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={resetFilters} data-testid="button-reset-filters">
            Limpar Filtros
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Eventos</p>
              <p className="text-2xl font-bold" data-testid="text-total-eventos">
                {stats.totalEventos}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Gavel className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Decisões</p>
              <p className="text-2xl font-bold" data-testid="text-total-decisoes">
                {stats.totalDecisoes}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Audiências</p>
              <p className="text-2xl font-bold" data-testid="text-total-audiencias">
                {stats.totalAudiencias}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Gavel className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Favorabilidade</p>
              <p className="text-2xl font-bold" data-testid="text-favorabilidade">
                {stats.percentualFavoravel}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Linha do Tempo</h3>
          <Badge variant="secondary" className="ml-auto">
            {eventosFiltrados.length} eventos
          </Badge>
        </div>

        {loadingEventos ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum evento encontrado para os filtros selecionados</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-8">
              {eventosAgrupados.map((grupo) => (
                <div key={grupo.mes} className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <h4 className="font-semibold text-lg capitalize">
                      {grupo.mesFormatado}
                    </h4>
                    <Badge variant="outline">{grupo.eventos.length} eventos</Badge>
                  </div>
                  
                  <div className="ml-12 space-y-3">
                    {grupo.eventos.map((evento) => (
                      <div
                        key={evento.id}
                        className="relative pl-4 border-l-2 hover-elevate rounded-r-lg p-3 border"
                        style={{
                          borderLeftColor: evento.tipo === "decisao" 
                            ? evento.resultado === "favoravel" 
                              ? "hsl(147, 79%, 42%)" 
                              : evento.resultado === "desfavoravel"
                              ? "hsl(0, 70%, 55%)"
                              : "hsl(30, 95%, 55%)"
                            : "hsl(270, 70%, 55%)",
                        }}
                        data-testid={`timeline-item-${evento.id}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {evento.tipo === "decisao" ? (
                              <Gavel className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Users className="w-4 h-4 text-purple-500" />
                            )}
                            <span className="font-medium">{evento.descricao}</span>
                            {evento.resultado && (
                              <Badge
                                variant={
                                  evento.resultado === "favoravel"
                                    ? "default"
                                    : evento.resultado === "desfavoravel"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {evento.resultado === "favoravel"
                                  ? "Favorável"
                                  : evento.resultado === "desfavoravel"
                                  ? "Desfavorável"
                                  : "Parcial"}
                              </Badge>
                            )}
                            {evento.status && (
                              <Badge variant="outline" className="text-xs">
                                {evento.status === "agendada"
                                  ? "Agendada"
                                  : evento.status === "realizada"
                                  ? "Realizada"
                                  : evento.status === "adiada"
                                  ? "Adiada"
                                  : "Cancelada"}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(evento.data), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{evento.numeroProcesso}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>
                              TRT-{evento.trtNome.match(/\d+/)?.[0]} | {evento.varaNome} - {evento.varaCidade}
                            </span>
                          </div>
                          {evento.juizNome && (
                            <div className="flex items-center gap-1">
                              <Gavel className="w-3 h-3" />
                              <span>{evento.juizNome}</span>
                            </div>
                          )}
                          {evento.parte && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{evento.parte}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
