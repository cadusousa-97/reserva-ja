/**
 * Convert cents to currency string
 * @param cents - Amount in cents (e.g., 1000 = $10.00)
 * @param locale - Locale for formatting (default: pt-BR)
 * @param currency - Currency code (default: BRL)
 * @returns Formatted currency string (e.g., "R$ 10,00")
 */
export function formatCurrency(
  cents: number,
  locale = 'pt-BR',
  currency = 'BRL',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Convert decimal amount to cents
 * @param amount - Decimal amount (e.g., 10.50)
 * @returns Amount in cents (e.g., 1050)
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert cents to decimal
 * @param cents - Amount in cents (e.g., 1050)
 * @returns Decimal amount (e.g., 10.50)
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Calculate discounted price
 * @param priceCents - Original price in cents
 * @param discountPercent - Discount percentage (0-100)
 * @returns Discounted price in cents
 */
export function applyDiscount(
  priceCents: number,
  discountPercent: number,
): number {
  return priceCents - Math.floor((priceCents * discountPercent) / 100);
}
