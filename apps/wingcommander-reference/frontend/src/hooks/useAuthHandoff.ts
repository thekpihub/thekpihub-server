import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TOKEN_KEY = "ditto_handoff_token";
const USER_KEY  = "ditto_handoff_user";

export interface HandoffUser {
  id: string;
  email: string;
  plan: string;
  name?: string;
  avatarUrl?: string;
}

export interface HandoffState {
  user: HandoffUser | null;
  token: string | null;
  isLoading: boolean;
  isPremium: boolean;
  clearHandoff: () => void;
}

// Reads ?token= from the URL, verifies it against the backend, and stores it.
// Also restores a previously stored token on page load.
export function useAuthHandoff(): HandoffState {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser]       = useState<HandoffUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      // Token arrived from thekpihub.com — verify then store
      verifyAndStore(urlToken).then((ok) => {
        if (ok) {
          // Strip ?token= from the URL without a full reload
          params.delete("token");
          const newSearch = params.toString();
          navigate(
            location.pathname + (newSearch ? `?${newSearch}` : ""),
            { replace: true }
          );
        } else {
          clearHandoff();
        }
        setIsLoading(false);
      });
    } else {
      // No URL token — try restoring from localStorage
      const stored = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (stored && storedUser) {
        try {
          setToken(stored);
          setUser(JSON.parse(storedUser) as HandoffUser);
        } catch {
          clearHandoff();
        }
      }
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  async function verifyAndStore(t: string): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/verify", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { valid: boolean; user: HandoffUser };
      if (!data.valid) return false;
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(t);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }

  function clearHandoff() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  const PREMIUM_PLANS = ["pro", "premium", "enterprise"];
  const isPremium = !!user && PREMIUM_PLANS.includes(user.plan);

  return { user, token, isLoading, isPremium, clearHandoff };
}

// Helper — retrieve the stored token for use in API calls
export function getHandoffToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
