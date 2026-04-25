import { describe, it, expect } from "vitest";
import {
  parseCSV,
  autoDetectColumns,
  normalizeAssetType,
  parseFlexibleDate,
  parsePrice,
} from "./csv";

describe("parseCSV", () => {
  it("returns an empty array for empty input", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("parses a simple comma-delimited file", () => {
    const csv = "a,b,c\n1,2,3\n4,5,6";
    expect(parseCSV(csv)).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  it("auto-detects semicolon delimiter (German Excel)", () => {
    const csv = "name;price;currency\nfoo;100;EUR\nbar;200;EUR";
    const out = parseCSV(csv);
    expect(out[0]).toEqual(["name", "price", "currency"]);
    expect(out[1]).toEqual(["foo", "100", "EUR"]);
  });

  it("handles quoted fields with commas inside", () => {
    const csv = `name,note\n"foo, the great",hello\nbar,"with ""quotes"" inside"`;
    const out = parseCSV(csv);
    expect(out[1]).toEqual(["foo, the great", "hello"]);
    expect(out[2]).toEqual(["bar", `with "quotes" inside`]);
  });

  it("handles CRLF line endings", () => {
    const csv = "a,b\r\n1,2\r\n3,4\r\n";
    expect(parseCSV(csv)).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("strips a leading BOM", () => {
    const csv = "\uFEFFa,b\n1,2";
    expect(parseCSV(csv)[0]).toEqual(["a", "b"]);
  });
});

describe("autoDetectColumns", () => {
  it("matches English headers exactly", () => {
    const m = autoDetectColumns([
      "Name", "Type", "Renewal Date", "Vendor", "Price", "Currency", "Notes", "Project",
    ]);
    expect(m.name).toBe(0);
    expect(m.assetType).toBe(1);
    expect(m.renewalDate).toBe(2);
    expect(m.vendorName).toBe(3);
    expect(m.priceAmount).toBe(4);
    expect(m.priceCurrency).toBe(5);
    expect(m.notes).toBe(6);
    expect(m.projectName).toBe(7);
  });

  it("matches Turkish headers", () => {
    const m = autoDetectColumns(["Ad", "Tip", "Yenileme", "Sağlayıcı", "Fiyat"]);
    expect(m.name).toBe(0);
    expect(m.assetType).toBe(1);
    expect(m.renewalDate).toBe(2);
    expect(m.vendorName).toBe(3);
    expect(m.priceAmount).toBe(4);
  });

  it("ignores headers it doesn't recognize", () => {
    const m = autoDetectColumns(["totally", "unrelated", "fields"]);
    expect(Object.keys(m)).toHaveLength(0);
  });
});

describe("normalizeAssetType", () => {
  it("recognizes canonical uppercase values", () => {
    expect(normalizeAssetType("DOMAIN")).toBe("DOMAIN");
    expect(normalizeAssetType("ssl_certificate")).toBe("SSL_CERTIFICATE");
  });

  it("matches common aliases (en + i18n)", () => {
    expect(normalizeAssetType("ssl")).toBe("SSL_CERTIFICATE");
    expect(normalizeAssetType("vps")).toBe("SERVER");
    expect(normalizeAssetType("hosting")).toBe("HOSTING_SERVICE");
    expect(normalizeAssetType("kart")).toBe("CREDIT_CARD");
    expect(normalizeAssetType("lisans")).toBe("LICENSE");
  });

  it("returns null for unknown values", () => {
    expect(normalizeAssetType("widget")).toBeNull();
    expect(normalizeAssetType("")).toBeNull();
  });
});

describe("parseFlexibleDate", () => {
  it("parses ISO format", () => {
    expect(parseFlexibleDate("2026-12-01")).toBe("2026-12-01");
    expect(parseFlexibleDate("2026/12/01")).toBe("2026-12-01");
  });

  it("parses European DD.MM.YYYY", () => {
    expect(parseFlexibleDate("01.12.2026")).toBe("2026-12-01");
    expect(parseFlexibleDate("31/12/2026")).toBe("2026-12-31");
  });

  it("disambiguates when the day is > 12 (definitely DD first)", () => {
    expect(parseFlexibleDate("13/01/2026")).toBe("2026-01-13");
  });

  it("rejects nonsense (Feb 30) instead of silently rolling over", () => {
    expect(parseFlexibleDate("30/02/2026")).toBeNull();
  });

  it("returns null for unparseable input", () => {
    expect(parseFlexibleDate("not a date")).toBeNull();
    expect(parseFlexibleDate("")).toBeNull();
  });
});

describe("parsePrice", () => {
  it("parses US-style with currency symbol", () => {
    expect(parsePrice("$1,234.56")).toEqual({ amount: "1234.56", currency: "USD" });
  });

  it("parses European-style with comma decimal", () => {
    expect(parsePrice("1.234,56 €")).toEqual({ amount: "1234.56", currency: "EUR" });
  });

  it("parses currency code suffix", () => {
    expect(parsePrice("100 USD")).toEqual({ amount: "100", currency: "USD" });
    expect(parsePrice("250 TRY")).toEqual({ amount: "250", currency: "TRY" });
  });

  it("strips trailing .00", () => {
    expect(parsePrice("100.00 USD").amount).toBe("100");
  });

  it("returns null amount when no number is found", () => {
    expect(parsePrice("free")).toEqual({ amount: null, currency: null });
  });
});
