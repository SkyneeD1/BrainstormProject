export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)} M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.0', '')} k`;
  }
  return value.toLocaleString('pt-BR');
}

export function formatProcessos(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString('pt-BR');
  }
  return value.toString();
}

export function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `R$ ${(value / 1000000000).toFixed(0)} B`;
  }
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(0)} M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)} k`;
  }
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

export function formatCurrencyMi(value: number): string {
  return `${Math.round(value / 1000000)}`;
}

export function formatCurrencyK(value: number): string {
  return `${Math.round(value / 1000)}`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatPercentageParens(value: number): string {
  return `(${Math.round(value)}%)`;
}

export function formatTicketMedio(value: number): string {
  return Math.round(value / 1000).toLocaleString('pt-BR');
}
