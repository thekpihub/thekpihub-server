import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "48px 0 80px" }}>
      <div className="shell">
        <section className="panel" style={{ padding: 36 }}>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              background: "var(--gold-soft)",
              color: "#ffd99b",
              fontWeight: 700,
            }}
          >
            Canonical platform foundation
          </div>

          <h1 style={{ fontSize: "3rem", marginBottom: 16 }}>
            Decision-grade intelligence, rebuilt on a single production stack.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.08rem", lineHeight: 1.8, maxWidth: 760 }}>
            This new app shell is where Supabase auth, billing, decision persistence, and the
            differentiated dashboard experience come together. The current live static site remains
            operational during migration.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28 }}>
            <Link className="button button-primary" href="/login">
              Sign in
            </Link>
            <Link className="button button-secondary" href="/register">
              Create account
            </Link>
            <Link className="button button-secondary" href="/dashboard">
              Open dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
