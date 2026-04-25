import { Bell, Search, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/date";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { ThemeToggle } from "@/components/ThemeToggle";

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: unread } = useUnreadNotificationCount();
  const hasUnread = (unread?.count ?? 0) > 0;
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/assets?search=${encodeURIComponent(q)}` : "/assets");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="h-[52px] bg-background border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 gap-3">
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
      >
        <Menu className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <h1 className="text-[15px] font-semibold text-foreground flex-shrink-0">{title}</h1>

      {/* Search (hidden on small mobile) */}
      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xs mx-2 md:mx-8">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("topbar.searchAssets")}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-10 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded hidden md:block">
            ⌘K
          </span>
        </div>
      </form>

      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <ThemeToggle />
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-1.5 rounded-md hover:bg-secondary transition-colors duration-150"
        >
          <Bell className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
          {hasUnread && (
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          )}
        </button>
        <div className="w-px h-5 bg-border hidden sm:block" />
        <div
          onClick={() => navigate("/settings")}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground cursor-pointer hover:bg-accent transition-colors duration-150 overflow-hidden"
          title={user?.fullName}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <span>{user ? initials(user.fullName) : "—"}</span>
          )}
        </div>
      </div>
    </header>
  );
}
