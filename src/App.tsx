import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardPage from "@/pages/DashboardPage";
import AssetsPage from "@/pages/AssetsPage";
import AssetDetailPage from "@/pages/AssetDetailPage";
import AddAssetPage from "@/pages/AddAssetPage";
import CalendarPage from "@/pages/CalendarPage";
import RenewalsPage from "@/pages/RenewalsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import TeamPage from "@/pages/TeamPage";
import BillingPage from "@/pages/BillingPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import AcceptInvitePage from "@/pages/AcceptInvitePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Public routes (accessible whether logged in or not) */}
            <Route path="/invite/:token" element={<AcceptInvitePage />} />

            {/* Guest-only routes */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/assets/new" element={<AddAssetPage />} />
                <Route path="/assets/:id" element={<AssetDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/renewals" element={<RenewalsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
