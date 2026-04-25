import { describe, it, expect } from "vitest";
import { buildForecast, formatMoney, shortMonthLabel } from "./forecast";
import type { Asset } from "@/types";

// Minimal helper so test data doesn't balloon with every optional field.
function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "a1",
    name: "example.com",
    assetType: "DOMAIN",
    status: "ACTIVE",
    renewalDate: "2026-06-01T00:00:00.000Z",
    priceAmount: "100",
    priceCurrency: "USD",
    vendorName: null,
    projectId: null,
    project: null,
    ownerId: null,
    owner: null,
    renewalIntervalUnit: null,
    renewalIntervalValue: null,
    autoRenewEnabled: false,
    notes: null,
    last4Digits: null,
    bankName: null,
    billingCycleDay: null,
    dueDay: null,
    avgMonthlyAmount: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastRenewedAt: null,
    ...overrides,
  } as Asset;
}

const NOW = new Date("2026-04-01T00:00:00.000Z");

describe("buildForecast", () => {
  it("produces the requested number of buckets starting at 'now'", () => {
    const r = buildForecast([], { months: 6, now: NOW, displayCurrency: "USD" });
    expect(r.buckets).toHaveLength(6);
    expect(r.buckets[0].month).toBe("2026-04");
    expect(r.buckets[5].month).toBe("2026-09");
    expect(r.grandTotal).toBe(0);
  });

  it("tallies a single yearly asset into its renewal month", () => {
    const asset = makeAsset({
      renewalDate: "2026-06-15T00:00:00.000Z",
      priceAmount: "100",
      priceCurrency: "USD",
    });
    const r = buildForecast([asset], { months: 12, now: NOW, displayCurrency: "USD" });
    const june = r.buckets.find((b) => b.month === "2026-06");
    expect(june?.total).toBe(100);
    expect(june?.count).toBe(1);
    expect(r.grandTotal).toBe(100);
  });

  it("tallies a monthly credit card across the window", () => {
    const cc = makeAsset({
      assetType: "CREDIT_CARD",
      renewalDate: "2026-04-15T00:00:00.000Z",
      priceAmount: "50",
      priceCurrency: "USD",
      // no interval set — inferIntervalMonths defaults CC to 1
    });
    const r = buildForecast([cc], { months: 3, now: NOW, displayCurrency: "USD" });
    // Apr, May, Jun — 3 hits of $50
    expect(r.grandTotal).toBe(150);
    expect(r.buckets.every((b) => b.count === 1)).toBe(true);
  });

  it("skips cancelled / archived assets", () => {
    const cancelled = makeAsset({ status: "CANCELLED" });
    const archived = makeAsset({ status: "ARCHIVED" });
    const r = buildForecast([cancelled, archived], { months: 12, now: NOW });
    expect(r.grandTotal).toBe(0);
  });

  it("skips assets with zero / missing price", () => {
    const r = buildForecast(
      [
        makeAsset({ priceAmount: "0" }),
        makeAsset({ priceAmount: null }),
      ],
      { months: 12, now: NOW },
    );
    expect(r.grandTotal).toBe(0);
  });

  it("respects explicit MONTHS interval", () => {
    const quarterly = makeAsset({
      renewalDate: "2026-04-10T00:00:00.000Z",
      priceAmount: "300",
      priceCurrency: "USD",
      renewalIntervalUnit: "MONTH",
      renewalIntervalValue: 3,
    });
    const r = buildForecast([quarterly], { months: 12, now: NOW, displayCurrency: "USD" });
    // Apr, Jul, Oct, Jan → 4 hits
    expect(r.grandTotal).toBe(1200);
  });

  it("converts currencies via the FX table", () => {
    const euroAsset = makeAsset({
      priceAmount: "100",
      priceCurrency: "EUR",
      renewalDate: "2026-06-01T00:00:00.000Z",
    });
    const r = buildForecast([euroAsset], { months: 12, now: NOW, displayCurrency: "USD" });
    // 100 EUR × 1.08 = 108 USD (per the static FX_TO_USD table)
    expect(r.grandTotal).toBeCloseTo(108, 2);
  });

  it("counts unconvertible currencies as skipped, not zero", () => {
    const xyz = makeAsset({ priceCurrency: "XYZ" });
    const r = buildForecast([xyz], { months: 12, now: NOW });
    expect(r.skippedAssets).toBe(1);
    expect(r.grandTotal).toBe(0);
  });

  it("walks past-dated renewals forward into the window", () => {
    // Renewal was in 2025 — the function should walk forward yearly until
    // it lands in the 12-month window starting Apr 2026.
    const past = makeAsset({
      renewalDate: "2025-05-10T00:00:00.000Z",
      priceAmount: "42",
    });
    const r = buildForecast([past], { months: 12, now: NOW, displayCurrency: "USD" });
    const may = r.buckets.find((b) => b.month === "2026-05");
    expect(may?.total).toBe(42);
  });
});

describe("formatMoney", () => {
  it("renders currency with locale formatting", () => {
    const out = formatMoney(1234.5, "USD", "en-US");
    // Don't depend on exact non-breaking-space vs space nuances
    expect(out).toMatch(/\$/);
    expect(out).toMatch(/1,?235/); // rounded because amount >= 100 → 0 fraction digits
  });

  it("falls back gracefully on bogus currency codes", () => {
    const out = formatMoney(10, "NOTACURRENCY", "en-US");
    expect(out).toContain("NOTACURRENCY");
  });
});

describe("shortMonthLabel", () => {
  it("formats YYYY-MM into a short label", () => {
    const label = shortMonthLabel("2026-06", "en-US");
    expect(label.toLowerCase()).toContain("jun");
    expect(label).toMatch(/26/);
  });

  it("returns the input unchanged for invalid strings", () => {
    expect(shortMonthLabel("garbage", "en-US")).toBe("garbage");
  });
});
