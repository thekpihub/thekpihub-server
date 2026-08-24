import { NextResponse } from "next/server";
import { buildIntelligenceHubSnapshot } from "@/lib/intelligence/hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const snapshot = await buildIntelligenceHubSnapshot(supabase);
    return NextResponse.json({ snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build intelligence snapshot";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
