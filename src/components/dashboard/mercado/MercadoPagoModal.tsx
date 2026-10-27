"use client";

import { useState } from "react";
import { formatCurrency, formatDate, getTodayIso } from "@/lib/format";
import {
  addDaysIso,
  CACHEA_DUE_DAYS,
  CACHEA_MIN_PERCENT,
  roundMoney,
} from "@/lib/mercado";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./mercado-ui";

export type PagoModalMode = "completo" | "cachea" | "saldo";

export interface PagoModalPayload {
  tipo: PagoModalMode;
  porcentaje?: number;
  monto?: number;
  fecha_pago: string;
}

interface MercadoPagoModalProps {
  mode: PagoModalMode;
  total: number;
  pending?: number;
  onClose: () => void;
  onConfirm: (payload: PagoModalPayload) => Promise<void>;
}

const quickPercentages = [20, 30, 50];

export default function MercadoPagoModal({
  mode,
  total,
  pending,
  onClose,
  onConfirm,
}: MercadoPagoModalProps) {
  const [inputMode, setInputMode] = useState<"porcentaje" | "monto">(
    "porcentaje",
  );
  const [value, setValue] = useState("20");
  const [fechaPago, setFechaPago] = useState(getTodayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericValue = Number(value);
  const amount =
    mode === "completo"
      ? roundMoney(total)
      : mode === "saldo"
        ? roundMoney(pending ?? 0)
        : inputMode === "porcentaje"
          ? roundMoney((total * numericValue) / 100)
          : roundMoney(numericValue);
  const percentage =
    total > 0 ? roundMoney((amount / total) * 100) : 0;
  const saldo =
    mode === "saldo" ? 0 : roundMoney(Math.max(total - amount, 0));
  const dueDate =
    mode === "cachea" ? addDaysIso(fechaPago, CACHEA_DUE_DAYS) : null;

  let validationError: string | null = null;
  if (!fechaPago) {
    validationError = "Selecciona la fecha de pago";
  } else if (mode === "cachea") {
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      validationError =
        inputMode === "porcentaje"
          ? "Ingresa un porcentaje válido"
          : "Ingresa un monto válido";
    } else if (percentage < CACHEA_MIN_PERCENT) {
      validationError = `El abono mínimo es del ${CACHEA_MIN_PERCENT}% (${formatCurrency(
        roundMoney((total * CACHEA_MIN_PERCENT) / 100),
      )})`;
    } else if (amount >= total) {
      validationError = "Para pagar el total usa la opción Pagar completo";
    }
  } else if (mode === "saldo" && (pending ?? 0) <= 0) {
    validationError = "La lista no tiene saldo pendiente";
  } else if (mode === "completo" && total <= 0) {
    validationError = "La lista no tiene un total para pagar";
  }

  const title =
    mode === "completo"
      ? "Pagar completo"
      : mode === "cachea"
        ? "Pagar con Cachea"
        : "Pagar saldo";

  async function handleSubmit() {
    if (validationError) return;
    setSaving(true);
    setError(null);
    try {
      const payload: PagoModalPayload = {
        tipo: mode,
        fecha_pago: fechaPago,
      };
      if (mode === "cachea") {
        if (inputMode === "porcentaje") {
          payload.porcentaje = numericValue;
        } else {
          payload.monto = numericValue;
        }
      }
      await onConfirm(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el pago");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar pago"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface hover:text-primary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {mode === "cachea" && (
          <div className="space-y-4">
            <div>
              <span className={labelClass}>Forma de abono</span>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setInputMode("porcentaje")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    inputMode === "porcentaje"
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  Porcentaje
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("monto")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    inputMode === "monto"
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  Monto
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="pago-cachea-valor" className={labelClass}>
                {inputMode === "porcentaje"
                  ? "Porcentaje a pagar"
                  : "Monto a pagar"}
              </label>
              <input
                id="pago-cachea-valor"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={inputMode === "porcentaje" ? "20" : "0.00"}
                className={inputClass}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {quickPercentages.map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => {
                      setInputMode("porcentaje");
                      setValue(String(percent));
                    }}
                    className="rounded-full border border-primary/15 px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-surface"
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode !== "cachea" && (
          <div className={labelClass}>
            {mode === "completo" ? "Monto a pagar" : "Saldo a pagar"}
            <p className="mt-2 text-2xl font-bold text-primary">
              {formatCurrency(amount)}
            </p>
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="pago-fecha" className={labelClass}>
            Fecha de pago
          </label>
          <input
            id="pago-fecha"
            type="date"
            value={fechaPago}
            onChange={(event) => setFechaPago(event.target.value)}
            className={inputClass}
          />
        </div>

        <dl className="mt-5 grid gap-3 rounded-2xl bg-surface p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-normal text-muted">Total de la lista</dt>
            <dd className="text-sm font-bold text-primary">
              {formatCurrency(total)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">Pagas ahora</dt>
            <dd className="text-sm font-bold text-primary">
              {formatCurrency(amount)}
              {mode === "cachea" ? ` (${percentage}%)` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">Saldo pendiente</dt>
            <dd className="text-sm font-bold text-primary">
              {formatCurrency(saldo)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">
              {dueDate ? "Vence" : "Estado"}
            </dt>
            <dd className="text-sm font-bold text-primary">
              {dueDate ? formatDate(dueDate) : "Sin saldo"}
            </dd>
          </div>
        </dl>

        {(validationError || error) && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
            {error ?? validationError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className={secondaryButtonClass}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || Boolean(validationError)}
            className={primaryButtonClass}
          >
            {saving ? "Guardando..." : "Confirmar pago"}
          </button>
        </div>
      </div>
    </div>
  );
}
