import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { HandoffClient } from "@/components/auth/HandoffClient";

export default function HandoffPage() {
  return (
    <AuthShell
      title="One moment"
      subtitle="Bringing your thekpihub.com session over to the platform."
      footer={null}
    >
      <Suspense fallback={<p style={{ color: "var(--muted)" }}>Signing you in...</p>}>
        <HandoffClient />
      </Suspense>
    </AuthShell>
  );
}
