"use client";

import { CopyCodeButton } from "@/components/dashboard/CopyCodeButton";
import {
  formatCurrency,
  formatDeliveryDate,
  formatMonth,
  formatStatus,
} from "@/lib/format";
import type { AcademixRecord } from "@/lib/types";

interface RecordDetailModalProps {
  record: AcademixRecord | null;
  onClose: () => void;
  onEdit?: (record: AcademixRecord) => void;
}

export function RecordDetailModal({
  record,
  onClose,
  onEdit,
}: RecordDetailModalProps) {
  if (!record) return null;

  const estado = formatStatus(record.estado);
  const estadoPago = formatStatus(record.estado_pago);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-primary">{record.titulo}</h2>
            <p className="mt-1 text-xs font-normal text-muted">
              Detalle del trabajo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface hover:text-primary"
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

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-normal text-muted">Código</dt>
            <dd className="mt-1 flex items-center gap-1 text-sm font-bold text-primary">
              {record.codigo ? (
                <>
                  {record.codigo}
                  <CopyCodeButton value={record.codigo} />
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">Fecha de entrega</dt>
            <dd className="mt-1 text-sm font-normal text-primary">
              {formatDeliveryDate(record.fecha_entrega_real)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">Hora</dt>
            <dd className="mt-1 text-sm font-normal text-primary">
              {record.hora || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">Mes de registro</dt>
            <dd className="mt-1 text-sm font-normal text-primary">
              {formatMonth(record.mes_registro)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">Precio</dt>
            <dd className="mt-1 text-sm font-bold text-primary">
              {formatCurrency(Number(record.precio ?? 0))}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">Porcentaje</dt>
            <dd className="mt-1 text-sm font-normal text-primary">
              {formatCurrency(Number(record.porcentaje ?? 0))}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">Estado</dt>
            <dd className="mt-1">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${estado.className}`}
              >
                {estado.label}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-normal text-muted">Estado de pago</dt>
            <dd className="mt-1">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${estadoPago.className}`}
              >
                {estadoPago.label}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="text-xs font-normal text-muted">Comentario</p>
          <p className="mt-1 whitespace-pre-wrap rounded-xl border border-black/5 bg-surface/60 px-4 py-3 text-sm font-normal leading-6 text-primary">
            {record.comentario || "Sin comentario"}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-primary/15 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface"
          >
            Cerrar
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Editar registro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
