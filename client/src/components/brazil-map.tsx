import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, TrendingDown, Users, Building2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { BRAZIL_STATE_PATHS } from "@/lib/brazil-paths";

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

export function BrazilMap({ estados, onSelectEstado, selectedUF, tenantColor = "#ffd700" }: BrazilMapProps) {
  const [hoveredUF, setHoveredUF] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const getEstadoData = (uf: string): EstadoData | undefined => {
    return estados.find(e => e.uf === uf);
  };

  const getStateColor = (uf: string): string => {
    const data = getEstadoData(uf);
    
    if (selectedUF === uf) return tenantColor;
    if (hoveredUF === uf) return tenantColor;
    
    if (!data || data.totalDecisoes === 0) return "#d1d5db";
    
    const intensity = Math.min(data.totalDecisoes / 50, 1);
    if (data.percentualFavoravel >= 60) {
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.5})`;
    } else if (data.percentualFavoravel <= 40) {
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.5})`;
    }
    return `rgba(234, 179, 8, ${0.3 + intensity * 0.5})`;
  };

  const getStrokeColor = (uf: string): string => {
    if (selectedUF === uf) return tenantColor;
    if (hoveredUF === uf) return tenantColor;
    return "#94a3b8";
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  const hoveredData = hoveredUF ? getEstadoData(hoveredUF) : null;
  const estadosComDados = estados.filter(e => e.totalDecisoes > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleZoomIn}
            className="h-8 w-8 bg-background/90 backdrop-blur"
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleZoomOut}
            className="h-8 w-8 bg-background/90 backdrop-blur"
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleReset}
            className="h-8 w-8 bg-background/90 backdrop-blur"
            data-testid="button-zoom-reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {hoveredData && (
          <Card className="absolute top-2 left-2 shadow-lg z-20 min-w-[240px] bg-background/95 backdrop-blur border-2" style={{ borderColor: tenantColor }}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" style={{ color: tenantColor }} />
                <span className="font-semibold">{hoveredData.estado}</span>
                <Badge variant="outline" className="text-xs">{hoveredData.uf}</Badge>
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

        <div 
          className="overflow-hidden rounded-lg border bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800"
          style={{ cursor: isDragging ? 'grabbing' : (zoom > 1 ? 'grab' : 'default') }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg 
            ref={svgRef}
            viewBox="0 0 1000 912" 
            className="w-full h-auto"
            style={{ 
              maxHeight: '500px',
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <defs>
              <filter id="stateShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            <g id="states">
              {BRAZIL_STATE_PATHS.map(({ uf, name, path }) => {
                const data = getEstadoData(uf);
                const hasData = data && data.totalDecisoes > 0;
                const isHovered = hoveredUF === uf;
                const isSelected = selectedUF === uf;
                
                return (
                  <path
                    key={uf}
                    d={path}
                    fill={getStateColor(uf)}
                    stroke={getStrokeColor(uf)}
                    strokeWidth={isSelected ? 3 : isHovered ? 2 : 0.8}
                    strokeLinejoin="round"
                    filter={isHovered || isSelected ? "url(#stateShadow)" : undefined}
                    className={`transition-all duration-150 ${hasData ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{
                      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                      transformOrigin: 'center',
                      transformBox: 'fill-box'
                    }}
                    onMouseEnter={() => setHoveredUF(uf)}
                    onMouseLeave={() => setHoveredUF(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasData) onSelectEstado(uf, data.estado);
                    }}
                    data-testid={`map-state-${uf}`}
                  >
                    <title>{name}</title>
                  </path>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground px-2">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Use a roda do mouse para zoom • Arraste para mover</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">
          Estados com Decisões ({estadosComDados.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {estadosComDados.map((estado) => (
            <Card
              key={estado.uf}
              className={`cursor-pointer transition-all hover-elevate ${selectedUF === estado.uf ? 'ring-2' : ''}`}
              style={{ 
                borderColor: selectedUF === estado.uf ? tenantColor : undefined,
                ['--tw-ring-color' as string]: tenantColor 
              }}
              onClick={() => onSelectEstado(estado.uf, estado.estado)}
              onMouseEnter={() => setHoveredUF(estado.uf)}
              onMouseLeave={() => setHoveredUF(null)}
              data-testid={`card-estado-${estado.uf}`}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <Badge 
                    variant="secondary" 
                    className="font-mono text-xs px-1.5 py-0"
                    style={{ backgroundColor: tenantColor + "25", color: tenantColor, borderColor: tenantColor }}
                  >
                    {estado.uf}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{estado.totalDecisoes}</span>
                </div>
                <div className="text-xs font-medium truncate">{estado.estado}</div>
                <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all"
                    style={{ 
                      width: `${estado.percentualFavoravel}%`,
                      backgroundColor: estado.percentualFavoravel >= 50 ? "#22c55e" : "#ef4444"
                    }}
                  />
                </div>
                <div className="mt-0.5 text-center">
                  <span 
                    className="text-xs font-bold"
                    style={{ color: estado.percentualFavoravel >= 50 ? "#22c55e" : "#ef4444" }}
                  >
                    {estado.percentualFavoravel}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {estadosComDados.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum estado com decisões</p>
          </div>
        )}
      </div>
    </div>
  );
}
