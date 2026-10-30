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
    <div className="min-h-screen overflow-x-clip bg-canvas text-ink">
      <Topbar />
      <main className="mx-auto max-w-[1400px] p-4 pb-10 lg:p-8 lg:pb-12">{children}</main>
    </div>
  );
}
