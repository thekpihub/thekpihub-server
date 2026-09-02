import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { applyTheme } from "@/lib/theme";
import { useAuthStore, useThemeStore } from "@/store";
import { useAuthHandoff } from "@/hooks/useAuthHandoff";
import PremiumGate from "@/components/auth/PremiumGate";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import WorkspacePage from "@/pages/WorkspacePage";
import SettingsPage from "@/pages/SettingsPage";
import AdminPage from "@/pages/AdminPage";
import type { User } from "@/types";

// ── Loading spinner ───────────────────────────────────────────────────────────

function LoadingScreen({ message = "Loading Ditto Wingman..." }: { message?: string }) {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ditto-400 to-ditto-700 flex items-center justify-center animate-pulse">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// ── Auth guard — accepts Supabase session OR JWT handoff token ────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user: supabaseUser, isLoading: supabaseLoading } = useAuthStore();
  const { user: handoffUser, isLoading: handoffLoading, isPremium } = useAuthHandoff();
  const location = useLocation();

  // Still resolving auth from either source
  if (supabaseLoading || handoffLoading) {
    return <LoadingScreen />;
  }

  // Authenticated via Supabase (native sign-in)
  if (supabaseUser) {
    return <>{children}</>;
  }

  // Authenticated via JWT handoff from thekpihub.com
  if (handoffUser) {
    if (!isPremium) {
      return <PremiumGate upgradeUrl="https://thekpihub.com/pricing" />;
    }
    return <>{children}</>;
  }

  // Not authenticated at all
  return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
}

// ── OAuth callback ────────────────────────────────────────────────────────────

function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
      else navigate("/auth", { replace: true });
    });
  }, [navigate]);
  return null;
}

// ── App routes ────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { setUser, setLoading } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const su = data.session.user;
        setUser({
          id: su.id,
          email: su.email ?? "",
          name: su.user_metadata?.name ?? su.user_metadata?.full_name,
          avatarUrl: su.user_metadata?.avatar_url,
          plan: "free",
          createdAt: new Date(su.created_at),
        } as User);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const su = session.user;
        setUser({
          id: su.id,
          email: su.email ?? "",
          name: su.user_metadata?.name ?? su.user_metadata?.full_name,
          avatarUrl: su.user_metadata?.avatar_url,
          plan: "free",
          createdAt: new Date(su.created_at),
        } as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/workspace/:id"
        element={
          <RequireAuth>
            <WorkspacePage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
