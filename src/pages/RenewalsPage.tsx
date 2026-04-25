import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpcomingRenewals, useOverdueRenewals, useRenewAsset } from "@/hooks/useRenewals";
import { formatDate, daysUntil, daysColor } from "@/lib/date";

const typeColors: Record<string, string> = {
  DOMAIN: "text-primary",
  SSL_CERTIFICATE: "text-info",
  SERVER: "text-info",
  LICENSE: "text-warning",
  CDN_SERVICE: "text-success",
  HOSTING_SERVICE: "text-info",
  CUSTOM: "text-muted-foreground",
};

export default function RenewalsPage() {
  const { t } = useTranslation();
  const { data: upcoming = [], isLoading } = useUpcomingRenewals(90);
  const { data: overdue = [] } = useOverdueRenewals();
  const renewAsset = useRenewAsset();

  const all = [
    ...overdue,
    ...upcoming,
  ].sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-foreground">{t("renewals.title")}</h2>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("renewals.table.asset")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("renewals.table.type")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("renewals.table.renewalDate")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("renewals.table.daysLeft")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("renewals.table.price")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-right">{t("renewals.table.action")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">{t("renewals.loading")}</td></tr>
              )}
              {!isLoading && all.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">{t("renewals.empty")}</td></tr>
              )}
              {all.map((r) => {
                const days = daysUntil(r.renewalDate);
                const { dot, text } = daysColor(days);
                const price = r.priceAmount ? `${r.priceCurrency} ${parseFloat(r.priceAmount).toFixed(2)}` : "—";
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors duration-150 h-[52px]">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{r.name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-mono font-semibold uppercase ${typeColors[r.assetType] || "text-muted-foreground"}`}>
                        {t(`assets.typeShort.${r.assetType}`, { defaultValue: r.assetType })}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums text-foreground font-mono">{formatDate(r.renewalDate)}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        <span className={`text-xs font-medium tabular-nums ${text}`}>
                          {days < 0 ? t("renewals.daysOverdue", { count: Math.abs(days) }) : t("renewals.daysLeft", { count: days })}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium tabular-nums text-foreground">{price}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => renewAsset.mutate({ assetId: r.id })}
                        disabled={renewAsset.isPending}
                        className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors duration-150 disabled:opacity-50"
                      >
                        {t("renewals.renew")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {isLoading && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("renewals.loading")}</p>}
          {!isLoading && all.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("renewals.empty")}</p>}
          {all.map((r) => {
            const days = daysUntil(r.renewalDate);
            const { dot, text } = daysColor(days);
            const price = r.priceAmount ? `${r.priceCurrency} ${parseFloat(r.priceAmount).toFixed(2)}` : null;
            return (
              <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-mono font-semibold uppercase ${typeColors[r.assetType] || "text-muted-foreground"}`}>
                      {t(`assets.typeShort.${r.assetType}`, { defaultValue: r.assetType })}
                    </span>
                    {price && <span className="text-[10px] text-muted-foreground">· {price}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">{formatDate(r.renewalDate)}</span>
                    <span className="flex items-center gap-1">
                      <span className={`w-1 h-1 rounded-full ${dot}`} />
                      <span className={`text-[10px] font-medium ${text}`}>
                        {days < 0 ? t("renewals.daysOverdue", { count: Math.abs(days) }) : t("renewals.daysLeft", { count: days })}
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => renewAsset.mutate({ assetId: r.id })}
                  disabled={renewAsset.isPending}
                  className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors duration-150 disabled:opacity-50 flex-shrink-0"
                >
                  {t("renewals.renew")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
