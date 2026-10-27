"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MercadoLista } from "@/lib/types";
import MercadoPagoModal, {
  type PagoModalMode,
  type PagoModalPayload,
} from "./MercadoPagoModal";
import {
  dangerButtonClass,
  getPaymentStatus,
  secondaryButtonClass,
  smallPrimaryButtonClass,
} from "./mercado-ui";

interface MercadoListasGuardadasTabProps {
  listas: MercadoLista[];
  onChanged: () => Promise<void>;
}

interface PaymentAction {
  lista: MercadoLista;
  mode: PagoModalMode;
}

function MiniStat({
  label,
  value,
  hint,
  valueClass = "text-primary",
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <p className="text-xs font-normal text-muted">{label}</p>
      <p className={`mt-1 text-base font-bold ${valueClass}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs font-normal text-muted">{hint}</p>}
    </div>
  );
}

export default function MercadoListasGuardadasTab({
  listas,
  onChanged,
}: MercadoListasGuardadasTabProps) {
  const [paymentAction, setPaymentAction] = useState<PaymentAction | null>(
    null,
  );
  const [deletingList, setDeletingList] = useState<MercadoLista | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handlePayment(payload: PagoModalPayload) {
    if (!paymentAction) return;
    const response = await fetch(
      `/api/mercado/listas/${paymentAction.lista.id}/pagos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Error al registrar el pago");
    }
    setPaymentAction(null);
    await onChanged();
  }

  async function handleDelete() {
    if (!deletingList) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(
        `/api/mercado/listas/${deletingList.id}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setDeleteError(data.error ?? "Error al eliminar la lista");
        return;
      }
      setDeletingList(null);
      await onChanged();
    } catch {
      setDeleteError("Error al eliminar la lista");
    } finally {
      setDeleting(false);
    }
  }

  if (listas.length === 0) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-normal text-muted">
          Todavía no hay listas guardadas. Arma una lista y págala completa o
          con Cachea.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {listas.map((lista) => {
        const status = getPaymentStatus(lista.estado_pago);
        const isPaid = lista.estado_pago === "pagado";
        const hasPayments = lista.pagos.length > 0;

        return (
          <article
            key={lista.id}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-primary">
                    {lista.nombre}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
                <p className="mt-1 text-sm font-normal text-muted">
                  Creada el {formatDate(lista.created_at)} · {lista.items.length}{" "}
                  {lista.items.length === 1 ? "producto" : "productos"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isPaid && !hasPayments && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAction({ lista, mode: "completo" })
                      }
                      className={smallPrimaryButtonClass}
                    >
                      Pagar completo
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAction({ lista, mode: "cachea" })
                      }
                      className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-primary transition-opacity hover:opacity-90"
                    >
                      Cachea
                    </button>
                  </>
                )}
                {!isPaid && hasPayments && lista.saldo > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAction({ lista, mode: "saldo" })}
                    className={smallPrimaryButtonClass}
                  >
                    Pagar saldo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeletingList(lista);
                  }}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <MiniStat
                label="Presupuesto"
                value={
                  lista.presupuesto === null
                    ? "—"
                    : formatCurrency(lista.presupuesto)
                }
                hint="Monto asignado"
              />
              <MiniStat
                label="Total"
                value={formatCurrency(lista.total)}
                hint="Compra"
              />
              <MiniStat
                label="Pagado"
                value={formatCurrency(lista.pagado)}
                hint={lista.pagado > 0 ? "Registrado" : "Sin pago"}
              />
              <MiniStat
                label="Diferencia"
                value={
                  lista.diferencia === null
                    ? "—"
                    : formatCurrency(lista.diferencia)
                }
                hint={
                  lista.diferencia === null
                    ? "Sin presupuesto"
                    : lista.diferencia < 0
                      ? `Faltan ${formatCurrency(Math.abs(lista.diferencia))}`
                      : "Disponible"
                }
                valueClass={
                  lista.diferencia !== null && lista.diferencia < 0
                    ? "text-red-600"
                    : "text-secondary"
                }
              />
              <MiniStat
                label="Saldo"
                value={formatCurrency(lista.saldo)}
                hint={
                  lista.saldo > 0
                    ? lista.fecha_vencimiento
                      ? `Vence ${formatDate(lista.fecha_vencimiento)}`
                      : "Pendiente"
                    : "Sin saldo"
                }
                valueClass={lista.estado_pago === "vencido" ? "text-red-600" : "text-primary"}
              />
            </div>

            <details className="mt-4 rounded-xl border border-black/5">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-primary">
                Ver productos
              </summary>
              <div className="divide-y divide-black/5 border-t border-black/5">
                {lista.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-primary">
                        {item.nombre_producto}
                      </p>
                      <p className="text-xs font-normal text-muted">
                        {item.cantidad} {item.unidad} ·{" "}
                        {item.tienda_nombre ?? "Sin tienda"}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </details>

            {lista.pagos.length > 0 && (
              <details className="mt-3 rounded-xl border border-black/5">
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-primary">
                  Ver pagos ({lista.pagos.length})
                </summary>
                <div className="divide-y divide-black/5 border-t border-black/5">
                  {lista.pagos.map((pago) => (
                    <div
                      key={pago.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold capitalize text-primary">
                          {pago.tipo}
                          {pago.porcentaje !== null
                            ? ` · ${pago.porcentaje}%`
                            : ""}
                        </p>
                        <p className="text-xs font-normal text-muted">
                          {formatDate(pago.fecha_pago)}
                          {pago.fecha_vencimiento
                            ? ` · vence ${formatDate(pago.fecha_vencimiento)}`
                            : ""}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(pago.monto)}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </article>
        );
      })}

      {paymentAction && (
        <MercadoPagoModal
          mode={paymentAction.mode}
          total={paymentAction.lista.total}
          pending={paymentAction.lista.saldo}
          onClose={() => setPaymentAction(null)}
          onConfirm={handlePayment}
        />
      )}

      {deletingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeletingList(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-primary">Eliminar lista</h2>
            <p className="mt-2 text-sm font-normal leading-6 text-muted">
              ¿Seguro que deseas eliminar{" "}
              <span className="font-bold text-primary">
                {deletingList.nombre}
              </span>
              ? También se eliminarán sus pagos.
            </p>

            {deleteError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeletingList(null)}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={dangerButtonClass}
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
