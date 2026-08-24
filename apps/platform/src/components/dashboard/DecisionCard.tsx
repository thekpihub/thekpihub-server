"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DecisionFeedEntry,
  RankedRecommendation,
  Severity,
  DecisionFeedCategory,
} from "@/lib/intelligence/types";

interface DecisionApiRecord {
  id: string;
  headline: string;
  status: "pending" | "accepted" | "snoozed" | "dismissed";
  recommendation_id?: string | null;
  source_payload?: {
    id?: string;
  } | null;
  decision_outcomes?: OutcomeApiRecord[] | null;
}

interface OutcomeApiRecord {
  decision_id: string;
  result: "success" | "partial_success" | "failed";
  notes?: string | null;
}

export interface DecisionCardProps {
  entries: DecisionFeedEntry[];
  recommendations?: RankedRecommendation[];
}

function getEntryKey(entry: DecisionFeedEntry) {
  return entry.id;
}

const categoryLabel: Record<DecisionFeedCategory, string> = {
  risk: "Risk",
  opportunity: "Opportunity",
  recommendation: "Recommendation",
};

const severityColor: Record<Severity, string> = {
  high: "#ffb35c",
  medium: "#9bc2ff",
  low: "#8af3de",
};

const statusColor: Record<DecisionApiRecord["status"], string> = {
  pending: "#a6b0cf",
  accepted: "#8af3de",
  snoozed: "#ffd99b",
  dismissed: "#d6dbef",
};

const outcomeLabel: Record<OutcomeApiRecord["result"], string> = {
  success: "Success",
  partial_success: "Partial Success",
  failed: "Failed",
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function OutcomeRecorder({
  decisionId,
  onSaved,
}: {
  decisionId: string;
  onSaved: () => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveOutcome(result: OutcomeApiRecord["result"]) {
    setError(null);
    setIsSaving(true);
    try {
      await requestJson(`/api/decisions/${decisionId}/outcome`, {
        method: "PUT",
        body: JSON.stringify({ result, notes }),
      });
      setNotes("");
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save outcome");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Optional notes"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "12px 14px",
          color: "var(--text)",
        }}
      />
      {error ? <div className="message message-error">{error}</div> : null}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="button button-primary" disabled={isSaving} onClick={() => saveOutcome("success")}>
          Success
        </button>
        <button className="button button-secondary" disabled={isSaving} onClick={() => saveOutcome("partial_success")}>
          Partial success
        </button>
        <button className="button button-secondary" disabled={isSaving} onClick={() => saveOutcome("failed")}>
          Failed
        </button>
      </div>
    </div>
  );
}

export function DecisionCard({ entries, recommendations = [] }: DecisionCardProps) {
  const recommendationsById = useMemo(() => {
    const map = new Map<string, RankedRecommendation>();
    recommendations.forEach((recommendation) => map.set(recommendation.id, recommendation));
    return map;
  }, [recommendations]);
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<Record<string, DecisionApiRecord>>({});
  const [outcomes, setOutcomes] = useState<Record<string, OutcomeApiRecord>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  async function hydrateDecisions() {
    setError(null);
    setIsLoading(true);
    try {
      const data = await requestJson<{
        decisions: Array<
          DecisionApiRecord & {
            id: string;
          }
        >;
      }>("/api/decisions");

      const nextRecords: Record<string, DecisionApiRecord> = {};
      const nextOutcomes: Record<string, OutcomeApiRecord> = {};

      data.decisions.forEach((decision) => {
        const decisionKey = decision.source_payload?.id ?? decision.headline;
        nextRecords[decisionKey] = decision;
        const nestedOutcome = decision.decision_outcomes?.[0];
        if (nestedOutcome) {
          nextOutcomes[decision.id] = nestedOutcome;
        }
      });

      setRecords(nextRecords);
      setOutcomes(nextOutcomes);
    } catch (hydrateError) {
      setError(hydrateError instanceof Error ? hydrateError.message : "Failed to load decisions");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void hydrateDecisions();
  }, []);

  const items = useMemo(
    () =>
      entries.map((entry) => ({
        entry,
        record: records[getEntryKey(entry)] ?? null,
        outcome: records[getEntryKey(entry)] ? outcomes[records[getEntryKey(entry)].id] ?? null : null,
        recommendation: entry.relatedRecommendationId
          ? recommendationsById.get(entry.relatedRecommendationId) ?? null
          : null,
      })),
    [entries, outcomes, records, recommendationsById]
  );

  const pendingItems = items.filter((item) => (item.record?.status ?? "pending") === "pending");
  const decidedItems = items.filter((item) => (item.record?.status ?? "pending") !== "pending");

  useEffect(() => {
    if (index > 0 && index >= pendingItems.length) {
      setIndex(Math.max(0, pendingItems.length - 1));
    }
  }, [index, pendingItems.length]);

  async function ensureDecision(entry: DecisionFeedEntry) {
    const existing = records[getEntryKey(entry)];
    if (existing) {
      return existing.id;
    }

    const created = await requestJson<{
      decision: DecisionApiRecord & { id: string };
    }>("/api/decisions", {
      method: "POST",
      body: JSON.stringify({
        module_id: entry.moduleId,
        headline: entry.headline,
        category: entry.category,
        severity: entry.severity,
        detail: entry.detail,
        recommendation_id: entry.relatedRecommendationId ?? null,
        source_payload: entry,
      }),
    });

    setRecords((current) => ({
      ...current,
      [getEntryKey(entry)]: created.decision,
    }));

    return created.decision.id;
  }

  async function updateDecisionStatus(entry: DecisionFeedEntry, status: DecisionApiRecord["status"]) {
    setError(null);
    setIsMutating(true);
    try {
      const decisionId = await ensureDecision(entry);
      const updated = await requestJson<{ decision: DecisionApiRecord }>(
        `/api/decisions/${decisionId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );
      setRecords((current) => ({
        ...current,
        [getEntryKey(entry)]: updated.decision,
      }));
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Failed to update decision");
    } finally {
      setIsMutating(false);
    }
  }

  const currentItem = pendingItems[Math.min(index, Math.max(0, pendingItems.length - 1))];
  const currentRecommendation: RankedRecommendation | null = currentItem?.recommendation ?? null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section className="panel" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem" }}>
              Mission control
            </div>
            <h2 style={{ margin: "8px 0 6px" }}>Decision Card</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              Server-backed decision queue replacing the previous local-only workflow.
            </p>
          </div>

          {pendingItems.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                className="button button-secondary"
                disabled={index === 0}
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
              >
                Prev
              </button>
              <span style={{ color: "var(--muted)", minWidth: 70, textAlign: "center" }}>
                {Math.min(index + 1, pendingItems.length)} / {pendingItems.length}
              </span>
              <button
                className="button button-secondary"
                disabled={index >= pendingItems.length - 1}
                onClick={() => setIndex((value) => Math.min(pendingItems.length - 1, value + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 18 }}>
          {error ? <div className="message message-error">{error}</div> : null}
          {isLoading ? (
            <p style={{ color: "var(--muted)" }}>Loading decision queue...</p>
          ) : currentItem ? (
            <div style={{ display: "grid", gap: 18 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--text)",
                    fontSize: ".85rem",
                  }}
                >
                  {categoryLabel[currentItem.entry.category]}
                </span>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.04)",
                    color: severityColor[currentItem.entry.severity],
                    fontSize: ".85rem",
                  }}
                >
                  {currentItem.entry.severity}
                </span>
                <span style={{ color: "var(--muted)", fontSize: ".88rem" }}>
                  {currentItem.entry.moduleLabel} | {new Date(currentItem.entry.timestamp).toLocaleString()}
                </span>
              </div>

              <div>
                <h3 style={{ marginBottom: 8 }}>{currentItem.entry.headline}</h3>
                <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
                  {currentItem.entry.detail}
                </p>
              </div>

              {currentRecommendation ? (
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 16,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>Linked Recommendation</strong>
                    <span style={{ color: "var(--muted)" }}>Rank #{currentRecommendation.rank}</span>
                  </div>
                  <div style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                    {currentRecommendation.issue}
                  </div>
                  <div className="stats-grid">
                    <MetricBar label="Impact" value={currentRecommendation.impact} color="var(--teal)" />
                    <MetricBar label="Effort" value={currentRecommendation.effort} color="var(--gold)" />
                    <MetricBar label="Confidence" value={currentRecommendation.confidence} color="#9bc2ff" />
                  </div>
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="button button-primary"
                  disabled={isMutating}
                  onClick={() => updateDecisionStatus(currentItem.entry, "accepted")}
                >
                  Accept
                </button>
                <button
                  className="button button-secondary"
                  disabled={isMutating}
                  onClick={() => updateDecisionStatus(currentItem.entry, "snoozed")}
                >
                  Snooze
                </button>
                <button
                  className="button button-secondary"
                  disabled={isMutating}
                  onClick={() => updateDecisionStatus(currentItem.entry, "dismissed")}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--muted)" }}>
              Queue cleared. Decisions are now tracked on the server instead of local storage.
            </p>
          )}
        </div>
      </section>

      <section className="panel" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem" }}>
              Decision memory
            </div>
            <h2 style={{ margin: "8px 0 6px" }}>Decision History</h2>
          </div>
          <button className="button button-secondary" onClick={() => void hydrateDecisions()}>
            Refresh
          </button>
        </div>

        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          {decidedItems.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No decisions recorded yet.</p>
          ) : (
            decidedItems.map((item) => {
              const record = item.record!;
              const outcome = item.outcome;
              return (
                <article
                  key={item.entry.id}
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 14,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <strong>{item.entry.headline}</strong>
                      <div style={{ color: "var(--muted)", marginTop: 4, fontSize: ".92rem" }}>
                        {item.entry.moduleLabel}
                      </div>
                    </div>
                    <span style={{ color: statusColor[record.status], fontWeight: 700 }}>
                      {record.status}
                    </span>
                  </div>

                  {record.status === "accepted" ? (
                    outcome ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        <span style={{ color: "var(--gold)" }}>{outcomeLabel[outcome.result]}</span>
                        {outcome.notes ? (
                          <div style={{ color: "var(--muted)", lineHeight: 1.7 }}>{outcome.notes}</div>
                        ) : null}
                      </div>
                    ) : (
                      <OutcomeRecorder decisionId={record.id} onSaved={hydrateDecisions} />
                    )
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
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
            width: `${value}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
