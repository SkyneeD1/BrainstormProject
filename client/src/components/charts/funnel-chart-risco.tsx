import type { RiscoData } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { formatCurrencyValue, formatTicketMedio } from "@/lib/formatters";

interface FunnelChartRiscoProps {
  data: RiscoData[];
  title: string;
}

const COLORS = {
  "Remoto": { main: "hsl(147, 79%, 42%)", dark: "hsl(147, 79%, 32%)", light: "hsl(147, 79%, 52%)" },
  "Possível": { main: "hsl(30, 95%, 55%)", dark: "hsl(30, 95%, 45%)", light: "hsl(30, 95%, 65%)" },
  "Provável": { main: "hsl(0, 70%, 55%)", dark: "hsl(0, 70%, 45%)", light: "hsl(0, 70%, 65%)" },
};

export function FunnelChartRisco({ data, title }: FunnelChartRiscoProps) {
  const sortedData = [...data].sort((a, b) => b.processos - a.processos);
  
  const chartData = sortedData.map((d, index) => ({
    name: d.risco,
    processos: d.processos,
    percentual: d.percentualProcessos,
    valorTotal: d.valorTotal,
    ticketMedio: d.ticketMedio,
    percentualValor: d.percentualValor,
    colors: COLORS[d.risco as keyof typeof COLORS],
    position: index,
  }));

  const maxWidth = 220;
  const minWidth = 100;
  const cylinderHeight = 45;
  const gap = 8;
  const totalHeight = chartData.length * (cylinderHeight + gap);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      
      <div className="flex items-center justify-center" data-testid="chart-funnel-risco">
        <svg 
          viewBox={`0 0 500 ${totalHeight + 40}`} 
          className="w-full max-w-[500px] h-auto"
          style={{ minHeight: '280px' }}
        >
          {chartData.map((item, index) => {
            const widthRatio = 1 - (index * 0.25);
            const width = Math.max(minWidth, maxWidth * widthRatio);
            const centerX = 250;
            const y = 20 + index * (cylinderHeight + gap);
            const isLeft = index % 2 === 0;
            
            const ellipseRx = width / 2;
            const ellipseRy = 12;
            
            return (
              <g key={item.name}>
                <ellipse
                  cx={centerX}
                  cy={y + cylinderHeight}
                  rx={ellipseRx}
                  ry={ellipseRy}
                  fill={item.colors.dark}
                />
                
                <path
                  d={`
                    M ${centerX - ellipseRx} ${y + ellipseRy}
                    L ${centerX - ellipseRx} ${y + cylinderHeight}
                    A ${ellipseRx} ${ellipseRy} 0 0 0 ${centerX + ellipseRx} ${y + cylinderHeight}
                    L ${centerX + ellipseRx} ${y + ellipseRy}
                    A ${ellipseRx} ${ellipseRy} 0 0 1 ${centerX - ellipseRx} ${y + ellipseRy}
                  `}
                  fill={item.colors.main}
                />
                
                <ellipse
                  cx={centerX}
                  cy={y + ellipseRy}
                  rx={ellipseRx}
                  ry={ellipseRy}
                  fill={item.colors.light}
                />
                
                <text
                  x={centerX}
                  y={y + cylinderHeight / 2 + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {item.processos.toLocaleString('pt-BR')}
                </text>
                
                {isLeft ? (
                  <>
                    <line
                      x1={centerX - ellipseRx - 5}
                      y1={y + cylinderHeight / 2}
                      x2={centerX - ellipseRx - 30}
                      y2={y + cylinderHeight / 2}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="1"
                    />
                    <circle
                      cx={centerX - ellipseRx - 30}
                      cy={y + cylinderHeight / 2}
                      r="3"
                      fill={item.colors.main}
                    />
                    <text
                      x={centerX - ellipseRx - 40}
                      y={y + cylinderHeight / 2 - 8}
                      textAnchor="end"
                      fill="hsl(var(--foreground))"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {item.name}
                    </text>
                    <text
                      x={centerX - ellipseRx - 40}
                      y={y + cylinderHeight / 2 + 6}
                      textAnchor="end"
                      fill="hsl(var(--muted-foreground))"
                      fontSize="9"
                    >
                      {item.percentual.toFixed(0)}% | {formatCurrencyValue(item.valorTotal)}
                    </text>
                    <text
                      x={centerX - ellipseRx - 40}
                      y={y + cylinderHeight / 2 + 18}
                      textAnchor="end"
                      fill="hsl(var(--muted-foreground))"
                      fontSize="9"
                    >
                      Média: {formatTicketMedio(item.ticketMedio)}
                    </text>
                  </>
                ) : (
                  <>
                    <line
                      x1={centerX + ellipseRx + 5}
                      y1={y + cylinderHeight / 2}
                      x2={centerX + ellipseRx + 30}
                      y2={y + cylinderHeight / 2}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="1"
                    />
                    <circle
                      cx={centerX + ellipseRx + 30}
                      cy={y + cylinderHeight / 2}
                      r="3"
                      fill={item.colors.main}
                    />
                    <text
                      x={centerX + ellipseRx + 40}
                      y={y + cylinderHeight / 2 - 8}
                      textAnchor="start"
                      fill="hsl(var(--foreground))"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {item.name}
                    </text>
                    <text
                      x={centerX + ellipseRx + 40}
                      y={y + cylinderHeight / 2 + 6}
                      textAnchor="start"
                      fill="hsl(var(--muted-foreground))"
                      fontSize="9"
                    >
                      {item.percentual.toFixed(0)}% | {formatCurrencyValue(item.valorTotal)}
                    </text>
                    <text
                      x={centerX + ellipseRx + 40}
                      y={y + cylinderHeight / 2 + 18}
                      textAnchor="start"
                      fill="hsl(var(--muted-foreground))"
                      fontSize="9"
                    >
                      Média: {formatTicketMedio(item.ticketMedio)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </Card>
  );
}
