import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  BadRequestError,
  parseProfilePatchRequest,
  readJsonObject,
} from "@/lib/api/validation";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, org, role, plan")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let payload;
  try {
    payload = parseProfilePatchRequest(await readJsonObject(request));
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id, email, first_name, last_name, org, role, plan")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
