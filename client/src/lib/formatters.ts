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
  const formattedValue = Math.round(value).toLocaleString('pt-BR');
  
  if (absValue >= 1_000_000_000) {
    return `${formattedValue} (bi)`;
  }
  
  if (absValue >= 1_000_000) {
    return `${formattedValue} (mi)`;
  }
  
  if (absValue >= 1_000) {
    return `${formattedValue} (mil)`;
  }
  
  return formattedValue;
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
  const formattedValue = Math.round(value).toLocaleString('pt-BR');
  
  if (absValue >= 1_000_000) {
    return `${formattedValue} (mi)`;
  }
  
  if (absValue >= 1_000) {
    return `${formattedValue} (mil)`;
  }
  
  return formattedValue;
}
