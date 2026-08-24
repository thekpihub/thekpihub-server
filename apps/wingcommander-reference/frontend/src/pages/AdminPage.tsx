import { useState, useEffect, useCallback } from "react";
import { useAuthHandoff } from "@/hooks/useAuthHandoff";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

interface BYOKUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  plan: string;
  byok_approved: boolean;
  byok_approved_at: string;
}

interface BYOKRequest {
  id: string;
  user_id: string;
  email: string;
  plan: string;
  requested_at: string;
  status: string;
}

interface Stats {
  growthUsers: number;
  enterpriseUsers: number;
  byokApproved: number;
}

type Tab = "requests" | "approved" | "stats";

export default function AdminPage() {
  const { user, token } = useAuthHandoff();
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<BYOKRequest[]>([]);
  const [approved, setApproved] = useState<BYOKUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    const res = await fetch(`${API}/api/admin${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");
    return res.json();
  }, [token]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/byok/requests");
      setRequests(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
    setLoading(false);
  }, [apiFetch]);

  const loadApproved = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/byok/users");
      setApproved(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
    setLoading(false);
  }, [apiFetch]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/stats");
      setStats(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
    setLoading(false);
  }, [apiFetch]);

  async function approveUser(userId: string) {
    setActionLoading(userId);
    try {
      await apiFetch(`/byok/approve/${userId}`, { method: "POST" });
      await loadRequests();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Approve failed");
    }
    setActionLoading(null);
  }

  async function revokeUser(userId: string) {
    if (!confirm("Revoke BYOK access for this user?")) return;
    setActionLoading(userId);
    try {
      await apiFetch(`/byok/revoke/${userId}`, { method: "DELETE" });
      await loadApproved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Revoke failed");
    }
    setActionLoading(null);
  }

  useEffect(() => {
    if (tab === "requests") loadRequests();
    if (tab === "approved") loadApproved();
    if (tab === "stats") loadStats();
  }, [tab, loadRequests, loadApproved, loadStats]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Not authenticated</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wing-400 to-wing-700 flex items-center justify-center text-sm font-bold text-background">
            W
          </div>
          <span className="font-bold">WingCommander</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-wing-400 font-semibold">Admin Dashboard</span>
        </div>
        <div className="text-sm text-muted-foreground">{user.email}</div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tab nav */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-6 w-fit">
          {(["requests", "approved", "stats"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-wing-400 text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "requests" ? "API Keys Users-Free" : t === "approved" ? "Approved Users" : "Stats"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading…</div>
        ) : (
          <>
            {/* REQUESTS TAB */}
            {tab === "requests" && (
              <div>
                <h2 className="text-lg font-bold mb-1">API Keys Access Requests</h2>
                <p className="text-sm text-muted-foreground mb-6">Users who have requested BYOK integration access. Approve to grant them access to <code>/account/integrations</code>.</p>
                {requests.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                    No pending requests
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map(r => (
                      <div key={r.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{r.email}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Plan: <span className="text-wing-400 font-medium">{r.plan}</span> · Requested {new Date(r.requested_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => approveUser(r.user_id)}
                          disabled={actionLoading === r.user_id}
                          className="px-4 py-2 bg-wing-400 text-background rounded-lg text-sm font-semibold hover:bg-wing-500 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === r.user_id ? "Approving…" : "Approve Access"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* APPROVED TAB */}
            {tab === "approved" && (
              <div>
                <h2 className="text-lg font-bold mb-1">BYOK Approved Users</h2>
                <p className="text-sm text-muted-foreground mb-6">Users with active integration access. Revoking removes their ability to use /account/integrations.</p>
                {approved.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                    No approved users yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approved.map(u => (
                      <div key={u.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{u.first_name} {u.last_name} <span className="text-muted-foreground font-normal">({u.email})</span></div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Plan: <span className="text-wing-400 font-medium">{u.plan}</span> · Approved {new Date(u.byok_approved_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => revokeUser(u.id)}
                          disabled={actionLoading === u.id}
                          className="px-4 py-2 border border-destructive text-destructive rounded-lg text-sm font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === u.id ? "Revoking…" : "Revoke"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STATS TAB */}
            {tab === "stats" && stats && (
              <div>
                <h2 className="text-lg font-bold mb-6">Platform Overview</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Growth Plan Users", value: stats.growthUsers, color: "text-blue-400" },
                    { label: "Enterprise Users", value: stats.enterpriseUsers, color: "text-purple-400" },
                    { label: "BYOK Approved", value: stats.byokApproved, color: "text-wing-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-xl p-6 text-center">
                      <div className={`text-4xl font-bold mb-2 ${s.color}`}>{s.value}</div>
                      <div className="text-sm text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
