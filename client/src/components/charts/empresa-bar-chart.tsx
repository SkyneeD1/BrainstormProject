import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { EmpresaFaseData } from "@shared/schema";
import { Card } from "@/components/ui/card";

interface EmpresaBarChartProps {
  data: EmpresaFaseData[];
  title: string;
}

const COLORS: Record<string, string> = {
  "V.tal": "hsl(52, 100%, 50%)",
  "NIO": "hsl(120, 100%, 43%)",
  "OI": "hsl(0, 70%, 50%)",
  "Serede": "hsl(30, 90%, 50%)",
  "Sprink": "hsl(270, 60%, 50%)",
  "Outros Terceiros": "hsl(210, 15%, 50%)",
};

export function EmpresaBarChart({ data, title }: EmpresaBarChartProps) {
  const chartData = data.map((d) => ({
    name: d.empresa,
    value: d.total.valor / 1000000,
    processos: d.total.processos,
    percentual: d.total.percentualValor,
  }));

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="h-[220px]" data-testid="chart-bar-empresa">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `${value} mi`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              width={100}
            />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `R$ ${value.toFixed(0)} mi (${props.payload.percentual.toFixed(0)}%)`,
                "Valor Total"
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={800}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "hsl(200, 35%, 45%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
