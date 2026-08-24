import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Send a secure password reset link through Supabase Auth."
      footer={
        <Link href="/login" style={{ color: "var(--gold)" }}>
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
