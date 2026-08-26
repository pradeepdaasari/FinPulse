export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sumCurrency(values: number[]): number {
  return roundCurrency(values.reduce((sum, v) => sum + v, 0));
}
