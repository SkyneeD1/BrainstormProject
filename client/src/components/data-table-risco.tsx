import type { RiscoData } from "@shared/schema";
import { formatPercentageParens, formatCurrencyValue, formatTicketMedio } from "@/lib/formatters";

interface DataTableRiscoProps {
  data: RiscoData[];
  totals: {
    processos: number;
    valorTotal: number;
    ticketMedio: number;
  };
}

const riscoColors: Record<string, string> = {
  "Remoto": "border-l-4 border-l-chart-3",
  "Possível": "border-l-4 border-l-chart-4",
  "Provável": "border-l-4 border-l-chart-5",
};

export function DataTableRisco({ data, totals }: DataTableRiscoProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary text-secondary-foreground">
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">
              Base<br />Dez/24
            </th>
            <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider">
              # de<br />processos ativos
            </th>
            <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider">
              Valor total<br />risco
              <br /><span className="text-[10px] opacity-70">(R$)</span>
            </th>
            <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider">
              TMT<br />risco
              <br /><span className="text-[10px] opacity-70">(R$ / processo)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.risco}
              className={`${index % 2 === 0 ? "bg-card" : "bg-muted/30"} ${riscoColors[row.risco] || ""}`}
              data-testid={`row-risco-${row.risco.toLowerCase()}`}
            >
              <td className="px-4 py-3 font-medium text-foreground">
                {row.risco}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-semibold text-base">{row.processos.toLocaleString('pt-BR')}</span>
                <br />
                <span className="text-xs text-muted-foreground">{formatPercentageParens(row.percentualProcessos)}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-semibold text-base">{formatCurrencyValue(row.valorTotal)}</span>
                <br />
                <span className="text-xs text-muted-foreground">{formatPercentageParens(row.percentualValor)}</span>
              </td>
              <td className="px-4 py-3 text-center font-semibold text-base">
                {formatTicketMedio(row.ticketMedio)}
              </td>
            </tr>
          ))}
          <tr className="bg-muted font-semibold" data-testid="row-risco-total">
            <td className="px-4 py-3 text-foreground">Total Ativos</td>
            <td className="px-4 py-3 text-center">
              <span className="text-base">{totals.processos.toLocaleString('pt-BR')}</span>
              <br />
              <span className="text-xs text-muted-foreground">(100%)</span>
            </td>
            <td className="px-4 py-3 text-center">
              <span className="text-base">{formatCurrencyValue(totals.valorTotal)}</span>
              <br />
              <span className="text-xs text-muted-foreground">(100%)</span>
            </td>
            <td className="px-4 py-3 text-center text-base">
              {formatTicketMedio(totals.ticketMedio)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
