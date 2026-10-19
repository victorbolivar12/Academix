"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { parseAcademixMessage } from "@/lib/academix";
import {
  emptySubscribe,
  formatCurrency,
  formatDeliveryDate,
  formatMonth,
  getCurrentMonth,
  getEmptyValue,
} from "@/lib/format";
import type { AcademixListResponse, AcademixRecord, AcademixStats } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-normal text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40";

const labelClass = "mb-1.5 block text-sm font-bold text-primary";

const PAGE_SIZE = 10;

const emptyStats: AcademixStats = {
  acumulado: 0,
  ganancia: 0,
  totalAcademia: 0,
  totalGanancia: 0,
};

interface FormState {
  codigo: string;
  titulo: string;
  fecha_entrega_real: string;
  precio: string;
  estado: string;
  estado_pago: string;
}

const initialForm: FormState = {
  codigo: "",
  titulo: "",
  fecha_entrega_real: "",
  precio: "",
  estado: "Pendiente",
  estado_pago: "Pendiente",
};

function formatStatus(value: string | null): {
  label: string;
  className: string;
} {
  if (!value) {
    return { label: "—", className: "bg-surface text-muted" };
  }
  const normalized = value.toLowerCase();
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  if (normalized === "listo") {
    return { label, className: "bg-secondary/10 text-secondary" };
  }
  if (normalized === "pendiente") {
    return { label, className: "bg-accent/20 text-primary" };
  }
  return { label, className: "bg-primary/10 text-primary" };
}

interface RecordActionsProps {
  estado: string | null;
  estadoPago: string | null;
  busy?: boolean;
  onToggleEstado: () => void;
  onTogglePago: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function RecordActions({
  estado,
  estadoPago,
  busy = false,
  onToggleEstado,
  onTogglePago,
  onEdit,
  onDelete,
}: RecordActionsProps) {
  const estadoIsListo = (estado ?? "").toLowerCase() === "listo";
  const pagoIsListo = (estadoPago ?? "").toLowerCase() === "listo";

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onToggleEstado}
        disabled={busy}
        aria-label={
          estadoIsListo
            ? "Marcar estado como pendiente"
            : "Marcar estado como listo"
        }
        title={
          estadoIsListo
            ? "Marcar estado como pendiente"
            : "Marcar estado como listo"
        }
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          estadoIsListo
            ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
            : "text-muted hover:bg-surface hover:text-secondary"
        }`}
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
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onTogglePago}
        disabled={busy}
        aria-label={
          pagoIsListo
            ? "Marcar pago como pendiente"
            : "Marcar pago como listo"
        }
        title={
          pagoIsListo
            ? "Marcar pago como pendiente"
            : "Marcar pago como listo"
        }
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          pagoIsListo
            ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
            : "text-muted hover:bg-surface hover:text-secondary"
        }`}
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
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v10" />
          <path d="M15 9.5a2.5 2.5 0 0 0-2.5-2.5h-1a2.5 2.5 0 0 0 0 5h1a2.5 2.5 0 0 1 0 5h-1A2.5 2.5 0 0 1 9 14.5" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Editar registro"
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
        aria-label="Eliminar registro"
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

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // continúa con el método alternativo
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function CopyCodeButton({
  value,
  label = "código",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copiar ${label}`}
      title={copied ? "Copiado" : `Copiar ${label}`}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
        copied
          ? "text-secondary"
          : "text-muted hover:bg-surface hover:text-primary"
      }`}
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
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
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function AcademixModule() {
  const [records, setRecords] = useState<AcademixRecord[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [monthCount, setMonthCount] = useState(0);
  const [stats, setStats] = useState<AcademixStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = useSyncExternalStore(
    emptySubscribe,
    getCurrentMonth,
    getEmptyValue,
  );
  const [mesFilter, setMesFilter] = useState<string | undefined>(undefined);
  const mes = mesFilter ?? currentMonth;
  const [codigo, setCodigo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [payingMonth, setPayingMonth] = useState(false);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  const [deletingRecord, setDeletingRecord] = useState<AcademixRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (mes) params.set("mes", mes);
      if (codigo.trim()) params.set("codigo", codigo.trim());
      if (titulo.trim()) params.set("titulo", titulo.trim());
      if (fecha) params.set("fecha", fecha);

      const query = params.toString();
      const res = await fetch(`/api/academix${query ? `?${query}` : ""}`);
      if (!res.ok) throw new Error();
      const data: AcademixListResponse = await res.json();
      setRecords(data.records);
      setMonths(data.months);
      setMonthCount(data.monthCount);
      setStats(data.stats);
      setError(null);
    } catch {
      setError("Error al cargar los datos de Academix");
    } finally {
      setLoading(false);
    }
  }, [mes, codigo, titulo, fecha]);

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

  const precioNumber = Number(form.precio);
  const porcentajePreview =
    Number.isFinite(precioNumber) && precioNumber >= 0 ? precioNumber * 0.75 : 0;

  function openForm() {
    setForm(initialForm);
    setFormError(null);
    setEditingId(null);
    setMessage("");
    setMessageError(null);
    setShowForm(true);
  }

  function openEdit(record: AcademixRecord) {
    setForm({
      codigo: record.codigo ?? "",
      titulo: record.titulo ?? "",
      fecha_entrega_real: record.fecha_entrega_real ?? "",
      precio: record.precio ?? "",
      estado: record.estado || "Pendiente",
      estado_pago: record.estado_pago || "Pendiente",
    });
    setFormError(null);
    setEditingId(record.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function handleParseMessage() {
    const parsed = parseAcademixMessage(message);
    if (
      !parsed.titulo &&
      !parsed.codigo &&
      !parsed.precio &&
      !parsed.fecha_entrega_real
    ) {
      setMessageError("No se reconocieron datos en el mensaje");
      return;
    }
    setForm({
      codigo: parsed.codigo ?? "",
      titulo: parsed.titulo ?? "",
      fecha_entrega_real: parsed.fecha_entrega_real ?? "",
      precio: parsed.precio ?? "",
      estado: form.estado,
      estado_pago: form.estado_pago,
    });
    setMessageError(null);
  }

  function openDelete(record: AcademixRecord) {
    setDeleteError(null);
    setDeletingRecord(record);
  }

  function closeDelete() {
    setDeletingRecord(null);
  }

  async function handleToggleStatus(
    record: AcademixRecord,
    field: "estado" | "estado_pago",
  ) {
    const current = field === "estado" ? record.estado : record.estado_pago;
    const next =
      (current ?? "").toLowerCase() === "listo" ? "Pendiente" : "Listo";
    setUpdatingId(record.id);
    setError(null);
    try {
      const res = await fetch(`/api/academix/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) {
        setError("Error al actualizar el estado del registro");
        return;
      }
      await fetchData();
    } catch {
      setError("Error al actualizar el estado del registro");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handlePayMonth() {
    if (!mes) return;
    setPayingMonth(true);
    setError(null);
    setPayMessage(null);
    try {
      const res = await fetch("/api/academix/pagar-mes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes }),
      });
      const data = (await res.json()) as { updated?: number; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al marcar los pagos del mes");
        return;
      }
      const updated = data.updated ?? 0;
      setPayMessage(
        updated > 0
          ? `${updated} ${updated === 1 ? "registro marcado" : "registros marcados"} como pagados`
          : "No hay registros listos pendientes de pago en este mes",
      );
      await fetchData();
    } catch {
      setError("Error al marcar los pagos del mes");
    } finally {
      setPayingMonth(false);
    }
  }

  async function handleDelete() {
    if (!deletingRecord) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/academix/${deletingRecord.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error ?? "Error al eliminar el registro");
        return;
      }
      closeDelete();
      await fetchData();
    } catch {
      setDeleteError("Error al eliminar el registro");
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
        isEditing ? `/api/academix/${editingId}` : "/api/academix",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: form.codigo,
            titulo: form.titulo,
            fecha_entrega_real: form.fecha_entrega_real,
            precio: precioNumber,
            estado: form.estado,
            estado_pago: form.estado_pago,
          }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Error al guardar el registro");
        return;
      }
      closeForm();
      await fetchData();
    } catch {
      setFormError("Error al guardar el registro");
    } finally {
      setSaving(false);
    }
  }

  const cards = [
    {
      label: "Acumulado",
      value: formatCurrency(stats.acumulado),
      description: "Entregados con pago pendiente",
      copyText: `Balance: ${formatCurrency(stats.acumulado)}`,
    },
    {
      label: "Ganancia",
      value: formatCurrency(stats.ganancia),
      description: "Acumulado menos 25%",
      copyText: null,
    },
    {
      label: "Total de Academia",
      value: formatCurrency(stats.totalAcademia),
      description: "Entregados y pagados",
      copyText: null,
    },
    {
      label: "Total de Ganancia",
      value: formatCurrency(stats.totalGanancia),
      description: "Total de Academia menos 25%",
      copyText: null,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-accent/20 px-4 py-1 text-sm font-bold text-primary">
            Módulo 2
          </span>
          <h1 className="mt-4 text-3xl font-bold text-primary">Academix</h1>
          <p className="mt-2 text-base font-normal text-muted">
            Gestión de trabajos, entregas y pagos de Academix.
          </p>
        </div>
        <button
          type="button"
          onClick={openForm}
          className="w-full rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          Nuevo registro
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-normal text-muted">{card.label}</p>
            <p className="mt-3 flex items-center gap-2 text-2xl font-bold text-primary">
              {card.value}
              {card.copyText && (
                <CopyCodeButton value={card.copyText} label="balance" />
              )}
            </p>
            <p className="mt-1 text-xs font-normal text-muted">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                setPayMessage(null);
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
            <label htmlFor="filter-codigo" className={labelClass}>
              Código
            </label>
            <input
              id="filter-codigo"
              type="text"
              value={codigo}
              onChange={(event) => {
                setCodigo(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por código"
              className={inputClass}
            />
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
          <div>
            <label htmlFor="filter-fecha" className={labelClass}>
              Fecha de entrega
            </label>
            <input
              id="filter-fecha"
              type="date"
              value={fecha}
              onChange={(event) => {
                setFecha(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setCodigo("");
                setTitulo("");
                setFecha("");
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
          <h2 className="text-base font-bold text-primary">
            Registros de Academix
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              {monthCount} {monthCount === 1 ? "registro" : "registros"}
              {mes ? ` · ${formatMonth(mes)}` : ""}
            </span>
            <button
              type="button"
              onClick={() => void handlePayMonth()}
              disabled={payingMonth || !mes}
              title={
                mes
                  ? "Marca como pagados los registros listos y pendientes de pago de este mes"
                  : "Selecciona un mes específico para usar esta acción"
              }
              className="rounded-full bg-secondary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {payingMonth ? "Marcando..." : "PAGADOS"}
            </button>
          </div>
        </div>
        {payMessage && (
          <p className="border-b border-black/5 bg-secondary/5 px-6 py-2 text-sm font-normal text-secondary">
            {payMessage}
          </p>
        )}

        <div className="divide-y divide-black/5 lg:hidden">
          {visibleRecords.length === 0 && !loading ? (
            <p className="px-4 py-8 text-center text-sm font-normal text-muted">
              No hay registros para los filtros seleccionados
            </p>
          ) : (
            visibleRecords.map((record) => {
              const estado = formatStatus(record.estado);
              const estadoPago = formatStatus(record.estado_pago);
              return (
                <article key={record.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-xs font-normal text-muted">
                          {record.codigo || "Sin código"}
                        </span>
                        {record.codigo && (
                          <CopyCodeButton value={record.codigo} />
                        )}
                      </div>
                      <h3 className="truncate text-sm font-bold text-primary">
                        {record.titulo}
                      </h3>
                    </div>
                    <RecordActions
                      estado={record.estado}
                      estadoPago={record.estado_pago}
                      busy={updatingId === record.id}
                      onToggleEstado={() =>
                        void handleToggleStatus(record, "estado")
                      }
                      onTogglePago={() =>
                        void handleToggleStatus(record, "estado_pago")
                      }
                      onEdit={() => openEdit(record)}
                      onDelete={() => openDelete(record)}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-normal text-muted">
                      Estado:
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${estado.className}`}
                    >
                      {estado.label}
                    </span>
                    <span className="text-xs font-normal text-muted">Pago:</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${estadoPago.className}`}
                    >
                      {estadoPago.label}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <dt className="text-xs font-normal text-muted">Precio</dt>
                      <dd className="text-sm font-bold text-primary">
                        {formatCurrency(Number(record.precio ?? 0))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-normal text-muted">
                        Porcentaje
                      </dt>
                      <dd className="text-sm font-bold text-primary">
                        {formatCurrency(Number(record.porcentaje ?? 0))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-normal text-muted">
                        Fecha de entrega
                      </dt>
                      <dd className="text-sm font-normal text-primary">
                        {formatDeliveryDate(record.fecha_entrega_real)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-normal text-muted">
                        Mes de registro
                      </dt>
                      <dd className="text-sm font-normal text-primary">
                        {formatMonth(record.mes_registro)}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] text-left text-sm font-normal">
            <thead>
              <tr className="border-b border-black/5 text-muted">
                <th className="px-4 py-3 font-bold">Código</th>
                <th className="px-4 py-3 font-bold">Título</th>
                <th className="px-4 py-3 font-bold">Fecha de entrega</th>
                <th className="px-4 py-3 font-bold">Precio</th>
                <th className="px-4 py-3 font-bold">Porcentaje</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 font-bold">Estado de pago</th>
                <th className="px-4 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-muted"
                  >
                    No hay registros para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => {
                  const estado = formatStatus(record.estado);
                  const estadoPago = formatStatus(record.estado_pago);
                  return (
                    <tr
                      key={record.id}
                      className="border-b border-black/5 last:border-0"
                    >
                      <td className="px-4 py-3 text-muted">
                        {record.codigo ? (
                          <span className="flex items-center gap-1">
                            {record.codigo}
                            <CopyCodeButton value={record.codigo} />
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-primary">{record.titulo}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatDeliveryDate(record.fecha_entrega_real)}
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">
                        {formatCurrency(Number(record.precio ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatCurrency(Number(record.porcentaje ?? 0))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${estado.className}`}
                        >
                          {estado.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${estadoPago.className}`}
                        >
                          {estadoPago.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RecordActions
                          estado={record.estado}
                          estadoPago={record.estado_pago}
                          busy={updatingId === record.id}
                          onToggleEstado={() =>
                            void handleToggleStatus(record, "estado")
                          }
                          onTogglePago={() =>
                            void handleToggleStatus(record, "estado_pago")
                          }
                          onEdit={() => openEdit(record)}
                          onDelete={() => openDelete(record)}
                        />
                      </td>
                    </tr>
                  );
                })
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
                {editingId !== null ? "Editar registro" : "Nuevo registro"}
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
              {editingId === null && (
                <div className="rounded-xl border border-dashed border-primary/20 bg-surface/60 p-4">
                  <label htmlFor="form-mensaje" className={labelClass}>
                    Pegar mensaje (opcional)
                  </label>
                  <textarea
                    id="form-mensaje"
                    rows={5}
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setMessageError(null);
                    }}
                    placeholder={
                      "Agendado 🤝 tarea\nValor: 8$\nFecha: 19/10\nHora: 5pm\nCódigo: 191026vbt-13 ✅"
                    }
                    className={`${inputClass} resize-y`}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-normal text-muted">
                      Se completan título, valor, fecha y código.
                    </p>
                    <button
                      type="button"
                      onClick={handleParseMessage}
                      className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Autocompletar campos
                    </button>
                  </div>
                  {messageError && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      {messageError}
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="form-codigo" className={labelClass}>
                    Código (opcional)
                  </label>
                  <input
                    id="form-codigo"
                    type="text"
                    value={form.codigo}
                    onChange={(event) =>
                      setForm({ ...form, codigo: event.target.value })
                    }
                    placeholder="Ej. TRB-001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="form-fecha" className={labelClass}>
                    Fecha de entrega
                  </label>
                  <input
                    id="form-fecha"
                    type="date"
                    value={form.fecha_entrega_real}
                    onChange={(event) =>
                      setForm({ ...form, fecha_entrega_real: event.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="form-titulo" className={labelClass}>
                  Título
                </label>
                <input
                  id="form-titulo"
                  type="text"
                  value={form.titulo}
                  onChange={(event) =>
                    setForm({ ...form, titulo: event.target.value })
                  }
                  placeholder="Nombre del trabajo"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="form-precio" className={labelClass}>
                    Precio
                  </label>
                  <input
                    id="form-precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={(event) =>
                      setForm({ ...form, precio: event.target.value })
                    }
                    placeholder="0.00"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="form-porcentaje" className={labelClass}>
                    Porcentaje (precio − 25%)
                  </label>
                  <input
                    id="form-porcentaje"
                    type="text"
                    value={formatCurrency(porcentajePreview)}
                    readOnly
                    className={`${inputClass} cursor-not-allowed bg-surface text-muted`}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="form-estado" className={labelClass}>
                    Estado
                  </label>
                  <select
                    id="form-estado"
                    value={form.estado}
                    onChange={(event) =>
                      setForm({ ...form, estado: event.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Listo">Listo</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="form-estado-pago" className={labelClass}>
                    Estado de pago
                  </label>
                  <select
                    id="form-estado-pago"
                    value={form.estado_pago}
                    onChange={(event) =>
                      setForm({ ...form, estado_pago: event.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Listo">Listo</option>
                  </select>
                </div>
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
                      : "Guardar registro"}
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
            <h2 className="text-lg font-bold text-primary">
              Eliminar registro
            </h2>
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
