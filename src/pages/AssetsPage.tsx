import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, MoreHorizontal, Search, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAssets, useDeleteAsset } from "@/hooks/useAssets";
import { useProjects } from "@/hooks/useOrganization";
import { formatDate, daysUntil, initials } from "@/lib/date";
import { ASSET_STATUS_DISPLAY, type AssetType, type AssetStatus } from "@/types";
import { CSVImportDialog } from "@/components/CSVImportDialog";

const TAB_DEFS: { key: string; type?: AssetType }[] = [
  { key: "all" },
  { key: "domains", type: "DOMAIN" },
  { key: "ssl", type: "SSL_CERTIFICATE" },
  { key: "servers", type: "SERVER" },
  { key: "hosting", type: "HOSTING_SERVICE" },
  { key: "licenses", type: "LICENSE" },
  { key: "cdn", type: "CDN_SERVICE" },
];

const typeColors: Record<string, string> = {
  DOMAIN: "text-primary",
  SSL_CERTIFICATE: "text-info",
  SERVER: "text-info",
  LICENSE: "text-warning",
  CDN_SERVICE: "text-success",
  HOSTING_SERVICE: "text-info",
  CUSTOM: "text-muted-foreground",
};

export default function AssetsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [csvOpen, setCsvOpen] = useState(false);

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    if (urlSearch !== search) setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    if (search && search !== urlSearch) {
      setSearchParams((prev) => { prev.set("search", search); return prev; }, { replace: true });
    } else if (!search && urlSearch) {
      setSearchParams((prev) => { prev.delete("search"); return prev; }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const activeType = TAB_DEFS.find((tab) => tab.key === activeTab)?.type;
  const queryParams: Record<string, string> = {};
  if (activeType) queryParams.assetType = activeType;
  if (statusFilter) queryParams.status = statusFilter;

  const { data: assets = [], isLoading } = useAssets(Object.keys(queryParams).length ? queryParams : undefined);
  const { data: projects = [] } = useProjects();
  const deleteAsset = useDeleteAsset();

  const filtered = assets.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !(a.vendorName ?? "").toLowerCase().includes(q)) return false;
    }
    if (projectFilter && a.projectId !== projectFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-0 border-b border-border overflow-x-auto scrollbar-none flex-1 min-w-0">
          {TAB_DEFS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-medium px-3 md:px-4 py-2.5 border-b-2 transition-colors duration-150 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.key
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {t(`assets.tabs.${tab.key}`)}{" "}
              <span className="text-[10px] tabular-nums opacity-60">
                {tab.type ? assets.filter((a) => a.assetType === tab.type).length : assets.length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setCsvOpen(true)}
            className="border border-border bg-secondary/50 hover:bg-secondary text-foreground px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center gap-2"
            title={t("csvImport.buttonTitle")}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t("csvImport.importCSV")}</span>
          </button>
          <Link
            to="/assets/new"
            className="bg-primary text-primary-foreground px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("assets.addAsset")}</span>
          </Link>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 md:p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="text"
                placeholder={t("assets.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm border border-border rounded-lg pl-9 pr-4 py-1.5 w-48 md:w-64 bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-secondary text-muted-foreground"
            >
              <option value="">{t("assets.allProjects")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-secondary text-muted-foreground"
            >
              <option value="">{t("assets.allStatuses")}</option>
              <option value="ACTIVE">{t("assets.statuses.ACTIVE")}</option>
              <option value="EXPIRING_SOON">{t("assets.statuses.EXPIRING_SOON")}</option>
              <option value="EXPIRED">{t("assets.statuses.EXPIRED")}</option>
              <option value="ARCHIVED">{t("assets.statuses.ARCHIVED")}</option>
            </select>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
            {isLoading ? t("assets.loadingAssets") : t("assets.counter", { filtered: filtered.length, total: assets.length })}
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 w-4"><input type="checkbox" className="rounded border-border accent-primary" /></th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("assets.table.name")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("assets.table.type")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("assets.table.vendor")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("assets.table.project")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("assets.table.renewalDate")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("assets.table.price")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("assets.table.status")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("assets.table.owner")}</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-right">{t("assets.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="px-5 py-8 text-center text-sm text-muted-foreground">{t("assets.loadingAssets")}</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={10} className="px-5 py-8 text-center text-sm text-muted-foreground">{t("assets.noAssets")}</td></tr>}
              {filtered.map((asset) => {
                const st = ASSET_STATUS_DISPLAY[asset.status as AssetStatus] ?? ASSET_STATUS_DISPLAY.ACTIVE;
                const days = daysUntil(asset.renewalDate);
                const ownerInitials = asset.assignedUser ? initials(asset.assignedUser.fullName) : "—";
                const price = asset.priceAmount ? `${asset.priceCurrency} ${parseFloat(asset.priceAmount).toFixed(2)}` : "—";
                return (
                  <tr key={asset.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors duration-150 h-[52px]">
                    <td className="px-5 py-3"><input type="checkbox" className="rounded border-border accent-primary" /></td>
                    <td className="px-5 py-3">
                      <Link to={`/assets/${asset.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-150">{asset.name}</Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-mono font-semibold uppercase ${typeColors[asset.assetType] || "text-muted-foreground"}`}>
                        {t(`assets.typeShort.${asset.assetType}`, { defaultValue: asset.assetType })}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{asset.vendorName ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{asset.project?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className="text-sm tabular-nums text-foreground font-mono">{formatDate(asset.renewalDate)}</span>
                      {days <= 30 && (
                        <p className={`text-[10px] tabular-nums ${days < 0 ? "text-destructive" : days <= 7 ? "text-destructive" : "text-warning"}`}>
                          {days < 0 ? t("assets.daysOverdue", { count: Math.abs(days) }) : t("assets.daysLeft", { count: days })}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium tabular-nums text-foreground">{price}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span className={`text-xs ${st.text}`}>{t(`assets.statuses.${asset.status}`, { defaultValue: asset.status })}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-foreground" title={asset.assignedUser?.fullName}>
                        {ownerInitials}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => { if (confirm(t("assetDetail.confirmDelete"))) deleteAsset.mutate(asset.id); }} className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                        <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-border">
          {isLoading && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("assets.loadingAssets")}</p>}
          {!isLoading && filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("assets.noAssets")}</p>}
          {filtered.map((asset) => {
            const st = ASSET_STATUS_DISPLAY[asset.status as AssetStatus] ?? ASSET_STATUS_DISPLAY.ACTIVE;
            const days = daysUntil(asset.renewalDate);
            const price = asset.priceAmount ? `${asset.priceCurrency} ${parseFloat(asset.priceAmount).toFixed(2)}` : null;
            return (
              <div key={asset.id} className="p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <Link to={`/assets/${asset.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block">
                      {asset.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-mono font-semibold uppercase ${typeColors[asset.assetType] || "text-muted-foreground"}`}>
                        {t(`assets.typeShort.${asset.assetType}`, { defaultValue: asset.assetType })}
                      </span>
                      {asset.vendorName && <span className="text-[10px] text-muted-foreground">· {asset.vendorName}</span>}
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    <span className={`text-xs ${st.text}`}>{t(`assets.statuses.${asset.status}`, { defaultValue: asset.status })}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{formatDate(asset.renewalDate)}</span>
                  <div className="flex items-center gap-3">
                    {price && <span className="font-medium text-foreground">{price}</span>}
                    {days <= 30 && (
                      <span className={`font-medium ${days < 0 ? "text-destructive" : days <= 7 ? "text-destructive" : "text-warning"}`}>
                        {days < 0 ? t("assets.daysOverdue", { count: Math.abs(days) }) : t("assets.daysLeft", { count: days })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 md:px-5 py-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground tabular-nums">{t("assets.assetsCount", { count: filtered.length })}</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors duration-150 disabled:opacity-40" disabled>{t("assets.prev")}</button>
            <button className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors duration-150">{t("assets.next")}</button>
          </div>
        </div>
      </div>

      <CSVImportDialog open={csvOpen} onClose={() => setCsvOpen(false)} />
    </div>
  );
}
