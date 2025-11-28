import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  accentColor?: "yellow" | "blue" | "green" | "red";
}

const accentColors = {
  yellow: "bg-primary",
  blue: "bg-chart-2",
  green: "bg-chart-3",
  red: "bg-chart-5",
};

export function KPICard({ title, value, subtitle, icon: Icon, accentColor = "yellow" }: KPICardProps) {
  return (
    <Card className="relative overflow-visible p-5">
      <div className={`absolute left-0 top-4 bottom-4 w-1 ${accentColors[accentColor]} rounded-r`} />
      <div className="flex items-start justify-between pl-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <span className="text-2xl font-bold tracking-tight" data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-md ${accentColors[accentColor]}/10`}>
            <Icon className={`h-5 w-5 text-${accentColor === "yellow" ? "primary" : `chart-${accentColor === "blue" ? "2" : accentColor === "green" ? "3" : "5"}`}`} />
          </div>
        )}
      </div>
    </Card>
  );
}
