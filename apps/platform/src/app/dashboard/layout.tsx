import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main style={{ padding: "28px 0 40px" }}>
      <div className="shell dashboard-shell">
        <Sidebar />
        <section className="panel" style={{ padding: 24 }}>
          {children}
        </section>
      </div>
    </main>
  );
}
