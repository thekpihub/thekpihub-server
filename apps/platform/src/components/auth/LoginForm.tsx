"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const redirectTo = next?.startsWith("/dashboard") ? next : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Signed in successfully. Redirecting...");
    window.location.assign(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
      {error ? <div className="message message-error">{error}</div> : null}
      {message ? <div className="message message-success">{message}</div> : null}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          required
        />
      </div>

      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link href="/register" style={{ color: "var(--gold)" }}>
          Create account
        </Link>
        <Link href="/reset-password" style={{ color: "var(--gold)" }}>
          Reset password
        </Link>
      </div>
    </form>
  );
}
