"use client";

import { useEffect, useMemo, useState } from "react";

type RecommendationCategory =
  | "All"
  | "Pricing"
  | "Retention"
  | "Expansion"
  | "Product"
  | "Go-to-Market"
  | "New Market";

type RecommendationItem = {
  id: string;
  title: string;
  category: Exclude<RecommendationCategory, "All">;
  issue: string;
  likelyCauses: string[];
  recommendedActions: string[];
  expectedImpact: string;
  impact: number;
  effort: number;
  confidence: number;
  priorityScore: number;
  rank: number;
  accuracy: {
    success_count: number;
    partial_success_count: number;
    failed_count: number;
    total_scored: number;
    score: number;
  };
};

const tabs: RecommendationCategory[] = [
  "All",
  "Pricing",
  "Retention",
  "Expansion",
  "Product",
  "Go-to-Market",
  "New Market",
];

export default function RecommendationEnginePage() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [category, setCategory] = useState<RecommendationCategory>("All");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      setError(null);
      setIsLoading(true);
      try {
        const response = await fetch("/api/recommendations", { cache: "no-store" });
        const data = (await response.json()) as {
          recommendations?: RecommendationItem[];
          error?: string;
        };

        if (!response.ok || !data.recommendations) {
          throw new Error(data.error || "Failed to load recommendations");
        }

        setItems(data.recommendations);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load recommendations");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRecommendations();
  }, []);

  const filtered = useMemo(
    () => (category === "All" ? items : items.filter((item) => item.category === category)),
    [category, items]
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem" }}>
          Phase 4 foundation
        </div>
        <h1 style={{ marginBottom: 8 }}>Recommendation Engine</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
          Ranked strategic plays now include a first accuracy-ready server metric derived from
          recorded decision outcomes.
        </p>
      </header>

      <section className="panel" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={tab === category ? "button button-primary" : "button button-secondary"}
              onClick={() => setCategory(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="message message-error">{error}</div> : null}

      {isLoading ? (
        <section className="panel" style={{ padding: 20 }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>Loading recommendations...</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="panel" style={{ padding: 20 }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>No recommendations match this category yet.</p>
        </section>
      ) : (
        filtered.map((item) => (
          <section key={item.id} className="panel" style={{ padding: 20, display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
              <div>
                <div style={{ color: "var(--gold)", textTransform: "uppercase", fontSize: ".8rem", fontWeight: 700 }}>
                  {item.category}
                </div>
                <h2 style={{ margin: "8px 0 6px" }}>{item.title}</h2>
                <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{item.issue}</p>
              </div>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "10px 12px",
                  minWidth: 120,
                  textAlign: "center",
                }}
              >
                <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>Rank</div>
                <strong>#{item.rank}</strong>
              </div>
            </div>

            <div className="recommendation-detail-grid">
              <div style={{ display: "grid", gap: 14 }}>
                <Block title="Likely Causes" items={item.likelyCauses} />
                <Block title="Recommended Actions" items={item.recommendedActions} />
                <div>
                  <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem", fontWeight: 700 }}>
                    Expected Impact
                  </div>
                  <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: 0 }}>
                    {item.expectedImpact}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <MetricBar label="Impact" value={item.impact} color="var(--teal)" />
                <MetricBar label="Effort" value={item.effort} color="var(--gold)" />
                <MetricBar label="Confidence" value={item.confidence} color="#9bc2ff" />
                <MetricBar label="Priority Score" value={item.priorityScore} color="#d2c1ff" />

                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: 14,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem", fontWeight: 700 }}>
                    Accuracy
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{item.accuracy.score}%</div>
                  <div style={{ color: "var(--muted)", fontSize: ".92rem" }}>
                    {item.accuracy.total_scored === 0
                      ? "No scored outcomes yet"
                      : `${item.accuracy.total_scored} scored decision outcomes`}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: ".92rem", lineHeight: 1.7 }}>
                    {item.accuracy.success_count} success | {item.accuracy.partial_success_count} partial |{" "}
                    {item.accuracy.failed_count} failed
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem", fontWeight: 700 }}>
        {title}
      </div>
      <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: 18, marginBottom: 0 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span style={{ color: "var(--muted)", fontSize: ".88rem" }}>{label}</span>
        <span>{value}</span>
      </div>
      <div
        style={{
          height: 10,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
