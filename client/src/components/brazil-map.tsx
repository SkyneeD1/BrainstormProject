import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, TrendingDown, Users, Building2 } from "lucide-react";

interface EstadoData {
  uf: string;
  estado: string;
  trtCodigo: string;
  trtNome: string;
  regiao: string;
  totalDecisoes: number;
  favoraveis: number;
  desfavoraveis: number;
  percentualFavoravel: number;
  totalComarcas: number;
  totalRelatores: number;
}

interface BrazilMapProps {
  estados: EstadoData[];
  onSelectEstado: (uf: string, estado: string) => void;
  selectedUF?: string | null;
  tenantColor?: string;
}

const STATE_PATHS: Record<string, { path: string; x: number; y: number }> = {
  AC: { path: "M52,198 L74,198 L74,218 L52,218 Z", x: 63, y: 208 },
  AM: { path: "M75,140 L180,140 L180,200 L75,200 Z", x: 127, y: 170 },
  AP: { path: "M240,80 L280,80 L280,120 L240,120 Z", x: 260, y: 100 },
  PA: { path: "M182,100 L320,100 L320,180 L182,180 Z", x: 251, y: 140 },
  RO: { path: "M75,202 L130,202 L130,250 L75,250 Z", x: 102, y: 226 },
  RR: { path: "M120,50 L178,50 L178,138 L120,138 Z", x: 149, y: 94 },
  TO: { path: "M260,182 L318,182 L318,275 L260,275 Z", x: 289, y: 228 },
  MA: { path: "M320,102 L400,102 L400,165 L320,165 Z", x: 360, y: 133 },
  PI: { path: "M356,167 L420,167 L420,235 L356,235 Z", x: 388, y: 201 },
  CE: { path: "M402,130 L465,130 L465,185 L402,185 Z", x: 433, y: 157 },
  RN: { path: "M450,155 L500,155 L500,185 L450,185 Z", x: 475, y: 170 },
  PB: { path: "M442,187 L500,187 L500,210 L442,210 Z", x: 471, y: 198 },
  PE: { path: "M410,212 L500,212 L500,245 L410,245 Z", x: 455, y: 228 },
  AL: { path: "M460,247 L500,247 L500,275 L460,275 Z", x: 480, y: 261 },
  SE: { path: "M450,277 L490,277 L490,300 L450,300 Z", x: 470, y: 288 },
  BA: { path: "M322,237 L448,237 L448,365 L322,365 Z", x: 385, y: 301 },
  MT: { path: "M132,200 L258,200 L258,310 L132,310 Z", x: 195, y: 255 },
  MS: { path: "M170,312 L260,312 L260,395 L170,395 Z", x: 215, y: 353 },
  GO: { path: "M262,277 L350,277 L350,375 L262,375 Z", x: 306, y: 326 },
  DF: { path: "M300,310 L325,310 L325,335 L300,335 Z", x: 312, y: 322 },
  MG: { path: "M318,325 L448,325 L448,420 L318,420 Z", x: 383, y: 372 },
  ES: { path: "M420,367 L470,367 L470,415 L420,415 Z", x: 445, y: 391 },
  RJ: { path: "M398,417 L468,417 L468,455 L398,455 Z", x: 433, y: 436 },
  SP: { path: "M280,377 L395,377 L395,455 L280,455 Z", x: 337, y: 416 },
  PR: { path: "M245,397 L340,397 L340,465 L245,465 Z", x: 292, y: 431 },
  SC: { path: "M265,467 L345,467 L345,510 L265,510 Z", x: 305, y: 488 },
  RS: { path: "M225,465 L310,465 L310,560 L225,560 Z", x: 267, y: 512 },
};

export function BrazilMap({ estados, onSelectEstado, selectedUF, tenantColor = "#ffd700" }: BrazilMapProps) {
  const [hoveredUF, setHoveredUF] = useState<string | null>(null);

  const getEstadoData = (uf: string): EstadoData | undefined => {
    return estados.find(e => e.uf === uf);
  };

  const getStateColor = (uf: string): string => {
    const data = getEstadoData(uf);
    if (!data || data.totalDecisoes === 0) return "#e5e7eb";
    
    if (selectedUF === uf) return tenantColor;
    if (hoveredUF === uf) return tenantColor + "80";
    
    const intensity = Math.min(data.totalDecisoes / 50, 1);
    if (data.percentualFavoravel >= 60) {
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
    } else if (data.percentualFavoravel <= 40) {
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
    }
    return `rgba(234, 179, 8, ${0.3 + intensity * 0.7})`;
  };

  const hoveredData = hoveredUF ? getEstadoData(hoveredUF) : null;

  return (
    <div className="flex gap-6">
      <div className="relative">
        <svg viewBox="0 0 550 600" className="w-full max-w-[500px] h-auto">
          <rect width="550" height="600" fill="transparent" />
          {Object.entries(STATE_PATHS).map(([uf, { path }]) => {
            const data = getEstadoData(uf);
            return (
              <g key={uf}>
                <path
                  d={path}
                  fill={getStateColor(uf)}
                  stroke={selectedUF === uf ? tenantColor : "#94a3b8"}
                  strokeWidth={selectedUF === uf ? 3 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredUF(uf)}
                  onMouseLeave={() => setHoveredUF(null)}
                  onClick={() => data && data.totalDecisoes > 0 && onSelectEstado(uf, data.estado)}
                  data-testid={`map-state-${uf}`}
                />
                <text
                  x={STATE_PATHS[uf].x}
                  y={STATE_PATHS[uf].y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium pointer-events-none select-none"
                  fill={data && data.totalDecisoes > 0 ? "#1f2937" : "#9ca3af"}
                >
                  {uf}
                </text>
                {data && data.totalDecisoes > 0 && (
                  <text
                    x={STATE_PATHS[uf].x}
                    y={STATE_PATHS[uf].y + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] pointer-events-none select-none"
                    fill="#4b5563"
                  >
                    {data.totalDecisoes}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredData && (
          <Card className="absolute top-4 left-4 shadow-lg z-10 min-w-[200px]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" style={{ color: tenantColor }} />
                <span className="font-semibold">{hoveredData.estado}</span>
                <Badge variant="outline" className="text-xs">{hoveredData.trtNome}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span>{hoveredData.favoraveis} favoráveis</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span>{hoveredData.desfavoraveis} desfav.</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span>{hoveredData.totalComarcas} comarcas</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{hoveredData.totalRelatores} relatores</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-lg font-bold" style={{ color: hoveredData.percentualFavoravel >= 50 ? "#22c55e" : "#ef4444" }}>
                  {hoveredData.percentualFavoravel}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">favorável</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex-1 space-y-2 max-h-[500px] overflow-y-auto">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3 sticky top-0 bg-background py-1">
          Estados com Decisões ({estados.filter(e => e.totalDecisoes > 0).length})
        </h3>
        {estados.filter(e => e.totalDecisoes > 0).map((estado) => (
          <Card
            key={estado.uf}
            className={`cursor-pointer transition-all hover-elevate ${selectedUF === estado.uf ? 'ring-2' : ''}`}
            style={{ 
              borderColor: selectedUF === estado.uf ? tenantColor : undefined,
              ['--ring-color' as string]: tenantColor 
            }}
            onClick={() => onSelectEstado(estado.uf, estado.estado)}
            data-testid={`card-estado-${estado.uf}`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="font-mono"
                    style={{ backgroundColor: tenantColor + "20", color: tenantColor }}
                  >
                    {estado.uf}
                  </Badge>
                  <span className="font-medium text-sm">{estado.estado}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{estado.totalDecisoes} dec.</span>
                  <Badge 
                    variant={estado.percentualFavoravel >= 50 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {estado.percentualFavoravel}% fav
                  </Badge>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${estado.percentualFavoravel}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
