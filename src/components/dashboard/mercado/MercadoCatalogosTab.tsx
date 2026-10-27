"use client";

import { useState } from "react";
import type { MercadoCatalogoResponse } from "@/lib/types";
import {
  dangerButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallSecondaryButtonClass,
} from "./mercado-ui";

interface CatalogItem {
  id: number;
  nombre: string;
}

interface CatalogSectionProps {
  title: string;
  description: string;
  endpoint: string;
  placeholder: string;
  items: CatalogItem[];
  onChanged: () => Promise<void>;
}

function CatalogSection({
  title,
  description,
  endpoint,
  placeholder,
  items,
  onChanged,
}: CatalogSectionProps) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState<CatalogItem | null>(null);
  const [deletingSaving, setDeletingSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) {
      setError("Escribe un nombre.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newName.trim() }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      setNewName("");
      await onChanged();
    } catch {
      setError("Error al guardar");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(item: CatalogItem) {
    setEditingId(item.id);
    setEditingName(item.nombre);
    setError(null);
  }

  async function handleSaveEdit() {
    if (editingId === null) return;
    if (!editingName.trim()) {
      setError("Escribe un nombre.");
      return;
    }
    setSavingEdit(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editingName.trim() }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Error al actualizar");
        return;
      }
      setEditingId(null);
      setEditingName("");
      await onChanged();
    } catch {
      setError("Error al actualizar");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingSaving(true);
    setDeleteError(null);
    try {
      const response = await fetch(`${endpoint}/${deleting.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setDeleteError(data.error ?? "Error al eliminar");
        return;
      }
      setDeleting(null);
      await onChanged();
    } catch {
      setDeleteError("Error al eliminar");
    } finally {
      setDeletingSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      <p className="mt-1 text-sm font-normal text-muted">{description}</p>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder={placeholder}
          maxLength={100}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={adding}
          className={`${primaryButtonClass} shrink-0 px-4 py-2.5`}
        >
          {adding ? "..." : "Agregar"}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 divide-y divide-black/5 rounded-xl border border-black/5">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm font-normal text-muted">
            Todavía no hay registros.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              {editingId === item.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  maxLength={100}
                  className={inputClass}
                />
              ) : (
                <span className="truncate text-sm font-normal text-primary">
                  {item.nombre}
                </span>
              )}

              <div className="flex shrink-0 items-center gap-1">
                {editingId === item.id ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className={smallSecondaryButtonClass}
                    >
                      {savingEdit ? "..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditingName("");
                        setError(null);
                      }}
                      className="rounded-full px-3 py-2 text-sm font-bold text-muted transition-colors hover:text-primary"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className={smallSecondaryButtonClass}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleting(item);
                      }}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleting(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-primary">Eliminar</h2>
            <p className="mt-2 text-sm font-normal leading-6 text-muted">
              ¿Seguro que deseas eliminar{" "}
              <span className="font-bold text-primary">{deleting.nombre}</span>?
            </p>

            {deleteError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingSaving}
                className={dangerButtonClass}
              >
                {deletingSaving ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface MercadoCatalogosTabProps {
  catalogo: MercadoCatalogoResponse;
  onChanged: () => Promise<void>;
}

export default function MercadoCatalogosTab({
  catalogo,
  onChanged,
}: MercadoCatalogosTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CatalogSection
        title="Categorías"
        description="Organiza los productos por tipo de compra."
        endpoint="/api/mercado/categorias"
        placeholder="Ej. Proteína"
        items={catalogo.categorias}
        onChanged={onChanged}
      />
      <CatalogSection
        title="Tiendas"
        description="Lugares donde puedes comprar y comparar precios."
        endpoint="/api/mercado/tiendas"
        placeholder="Ej. Mercado central"
        items={catalogo.tiendas}
        onChanged={onChanged}
      />
    </div>
  );
}
