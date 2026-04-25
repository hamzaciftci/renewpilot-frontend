import { describe, it, expect, vi, afterEach } from "vitest";
import { daysUntil, daysColor, initials } from "./date";

describe("daysUntil", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for today", () => {
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));
    expect(daysUntil("2026-04-15T00:00:00.000Z")).toBe(0);
  });

  it("returns positive days for future dates", () => {
    vi.setSystemTime(new Date("2026-04-15T00:00:00.000Z"));
    expect(daysUntil("2026-04-22T00:00:00.000Z")).toBe(7);
  });

  it("returns negative days for past dates", () => {
    vi.setSystemTime(new Date("2026-04-15T00:00:00.000Z"));
    expect(daysUntil("2026-04-10T00:00:00.000Z")).toBe(-5);
  });
});

describe("daysColor", () => {
  it("flags overdue (negative) and within-7-days as destructive", () => {
    expect(daysColor(-1).text).toContain("destructive");
    expect(daysColor(0).text).toContain("destructive");
    expect(daysColor(7).text).toContain("destructive");
  });

  it("flags 8–30 days as warning", () => {
    expect(daysColor(8).text).toContain("warning");
    expect(daysColor(30).text).toContain("warning");
  });

  it("treats > 30 days as muted", () => {
    expect(daysColor(31).text).toContain("muted");
    expect(daysColor(365).text).toContain("muted");
  });
});

describe("initials", () => {
  it("returns first letters of first two words, uppercased", () => {
    expect(initials("Hamza Yılmaz")).toBe("HY");
    expect(initials("john doe")).toBe("JD");
  });

  it("handles single-word names", () => {
    expect(initials("Hamza")).toBe("H");
  });

  it("ignores third+ words", () => {
    expect(initials("Anna Maria Bianchi")).toBe("AM");
  });

  it("returns empty for empty input", () => {
    expect(initials("")).toBe("");
  });
});
