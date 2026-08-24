import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name, last_name, org, role, plan")
    .eq("id", user!.id)
    .single();

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem" }}>
          Dashboard overview
        </div>
        <h1 style={{ marginBottom: 8 }}>Canonical platform shell</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          Auth is now routed through Supabase inside the future product shell. Billing, decisions,
          and the intelligence modules can be migrated onto this base incrementally.
        </p>
      </header>

      <div className="stats-grid">
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ color: "var(--muted)", fontSize: ".86rem" }}>Signed in as</div>
          <div style={{ marginTop: 8, fontWeight: 700 }}>{profile?.email ?? user?.email}</div>
        </div>
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ color: "var(--muted)", fontSize: ".86rem" }}>Current plan</div>
          <div style={{ marginTop: 8, fontWeight: 700 }}>{profile?.plan ?? "starter"}</div>
        </div>
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ color: "var(--muted)", fontSize: ".86rem" }}>Organization</div>
          <div style={{ marginTop: 8, fontWeight: 700 }}>{profile?.org ?? "Not set yet"}</div>
        </div>
      </div>

      <section className="panel" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Migration status</h2>
        <ul style={{ color: "var(--muted)", lineHeight: 1.9, paddingLeft: 18 }}>
          <li>Supabase auth foundation is in place.</li>
          <li>Protected dashboard routing is active.</li>
          <li>Profile, decisions, and billing API surfaces are scaffolded.</li>
          <li>Unified SQL draft is ready for refinement and migration work.</li>
        </ul>
      </section>
    </div>
  );
}
