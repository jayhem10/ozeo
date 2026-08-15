// All monetary values are handled as integer cents to avoid floating point
// precision errors. Never use raw floats for money math.

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatMoney(
  cents: number,
  currency: string = "EUR",
  locale: string = "fr-FR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(fromCents(cents));
}

export function formatSignedMoney(
  cents: number,
  currency: string = "EUR",
  locale: string = "fr-FR"
): string {
  const formatted = formatMoney(Math.abs(cents), currency, locale);
  return cents < 0 ? `-${formatted}` : `+${formatted}`;
}

export function formatPercent(ratio: number, digits: number = 0): string {
  return `${(ratio * 100).toFixed(digits)} %`;
}
