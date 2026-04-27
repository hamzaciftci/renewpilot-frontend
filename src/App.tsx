import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Route-based code splitting — each page is its own chunk.
// Auth pages are eager so the initial login flow stays snappy.
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AssetsPage = lazy(() => import("@/pages/AssetsPage"));
const AssetDetailPage = lazy(() => import("@/pages/AssetDetailPage"));
const AddAssetPage = lazy(() => import("@/pages/AddAssetPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const RenewalsPage = lazy(() => import("@/pages/RenewalsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const TeamPage = lazy(() => import("@/pages/TeamPage"));
const BillingPage = lazy(() => import("@/pages/BillingPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const AcceptInvitePage = lazy(() => import("@/pages/AcceptInvitePage"));
const SharedAssetPage = lazy(() => import("@/pages/SharedAssetPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Users without an org must go through onboarding first.
  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  // Users with an org shouldn't be on the onboarding page.
  if (!needsOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function GuestRoute() {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to={needsOnboarding ? "/onboarding" : "/dashboard"} replace />;
  }
  return <Outlet />;
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Public routes (accessible whether logged in or not) */}
              <Route path="/invite/:token" element={<AcceptInvitePage />} />
              <Route path="/share/:token" element={<SharedAssetPage />} />

              {/* Guest-only routes */}
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<OnboardingPage />} />

                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/assets" element={<AssetsPage />} />
                  <Route path="/assets/new" element={<AddAssetPage />} />
                  <Route path="/assets/:id" element={<AssetDetailPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/renewals" element={<RenewalsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
