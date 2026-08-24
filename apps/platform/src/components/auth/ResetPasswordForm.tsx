"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (resetError) {
      setError(resetError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Reset link sent. Check your inbox.");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
      {error ? <div className="message message-error">{error}</div> : null}
      {message ? <div className="message message-success">{message}</div> : null}

      <div className="field">
        <label htmlFor="reset-email">Email</label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
