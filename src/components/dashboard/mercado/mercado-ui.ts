import type { MercadoPaymentStatus } from "@/lib/types";

export const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-normal text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40";

export const labelClass = "mb-1.5 block text-sm font-bold text-primary";

export const cardClass =
  "rounded-2xl border border-black/5 bg-white p-6 shadow-sm";

export const primaryButtonClass =
  "rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "rounded-full border border-primary/15 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export const smallPrimaryButtonClass =
  "rounded-full bg-secondary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export const smallSecondaryButtonClass =
  "rounded-full border border-primary/15 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60";

export function getPaymentStatus(value: MercadoPaymentStatus): {
  label: string;
  className: string;
} {
  if (value === "pagado") {
    return {
      label: "Pagada",
      className: "bg-secondary/10 text-secondary",
    };
  }
  if (value === "cachea") {
    return {
      label: "Cachea",
      className: "bg-accent/20 text-primary",
    };
  }
  if (value === "vencido") {
    return {
      label: "Vencida",
      className: "bg-red-50 text-red-700",
    };
  }
  return {
    label: "Pendiente",
    className: "bg-primary/10 text-primary",
  };
}
