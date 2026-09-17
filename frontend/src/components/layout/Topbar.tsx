"use client";

import { useState } from "react";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b border-slate-800 bg-slate-950 px-6">
      <button
        type="button"
        aria-label="Notificaciones"
        className="relative rounded-full p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
      >
        <Bell className="h-5 w-5" />
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-900"
        >
          <span className="font-medium">{user?.fullName ?? "Usuario"}</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
            {user?.role}
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-md border border-slate-800 bg-slate-900 shadow-lg">
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
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