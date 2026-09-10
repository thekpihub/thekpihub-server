"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Cross-subdomain session handoff, from apps/website (thekpihub.com, a plain
 * localStorage-based Supabase client) to this app (app.thekpihub.com,
 * @supabase/ssr cookies). Neither storage mechanism crosses subdomains on
 * its own -- confirmed by reading both apps' actual client setup, not
 * assumed -- so a session established on thekpihub.com does not exist here
 * without this step.
 *
 * Both apps share the same Supabase project, so the access/refresh token
 * pair issued on thekpihub.com is a valid, portable credential here too --
 * no separate secret-based handoff (like WingCommander's) is needed, just
 * passing the tokens through and calling setSession().
 *
 * Tokens travel in the URL *hash fragment* (`#access_token=...`), not the
 * query string: fragments are never sent to any server (not in this app's
 * own request, not in an intermediate proxy/log, not in a Referer header on
 * a later navigation) -- only the browser sees them. `redirect` travels as
 * a plain query param since it isn't sensitive.
 */
export function HandoffClient() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const destination = redirect?.startsWith("/") ? redirect : "/dashboard";

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError("No session to hand off -- missing access_token/refresh_token.");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: setSessionError }) => {
        if (setSessionError) {
          setError(setSessionError.message);
          return;
        }
        // Hard navigation (not router.push) so middleware re-evaluates with
        // the freshly-set cookies, same pattern LoginForm uses after sign-in.
        window.location.assign(destination);
      });
  }, [destination]);

  if (error) {
    return (
      <div style={{ display: "grid", gap: 18 }}>
        <div className="message message-error">{error}</div>
        <Link href={`/login?next=${encodeURIComponent(destination)}`} style={{ color: "var(--gold)" }}>
          Sign in instead
        </Link>
      </div>
    );
  }

  return <p style={{ color: "var(--muted)" }}>Signing you in...</p>;
}
