import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NODUS — Ingeniería SAS",
  description: "Plataforma de orquestación de casos Mipyme ↔ Consultores",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
