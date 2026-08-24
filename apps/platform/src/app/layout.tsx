import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "The KPI Hub Platform",
  description: "Unified production app foundation for The KPI Hub.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
