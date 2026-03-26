import { Bell, Mail, Smartphone } from "lucide-react";
import { useState } from "react";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/date";

const channelIcons: Record<string, typeof Bell> = {
  EMAIL: Mail,
  PUSH: Bell,
  SMS: Smartphone,
  WHATSAPP: Smartphone,
};

const channelColors: Record<string, string> = {
  EMAIL: "text-primary",
  PUSH: "text-warning",
  SMS: "text-success",
  WHATSAPP: "text-success",
};

const prefItems = [
  { label: "E-posta bildirimleri", enabled: true },
  { label: "Push bildirimleri", enabled: true },
  { label: "SMS bildirimleri", enabled: false },
  { label: "WhatsApp", enabled: false },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const isRead = (n: (typeof notifications)[number]) =>
    n.status === "READ" || !!n.readAt;

  const filtered = tab === "unread" ? notifications.filter((n) => !isRead(n)) : notifications;
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        {([["all", "Tümü"], ["unread", `Okunmamış (${unreadCount})`]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 ${
              tab === key ? "text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
            Yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              {tab === "unread" ? "Okunmamış bildirim yok." : "Henüz bildirim yok."}
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const read = isRead(n);
            const Icon = channelIcons[n.channel] ?? Bell;
            return (
              <div
                key={n.id}
                className={`bg-card border border-border rounded-lg p-4 flex items-center gap-4 transition-colors duration-150 ${
                  !read ? "border-l-2 border-l-primary" : ""
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${!read ? "text-foreground" : "text-muted-foreground"}`} strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {n.body ?? n.subject ?? n.notificationType}
                    {(n as any).asset && <span className="text-muted-foreground"> — {(n as any).asset.name}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                <span className={`text-[10px] font-mono font-semibold ${channelColors[n.channel] ?? "text-muted-foreground"}`}>
                  {n.channel}
                </span>
                {!read && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    disabled={markRead.isPending}
                    className="text-xs text-primary font-medium hover:text-primary/80 whitespace-nowrap transition-colors duration-150 disabled:opacity-50"
                  >
                    Okundu
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Preferences */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Bildirim Tercihleri</h3>
        <div className="space-y-3">
          {prefItems.map((p) => (
            <div key={p.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground/80">{p.label}</span>
              <div className={`w-9 h-5 rounded-full ${p.enabled ? "bg-primary" : "bg-border"} transition-colors duration-150 cursor-pointer`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-foreground shadow transition-transform mx-[3px] mt-[3px] ${p.enabled ? "translate-x-4" : ""}`} />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between py-1.5 border-t border-border pt-3 mt-2">
            <span className="text-sm text-foreground/80">Sessiz saatler</span>
            <span className="text-sm text-muted-foreground tabular-nums font-mono">22:00 — 08:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
