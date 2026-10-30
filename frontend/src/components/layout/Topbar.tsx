"use client";

import { useState } from "react";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/case-status";

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-line bg-surface px-4 lg:px-6">
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={onMenu}
        className="rounded-md p-2 text-ink-soft hover:bg-sunken hover:text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1" />
      <button
        type="button"
        aria-label="Notificaciones"
        className="relative rounded-full p-2 text-ink-soft hover:bg-sunken hover:text-ink"
      >
        <Bell className="h-5 w-5" />
      </button>

      <div className="relative">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink-soft hover:bg-sunken"
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary"
          >
            {initials(user?.fullName)}
          </span>
          <span className="hidden font-medium text-ink sm:inline">{user?.fullName ?? "Usuario"}</span>
          <span className="rounded bg-primary-soft px-1.5 py-0.5 text-xs font-medium text-primary">
            {roleLabel(user?.role)}
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-line bg-surface shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => logout()}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-sunken"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
