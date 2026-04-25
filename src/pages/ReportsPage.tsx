import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Download, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAssets } from "@/hooks/useAssets";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildForecast,
  formatMoney,
  shortMonthLabel,
} from "@/lib/forecast";
import { getIntlLocale } from "@/i18n";

const MONTH_OPTIONS = [3, 6, 12, 24];

export default function ReportsPage() {
  const { t } = useTranslation();
  const { membership } = useAuth();
  const { data: assets = [], isLoading } = useAssets();
  const orgCurrency = membership?.organization.currency ?? "USD";
  const locale = getIntlLocale();

  const [months, setMonths] = useState(12);
  const [currency, setCurrency] = useState(orgCurrency);

  const forecast = useMemo(
    () => buildForecast(assets, { months, displayCurrency: currency }),
    [assets, months, currency],
  );

  const chartData = forecast.buckets.map((b) => ({
    month: shortMonthLabel(b.month, locale),
    total: Math.round(b.total),
    count: b.count,
  }));

  const avgMonthly = forecast.grandTotal / (months || 1);
  const peakBucket = forecast.buckets.reduce(
    (acc, b) => (b.total > acc.total ? b : acc),
    forecast.buckets[0] ?? { total: 0, month: "", count: 0, offset: 0, byType: {} },
  );

  // Build cross-type breakdown across the window
  const typeBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const b of forecast.buckets) {
      for (const [type, amount] of Object.entries(b.byType)) {
        acc[type] = (acc[type] ?? 0) + amount;
      }
    }
    return Object.entries(acc)
      .map(([type, total]) => ({ type, total }))
      .sort((a, b) => b.total - a.total);
  }, [forecast]);

  const exportCSV = () => {
    const header = ["Month", "Total", "Count"].join(",");
    const rows = forecast.buckets.map((b) =>
      [b.month, b.total.toFixed(2), b.count].join(","),
    );
    const blob = new Blob([`${header}\n${rows.join("\n")}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `renewpilot-forecast-${months}mo.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header / controls */}
      <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">
            {t("reports.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("reports.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="text-xs bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {t("reports.monthsOption", { count: m })}
              </option>
            ))}
          </select>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-xs bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
          >
            {["USD", "EUR", "GBP", "TRY", "JPY", "CAD", "AUD", "CHF"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCSV}
            className="text-xs bg-secondary hover:bg-secondary/80 border border-border rounded-lg px-3 py-1.5 text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            {t("reports.exportCSV")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-card border border-border rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                  {t("reports.grandTotal")}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                {formatMoney(forecast.grandTotal, currency, locale)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("reports.grandTotalSub", { months })}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 md:p-5">
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">
                {t("reports.avgMonthly")}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                {formatMoney(avgMonthly, currency, locale)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("reports.avgMonthlySub")}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 md:p-5">
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">
                {t("reports.peakMonth")}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                {formatMoney(peakBucket.total, currency, locale)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {peakBucket.month ? shortMonthLabel(peakBucket.month, locale) : "—"} · {peakBucket.count}{" "}
                {t("reports.renewals", { count: peakBucket.count })}
              </p>
            </div>
          </div>

          {forecast.skippedAssets > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs text-foreground">
                {t("reports.skippedAssets", { count: forecast.skippedAssets })}
              </p>
            </div>
          )}

          {/* Chart */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">
              {t("reports.monthlyBreakdown")}
            </h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    tickFormatter={(v) => formatMoney(Number(v), currency, locale).replace(/\.00$/, "")}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--secondary))" }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => formatMoney(value, currency, locale)}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-type breakdown */}
          {typeBreakdown.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 md:px-5 py-3 border-b border-border">
                <h2 className="text-sm font-medium text-foreground">
                  {t("reports.byTypeTitle")}
                </h2>
              </div>
              <ul className="divide-y divide-border">
                {typeBreakdown.map((row) => {
                  const pct = forecast.grandTotal
                    ? (row.total / forecast.grandTotal) * 100
                    : 0;
                  return (
                    <li
                      key={row.type}
                      className="flex items-center gap-3 px-4 md:px-5 py-3"
                    >
                      <span className="text-[10px] font-mono font-semibold uppercase w-20 text-muted-foreground flex-shrink-0">
                        {t(`assets.typeShort.${row.type}`, { defaultValue: row.type })}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                        {pct.toFixed(0)}%
                      </span>
                      <span className="text-sm font-medium text-foreground tabular-nums w-24 text-right">
                        {formatMoney(row.total, currency, locale)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            {t("reports.disclaimer")}
          </p>
        </>
      )}
    </div>
  );
}
