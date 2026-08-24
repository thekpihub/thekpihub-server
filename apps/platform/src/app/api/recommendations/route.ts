import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  computeAccuracyByRecommendation,
  emptyAccuracy,
  getRankedRecommendations,
} from "@/lib/intelligence/recommendations";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const [recommendations, accuracyByRecommendation] = await Promise.all([
      getRankedRecommendations(supabase),
      computeAccuracyByRecommendation(supabase, user.id),
    ]);

    const enriched = recommendations.map((recommendation) => ({
      ...recommendation,
      accuracy: accuracyByRecommendation.get(recommendation.id) ?? emptyAccuracy(),
    }));

    return NextResponse.json({ recommendations: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load recommendations";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
