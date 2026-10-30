export interface SlaCounts {
  ok: number;
  porVencer: number;
  vencido: number;
}

/** Anillo: verde = en plazo, negro = vencido, gris = por vencer. */
/** `centered` apila el anillo sobre la leyenda y centra todo. */
export function SlaRing({ ok, porVencer, vencido, centered = false }: SlaCounts & { centered?: boolean }) {
  const total = ok + porVencer + vencido;
  const pctOk = total ? (ok / total) * 100 : 0;
  const pctVencido = total ? (vencido / total) * 100 : 0;
  const ring = total
    ? `conic-gradient(rgb(var(--primary)) 0 ${pctOk}%, rgb(var(--ink)) ${pctOk}% ${pctOk + pctVencido}%, rgb(var(--line-strong)) ${pctOk + pctVencido}% 100%)`
    : "rgb(var(--line-strong))";
  const legend = [
    { n: ok, label: "en plazo", swatch: "bg-primary" },
    { n: vencido, label: "vencido", swatch: "bg-ink" },
    { n: porVencer, label: "por vencer", swatch: "bg-line-strong" },
  ];

  return (
    <div className={centered ? "flex flex-col items-center gap-5" : "flex flex-wrap items-center gap-8"}>
      <div
        role="img"
        aria-label={
          total
            ? `${Math.round(pctOk)}% de los casos en plazo: ${ok} en plazo, ${vencido} vencidos, ${porVencer} por vencer`
            : "Sin datos de SLA"
        }
        style={{ background: ring }}
        className="grid h-40 w-40 place-items-center rounded-full"
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-canvas text-center">
          <div>
            <p className="font-display text-4xl font-bold leading-none text-ink">
              {total ? `${Math.round(pctOk)}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-ink">en plazo</p>
          </div>
        </div>
      </div>
      <ul className={centered ? "flex flex-wrap justify-center gap-x-7 gap-y-2" : "space-y-3"}>
        {legend.map((l) => (
          <li key={l.label} className="flex items-center gap-2.5 text-base text-ink">
            <span aria-hidden className={`h-3 w-3 rounded-[3px] ${l.swatch}`} />
            <b>{l.n}</b> {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
