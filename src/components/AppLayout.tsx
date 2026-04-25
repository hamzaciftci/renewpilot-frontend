import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { QuickAddFAB } from "./QuickAddFAB";
import { WelcomeTour } from "./WelcomeTour";

const pageTitleKeys: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/assets": "nav.assets",
  "/calendar": "nav.calendar",
  "/renewals": "nav.renewals",
  "/reports": "nav.reports",
  "/team": "nav.team",
  "/notifications": "nav.notifications",
  "/billing": "nav.billing",
  "/settings": "nav.settings",
};

export function AppLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const titleKey =
    Object.entries(pageTitleKeys).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1];

  const title = titleKey ? t(titleKey) : "RenewPilot";

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col lg:ml-[220px] min-w-0">
        <TopBar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>

      <QuickAddFAB />
      <WelcomeTour />
    </div>
  );
}
