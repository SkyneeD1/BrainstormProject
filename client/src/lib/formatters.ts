export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatProcessos(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatCurrency(value: number): string {
  return `R$ ${formatCurrencyValue(value)}`;
}

export function formatCurrencyValue(value: number): string {
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return `${billions.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bi`;
  }
  
  if (absValue >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;
  }
  
  if (absValue >= 1_000) {
    const thousands = value / 1_000;
    return `${thousands.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mil`;
  }
  
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCurrencyFull(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatPercentageParens(value: number): string {
  return `(${value.toFixed(1)}%)`;
}

export function formatTicketMedio(value: number): string {
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;
  }
  
  if (absValue >= 1_000) {
    const thousands = value / 1_000;
    return `${thousands.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mil`;
  }
  
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
