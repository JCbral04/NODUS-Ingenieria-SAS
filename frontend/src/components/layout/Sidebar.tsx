"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  GitBranch,
  FileText,
  Timer,
} from "lucide-react";
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar">
      <div className="flex h-16 items-center px-5">
        <Logo tone="light" />
      </div>

      {/* Los módulos cuelgan de una línea de nodos, como un flujo de trabajo. */}
      <nav aria-label="Principal" className="relative mt-4 flex-1 px-3">
        <ul className="relative space-y-1">
          <span aria-hidden className="absolute bottom-[18px] left-[11px] top-[18px] w-px bg-sidebar-line" />
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md py-2 pl-9 pr-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-sidebar-ink hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[7px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full",
                      active
                        ? "bg-accent ring-4 ring-accent/25"
                        : "bg-sidebar ring-2 ring-sidebar-line"
                    )}
                  />
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
