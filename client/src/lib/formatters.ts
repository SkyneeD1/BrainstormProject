export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatProcessos(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatCurrency(value: number): string {
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
}

export function formatCurrencyValue(value: number): string {
  return Math.round(value).toLocaleString('pt-BR');
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatPercentageParens(value: number): string {
  return `(${Math.round(value)}%)`;
}

export function formatTicketMedio(value: number): string {
  return Math.round(value).toLocaleString('pt-BR');
}
