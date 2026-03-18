import { useState } from "react";
import { Bell, Mail, Smartphone } from "lucide-react";

interface Notification {
  id: string;
  icon: typeof Bell;
  message: string;
  channel: "EMAIL" | "PUSH" | "SMS";
  time: string;
  read: boolean;
  asset: string;
}

const notifications: Notification[] = [
  { id: "1", icon: Bell, message: "clientsite.com 2 gün içinde yenileniyor", channel: "PUSH", time: "10 dk önce", read: false, asset: "clientsite.com" },
  { id: "2", icon: Mail, message: "Hatırlatıcı gönderildi: *.example.com SSL 6 gün içinde sona eriyor", channel: "EMAIL", time: "2 saat önce", read: false, asset: "*.example.com" },
  { id: "3", icon: Bell, message: "VPS Production #1 12 gün içinde yenileniyor", channel: "PUSH", time: "5 saat önce", read: false, asset: "VPS Production #1" },
  { id: "4", icon: Mail, message: "clientapp.com başarıyla yenilendi", channel: "EMAIL", time: "Dün", read: true, asset: "clientapp.com" },
  { id: "5", icon: Smartphone, message: "staging-server.io süresi geçti — işlem gerekli", channel: "SMS", time: "2 gün önce", read: true, asset: "staging-server.io" },
  { id: "6", icon: Mail, message: "Şubat ayı yenileme özeti", channel: "EMAIL", time: "3 gün önce", read: true, asset: "" },
];

const channelColors: Record<string, string> = {
  EMAIL: "text-primary",
  PUSH: "text-warning",
  SMS: "text-success",
};

const prefItems = [
  { label: "E-posta bildirimleri", enabled: true },
  { label: "Push bildirimleri", enabled: true },
  { label: "SMS bildirimleri", enabled: false },
  { label: "WhatsApp", enabled: false },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread" | "sent">("all");
  const [items, setItems] = useState(notifications);

  const filtered = tab === "unread" ? items.filter((n) => !n.read) : items;
  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = (id: string) => setItems(items.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        {([["all", "Tümü"], ["unread", `Okunmamış (${unreadCount})`], ["sent", "Gönderilenler"]] as const).map(([key, label]) => (
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
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Hepsi tamam! Yeni bildirim yok.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`bg-card border border-border rounded-lg p-4 flex items-center gap-4 transition-colors duration-150 ${
                !n.read ? "border-l-2 border-l-primary" : ""
              }`}
            >
              <n.icon className={`w-4 h-4 flex-shrink-0 ${!n.read ? "text-foreground" : "text-muted-foreground"}`} strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
              </div>
              <span className={`text-[10px] font-mono font-semibold ${channelColors[n.channel]}`}>{n.channel}</span>
              {!n.read && (
                <button onClick={() => markRead(n.id)} className="text-xs text-primary font-medium hover:text-primary/80 whitespace-nowrap transition-colors duration-150">
                  Okundu işaretle
                </button>
              )}
            </div>
          ))
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
