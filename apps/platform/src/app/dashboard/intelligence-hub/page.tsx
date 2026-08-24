"use client";

import { useEffect, useMemo, useState } from "react";
import { DecisionCard } from "@/components/dashboard/DecisionCard";
import { rankSignalsBySeverity } from "@/lib/intelligence/scoring";
import type { IntelligenceHubSnapshot, ModuleSignal } from "@/lib/intelligence/types";

const flagshipIds = new Set(["opportunity-radar", "executive-war-room", "competitor-dna"]);
const trendIds = new Set(["market-shift", "forecasting-center", "recommendation-engine"]);
const explorationIds = new Set(["knowledge-graph", "scenario-simulator", "research-workspace", "signal-noise"]);

function SignalColumn({ title, signals }: { title: string; signals: ModuleSignal[] }) {
  return (
    <section className="panel" style={{ padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "grid", gap: 14 }}>
        {signals.map((signal) => (
          <article key={signal.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <strong>{signal.label}</strong>
              <span style={{ color: "var(--gold)" }}>{signal.severity}</span>
            </div>
            <div style={{ marginTop: 6 }}>{signal.headlineMetric}</div>
            <div style={{ color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>{signal.summary}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function IntelligenceHubPage() {
  const [snapshot, setSnapshot] = useState<IntelligenceHubSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSnapshot() {
      setError(null);
      setIsLoading(true);
      try {
        const response = await fetch("/api/intelligence-hub", { cache: "no-store" });
        const data = (await response.json()) as {
          snapshot?: IntelligenceHubSnapshot;
          error?: string;
        };

        if (!response.ok || !data.snapshot) {
          throw new Error(data.error || "Failed to load intelligence hub");
        }

        setSnapshot(data.snapshot);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load intelligence hub");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSnapshot();
  }, []);

  const rankedSignals = useMemo(
    () => (snapshot ? rankSignalsBySeverity(snapshot.signals) : []),
    [snapshot]
  );
  const flagship = rankedSignals.filter((signal) => flagshipIds.has(signal.id));
  const trend = rankedSignals.filter((signal) => trendIds.has(signal.id));
  const exploration = rankedSignals.filter((signal) => explorationIds.has(signal.id));

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem" }}>
          Mission control
        </div>
        <h1 style={{ marginBottom: 8 }}>Intelligence Hub</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
          Ported from the richer Next.js dashboard architecture and now connected to server-backed
          decision actions.
        </p>
      </header>

      {error ? <div className="message message-error">{error}</div> : null}

      {isLoading || !snapshot ? (
        <section className="panel" style={{ padding: 20 }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>Loading intelligence snapshot...</p>
        </section>
      ) : (
        <>
          <section className="panel" style={{ padding: 20 }}>
            <div className="three-column-grid">
              <div>
                <div style={{ color: "var(--teal)", textTransform: "uppercase", fontSize: ".8rem", fontWeight: 700 }}>
                  Key Opportunities
                </div>
                <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: 18 }}>
                  {snapshot.executiveBrief.keyOpportunities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ color: "var(--gold)", textTransform: "uppercase", fontSize: ".8rem", fontWeight: 700 }}>
                  Key Risks
                </div>
                <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: 18 }}>
                  {snapshot.executiveBrief.keyRisks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ color: "#9bc2ff", textTransform: "uppercase", fontSize: ".8rem", fontWeight: 700 }}>
                  Recommended Actions
                </div>
                <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: 18 }}>
                  {snapshot.executiveBrief.recommendedActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <DecisionCard entries={snapshot.decisionFeed} recommendations={snapshot.actionQueue} />

          <section className="panel" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Strategic Heatmap</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {snapshot.heatmap.map((row) => (
                <div
                  key={row.id}
                  className="heatmap-row"
                >
                  <strong>{row.label}</strong>
                  <HeatValue label="Opportunity" value={row.opportunity} color="var(--teal)" />
                  <HeatValue label="Risk" value={row.risk} color="var(--gold)" />
                  <HeatValue label="Momentum" value={row.momentum} color="#9bc2ff" />
                  <HeatValue label="Confidence" value={row.confidence} color="#d2c1ff" />
                </div>
              ))}
            </div>
          </section>

          <div className="two-column-grid">
            <section className="panel" style={{ padding: 20 }}>
              <h2 style={{ marginTop: 0 }}>Decision Feed</h2>
              <div style={{ display: "grid", gap: 14 }}>
                {snapshot.decisionFeed.map((entry) => (
                  <article key={entry.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{entry.headline}</strong>
                      <span style={{ color: "var(--gold)" }}>{entry.category}</span>
                    </div>
                    <div style={{ color: "var(--muted)", marginTop: 6, lineHeight: 1.7 }}>{entry.detail}</div>
                    <div style={{ color: "var(--muted)", marginTop: 8, fontSize: ".9rem" }}>
                      {entry.moduleLabel} | {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel" style={{ padding: 20 }}>
              <h2 style={{ marginTop: 0 }}>Action Queue</h2>
              <div style={{ display: "grid", gap: 14 }}>
                {snapshot.actionQueue.map((item) => (
                  <article key={item.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{item.title}</strong>
                      <span style={{ color: "#9bc2ff" }}>Rank #{item.rank}</span>
                    </div>
                    <div style={{ color: "var(--muted)", marginTop: 6, lineHeight: 1.7 }}>{item.expectedImpact}</div>
                    <div style={{ color: "var(--muted)", marginTop: 8, fontSize: ".9rem" }}>
                      Priority {item.priorityScore} | Confidence {item.confidence}%
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="three-column-grid">
            <SignalColumn title="Flagship Signals" signals={flagship} />
            <SignalColumn title="Trend & Forecasting" signals={trend} />
            <SignalColumn title="Exploration Tools" signals={exploration} />
          </div>
        </>
      )}
    </div>
  );
}

function HeatValue({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ color: "var(--muted)", fontSize: ".82rem" }}>{label}</div>
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
            width: `${value}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
          }}
        />
      </div>
      <div style={{ fontSize: ".88rem" }}>{value}</div>
    </div>
  );
}
