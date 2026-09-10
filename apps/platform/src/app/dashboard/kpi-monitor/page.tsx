"use client";

import { useEffect, useState } from "react";

type Direction = "higher_is_better" | "lower_is_better" | "target_is_better";

type Kpi = {
  id: string;
  name: string;
  unit: string | null;
  direction: Direction;
  status: "active" | "archived";
  created_at: string;
  current_value: number | null;
  change_percentage: number | null;
  value_count: number;
};

const DIRECTION_LABEL: Record<Direction, string> = {
  higher_is_better: "Higher is better",
  lower_is_better: "Lower is better",
  target_is_better: "Target is better",
};

export default function KpiMonitorPage() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newDirection, setNewDirection] = useState<Direction>("higher_is_better");
  const [isCreating, setIsCreating] = useState(false);

  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});
  const [savingKpiId, setSavingKpiId] = useState<string | null>(null);

  async function loadKpis() {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/kpis", { cache: "no-store" });
      const data = (await response.json()) as { kpis?: Kpi[]; error?: string };
      if (!response.ok || !data.kpis) {
        throw new Error(data.error || "Failed to load KPIs");
      }
      setKpis(data.kpis);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load KPIs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadKpis();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), unit: newUnit.trim() || undefined, direction: newDirection }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to create KPI");
      setNewName("");
      setNewUnit("");
      setNewDirection("higher_is_better");
      await loadKpis();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create KPI");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAddValue(kpiId: string) {
    const draft = valueDrafts[kpiId];
    const value = Number(draft);
    if (!draft || !Number.isFinite(value)) {
      setError("Enter a numeric value before saving.");
      return;
    }
    setSavingKpiId(kpiId);
    setError(null);
    try {
      const response = await fetch(`/api/kpis/${kpiId}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to record value");
      setValueDrafts((prev) => ({ ...prev, [kpiId]: "" }));
      await loadKpis();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to record value");
    } finally {
      setSavingKpiId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem" }}>
          KPI Monitor
        </div>
        <h1 style={{ marginBottom: 8 }}>Track your KPIs</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
          KPIs you track here feed the daily signal worker — missed targets and trend reversals
          show up automatically in your Intelligence Hub decision feed.
        </p>
      </header>

      {error ? <div className="message message-error">{error}</div> : null}

      <section className="panel" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: "1.05rem" }}>Add a KPI</h2>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ flex: "2 1 200px" }}>
            <label htmlFor="kpi-name">Name</label>
            <input
              id="kpi-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Monthly Recurring Revenue"
              required
            />
          </div>
          <div className="field" style={{ flex: "1 1 120px" }}>
            <label htmlFor="kpi-unit">Unit (optional)</label>
            <input
              id="kpi-unit"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="₹, %, users..."
            />
          </div>
          <div className="field" style={{ flex: "1 1 180px" }}>
            <label htmlFor="kpi-direction">Direction</label>
            <select
              id="kpi-direction"
              value={newDirection}
              onChange={(e) => setNewDirection(e.target.value as Direction)}
            >
              <option value="higher_is_better">Higher is better</option>
              <option value="lower_is_better">Lower is better</option>
              <option value="target_is_better">Target is better</option>
            </select>
          </div>
          <button type="submit" className="button button-primary" disabled={isCreating}>
            {isCreating ? "Adding..." : "Add KPI"}
          </button>
        </form>
      </section>

      {isLoading ? (
        <section className="panel" style={{ padding: 20 }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>Loading KPIs...</p>
        </section>
      ) : kpis.length === 0 ? (
        <section className="panel" style={{ padding: 20 }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            No KPIs yet. Add one above to start tracking.
          </p>
        </section>
      ) : (
        kpis.map((kpi) => (
          <section key={kpi.id} className="panel" style={{ padding: 20, display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
              <div>
                <div style={{ color: "var(--gold)", textTransform: "uppercase", fontSize: ".8rem", fontWeight: 700 }}>
                  {DIRECTION_LABEL[kpi.direction]}
                </div>
                <h2 style={{ margin: "8px 0 0" }}>{kpi.name}</h2>
              </div>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "10px 14px",
                  minWidth: 140,
                  textAlign: "center",
                }}
              >
                <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>Current value</div>
                <strong style={{ fontSize: "1.3rem" }}>
                  {kpi.current_value === null ? "—" : `${kpi.current_value}${kpi.unit ? ` ${kpi.unit}` : ""}`}
                </strong>
                {kpi.change_percentage !== null ? (
                  <div style={{ color: kpi.change_percentage >= 0 ? "var(--teal)" : "#ff9b9b", fontSize: ".85rem" }}>
                    {kpi.change_percentage >= 0 ? "▲" : "▼"} {Math.abs(kpi.change_percentage).toFixed(1)}%
                  </div>
                ) : null}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div className="field" style={{ maxWidth: 260 }}>
                <input
                  value={valueDrafts[kpi.id] ?? ""}
                  onChange={(e) => setValueDrafts((prev) => ({ ...prev, [kpi.id]: e.target.value }))}
                  placeholder={`Record today's value${kpi.unit ? ` (${kpi.unit})` : ""}`}
                  inputMode="decimal"
                  aria-label={`Record today's value for ${kpi.name}`}
                />
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => void handleAddValue(kpi.id)}
                disabled={savingKpiId === kpi.id}
              >
                {savingKpiId === kpi.id ? "Saving..." : "Save value"}
              </button>
              <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>
                {kpi.value_count} recorded value{kpi.value_count === 1 ? "" : "s"}
              </span>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
