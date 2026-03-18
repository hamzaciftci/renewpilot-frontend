import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { QuickAddFAB } from "./QuickAddFAB";

const pageTitles: Record<string, string> = {
  "/dashboard": "Pano",
  "/assets": "Varlıklar",
  "/calendar": "Takvim",
  "/renewals": "Yenilemeler",
  "/team": "Ekip",
  "/notifications": "Bildirimler",
  "/billing": "Faturalandırma",
  "/settings": "Ayarlar",
};

export function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title =
    Object.entries(pageTitles).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] ?? "RenewPilot";

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
    </div>
  );
}
