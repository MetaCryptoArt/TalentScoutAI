import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentScout AI",
  description: "Pre-calificación de candidatos con IA — DISC, autenticidad y Fraud Risk Score.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
