import { Bell, Mail, Smartphone, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const isRead = (n: (typeof notifications)[number]) =>
    n.status === "READ" || !!n.readAt;

  const filtered = tab === "unread" ? notifications.filter((n) => !isRead(n)) : notifications;
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  const tabs: Array<{ key: "all" | "unread"; label: string }> = [
    { key: "all", label: t("notifications.tabs.all") },
    { key: "unread", label: t("notifications.tabs.unread", { count: unreadCount }) },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        {tabs.map(({ key, label }) => (
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
            {t("notifications.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              {tab === "unread" ? t("notifications.emptyUnread") : t("notifications.empty")}
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
                    {t("notifications.markRead")}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Preferences link */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <SettingsIcon className="w-5 h-5 text-muted-foreground mt-0.5" strokeWidth={1.5} />
          <div>
            <h3 className="text-sm font-medium text-foreground">{t("notifications.preferences")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("notifications.preferencesDesc")}
            </p>
          </div>
        </div>
        <Link
          to="/settings"
          className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
        >
          {t("notifications.goToSettings")}
        </Link>
      </div>
    </div>
  );
}
