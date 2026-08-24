"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/lib/api/contracts";

const roles: ProfileRole[] = ["executive", "manager", "contributor", "analyst"];

export function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<ProfileRole>("executive");
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          first_name: firstName,
          last_name: lastName,
          org: organization,
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        org: organization,
        role,
        plan: "starter",
      });
    }

    setMessage(
      data.session
        ? "Account created successfully. Open /dashboard to continue."
        : "Account created. Check your email to confirm your registration."
    );
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
      {error ? <div className="message message-error">{error}</div> : null}
      {message ? <div className="message message-success">{message}</div> : null}

      <div className="auth-name-grid">
        <div className="field">
          <label htmlFor="first-name">First name</label>
          <input
            id="first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="last-name">Last name</label>
          <input
            id="last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="organization">Organization</label>
        <input
          id="organization"
          value={organization}
          onChange={(event) => setOrganization(event.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          value={role}
          onChange={(event) => setRole(event.target.value as ProfileRole)}
          style={{
            background: "rgba(255,255,255,0.03)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          {roles.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>

      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <Link href="/login" style={{ color: "var(--gold)" }}>
        Already have an account?
      </Link>
    </form>
  );
}
