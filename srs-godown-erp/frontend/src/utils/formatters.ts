/* Formatting helpers used across the app. */

const currencySymbols: Record<string, string> = {
  PKR: 'Rs',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'د.إ',
};

export function formatDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}

export function formatDateTime(value: string | number | Date): string {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value: number, decimals = 0): string {
  if (Number.isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number, currency = 'PKR'): string {
  const symbol = currencySymbols[currency] ?? currency;
  return `${symbol} ${formatNumber(value, 0)}`;
}

/* Human-friendly "time ago" for activity feeds. */
export function timeAgo(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const table: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  let count = seconds;
  let unit = 'second';
  for (const [step, name] of table) {
    if (count < step) {
      unit = name;
      break;
    }
    count = Math.floor(count / step);
    unit = name;
  }
  const rounded = Math.max(0, Math.floor(count));
  if (rounded <= 0 && unit === 'second') return 'just now';
  return `${rounded} ${unit}${rounded === 1 ? '' : 's'} ago`;
}
