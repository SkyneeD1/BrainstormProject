import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { FaseData } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { formatTicketMedio } from "@/lib/formatters";

interface GroupedBarChartProps {
  data: FaseData[];
  title: string;
}

const colors = ["hsl(52, 100%, 50%)", "hsl(52, 90%, 55%)", "hsl(52, 80%, 60%)"];

export function GroupedBarChart({ data, title }: GroupedBarChartProps) {
  const chartData = data.map((d) => ({
    name: d.fase,
    ticketMedio: Math.round(d.ticketMedio / 1000),
    original: d.ticketMedio,
  }));

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="h-[200px]" data-testid="chart-grouped-ticket">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `${value}k`}
            />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `R$ ${formatTicketMedio(props.payload.original)} k`,
                "Ticket Médio"
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Bar dataKey="ticketMedio" radius={[4, 4, 0, 0]} animationDuration={800}>
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
