"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Topbar } from "@/components/layout/Topbar";
import { LogoMark } from "@/components/brand/Logo";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div
        role="status"
        aria-label="Cargando sesión"
        className="flex min-h-screen items-center justify-center bg-canvas"
      >
        <LogoMark size={40} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Topbar />
      <main className="mx-auto max-w-[1400px] p-4 lg:p-8">{children}</main>
    </div>
  );
}
