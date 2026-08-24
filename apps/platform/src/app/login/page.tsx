import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with the unified Supabase auth flow for the canonical KPI Hub app."
      footer={
        <>
          Need an account?{" "}
          <Link href="/register" style={{ color: "var(--gold)" }}>
            Create one
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
