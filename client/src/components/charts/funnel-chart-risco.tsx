import { FunnelChart, Funnel, Cell, ResponsiveContainer, LabelList, Tooltip } from "recharts";
import type { RiscoData } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { formatCurrencyValue, formatTicketMedio } from "@/lib/formatters";

interface FunnelChartRiscoProps {
  data: RiscoData[];
  title: string;
}

const COLORS = {
  "Remoto": "hsl(147, 79%, 42%)",
  "Possível": "hsl(30, 95%, 55%)",
  "Provável": "hsl(0, 70%, 55%)",
};

export function FunnelChartRisco({ data, title }: FunnelChartRiscoProps) {
  const sortedData = [...data].sort((a, b) => b.processos - a.processos);
  
  const chartData = sortedData.map((d) => ({
    name: d.risco,
    value: d.processos,
    processos: d.processos,
    percentual: d.percentualProcessos,
    valorTotal: d.valorTotal,
    ticketMedio: d.ticketMedio,
    percentualValor: d.percentualValor,
    fill: COLORS[d.risco as keyof typeof COLORS],
  }));

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="h-[280px] flex-1 min-w-[200px]" data-testid="chart-funnel-risco">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  const item = props.payload;
                  return [
                    <div key="tooltip" className="space-y-1">
                      <div><strong>{item.processos.toLocaleString('pt-BR')}</strong> processos</div>
                      <div>{item.percentual.toFixed(0)}% do total</div>
                      <div>Valor: {formatCurrencyValue(item.valorTotal)}</div>
                      <div>Média: {formatTicketMedio(item.ticketMedio)}</div>
                    </div>,
                    ""
                  ];
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  padding: "10px",
                }}
              />
              <Funnel
                dataKey="value"
                data={chartData}
                isAnimationActive
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  position="center"
                  fill="#fff"
                  stroke="none"
                  fontSize={14}
                  fontWeight={600}
                  formatter={(value: number) => `${value.toLocaleString('pt-BR')}`}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-center gap-3 lg:w-[280px]">
          {chartData.map((item, index) => (
            <div
              key={item.name}
              className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
              data-testid={`funnel-desc-${item.name.toLowerCase()}`}
            >
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.fill }}
                />
                <div className="w-12 h-0.5 bg-border" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm mb-1" style={{ color: item.fill }}>
                  {item.name}
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Qtd:</span>{" "}
                    <span className="font-semibold">{item.processos.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">%:</span>{" "}
                    <span className="font-semibold">{item.percentual.toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Média:</span>{" "}
                    <span className="font-semibold">{formatTicketMedio(item.ticketMedio)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>{" "}
                    <span className="font-semibold">{formatCurrencyValue(item.valorTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
