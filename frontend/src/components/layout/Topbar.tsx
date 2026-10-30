"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  ChevronDown,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Timer,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/case-status";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/casos", label: "Casos", icon: Briefcase },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/consultores", label: "Consultores", icon: Users },
  { href: "/workflow", label: "Workflow", icon: GitBranch },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/sla", label: "SLA", icon: Timer },
];

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

/** Barra superior: marca, navegación principal, notificaciones y menú de usuario. */
export function Topbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // Los menús se cierran al navegar o con Escape.
  useEffect(() => {
    setNavOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen && !userMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setNavOpen(false);
      setUserMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen, userMenuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          aria-label={navOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((o) => !o)}
          className="rounded-full p-2 text-ink hover:bg-sunken lg:hidden"
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/dashboard" aria-label="NODUS, ir al Dashboard" className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-sidebar text-white" : "text-ink hover:bg-sunken",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 lg:hidden" />

        <button
          type="button"
          aria-label="Notificaciones"
          className="relative rounded-full p-2 text-ink hover:bg-sunken"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm text-ink hover:bg-sunken"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary"
            >
              {initials(user?.fullName)}
            </span>
            <span className="hidden font-medium xl:inline">{user?.fullName ?? "Usuario"}</span>
            <span className="hidden rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium sm:inline">
              {roleLabel(user?.role)}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-line bg-surface p-1 shadow-lg"
            >
              <p className="px-3 py-2 text-xs sm:hidden">
                {user?.fullName} · {roleLabel(user?.role)}
              </p>
              <button
                type="button"
                role="menuitem"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-sunken"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {navOpen && (
        <nav aria-label="Principal" className="border-t border-line bg-surface px-3 py-2 lg:hidden">
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-sidebar text-white" : "text-ink hover:bg-sunken",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
