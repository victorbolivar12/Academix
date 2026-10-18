"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  emptySubscribe,
  formatCurrency,
  formatDeliveryDate,
  formatMonth,
  getCurrentMonthName,
  getEmptyValue,
  getTodayIso,
} from "@/lib/format";
import { getMonthNameFromDate, SIDOR_TITULOS } from "@/lib/sidor";
import type { SidorListResponse, SidorPago } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-normal text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40";

const labelClass = "mb-1.5 block text-sm font-bold text-primary";

const PAGE_SIZE = 10;

interface FormState {
  titulo: string;
  monto: string;
  fecha_pago: string;
}

const initialForm: FormState = {
  titulo: "",
  monto: "",
  fecha_pago: "",
};

interface RecordActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

function RecordActions({ onEdit, onDelete }: RecordActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Editar pago"
        title="Editar"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-primary"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Eliminar pago"
        title="Eliminar"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
}

export default function SidorModule() {
  const [records, setRecords] = useState<SidorPago[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [monthCount, setMonthCount] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = useSyncExternalStore(
    emptySubscribe,
    getCurrentMonthName,
    getEmptyValue,
  );
  const [mesFilter, setMesFilter] = useState<string | undefined>(undefined);
  const mes = mesFilter ?? currentMonth;
  const [titulo, setTitulo] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deletingRecord, setDeletingRecord] = useState<SidorPago | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (mes) params.set("mes", mes);
      if (titulo.trim()) params.set("titulo", titulo.trim());

      const query = params.toString();
      const res = await fetch(`/api/sidor${query ? `?${query}` : ""}`);
      if (!res.ok) throw new Error();
      const data: SidorListResponse = await res.json();
      setRecords(data.records);
      setMonths(data.months);
      setMonthCount(data.monthCount);
      setMonthTotal(data.monthTotal);
      setError(null);
    } catch {
      setError("Error al cargar los pagos de Sidor");
    } finally {
      setLoading(false);
    }
  }, [mes, titulo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const monthOptions = Array.from(
    new Set([currentMonth, ...months].filter(Boolean)),
  );

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleRecords = records.slice(startIndex, startIndex + PAGE_SIZE);

  const montoNumber = Number(form.monto);

  function openForm() {
    setForm({ ...initialForm, fecha_pago: getTodayIso() });
    setFormError(null);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(record: SidorPago) {
    setForm({
      titulo: record.titulo ?? "",
      monto: record.monto ?? "",
      fecha_pago: record.fecha_pago ?? "",
    });
    setFormError(null);
    setEditingId(record.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function openDelete(record: SidorPago) {
    setDeleteError(null);
    setDeletingRecord(record);
  }

  function closeDelete() {
    setDeletingRecord(null);
  }

  async function handleDelete() {
    if (!deletingRecord) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/sidor/${deletingRecord.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error ?? "Error al eliminar el pago");
        return;
      }
      closeDelete();
      await fetchData();
    } catch {
      setDeleteError("Error al eliminar el pago");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const isEditing = editingId !== null;
      const res = await fetch(
        isEditing ? `/api/sidor/${editingId}` : "/api/sidor",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: form.titulo,
            monto: montoNumber,
            fecha_pago: form.fecha_pago,
          }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Error al guardar el pago");
        return;
      }
      closeForm();
      await fetchData();
    } catch {
      setFormError("Error al guardar el pago");
    } finally {
      setSaving(false);
    }
  }

  const monthLabel = mes || "todos los meses";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
            Módulo 3
          </span>
          <h1 className="mt-4 text-3xl font-bold text-primary">Sidor</h1>
          <p className="mt-2 text-base font-normal text-muted">
            Control de pagos mensuales de Sidor.
          </p>
        </div>
        <button
          type="button"
          onClick={openForm}
          className="w-full rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          Nuevo pago
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm font-normal text-muted">Total del mes</p>
          <p className="mt-3 text-2xl font-bold text-primary">
            {formatCurrency(monthTotal)}
          </p>
          <p className="mt-1 text-xs font-normal text-muted">
            {monthCount} {monthCount === 1 ? "registro" : "registros"} en{" "}
            {monthLabel}
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="filter-mes" className={labelClass}>
              Mes
            </label>
            <select
              id="filter-mes"
              value={mes}
              onChange={(event) => {
                setMesFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">Todos los meses</option>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {formatMonth(option)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-titulo" className={labelClass}>
              Título
            </label>
            <input
              id="filter-titulo"
              type="text"
              value={titulo}
              onChange={(event) => {
                setTitulo(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por título"
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setTitulo("");
                setPage(1);
              }}
              className="w-full rounded-xl border border-primary/15 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-surface"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </section>

      <section
        className={`mt-8 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-opacity ${
          loading ? "opacity-50" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 px-6 py-4">
          <h2 className="text-base font-bold text-primary">Pagos de Sidor</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
            {monthCount} {monthCount === 1 ? "registro" : "registros"}
            {mes ? ` · ${mes}` : ""}
          </span>
        </div>

        <div className="divide-y divide-black/5 lg:hidden">
          {visibleRecords.length === 0 && !loading ? (
            <p className="px-4 py-8 text-center text-sm font-normal text-muted">
              No hay registros para los filtros seleccionados
            </p>
          ) : (
            visibleRecords.map((record) => (
              <article key={record.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 truncate text-sm font-bold text-primary">
                    {record.titulo}
                  </h3>
                  <RecordActions
                    onEdit={() => openEdit(record)}
                    onDelete={() => openDelete(record)}
                  />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <dt className="text-xs font-normal text-muted">Monto</dt>
                    <dd className="text-sm font-bold text-primary">
                      {formatCurrency(Number(record.monto ?? 0))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-normal text-muted">Mes</dt>
                    <dd className="text-sm font-normal text-primary">
                      {record.mes}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-normal text-muted">
                      Fecha de pago
                    </dt>
                    <dd className="text-sm font-normal text-primary">
                      {formatDeliveryDate(record.fecha_pago)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[720px] text-left text-sm font-normal">
            <thead>
              <tr className="border-b border-black/5 text-muted">
                <th className="px-4 py-3 font-bold">Título</th>
                <th className="px-4 py-3 font-bold">Monto</th>
                <th className="px-4 py-3 font-bold">Mes</th>
                <th className="px-4 py-3 font-bold">Fecha de pago</th>
                <th className="px-4 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No hay registros para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-4 py-3 text-primary">{record.titulo}</td>
                    <td className="px-4 py-3 font-bold text-primary">
                      {formatCurrency(Number(record.monto ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-muted">{record.mes}</td>
                    <td className="px-4 py-3 text-muted">
                      {formatDeliveryDate(record.fecha_pago)}
                    </td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onEdit={() => openEdit(record)}
                        onDelete={() => openDelete(record)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 px-6 py-4">
          <p className="text-sm font-normal text-muted">
            Mostrando {records.length === 0 ? 0 : startIndex + 1}–
            {Math.min(startIndex + PAGE_SIZE, records.length)} de{" "}
            {records.length} registros
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
              className="rounded-full border border-primary/15 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm font-bold text-primary">
              Página {safePage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="rounded-full border border-primary/15 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar formulario"
            className="absolute inset-0 bg-black/40"
            onClick={closeForm}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">
                {editingId !== null ? "Editar pago" : "Nuevo pago"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Cerrar formulario"
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="form-titulo" className={labelClass}>
                  Título
                </label>
                <input
                  id="form-titulo"
                  type="text"
                  list="sidor-titulos"
                  value={form.titulo}
                  onChange={(event) =>
                    setForm({ ...form, titulo: event.target.value })
                  }
                  placeholder="Selecciona o escribe un título"
                  maxLength={100}
                  required
                  className={inputClass}
                />
                <datalist id="sidor-titulos">
                  {SIDOR_TITULOS.map((titulo) => (
                    <option key={titulo} value={titulo} />
                  ))}
                </datalist>
                <p className="mt-1.5 text-xs font-normal text-muted">
                  Elige una opción de la lista o escribe otro título.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="form-monto" className={labelClass}>
                    Monto
                  </label>
                  <input
                    id="form-monto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto}
                    onChange={(event) =>
                      setForm({ ...form, monto: event.target.value })
                    }
                    placeholder="0.00"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="form-fecha-pago" className={labelClass}>
                    Fecha de pago
                  </label>
                  <input
                    id="form-fecha-pago"
                    type="date"
                    value={form.fecha_pago}
                    onChange={(event) =>
                      setForm({ ...form, fecha_pago: event.target.value })
                    }
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="form-mes" className={labelClass}>
                  Mes
                </label>
                <input
                  id="form-mes"
                  type="text"
                  value={
                    form.fecha_pago
                      ? (getMonthNameFromDate(form.fecha_pago) ?? "")
                      : ""
                  }
                  readOnly
                  placeholder="Se toma de la fecha de pago"
                  className={`${inputClass} cursor-not-allowed bg-surface text-muted`}
                />
              </div>

              {formError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full border border-primary/15 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {saving
                    ? "Guardando..."
                    : editingId !== null
                      ? "Guardar cambios"
                      : "Guardar pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            className="absolute inset-0 bg-black/40"
            onClick={closeDelete}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-primary">Eliminar pago</h2>
            <p className="mt-2 text-sm font-normal leading-6 text-muted">
              ¿Seguro que deseas eliminar{" "}
              <span className="font-bold text-primary">
                {deletingRecord.titulo}
              </span>
              ? Esta acción no se puede deshacer.
            </p>

            {deleteError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDelete}
                className="rounded-full border border-primary/15 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
