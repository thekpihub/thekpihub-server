import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="This ports the live registration flow into the canonical app foundation."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" style={{ color: "var(--gold)" }}>
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
