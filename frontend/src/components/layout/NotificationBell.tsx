"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

interface NotificationItem {
  id: number;
  caseId: number | null;
  templateCode: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPage {
  data: NotificationItem[];
  meta: { page: number; totalPages: number; unreadCount: number };
}

const REFRESH_MS = 60_000;

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

/**
 * Campana de la barra superior: contador de no leídas y panel con la lista.
 * El contador se actualiza al entrar, cada minuto, al volver a la pestaña y
 * al abrir el panel; marcar como leída lo baja al instante, sin recargar.
 */
export function NotificationBell({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    try {
      const res = await apiFetch<NotificationPage>("/api/notifications?page=1&limit=20");
      setItems(res.data);
      setUnread(res.meta.unreadCount);
      setPage(1);
      setTotalPages(res.meta.totalPages);
      setError(null);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones");
    }
  }, []);

  // Contador al entrar, cada minuto y al volver a la pestaña.
  useEffect(() => {
    load(true);
    const timer = window.setInterval(() => load(true), REFRESH_MS);
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  // Al abrir el panel se trae la lista fresca.
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Clic fuera del panel lo cierra.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  async function markRead(n: NotificationItem) {
    if (n.isRead) return;
    // Se refleja de inmediato y se revierte si el servidor falla.
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? prev);
    setUnread((u) => Math.max(0, u - 1));
    try {
      await apiFetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
    } catch {
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, isRead: false } : x)) ?? prev);
      setUnread((u) => u + 1);
    }
  }

  async function markAllRead() {
    const pending = (items ?? []).filter((n) => !n.isRead);
    if (pending.length === 0) return;
    setMarkingAll(true);
    await Promise.allSettled(pending.map((n) => apiFetch(`/api/notifications/${n.id}/read`, { method: "PATCH" })));
    await load(true);
    setMarkingAll(false);
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await apiFetch<NotificationPage>(`/api/notifications?page=${page + 1}&limit=20`);
      setItems((prev) => [...(prev ?? []), ...res.data]);
      setPage(page + 1);
      setTotalPages(res.meta.totalPages);
      setUnread(res.meta.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar más notificaciones");
    } finally {
      setLoadingMore(false);
    }
  }

  const label = unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones";

  return (
    <div ref={root} className="sm:relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={onToggle}
        className="relative rounded-full p-2 text-ink hover:bg-sunken"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="fixed inset-x-2 top-[4.25rem] z-40 max-h-[calc(100vh-5.5rem)] overflow-hidden rounded-2xl border border-line bg-surface shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Notificaciones</h2>
              <p className="text-xs text-ink">{unread > 0 ? `${unread} sin leer` : "Todo al día"}</p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll}
                className="text-sm font-semibold text-ink underline underline-offset-4 disabled:opacity-50"
              >
                {markingAll ? "Marcando…" : "Marcar todas como leídas"}
              </button>
            )}
          </div>

          <div className="max-h-[calc(100vh-11rem)] overflow-y-auto">
            {error && !items && (
              <div className="px-4 py-6 text-center">
                <p role="alert" className="text-sm text-ink">{error}</p>
                <button type="button" onClick={() => load()} className="mt-3 text-sm font-semibold text-ink underline underline-offset-4">
                  Reintentar
                </button>
              </div>
            )}

            {!error && !items && (
              <div aria-busy="true" className="space-y-4 px-4 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-3 w-full" />
                  </div>
                ))}
              </div>
            )}

            {items && items.length === 0 && (
              <div className="px-4 py-10 text-center">
                <BellOff className="mx-auto h-7 w-7 text-ink" aria-hidden />
                <p className="mt-3 text-base font-semibold text-ink">No tienes notificaciones</p>
                <p className="mt-1 text-sm text-ink">Aquí te avisamos cuando algo pase en tus casos.</p>
              </div>
            )}

            {items && items.length > 0 && (
              <ul className="divide-y divide-line">
                {items.map((n) => {
                  const body = (
                    <>
                      <span
                        aria-hidden
                        className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-primary")}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm text-ink", n.isRead ? "font-medium" : "font-bold")}>{n.title}</span>
                        <span className="mt-0.5 block text-sm text-ink">{n.message}</span>
                        <span className="mt-1 block text-xs text-ink">
                          {timeAgo(n.createdAt)}
                          {!n.isRead && <span className="sr-only"> · sin leer</span>}
                        </span>
                      </span>
                    </>
                  );
                  const cls = "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-sunken";
                  return (
                    <li key={n.id}>
                      {n.caseId ? (
                        <Link
                          href={`/casos/${n.caseId}`}
                          onClick={() => {
                            markRead(n);
                            onClose();
                          }}
                          className={cls}
                        >
                          {body}
                        </Link>
                      ) : (
                        <button type="button" onClick={() => markRead(n)} className={cls}>
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {items && page < totalPages && (
              <div className="border-t border-line px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-sm font-semibold text-ink underline underline-offset-4 disabled:opacity-50"
                >
                  {loadingMore ? "Cargando…" : "Mostrar más"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
