"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
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
        className="flex h-screen items-center justify-center bg-canvas"
      >
        <LogoMark size={40} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 text-ink">{children}</main>
      </div>
    </div>
  );
}