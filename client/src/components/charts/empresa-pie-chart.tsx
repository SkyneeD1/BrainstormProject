import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { EmpresaFaseData } from "@shared/schema";
import { Card } from "@/components/ui/card";

interface EmpresaPieChartProps {
  data: EmpresaFaseData[];
  title: string;
}

const COLORS: Record<string, string> = {
  "V.tal": "hsl(52, 100%, 50%)",
  "OI": "hsl(0, 70%, 50%)",
  "Serede": "hsl(30, 90%, 50%)",
  "Sprink": "hsl(270, 60%, 50%)",
  "Outros Terceiros": "hsl(210, 15%, 50%)",
};

export function EmpresaPieChart({ data, title }: EmpresaPieChartProps) {
  const chartData = data.map((d) => ({
    name: d.empresa,
    value: d.total.valor / 1000000,
    percentual: d.total.percentualValor,
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="h-[220px]" data-testid="chart-pie-empresa">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={70}
              innerRadius={25}
              fill="#8884d8"
              dataKey="value"
              animationDuration={800}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "hsl(200, 35%, 45%)"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `R$ ${value.toFixed(0)} mi (${props.payload.percentual.toFixed(0)}%)`,
                "Valor"
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: "hsl(var(--foreground))", fontSize: "10px", fontWeight: 500 }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
