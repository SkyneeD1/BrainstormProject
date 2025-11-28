import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { FaseData } from "@shared/schema";
import { Card } from "@/components/ui/card";

interface BarChartFaseProps {
  data: FaseData[];
  title: string;
  dataKey: "processos" | "valorTotal";
  formatValue?: (value: number) => string;
}

const colors = ["hsl(200, 35%, 35%)", "hsl(200, 35%, 45%)", "hsl(200, 35%, 55%)"];

export function BarChartFase({ data, title, dataKey, formatValue }: BarChartFaseProps) {
  const chartData = data.map((d) => ({
    name: d.fase,
    value: dataKey === "valorTotal" ? d.valorTotal / 1000000 : d.processos,
    original: dataKey === "valorTotal" ? d.valorTotal : d.processos,
  }));

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="h-[200px]" data-testid={`chart-bar-${dataKey}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => formatValue ? formatValue(value) : value.toLocaleString('pt-BR')}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              width={90}
            />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                formatValue ? formatValue(props.payload.original) : props.payload.original.toLocaleString('pt-BR'),
                dataKey === "valorTotal" ? "Valor Total" : "Processos"
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
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
