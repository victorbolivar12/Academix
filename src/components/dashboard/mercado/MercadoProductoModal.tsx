"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { MERCADO_UNIDADES } from "@/lib/mercado";
import type {
  MercadoCategoria,
  MercadoProducto,
  MercadoTienda,
} from "@/lib/types";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./mercado-ui";

interface PriceRow {
  key: string;
  id: number | null;
  tienda_id: string;
  precio: string;
}

const NONE_STORE_KEY = "__none__";

function storeKey(storeId: string): string {
  return storeId === "" ? NONE_STORE_KEY : storeId;
}

interface MercadoProductoModalProps {
  product: MercadoProducto | null;
  categorias: MercadoCategoria[];
  tiendas: MercadoTienda[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function createRow(): PriceRow {
  return {
    key: `new-${Math.random().toString(36).slice(2)}`,
    id: null,
    tienda_id: "",
    precio: "",
  };
}

export default function MercadoProductoModal({
  product,
  categorias,
  tiendas,
  onClose,
  onSaved,
}: MercadoProductoModalProps) {
  const [nombre, setNombre] = useState(product?.nombre ?? "");
  const [categoriaId, setCategoriaId] = useState(
    product ? String(product.categoria_id) : "",
  );
  const [unidad, setUnidad] = useState(product?.unidad ?? "unidad");
  const [priceRows, setPriceRows] = useState<PriceRow[]>(
    product
      ? product.precios.map((price) => ({
          key: `price-${price.id}`,
          id: price.id,
          tienda_id: price.tienda_id === null ? "" : String(price.tienda_id),
          precio: String(price.precio),
        }))
      : [],
  );
  const [deletedPriceIds, setDeletedPriceIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedStores = new Set(
    priceRows.map((row) => storeKey(row.tienda_id)),
  );
  const canAddPrice =
    !usedStores.has(NONE_STORE_KEY) ||
    tiendas.some((store) => !usedStores.has(String(store.id)));

  function updateRow(key: string, patch: Partial<PriceRow>) {
    setPriceRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function updateRowStore(row: PriceRow, storeId: string) {
    if (row.id !== null && row.tienda_id !== storeId) {
      setDeletedPriceIds((current) => [...current, row.id as number]);
      setPriceRows((current) =>
        current.map((item) =>
          item.key === row.key
            ? { ...item, id: null, tienda_id: storeId }
            : item,
        ),
      );
      return;
    }
    updateRow(row.key, { tienda_id: storeId });
  }

  function removeRow(row: PriceRow) {
    if (row.id !== null) {
      setDeletedPriceIds((current) => [...current, row.id as number]);
    }
    setPriceRows((current) => current.filter((item) => item.key !== row.key));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    if (!categoriaId) {
      setError("Selecciona una categoría.");
      return;
    }

    const rowsToSave = priceRows.filter(
      (row) => row.tienda_id !== "" || row.precio.trim() !== "",
    );
    const selectedStores = new Set<string>();
    for (const row of rowsToSave) {
      if (row.precio.trim() === "") {
        setError("Escribe el precio de cada fila.");
        return;
      }
      const key = storeKey(row.tienda_id);
      if (selectedStores.has(key)) {
        setError(
          row.tienda_id === ""
            ? "Solo puede haber un precio sin tienda."
            : "No repitas la misma tienda en los precios.",
        );
        return;
      }
      selectedStores.add(key);
      const price = Number(row.precio);
      if (!Number.isFinite(price) || price < 0) {
        setError("Cada precio debe ser un número válido mayor o igual a 0.");
        return;
      }
    }

    setSaving(true);
    try {
      const isEditing = product !== null;
      const response = await fetch(
        product ? `/api/mercado/productos/${product.id}` : "/api/mercado/productos",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombre.trim(),
            categoria_id: Number(categoriaId),
            unidad,
            activo: true,
          }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        id?: number;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Error al guardar el producto");
      }

      const productId = product ? product.id : data.id;
      if (!productId) {
        throw new Error("Error al guardar el producto");
      }

      for (const priceId of deletedPriceIds) {
        const deleteResponse = await fetch(`/api/mercado/precios/${priceId}`, {
          method: "DELETE",
        });
        if (!deleteResponse.ok) {
          const deleteData = (await deleteResponse.json()) as {
            error?: string;
          };
          throw new Error(
            deleteData.error ?? "Error al eliminar un precio del producto",
          );
        }
      }

      for (const row of rowsToSave) {
        const priceResponse = await fetch(
          `/api/mercado/productos/${productId}/precios`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tienda_id: row.tienda_id === "" ? null : Number(row.tienda_id),
              precio: Number(row.precio),
            }),
          },
        );
        if (!priceResponse.ok) {
          const priceData = (await priceResponse.json()) as { error?: string };
          throw new Error(
            priceData.error ?? "Error al guardar uno de los precios",
          );
        }
      }

      await onSaved();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Error al guardar el producto",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar formulario"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">
            {product ? "Editar producto" : "Nuevo producto"}
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="producto-nombre" className={labelClass}>
              Nombre
            </label>
            <input
              id="producto-nombre"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Pollo entero"
              maxLength={150}
              required
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="producto-categoria" className={labelClass}>
                Categoría
              </label>
              <select
                id="producto-categoria"
                value={categoriaId}
                onChange={(event) => setCategoriaId(event.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="producto-unidad" className={labelClass}>
                Unidad
              </label>
              <select
                id="producto-unidad"
                value={unidad}
                onChange={(event) => setUnidad(event.target.value)}
                className={inputClass}
              >
                {MERCADO_UNIDADES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-black/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-primary">Precios</p>
                <p className="text-xs font-normal text-muted">
                  Guarda un precio base o el de cada tienda.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPriceRows((current) => [...current, createRow()])
                }
                disabled={!canAddPrice}
                className="rounded-full border border-primary/15 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                Agregar precio
              </button>
            </div>

            {priceRows.length === 0 ? (
              <p className="mt-3 rounded-xl bg-surface px-4 py-3 text-sm font-normal text-muted">
                Este producto todavía no tiene precios. Puedes guardar un
                precio sin tienda y asignarlo después.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {priceRows.map((row) => (
                  <div
                    key={row.key}
                    className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_40px]"
                  >
                    <select
                      value={row.tienda_id}
                      onChange={(event) =>
                        updateRowStore(row, event.target.value)
                      }
                      aria-label="Tienda"
                      className={inputClass}
                    >
                      <option
                        value=""
                        disabled={
                          usedStores.has(NONE_STORE_KEY) &&
                          row.tienda_id !== ""
                        }
                      >
                        Sin tienda
                      </option>
                      {tiendas.map((store) => (
                        <option
                          key={store.id}
                          value={store.id}
                          disabled={
                            usedStores.has(String(store.id)) &&
                            row.tienda_id !== String(store.id)
                          }
                        >
                          {store.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.precio}
                      onChange={(event) =>
                        updateRow(row.key, { precio: event.target.value })
                      }
                      placeholder="0.00"
                      aria-label="Precio"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(row)}
                      aria-label="Quitar precio"
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-red-50 hover:text-red-600"
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
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(() => {
              const validPrices = priceRows
                .filter((row) => row.precio.trim() !== "")
                .map((row) => Number(row.precio))
                .filter((price) => Number.isFinite(price) && price >= 0);
              return validPrices.length > 0 ? (
                <p className="mt-3 text-xs font-normal text-muted">
                  Precio más bajo: {formatCurrency(Math.min(...validPrices))}
                </p>
              ) : null;
            })()}
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={secondaryButtonClass}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={primaryButtonClass}
            >
              {saving ? "Guardando..." : "Guardar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
