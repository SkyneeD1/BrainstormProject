import type { EmpresaFaseData } from "@shared/schema";
import { formatPercentageParens, formatCurrencyValue } from "@/lib/formatters";
import { useTenant } from "@/hooks/use-tenant";

interface DataTableOrigemProps {
  data: EmpresaFaseData[];
  totals: {
    processos: number;
    valorTotal: number;
    conhecimento: { processos: number; valor: number };
    recursal: { processos: number; valor: number };
    execucao: { processos: number; valor: number };
  };
}

export function DataTableOrigem({ data, totals }: DataTableOrigemProps) {
  const { tenantName, tenantCode } = useTenant();
  const mainCompanyLabel = tenantCode === "nio" ? "NIO" : "V tal";
  
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="bg-secondary text-secondary-foreground">
            <th rowSpan={2} className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider border-r border-border/50 w-24">
              Base
            </th>
            <th rowSpan={2} className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider border-r border-border/50 w-20">
              # de<br />processos
            </th>
            <th rowSpan={2} className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider border-r border-border/50 w-28">
              Valor total<br />estimado<br /><span className="text-[10px] opacity-70">(R$)</span>
            </th>
            <th colSpan={2} className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider border-r border-border/50">
              <div className="flex items-center justify-center gap-1">
                <span className="inline-block px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">{mainCompanyLabel}</span>
              </div>
            </th>
            <th colSpan={2} className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider border-r border-border/50">
              <div className="flex items-center justify-center gap-1">
                <span className="inline-block px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">oi</span>
              </div>
            </th>
            <th colSpan={2} className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider border-r border-border/50">
              <div className="flex items-center justify-center gap-1">
                <span className="inline-block px-2 py-0.5 rounded bg-orange-500 text-white text-[10px] font-bold">SEREDE</span>
              </div>
            </th>
            <th colSpan={2} className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider border-r border-border/50">
              <div className="flex items-center justify-center gap-1">
                <span className="inline-block px-2 py-0.5 rounded bg-purple-500 text-white text-[10px] font-bold">SPRINK</span>
              </div>
            </th>
            <th colSpan={2} className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider">
              Outros Terceiros
            </th>
          </tr>
          <tr className="bg-secondary/80 text-secondary-foreground">
            <th className="px-2 py-1 text-center text-[10px] font-medium border-r border-border/30">#<br />processos</th>
            <th className="px-2 py-1 text-center text-[10px] font-medium border-r border-border/50">Valor total<br />(% do total)</th>
            <th className="px-2 py-1 text-center text-[10px] font-medium border-r border-border/30">#<br />processos</th>
            <th className="px-2 py-1 text-center text-[10px] font-medium border-r border-border/50">Valor total<br />(% do total)</th>
            <th className="px-2 py-1 text-center text-[10px] font-medium border-r border-border/30">#<br />processos</th>
            <th className="px-2 py-1 text-center text-[10px] font-medium border-r border-border/50">Valor total<br />(% do total)</th>
            <th className="px-2 py-1 text-center text-[10px] font-medium border-r border-border/30">#<br />processos</th>
            <th className="px-2 py-1 text-center text-[10px] font-medium border-r border-border/50">Valor total<br />(% do total)</th>
            <th className="px-2 py-1 text-center text-[10px] font-medium border-r border-border/30">#<br />processos</th>
            <th className="px-2 py-1 text-center text-[10px] font-medium">Valor total<br />(% do total)</th>
          </tr>
        </thead>
        <tbody>
          {["Conhecimento", "Recursal", "Execução"].map((fase, faseIndex) => {
            const faseKeyMapping: Record<string, "conhecimento" | "recursal" | "execucao"> = {
              "Conhecimento": "conhecimento",
              "Recursal": "recursal",
              "Execução": "execucao"
            };
            const mappedKey = faseKeyMapping[fase];
            
            const faseTotals = data.reduce((acc, emp) => ({
              processos: acc.processos + (emp[mappedKey]?.processos || 0),
              valor: acc.valor + (emp[mappedKey]?.valor || 0),
            }), { processos: 0, valor: 0 });

            return (
              <tr
                key={fase}
                className={faseIndex % 2 === 0 ? "bg-card" : "bg-muted/30"}
                data-testid={`row-origem-${fase.toLowerCase()}`}
              >
                <td className="px-3 py-3 font-medium text-foreground border-r border-border/30">{fase}</td>
                <td className="px-3 py-3 text-center border-r border-border/30">
                  <span className="font-semibold">{faseTotals.processos.toLocaleString('pt-BR')}</span>
                  <br />
                  <span className="text-[10px] text-muted-foreground">
                    {formatPercentageParens(totals.processos > 0 ? (faseTotals.processos / totals.processos) * 100 : 0)}
                  </span>
                </td>
                <td className="px-3 py-3 text-center border-r border-border/30">
                  <span className="font-semibold">{formatCurrencyValue(faseTotals.valor)}</span>
                  <br />
                  <span className="text-[10px] text-muted-foreground">
                    {formatPercentageParens(totals.valorTotal > 0 ? (faseTotals.valor / totals.valorTotal) * 100 : 0)}
                  </span>
                </td>
                {data.map((empresa) => {
                  const faseData = empresa[mappedKey];
                  return (
                    <td key={`${empresa.empresa}-${fase}`} colSpan={2} className="px-2 py-3 text-center border-r border-border/30 last:border-r-0">
                      <div className="flex items-center justify-center gap-4">
                        <span className="font-semibold min-w-[40px]">{faseData?.processos?.toLocaleString('pt-BR') || 0}</span>
                        <span className="text-[11px] min-w-[70px]">
                          {formatCurrencyValue(faseData?.valor || 0)}
                          <br />
                          <span className="text-muted-foreground">{formatPercentageParens(faseData?.percentualValor || 0)}</span>
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr className="bg-muted font-semibold" data-testid="row-origem-total">
            <td className="px-3 py-3 text-foreground border-r border-border/30">Total Ativos</td>
            <td className="px-3 py-3 text-center border-r border-border/30">
              <span>{totals.processos.toLocaleString('pt-BR')}</span>
              <br />
              <span className="text-[10px] text-muted-foreground">(100%)</span>
            </td>
            <td className="px-3 py-3 text-center border-r border-border/30">
              <span>{formatCurrencyValue(totals.valorTotal)}</span>
              <br />
              <span className="text-[10px] text-muted-foreground">(100%)</span>
            </td>
            {data.map((empresa) => (
              <td key={`total-${empresa.empresa}`} colSpan={2} className="px-2 py-3 text-center border-r border-border/30 last:border-r-0">
                <div className="flex items-center justify-center gap-4">
                  <span className="min-w-[40px]">{empresa.total.processos.toLocaleString('pt-BR')}</span>
                  <span className="text-[11px] min-w-[70px]">
                    {formatCurrencyValue(empresa.total.valor)}
                    <br />
                    <span className="text-muted-foreground">{formatPercentageParens(empresa.total.percentualValor)}</span>
                  </span>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
