import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "inverse";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-strong",
  secondary: "border border-line-strong bg-surface text-ink-soft hover:bg-sunken hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
  /** Para fondos oscuros (el encabezado con degradado). */
  inverse: "border border-white bg-transparent text-white hover:bg-white/15",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Muestra spinner, deshabilita el botón y evita doble envío. */
  loading?: boolean;
  /** Texto mientras carga (por defecto, el mismo del botón). */
  loadingText?: string;
}

export function Button({
  variant = "primary",
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px",
        VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {loading && <Spinner />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
