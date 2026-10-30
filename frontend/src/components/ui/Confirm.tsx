"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Button } from "./Button";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" pinta el botón de confirmar en rojo (acciones difíciles de revertir). */
  tone?: "default" | "danger";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Devuelve una función que abre un modal y resuelve true/false. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (options && dialog && !dialog.open) dialog.showModal();
  }, [options]);

  function close(result: boolean) {
    dialogRef.current?.close();
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <dialog
          ref={dialogRef}
          aria-labelledby="confirm-title"
          onCancel={(e) => {
            e.preventDefault();
            close(false);
          }}
          onClick={(e) => {
            if (e.target === dialogRef.current) close(false);
          }}
          className="confirm-dialog m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-xl"
        >
          <div className="p-6">
            <h2 id="confirm-title" className="text-lg font-bold">
              {options.title}
            </h2>
            {options.message && <p className="mt-2 text-sm text-ink-soft">{options.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => close(false)}>
                {options.cancelLabel ?? "Cancelar"}
              </Button>
              <Button
                variant={options.tone === "danger" ? "danger" : "primary"}
                onClick={() => close(true)}
                autoFocus
              >
                {options.confirmLabel ?? "Confirmar"}
              </Button>
            </div>
          </div>
        </dialog>
      )}
    </ConfirmContext.Provider>
  );
}
