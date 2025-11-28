import type { FaseData } from "@shared/schema";
import { formatPercentageParens, formatCurrencyMi, formatTicketMedio } from "@/lib/formatters";

interface DataTableFaseProps {
  data: FaseData[];
  totals: {
    processos: number;
    valorTotal: number;
    ticketMedio: number;
  };
}

export function DataTableFase({ data, totals }: DataTableFaseProps) {
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
            <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider bg-primary/20">
              <span className="text-primary-foreground">Valor total risco -<br />NOVO</span>
              <br /><span className="text-[10px] opacity-70">(mi R$)</span>
            </th>
            <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider">
              TM risco<br />CONTADOR +<br />PROJEÇÃO
              <br /><span className="text-[10px] opacity-70">(k R$ / processo)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.fase}
              className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
              data-testid={`row-fase-${row.fase.toLowerCase()}`}
            >
              <td className="px-4 py-3 font-medium text-foreground">
                {row.fase}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-semibold text-base">{row.processos.toLocaleString('pt-BR')}</span>
                <br />
                <span className="text-xs text-muted-foreground">{formatPercentageParens(row.percentualProcessos)}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-semibold text-base">{formatCurrencyMi(row.valorTotal)}</span>
                <br />
                <span className="text-xs text-muted-foreground">{formatPercentageParens(row.percentualValor)}</span>
              </td>
              <td className="px-4 py-3 text-center font-semibold text-base">
                {formatTicketMedio(row.ticketMedio)}
              </td>
            </tr>
          ))}
          <tr className="bg-muted font-semibold" data-testid="row-fase-total">
            <td className="px-4 py-3 text-foreground">Total Ativos</td>
            <td className="px-4 py-3 text-center">
              <span className="text-base">{totals.processos.toLocaleString('pt-BR')}</span>
              <br />
              <span className="text-xs text-muted-foreground">(100%)</span>
            </td>
            <td className="px-4 py-3 text-center">
              <span className="text-base">{formatCurrencyMi(totals.valorTotal)}</span>
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
