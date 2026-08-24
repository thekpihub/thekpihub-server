"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/intelligence-hub", label: "Intelligence Hub" },
  { href: "/dashboard/recommendation-engine", label: "Recommendation Engine" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="panel"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minWidth: 250,
      }}
    >
      <div>
        <div style={{ fontSize: ".82rem", color: "var(--muted)", textTransform: "uppercase" }}>
          Canonical app
        </div>
        <div style={{ marginTop: 8, fontWeight: 800, fontSize: "1.1rem" }}>The KPI Hub Platform</div>
      </div>

      <nav style={{ display: "grid", gap: 8 }}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                background: active ? "var(--gold-soft)" : "transparent",
                border: active ? "1px solid rgba(233, 161, 35, 0.35)" : "1px solid transparent",
                color: active ? "#ffe1ad" : "var(--muted)",
                fontWeight: active ? 700 : 500,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          marginTop: "auto",
          color: "var(--muted)",
          fontSize: ".9rem",
          lineHeight: 1.6,
        }}
      >
        This shell replaces the static dashboard over time while preserving live billing and auth.
      </div>
    </aside>
  );
}
