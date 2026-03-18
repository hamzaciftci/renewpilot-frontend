import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Server, CalendarDays, RefreshCw, Users,
  Bell, CreditCard, Settings, ChevronDown, LogOut, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/date";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Pano", href: "/dashboard" },
  { icon: Server, label: "Varlıklar", href: "/assets" },
  { icon: CalendarDays, label: "Takvim", href: "/calendar" },
  { icon: RefreshCw, label: "Yenilemeler", href: "/renewals" },
  { icon: Users, label: "Ekip", href: "/team" },
  { icon: Bell, label: "Bildirimler", href: "/notifications", badge: true },
  { icon: CreditCard, label: "Faturalandırma", href: "/billing" },
  { icon: Settings, label: "Ayarlar", href: "/settings" },
];

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, membership, logout } = useAuth();
  const { data: unread } = useUnreadNotificationCount();

  const hasUnread = (unread?.count ?? 0) > 0;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen w-[220px] bg-background border-r border-border flex flex-col z-30 transition-transform duration-200",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4">
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-4 h-4 text-primary-foreground" strokeWidth={2} />
        </div>
        <span className="font-semibold text-[15px] text-foreground tracking-tight flex-1">
          RenewPilot
        </span>
        <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigasyon */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");
          const showBadge = item.badge && hasUnread;
          return (
            <Link
              key={item.label}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 relative",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
              )}
              <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span>{item.label}</span>
              {showBadge && (
                <div className="w-1.5 h-1.5 rounded-full bg-destructive ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Organizasyon + Kullanıcı */}
      <div className="border-t border-border p-3 space-y-2">
        {membership && (
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-secondary/50 transition-colors w-full text-left">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {membership.organization.name}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto flex-shrink-0" />
          </button>
        )}
        <div className="flex items-center gap-2.5 px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-foreground flex-shrink-0">
            {user ? initials(user.fullName) : "—"}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {user?.fullName ?? "—"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate capitalize">
              {membership?.role.toLowerCase() ?? "—"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
