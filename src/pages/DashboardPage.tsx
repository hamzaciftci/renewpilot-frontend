import {
  Layers, Clock, AlertCircle, CheckCircle, Bell, Plus, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip,
} from "recharts";
import { useRenewalSummary, useUpcomingRenewals, useOverdueRenewals, useRenewAsset } from "@/hooks/useRenewals";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDate, daysUntil, daysColor, timeAgo } from "@/lib/date";
import { ASSET_TYPE_LABEL } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  DOMAIN: "bg-primary",
  SSL_CERTIFICATE: "bg-success",
  SERVER: "bg-info",
  HOSTING_SERVICE: "bg-warning",
  LICENSE: "bg-destructive",
  CDN_SERVICE: "bg-muted-foreground",
  CUSTOM: "bg-muted-foreground",
};

const typeColors: Record<string, string> = {
  DOMAIN: "text-primary",
  SSL_CERTIFICATE: "text-info",
  SERVER: "text-info",
  LICENSE: "text-warning",
  CDN_SERVICE: "text-success",
  HOSTING_SERVICE: "text-info",
  CUSTOM: "text-muted-foreground",
};

const activityIcons: Record<string, { icon: typeof CheckCircle; dotColor: string }> = {
  RENEWED: { icon: CheckCircle, dotColor: "bg-success" },
  REMINDER_SENT: { icon: Bell, dotColor: "bg-primary" },
  CREATED: { icon: Plus, dotColor: "bg-primary" },
  EXPIRED: { icon: AlertTriangle, dotColor: "bg-destructive" },
};

export default function DashboardPage() {
  const { data: summary } = useRenewalSummary();
  const { data: upcoming = [] } = useUpcomingRenewals(30);
  const { data: overdue = [] } = useOverdueRenewals();
  const { data: notifications = [] } = useNotifications();
  const renewAsset = useRenewAsset();

  const attentionItems = [
    ...overdue,
    ...upcoming.filter((a) => (a.daysUntilRenewal ?? 99) <= 30),
  ]
    .slice(0, 5)
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

  const chartData = (summary?.activityByMonth ?? []).map((m) => ({
    month: m.month,
    value: m.count,
  }));

  const breakdownData = (summary?.assetsByType ?? []).map((a) => ({
    name: ASSET_TYPE_LABEL[a.type] ?? a.type,
    value: a.count,
    pct: a.pct,
    color: TYPE_COLORS[a.type] ?? "bg-muted-foreground",
  }));

  const stats = [
    { label: "TOPLAM VARLIK", value: String(summary?.total ?? "—"), icon: Layers, color: "text-primary", sub: "Tüm aktif varlıklar", subColor: "text-muted-foreground" },
    { label: "7 GÜNDE SONA ERİYOR", value: String(summary?.expiringIn7Days ?? "—"), icon: Clock, color: "text-warning", valueColor: (summary?.expiringIn7Days ?? 0) > 0 ? "text-warning" : undefined, sub: "Dikkat gerektirir", subColor: "text-muted-foreground" },
    { label: "SÜRESİ GEÇMİŞ", value: String(summary?.expired ?? "—"), icon: AlertCircle, color: "text-destructive", valueColor: (summary?.expired ?? 0) > 0 ? "text-destructive" : undefined, sub: "Hemen işlem yapılmalı", subColor: "text-muted-foreground" },
    { label: "BU AY YENİLENDİ", value: String(summary?.renewedThisMonth ?? "—"), icon: CheckCircle, color: "text-success", valueColor: (summary?.renewedThisMonth ?? 0) > 0 ? "text-success" : undefined, sub: "Bu ay tamamlanan yenilemeler", subColor: "text-muted-foreground" },
  ];

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <stat.icon className={`w-4 h-4 flex-shrink-0 ${stat.color}`} strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground leading-tight">{stat.label}</span>
            </div>
            <p className={`text-2xl md:text-3xl font-bold tabular-nums ${stat.valueColor || "text-foreground"}`}>{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.subColor}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Dikkat Gerektiriyor */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-foreground">Dikkat Gerektiriyor</h2>
          <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Tümünü gör →</button>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Varlık Adı</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Tür</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Tedarikçi</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Proje</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Yenileme Tarihi</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Durum</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {attentionItems.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">Dikkat gerektiren varlık yok.</td></tr>
                )}
                {attentionItems.map((row) => {
                  const days = daysUntil(row.renewalDate);
                  const { dot, text } = daysColor(days);
                  return (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors duration-150 h-[52px]">
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{row.name}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-mono font-semibold uppercase ${typeColors[row.assetType] || "text-muted-foreground"}`}>
                          {ASSET_TYPE_LABEL[row.assetType] ?? row.assetType}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{row.vendorName ?? "—"}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{row.project?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className="text-sm tabular-nums text-foreground">{formatDate(row.renewalDate)}</span>
                        <p className={`text-[11px] tabular-nums ${text}`}>{days < 0 ? `${Math.abs(days)} gün geçti` : `${days} gün kaldı`}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                          <span className={`text-xs font-medium ${text}`}>{days < 0 ? `${Math.abs(days)}g` : `${days}g`}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => renewAsset.mutate({ assetId: row.id })} disabled={renewAsset.isPending} className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors duration-150 disabled:opacity-50">Yenile</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border">
            {attentionItems.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Dikkat gerektiren varlık yok.</p>}
            {attentionItems.map((row) => {
              const days = daysUntil(row.renewalDate);
              const { dot, text } = daysColor(days);
              return (
                <div key={row.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-mono font-semibold uppercase ${typeColors[row.assetType] || "text-muted-foreground"}`}>
                        {ASSET_TYPE_LABEL[row.assetType] ?? row.assetType}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{formatDate(row.renewalDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      <span className={`text-xs font-medium ${text}`}>{days < 0 ? `${Math.abs(days)} gün geçti` : `${days} gün kaldı`}</span>
                    </div>
                  </div>
                  <button onClick={() => renewAsset.mutate({ assetId: row.id })} disabled={renewAsset.isPending} className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors duration-150 disabled:opacity-50 flex-shrink-0">Yenile</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-4 md:p-5">
          <div className="mb-4 md:mb-5">
            <h3 className="text-sm font-medium text-foreground">Yenileme Aktivitesi</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Son 6 ay</p>
          </div>
          <div className="h-[180px] md:h-[220px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Henüz yenileme yok.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" name="Yenileme" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 md:p-5">
          <h3 className="text-sm font-medium text-foreground mb-4 md:mb-5">Türe Göre Varlıklar</h3>
          {breakdownData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Henüz varlık yok.</div>
          ) : (
            <div className="space-y-3">
              {breakdownData.map((d) => (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground tabular-nums">{d.value}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{d.pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.color}`} style={{ width: `${Math.max(d.pct, 3)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Son Aktivite */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Son Aktivite</h3>
        <div className="space-y-0">
          {recentNotifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz aktivite yok.</p>
          )}
          {recentNotifications.map((n, i) => {
            const info = activityIcons[n.notificationType] ?? activityIcons.CREATED;
            return (
              <div key={n.id} className="flex gap-3 relative hover:bg-secondary/30 rounded-lg px-2 py-2.5 -mx-2 transition-colors duration-150">
                <div className="flex flex-col items-center pt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${info.dotColor} flex-shrink-0`} />
                  {i < recentNotifications.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {n.body ?? n.subject ?? n.notificationType}
                    {n.asset && <span className="text-muted-foreground"> — {n.asset.name}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
