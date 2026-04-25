// ─── Spend forecast ──────────────────────────────────────────────────────────
// Given a list of assets, project total renewal spend for the next N months.
//
// We assume each asset recurs on the anniversary of its renewalDate at the same
// price (which is the common case for SaaS, domains, SSL, hosting, licenses).
// If renewalIntervalValue/Unit are present we respect them; otherwise we
// fall back to assuming yearly renewal, which matches how the add-asset flow
// creates domains/SSL/licenses today.
//
// All amounts are converted to a single display currency via a tiny static
// FX table. This is a rough forecast by design — for bookkeeping-grade
// numbers users should export to a CSV and reconcile manually.

import type { Asset, AssetWithDays } from "@/types";

// Approximate FX rates to USD as of 2026. Not exact — fine for an
// "how much will I spend next year" gut-check. Kept tiny on purpose.
const FX_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  TRY: 0.031,
  JPY: 0.0068,
  CAD: 0.73,
  AUD: 0.66,
  CHF: 1.13,
  CNY: 0.14,
  INR: 0.012,
  BRL: 0.18,
  MXN: 0.058,
  SEK: 0.094,
  NOK: 0.09,
  DKK: 0.145,
  PLN: 0.25,
  RUB: 0.011,
  ZAR: 0.053,
  SGD: 0.74,
  HKD: 0.128,
  KRW: 0.00073,
  NZD: 0.60,
};

export interface ForecastBucket {
  /** ISO YYYY-MM (UTC) */
  month: string;
  /** Zero-based month index from the "today" reference point (0 = current). */
  offset: number;
  /** Total in the display currency. */
  total: number;
  /** Count of renewal events falling in this bucket. */
  count: number;
  /** Per-asset-type breakdown. */
  byType: Record<string, number>;
}

export interface ForecastOptions {
  /** How many months ahead to project (inclusive of current month). */
  months?: number;
  /** Display currency (all amounts converted to this). */
  displayCurrency?: string;
  /** Reference "now" — tests pass this for deterministic output. */
  now?: Date;
}

interface ForecastResult {
  buckets: ForecastBucket[];
  displayCurrency: string;
  grandTotal: number;
  /** True if we had to drop some asset because of unknown currency. */
  skippedAssets: number;
}

function convertToDisplay(
  amount: number,
  from: string,
  to: string,
): number | null {
  const fromRate = FX_TO_USD[from];
  const toRate = FX_TO_USD[to];
  if (!fromRate || !toRate) return null;
  return (amount * fromRate) / toRate;
}

function inferIntervalMonths(asset: Asset): number {
  const unit = asset.renewalIntervalUnit?.toUpperCase();
  const value = asset.renewalIntervalValue ?? 0;
  if (unit === "MONTH" || unit === "MONTHS") return Math.max(1, value);
  if (unit === "YEAR" || unit === "YEARS") return Math.max(1, value) * 12;
  if (unit === "WEEK" || unit === "WEEKS") {
    // Round weeks → months (roughly 4.3)
    return Math.max(1, Math.round((Math.max(1, value) * 7) / 30));
  }
  if (unit === "DAY" || unit === "DAYS") {
    return Math.max(1, Math.round(Math.max(1, value) / 30));
  }
  // Default heuristic: credit cards are monthly, everything else is yearly.
  return asset.assetType === "CREDIT_CARD" ? 1 : 12;
}

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addMonthsUTC(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setUTCDate(1); // avoid month-length clamping
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d;
}

/**
 * Build month-by-month spend forecast for the next N months.
 */
export function buildForecast(
  assets: (Asset | AssetWithDays)[],
  opts: ForecastOptions = {},
): ForecastResult {
  const months = opts.months ?? 12;
  const displayCurrency = opts.displayCurrency ?? "USD";
  const now = opts.now ?? new Date();

  // Initialize buckets for current month + next (months - 1).
  const buckets: ForecastBucket[] = [];
  for (let i = 0; i < months; i++) {
    const d = addMonthsUTC(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      i,
    );
    buckets.push({
      month: monthKey(d),
      offset: i,
      total: 0,
      count: 0,
      byType: {},
    });
  }
  const bucketByKey = new Map(buckets.map((b) => [b.month, b]));

  // Active statuses we count for forecasting. Cancelled/archived assets are
  // ignored — they're not going to renew.
  const activeStatuses = new Set(["ACTIVE", "EXPIRING_SOON", "EXPIRED"]);

  let skipped = 0;

  for (const asset of assets) {
    if (!activeStatuses.has(asset.status)) continue;
    const rawAmount = asset.priceAmount ? Number(asset.priceAmount) : 0;
    if (!isFinite(rawAmount) || rawAmount <= 0) continue;

    const amount = convertToDisplay(
      rawAmount,
      (asset.priceCurrency || displayCurrency).toUpperCase(),
      displayCurrency,
    );
    if (amount == null) {
      skipped += 1;
      continue;
    }

    const intervalMonths = inferIntervalMonths(asset);

    // Start from the next renewal on/after the start of the forecast window.
    const windowStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const windowEnd = addMonthsUTC(windowStart, months); // exclusive

    let occurrence = new Date(asset.renewalDate);
    // Walk forward to the first occurrence inside (or after) the window.
    while (occurrence < windowStart) {
      occurrence = addMonthsUTC(occurrence, intervalMonths);
    }

    // Tally each occurrence that falls inside the window.
    while (occurrence < windowEnd) {
      const key = monthKey(occurrence);
      const bucket = bucketByKey.get(key);
      if (bucket) {
        bucket.total += amount;
        bucket.count += 1;
        bucket.byType[asset.assetType] =
          (bucket.byType[asset.assetType] ?? 0) + amount;
      }
      occurrence = addMonthsUTC(occurrence, intervalMonths);
    }
  }

  const grandTotal = buckets.reduce((sum, b) => sum + b.total, 0);

  return { buckets, displayCurrency, grandTotal, skippedAssets: skipped };
}

/** Format a numeric amount in a given currency using the browser locale. */
export function formatMoney(amount: number, currency: string, locale = "en-US"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Short "Jan 26", "Feb 26" style label from YYYY-MM. */
export function shortMonthLabel(month: string, locale = "en-US"): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  const d = new Date(Date.UTC(y, m - 1, 1));
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(d);
  } catch {
    return month;
  }
}
