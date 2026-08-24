import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px 0",
      }}
    >
      <div className="shell">
        <section
          className="panel"
          style={{
            width: "min(520px, 100%)",
            margin: "0 auto",
            padding: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "linear-gradient(135deg, var(--gold), #c87d18)",
                color: "#0b1020",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}
            >
              K
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>The KPI Hub</div>
              <div style={{ color: "var(--muted)", fontSize: ".92rem" }}>
                Unified platform migration
              </div>
            </div>
          </div>

          <h1 style={{ margin: 0, fontSize: "2rem" }}>{title}</h1>
          <p style={{ color: "var(--muted)", marginTop: 10, marginBottom: 28 }}>{subtitle}</p>

          {children}

          <div style={{ marginTop: 24, color: "var(--muted)", fontSize: ".95rem" }}>{footer}</div>
        </section>
      </div>
    </main>
  );
}
