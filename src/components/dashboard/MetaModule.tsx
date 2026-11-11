"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate, getTodayIso } from "@/lib/format";
import type { MetaItem, MetasResponse } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-normal text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40";

const labelClass = "mb-1.5 block text-sm font-bold text-primary";

interface FormState {
  nombre: string;
  precio: string;
  fecha_compra: string;
  completado: boolean;
}

const initialForm: FormState = {
  nombre: "",
  precio: "",
  fecha_compra: "",
  completado: false,
};

interface ItemActionsProps {
  item: MetaItem;
  toggling: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ItemActions({
  item,
  toggling,
  onToggle,
  onEdit,
  onDelete,
}: ItemActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={toggling}
        className={
          item.completado
            ? "rounded-full border border-primary/15 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            : "rounded-full bg-secondary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {toggling
          ? "Guardando..."
          : item.completado
            ? "Marcar pendiente"
            : "Marcar comprada"}
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Editar meta"
        title="Editar"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-primary"
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
        aria-label="Eliminar meta"
        title="Eliminar"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-600"
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

function StatusBadge({ completado }: { completado: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        completado
          ? "bg-secondary/10 text-secondary"
          : "bg-accent/20 text-primary"
      }`}
    >
      {completado ? "Completada" : "Pendiente"}
    </span>
  );
}

export default function MetaModule() {
  const [items, setItems] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [deletingItem, setDeletingItem] = useState<MetaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/metas");
      if (!res.ok) throw new Error();
      const data: MetasResponse = await res.json();
      setItems(data.items);
      setError(null);
    } catch {
      setError("Error al cargar las metas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const summary = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.precio, 0);
    const completed = items.filter((item) => item.completado).length;
    return {
      count: items.length,
      total,
      completed,
      pending: items.length - completed,
    };
  }, [items]);

  function openCreate() {
    setForm({ ...initialForm, fecha_compra: getTodayIso() });
    setFormError(null);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item: MetaItem) {
    setForm({
      nombre: item.nombre,
      precio: String(item.precio),
      fecha_compra: item.fecha_compra,
      completado: item.completado,
    });
    setFormError(null);
    setEditingId(item.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function openDelete(item: MetaItem) {
    setDeleteError(null);
    setDeletingItem(item);
  }

  function closeDelete() {
    setDeletingItem(null);
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/metas/${deletingItem.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error ?? "Error al eliminar la meta");
        return;
      }
      closeDelete();
      await fetchData();
    } catch {
      setDeleteError("Error al eliminar la meta");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle(item: MetaItem) {
    setTogglingId(item.id);
    setError(null);
    try {
      const res = await fetch(`/api/metas/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completado: !item.completado }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al actualizar la meta");
        return;
      }
      await fetchData();
    } catch {
      setError("Error al actualizar la meta");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const isEditing = editingId !== null;
      const res = await fetch(
        isEditing ? `/api/metas/${editingId}` : "/api/metas",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre,
            precio: Number(form.precio),
            fecha_compra: form.fecha_compra,
            completado: form.completado,
          }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Error al guardar la meta");
        return;
      }
      closeForm();
      await fetchData();
    } catch {
      setFormError("Error al guardar la meta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
            Módulo 5
          </span>
          <h1 className="mt-4 text-3xl font-bold text-primary">Meta</h1>
          <p className="mt-2 text-base font-normal text-muted">
            Anota los productos que quieres comprar, controla el total y marca
            lo que ya conseguiste.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="w-full rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          Nuevo producto
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm font-normal text-muted">Artículos</p>
          <p className="mt-3 text-2xl font-bold text-primary">{summary.count}</p>
          <p className="mt-1 text-xs font-normal text-muted">
            {summary.pending}{" "}
            {summary.pending === 1 ? "pendiente" : "pendientes"} por comprar
          </p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm font-normal text-muted">Total estimado</p>
          <p className="mt-3 text-2xl font-bold text-primary">
            {formatCurrency(summary.total)}
          </p>
          <p className="mt-1 text-xs font-normal text-muted">
            Suma de todos los productos de la lista
          </p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm font-normal text-muted">Completadas</p>
          <p className="mt-3 text-2xl font-bold text-secondary">
            {summary.completed}
          </p>
          <p className="mt-1 text-xs font-normal text-muted">
            De {summary.count}{" "}
            {summary.count === 1 ? "producto" : "productos"} en la lista
          </p>
        </article>
      </section>

      <section
        className={`mt-8 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-opacity ${
          loading ? "opacity-50" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 px-6 py-4">
          <h2 className="text-base font-bold text-primary">Lista de metas</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
            {summary.count} {summary.count === 1 ? "producto" : "productos"}
          </span>
        </div>

        <div className="divide-y divide-black/5 lg:hidden">
          {items.length === 0 && !loading ? (
            <p className="px-4 py-8 text-center text-sm font-normal text-muted">
              Todavía no hay productos en tu lista de metas.
            </p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <h3
                    className={`min-w-0 truncate text-sm font-bold ${
                      item.completado
                        ? "text-muted line-through"
                        : "text-primary"
                    }`}
                  >
                    {item.nombre}
                  </h3>
                  <StatusBadge completado={item.completado} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <dt className="text-xs font-normal text-muted">Precio</dt>
                    <dd className="text-sm font-bold text-primary">
                      {formatCurrency(item.precio)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-normal text-muted">
                      Fecha de compra
                    </dt>
                    <dd className="text-sm font-normal text-primary">
                      {formatDate(item.fecha_compra)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3">
                  <ItemActions
                    item={item}
                    toggling={togglingId === item.id}
                    onToggle={() => void handleToggle(item)}
                    onEdit={() => openEdit(item)}
                    onDelete={() => openDelete(item)}
                  />
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[720px] text-left text-sm font-normal">
            <thead>
              <tr className="border-b border-black/5 text-muted">
                <th className="px-4 py-3 font-bold">Producto</th>
                <th className="px-4 py-3 font-bold">Precio</th>
                <th className="px-4 py-3 font-bold">Fecha de compra</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Todavía no hay productos en tu lista de metas.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          item.completado
                            ? "text-muted line-through"
                            : "text-primary"
                        }`}
                      >
                        {item.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">
                      {formatCurrency(item.precio)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(item.fecha_compra)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge completado={item.completado} />
                    </td>
                    <td className="px-4 py-3">
                      <ItemActions
                        item={item}
                        toggling={togglingId === item.id}
                        onToggle={() => void handleToggle(item)}
                        onEdit={() => openEdit(item)}
                        onDelete={() => openDelete(item)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                {editingId !== null ? "Editar meta" : "Nueva meta"}
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
                <label htmlFor="meta-nombre" className={labelClass}>
                  Producto
                </label>
                <input
                  id="meta-nombre"
                  type="text"
                  value={form.nombre}
                  onChange={(event) =>
                    setForm({ ...form, nombre: event.target.value })
                  }
                  placeholder="Ej. Audífonos inalámbricos"
                  maxLength={150}
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="meta-precio" className={labelClass}>
                    Precio
                  </label>
                  <input
                    id="meta-precio"
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
                  <label htmlFor="meta-fecha" className={labelClass}>
                    Fecha de compra
                  </label>
                  <input
                    id="meta-fecha"
                    type="date"
                    value={form.fecha_compra}
                    onChange={(event) =>
                      setForm({ ...form, fecha_compra: event.target.value })
                    }
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.completado}
                  onChange={(event) =>
                    setForm({ ...form, completado: event.target.checked })
                  }
                  className="h-4 w-4 accent-secondary"
                />
                <span className="text-sm font-bold text-primary">
                  Ya la compré
                </span>
              </label>

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
                      : "Guardar producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            className="absolute inset-0 bg-black/40"
            onClick={closeDelete}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-primary">Eliminar meta</h2>
            <p className="mt-2 text-sm font-normal leading-6 text-muted">
              ¿Seguro que deseas eliminar{" "}
              <span className="font-bold text-primary">
                {deletingItem.nombre}
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
