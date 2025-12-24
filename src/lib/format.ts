/**
 * Format a number with locale-appropriate thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a number as currency
 */
export function formatCurrency(num: number, decimals = 2): string {
  return `$${num.toFixed(decimals)}`;
}

/**
 * Format a number with K/M suffix for large numbers
 */
export function formatCompact(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${Math.round(num / 1_000)}K`;
  }
  return formatNumber(num);
}

