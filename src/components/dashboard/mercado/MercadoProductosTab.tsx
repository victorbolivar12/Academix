"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import type {
  MercadoCatalogoResponse,
  MercadoProducto,
} from "@/lib/types";
import MercadoProductoModal from "./MercadoProductoModal";
import {
  dangerButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallSecondaryButtonClass,
} from "./mercado-ui";

interface MercadoProductosTabProps {
  catalogo: MercadoCatalogoResponse;
  onChanged: () => Promise<void>;
}

export default function MercadoProductosTab({
  catalogo,
  onChanged,
}: MercadoProductosTabProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<MercadoProducto | null>(null);
  const [deletingProduct, setDeletingProduct] =
    useState<MercadoProducto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const category = Number(categoryFilter);
    return catalogo.productos.filter((product) => {
      if (category > 0 && product.categoria_id !== category) return false;
      if (term && !product.nombre.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [catalogo.productos, categoryFilter, search]);

  function openCreate() {
    setEditingProduct(null);
    setShowModal(true);
  }

  function openEdit(product: MercadoProducto) {
    setEditingProduct(product);
    setShowModal(true);
  }

  async function handleDelete() {
    if (!deletingProduct) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(
        `/api/mercado/productos/${deletingProduct.id}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setDeleteError(data.error ?? "Error al eliminar el producto");
        return;
      }
      setDeletingProduct(null);
      await onChanged();
    } catch {
      setDeleteError("Error al eliminar el producto");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label htmlFor="productos-buscar" className={labelClass}>
              Buscar
            </label>
            <input
              id="productos-buscar"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre del producto"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="productos-categoria" className={labelClass}>
              Categoría
            </label>
            <select
              id="productos-categoria"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">Todas las categorías</option>
              {catalogo.categorias.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={openCreate}
              disabled={catalogo.categorias.length === 0}
              className={`${primaryButtonClass} w-full sm:w-auto`}
            >
              Nuevo producto
            </button>
          </div>
        </div>
        {catalogo.categorias.length === 0 && (
          <p className="mt-3 text-sm font-normal text-muted">
            Primero crea una categoría en la pestaña Catálogos para poder
            agregar productos.
          </p>
        )}
      </section>

      {filteredProducts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-normal text-muted">
            No hay productos que coincidan con la búsqueda.
          </p>
        </div>
      ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-primary">
                    {product.nombre}
                  </h2>
                  <p className="mt-1 text-xs font-normal text-muted">
                    {product.categoria_nombre} · {product.unidad}
                  </p>
                </div>
                {product.precios.length > 0 && (
                  <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                    {formatCurrency(product.precios[0].precio)}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {product.precios.length === 0 ? (
                  <p className="rounded-xl bg-surface px-3 py-2 text-xs font-normal text-muted">
                    Sin precios registrados
                  </p>
                ) : (
                  product.precios.map((price, index) => (
                    <div
                      key={price.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2"
                    >
                      <span className="truncate text-sm font-normal text-primary">
                        {price.tienda_nombre ?? "Sin tienda"}
                        {index === 0 && (
                          <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary">
                            Mejor
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-primary">
                        {formatCurrency(price.precio)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className={smallSecondaryButtonClass}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeletingProduct(product);
                  }}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {showModal && (
        <MercadoProductoModal
          product={editingProduct}
          categorias={catalogo.categorias}
          tiendas={catalogo.tiendas}
          onClose={() => setShowModal(false)}
          onSaved={onChanged}
        />
      )}

      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeletingProduct(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-primary">
              Eliminar producto
            </h2>
            <p className="mt-2 text-sm font-normal leading-6 text-muted">
              ¿Seguro que deseas eliminar{" "}
              <span className="font-bold text-primary">
                {deletingProduct.nombre}
              </span>
              ? También se eliminarán sus precios. Las listas guardadas
              conservarán el nombre y el precio usado.
            </p>

            {deleteError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
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
