import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { JudgeAvatar, FavorabilidadeBar, FavorabilidadeBadge } from "@/components/judge-avatar";
import { Building2, Scale, User, TrendingUp, TrendingDown, BarChart3, PieChart, MapPin, ChevronDown } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";
import type { TRTComFavorabilidade, JuizComFavorabilidade, VaraComFavorabilidade } from "@shared/schema";

export default function FavorabilidadePage() {
  const { data: trtsData, isLoading: isLoadingTRTs } = useQuery<TRTComFavorabilidade[]>({
    queryKey: ["/api/favorabilidade/trts"],
  });

  const { data: juizesData, isLoading: isLoadingJuizes } = useQuery<JuizComFavorabilidade[]>({
    queryKey: ["/api/favorabilidade/juizes"],
  });

  const estadosData = useMemo(() => {
    if (!trtsData) return [];
    
    const estadosMap = new Map<string, {
      uf: string;
      varas: Array<VaraComFavorabilidade & { trtNumero: string; trtNome: string }>;
      totalJulgamentos: number;
      favoraveis: number;
      desfavoraveis: number;
      parciais: number;
    }>();

    for (const trt of trtsData) {
      const existing = estadosMap.get(trt.uf) || {
        uf: trt.uf,
        varas: [],
        totalJulgamentos: 0,
        favoraveis: 0,
        desfavoraveis: 0,
        parciais: 0,
      };

      for (const vara of trt.varas) {
        existing.varas.push({
          ...vara,
          trtNumero: trt.numero,
          trtNome: trt.nome,
        });
        existing.totalJulgamentos += vara.favorabilidade.totalJulgamentos;
        existing.favoraveis += vara.favorabilidade.favoraveis;
        existing.desfavoraveis += vara.favorabilidade.desfavoraveis;
        existing.parciais += vara.favorabilidade.parciais;
      }

      estadosMap.set(trt.uf, existing);
    }

    return Array.from(estadosMap.values())
      .map(estado => ({
        ...estado,
        percentualFavoravel: estado.totalJulgamentos > 0
          ? Math.round(((estado.favoraveis + estado.parciais * 0.5) / estado.totalJulgamentos) * 100)
          : 0,
        varas: estado.varas.sort((a, b) => a.nome.localeCompare(b.nome)),
      }))
      .sort((a, b) => a.uf.localeCompare(b.uf));
  }, [trtsData]);

  if (isLoadingTRTs || isLoadingJuizes) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const totalTRTs = trtsData?.length || 0;
  const totalVaras = trtsData?.reduce((acc, trt) => acc + trt.varas.length, 0) || 0;
  const totalJuizes = juizesData?.length || 0;
  const totalJulgamentos = juizesData?.reduce((acc, j) => acc + j.favorabilidade.totalJulgamentos, 0) || 0;

  const allJulgamentos = {
    favoraveis: juizesData?.reduce((acc, j) => acc + j.favorabilidade.favoraveis, 0) || 0,
    desfavoraveis: juizesData?.reduce((acc, j) => acc + j.favorabilidade.desfavoraveis, 0) || 0,
    parciais: juizesData?.reduce((acc, j) => acc + j.favorabilidade.parciais, 0) || 0,
  };

  const overallFavorabilidade = totalJulgamentos > 0
    ? Math.round(((allJulgamentos.favoraveis + allJulgamentos.parciais * 0.5) / totalJulgamentos) * 100)
    : 0;

  const trtChartData = trtsData
    ?.filter(trt => trt.favorabilidade.totalJulgamentos > 0)
    .map(trt => ({
      name: `TRT-${trt.numero}`,
      favoravel: trt.favorabilidade.percentualFavoravel,
      desfavoravel: trt.favorabilidade.percentualDesfavoravel,
      total: trt.favorabilidade.totalJulgamentos,
    }))
    .sort((a, b) => b.favoravel - a.favoravel) || [];

  const pieData = [
    { name: "Favoráveis", value: allJulgamentos.favoraveis, color: "hsl(142, 71%, 45%)" },
    { name: "Parciais", value: allJulgamentos.parciais, color: "hsl(45, 93%, 47%)" },
    { name: "Desfavoráveis", value: allJulgamentos.desfavoraveis, color: "hsl(0, 84%, 60%)" },
  ].filter(d => d.value > 0);

  const topJuizes = [...(juizesData || [])]
    .filter(j => j.favorabilidade.totalJulgamentos >= 2)
    .sort((a, b) => b.favorabilidade.percentualFavoravel - a.favorabilidade.percentualFavoravel)
    .slice(0, 5);

  const worstJuizes = [...(juizesData || [])]
    .filter(j => j.favorabilidade.totalJulgamentos >= 2)
    .sort((a, b) => a.favorabilidade.percentualFavoravel - b.favorabilidade.percentualFavoravel)
    .slice(0, 5);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Dashboard de Favorabilidade</h1>
        <p className="text-muted-foreground">Análise de favorabilidade por TRT, Vara e Juiz</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-kpi-trts">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">TRTs Cadastrados</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTRTs}</div>
            <p className="text-xs text-muted-foreground">Tribunais Regionais</p>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-varas">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Varas</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVaras}</div>
            <p className="text-xs text-muted-foreground">Varas do Trabalho</p>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-juizes">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Juízes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJuizes}</div>
            <p className="text-xs text-muted-foreground">Magistrados cadastrados</p>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-favorabilidade">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Favorabilidade Geral</CardTitle>
            {overallFavorabilidade >= 50 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallFavorabilidade}%</div>
            <p className="text-xs text-muted-foreground">{totalJulgamentos} julgamentos</p>
          </CardContent>
        </Card>
      </div>

      {totalJulgamentos === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum julgamento registrado ainda.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cadastre TRTs, Varas e Juízes e registre julgamentos para visualizar as métricas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card data-testid="card-chart-trts">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Favorabilidade por TRT
                </CardTitle>
                <CardDescription>Comparativo entre tribunais regionais</CardDescription>
              </CardHeader>
              <CardContent>
                {trtChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trtChartData} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="name" width={60} />
                      <Tooltip
                        formatter={(value: number) => `${value}%`}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="favoravel" name="Favorável" fill="hsl(142, 71%, 45%)" stackId="a" />
                      <Bar dataKey="desfavoravel" name="Desfavorável" fill="hsl(0, 84%, 60%)" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum TRT com julgamentos.</p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-chart-distribuicao">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição de Resultados
                </CardTitle>
                <CardDescription>Total de {totalJulgamentos} julgamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card data-testid="card-top-juizes">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top 5 Juízes Favoráveis
                </CardTitle>
                <CardDescription>Magistrados com maior taxa de decisões favoráveis (min. 2 julgamentos)</CardDescription>
              </CardHeader>
              <CardContent>
                {topJuizes.length > 0 ? (
                  <div className="space-y-4">
                    {topJuizes.map((juiz, index) => (
                      <div key={juiz.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                        <JudgeAvatar nome={juiz.nome} favorabilidade={juiz.favorabilidade} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{juiz.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {juiz.varaNome} - {juiz.trtNome} ({juiz.trtUF})
                          </p>
                        </div>
                        <FavorabilidadeBadge percentual={juiz.favorabilidade.percentualFavoravel} variant="compact" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum juiz com 2+ julgamentos.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-worst-juizes">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Top 5 Juízes Menos Favoráveis
                </CardTitle>
                <CardDescription>Magistrados com menor taxa de decisões favoráveis (min. 2 julgamentos)</CardDescription>
              </CardHeader>
              <CardContent>
                {worstJuizes.length > 0 ? (
                  <div className="space-y-4">
                    {worstJuizes.map((juiz, index) => (
                      <div key={juiz.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                        <JudgeAvatar nome={juiz.nome} favorabilidade={juiz.favorabilidade} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{juiz.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {juiz.varaNome} - {juiz.trtNome} ({juiz.trtUF})
                          </p>
                        </div>
                        <FavorabilidadeBadge percentual={juiz.favorabilidade.percentualFavoravel} variant="compact" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum juiz com 2+ julgamentos.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-trts-grid">
            <CardHeader>
              <CardTitle>Visão Geral por TRT</CardTitle>
              <CardDescription>Grade de favorabilidade por tribunal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {trtsData?.map((trt) => (
                  <div
                    key={trt.id}
                    className="p-4 rounded-lg border hover-elevate"
                    data-testid={`grid-trt-${trt.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">TRT-{trt.numero}</span>
                      <Badge variant="outline">{trt.uf}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Varas:</span>
                        <span>{trt.varas.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Juízes:</span>
                        <span>{trt.varas.reduce((acc, v) => acc + v.juizes.length, 0)}</span>
                      </div>
                      {trt.favorabilidade.totalJulgamentos > 0 ? (
                        <>
                          <Progress 
                            value={trt.favorabilidade.percentualFavoravel} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{trt.favorabilidade.percentualFavoravel}% fav.</span>
                            <span>{trt.favorabilidade.totalJulgamentos} julg.</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">Sem julgamentos</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-estados-view">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Visão Geral por Estado
              </CardTitle>
              <CardDescription>Hierarquia completa: Estado → Vara → Juízes (clique para expandir/minimizar)</CardDescription>
            </CardHeader>
            <CardContent>
              {estadosData.length > 0 ? (
                <Accordion type="multiple" className="space-y-3">
                  {estadosData.map((estado) => (
                    <AccordionItem
                      key={estado.uf}
                      value={estado.uf}
                      className="border rounded-lg overflow-hidden"
                      data-testid={`accordion-estado-${estado.uf}`}
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover-elevate">
                        <div className="flex flex-wrap items-center gap-4 flex-1 mr-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span className="text-lg font-bold">{estado.uf}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{estado.varas.length} varas</Badge>
                            <Badge variant="outline">
                              {estado.varas.reduce((acc, v) => acc + v.juizes.length, 0)} juízes
                            </Badge>
                          </div>
                          {estado.totalJulgamentos > 0 && (
                            <div className="flex items-center gap-2 ml-auto">
                              <span className="text-sm text-muted-foreground">
                                {estado.totalJulgamentos} julgamentos
                              </span>
                              <FavorabilidadeBadge percentual={estado.percentualFavoravel} variant="compact" />
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4 pt-2">
                          {estado.varas.map((vara) => (
                            <div
                              key={vara.id}
                              className="border rounded-lg p-4"
                              data-testid={`vara-section-${vara.id}`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <Scale className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">{vara.nome}</span>
                                  <span className="text-sm text-muted-foreground">- {vara.cidade}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">TRT-{vara.trtNumero}</Badge>
                                  {vara.favorabilidade.totalJulgamentos > 0 && (
                                    <FavorabilidadeBadge percentual={vara.favorabilidade.percentualFavoravel} variant="compact" />
                                  )}
                                </div>
                              </div>
                              
                              {vara.juizes.length > 0 ? (
                                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                  {vara.juizes.map((juiz) => (
                                    <div
                                      key={juiz.id}
                                      className="p-3 rounded-lg border hover-elevate"
                                      data-testid={`juiz-item-${juiz.id}`}
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <JudgeAvatar nome={juiz.nome} favorabilidade={juiz.favorabilidade} size="sm" />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">{juiz.nome}</p>
                                          <Badge variant={juiz.tipo === "titular" ? "default" : "secondary"} className="text-xs">
                                            {juiz.tipo === "titular" ? "Titular" : "Substituto"}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <FavorabilidadeBar favorabilidade={juiz.favorabilidade} />
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                          <span>{juiz.favorabilidade.totalJulgamentos} julg.</span>
                                          <FavorabilidadeBadge percentual={juiz.favorabilidade.percentualFavoravel} variant="compact" />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Nenhum juiz cadastrado nesta vara
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum estado com dados cadastrados.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
