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
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-bold tracking-tight text-slate-100">NODUS</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}