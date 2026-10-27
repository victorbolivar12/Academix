"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { roundMoney } from "@/lib/mercado";
import type {
  MercadoCatalogoResponse,
  MercadoProducto,
} from "@/lib/types";
import MercadoPagoModal, {
  type PagoModalPayload,
} from "./MercadoPagoModal";
import MercadoSummaryCards from "./MercadoSummaryCards";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallPrimaryButtonClass,
} from "./mercado-ui";

interface CartItem {
  producto_id: number;
  nombre_producto: string;
  tienda_id: number | null;
  tienda_nombre: string | null;
  precio_unitario: number;
  cantidad: number;
  unidad: string;
  categoria_nombre: string;
}

interface MercadoListaTabProps {
  catalogo: MercadoCatalogoResponse;
  onSaved: () => Promise<void>;
}

export default function MercadoListaTab({
  catalogo,
  onSaved,
}: MercadoListaTabProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [budget, setBudget] = useState("");
  const [listName, setListName] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentMode, setPaymentMode] = useState<"completo" | "cachea" | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const productById = useMemo(
    () => new Map(catalogo.productos.map((product) => [product.id, product])),
    [catalogo.productos],
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const category = Number(categoryFilter);
    return catalogo.productos.filter((product) => {
      if (!product.activo) return false;
      if (category > 0 && product.categoria_id !== category) return false;
      if (term && !product.nombre.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [catalogo.productos, categoryFilter, search]);

  const total = roundMoney(
    cart.reduce(
      (sum, item) => sum + item.precio_unitario * item.cantidad,
      0,
    ),
  );
  const budgetNumber =
    budget.trim() === "" ? null : Number(budget.trim());
  const normalizedBudget =
    budgetNumber === null || !Number.isFinite(budgetNumber)
      ? null
      : roundMoney(budgetNumber);
  const difference =
    normalizedBudget === null
      ? null
      : roundMoney(normalizedBudget - total);

  function addProduct(product: MercadoProducto) {
    setFormError(null);
    const bestPrice = product.precios[0];
    if (!bestPrice) {
      setFormError(
        "Este producto no tiene precios. Agrégalos en la pestaña Productos.",
      );
      return;
    }
    if (cart.some((item) => item.producto_id === product.id)) {
      setFormError("Ese producto ya está en la lista.");
      return;
    }
    setCart((current) => [
      ...current,
      {
        producto_id: product.id,
        nombre_producto: product.nombre,
        tienda_id: bestPrice.tienda_id,
        tienda_nombre: bestPrice.tienda_nombre,
        precio_unitario: bestPrice.precio,
        cantidad: 1,
        unidad: product.unidad,
        categoria_nombre: product.categoria_nombre,
      },
    ]);
  }

  function updateQuantity(productId: number, rawValue: string) {
    const quantity = Number(rawValue);
    setCart((current) =>
      current.map((item) =>
        item.producto_id === productId
          ? { ...item, cantidad: Number.isFinite(quantity) ? quantity : 0 }
          : item,
      ),
    );
  }

  function updateStore(productId: number, rawStoreId: string) {
    const storeId = rawStoreId === "" ? null : Number(rawStoreId);
    const product = productById.get(productId);
    const price = product?.precios.find(
      (option) => option.tienda_id === storeId,
    );
    if (!price) return;
    setCart((current) =>
      current.map((item) =>
        item.producto_id === productId
          ? {
              ...item,
              tienda_id: price.tienda_id,
              tienda_nombre: price.tienda_nombre,
              precio_unitario: price.precio,
            }
          : item,
      ),
    );
  }

  function removeItem(productId: number) {
    setCart((current) =>
      current.filter((item) => item.producto_id !== productId),
    );
  }

  function validateBeforeSave(): boolean {
    if (!listName.trim()) {
      setFormError("Escribe un nombre para la lista.");
      return false;
    }
    if (cart.length === 0) {
      setFormError("Agrega al menos un producto a la lista.");
      return false;
    }
    if (cart.some((item) => item.cantidad <= 0)) {
      setFormError("Todas las cantidades deben ser mayores que 0.");
      return false;
    }
    setFormError(null);
    return true;
  }

  async function submitList(pago: PagoModalPayload | null) {
    const response = await fetch("/api/mercado/listas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: listName.trim(),
        presupuesto: normalizedBudget,
        items: cart.map((item) => ({
          producto_id: item.producto_id,
          tienda_id: item.tienda_id,
          precio_unitario: item.precio_unitario,
          cantidad: item.cantidad,
        })),
        pago,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Error al guardar la lista");
    }

    setCart([]);
    setListName("");
    setBudget("");
    setPaymentMode(null);
    await onSaved();
  }

  async function handleSaveWithoutPayment() {
    if (!validateBeforeSave()) return;
    setSaving(true);
    try {
      await submitList(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Error al guardar la lista",
      );
    } finally {
      setSaving(false);
    }
  }

  function openPayment(mode: "completo" | "cachea") {
    if (!validateBeforeSave()) return;
    setPaymentMode(mode);
  }

  return (
    <div>
      <MercadoSummaryCards
        presupuesto={normalizedBudget}
        total={total}
        pagado={0}
        diferencia={difference}
        saldo={0}
        budgetValue={budget}
        onBudgetChange={setBudget}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4">
            <h2 className="text-base font-bold text-primary">Productos</h2>
            <p className="mt-1 text-sm font-normal text-muted">
              Selecciona los productos para armar tu lista.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="mercado-buscar" className={labelClass}>
                  Buscar
                </label>
                <input
                  id="mercado-buscar"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nombre del producto"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="mercado-categoria" className={labelClass}>
                  Categoría
                </label>
                <select
                  id="mercado-categoria"
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
            </div>
          </div>

          <div className="max-h-[560px] divide-y divide-black/5 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm font-normal text-muted">
                No hay productos que coincidan con la búsqueda.
              </p>
            ) : (
              filteredProducts.map((product) => {
                const bestPrice = product.precios[0];
                const inCart = cart.some(
                  (item) => item.producto_id === product.id,
                );
                return (
                  <article
                    key={product.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-primary">
                        {product.nombre}
                      </h3>
                      <p className="mt-0.5 text-xs font-normal text-muted">
                        {product.categoria_nombre} · {product.unidad}
                      </p>
                      {bestPrice ? (
                        <p className="mt-1 text-sm font-bold text-primary">
                          {formatCurrency(bestPrice.precio)}
                          <span className="ml-1 text-xs font-normal text-muted">
                            {bestPrice.tienda_id === null
                              ? "precio base"
                              : `en ${bestPrice.tienda_nombre}`}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-xs font-normal text-red-600">
                          Sin precios registrados
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => addProduct(product)}
                      disabled={!bestPrice || inCart}
                      className={smallPrimaryButtonClass}
                    >
                      {inCart ? "Agregado" : "Agregar"}
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-primary">
                Lista de compra
              </h2>
              <p className="mt-1 text-sm font-normal text-muted">
                {cart.length} {cart.length === 1 ? "producto" : "productos"}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-sm font-bold text-red-600 transition-colors hover:text-red-700"
              >
                Vaciar
              </button>
            )}
          </div>

          <div className="space-y-4 px-5 py-4">
            <div>
              <label htmlFor="mercado-lista-nombre" className={labelClass}>
                Nombre de la lista
              </label>
              <input
                id="mercado-lista-nombre"
                type="text"
                value={listName}
                onChange={(event) => setListName(event.target.value)}
                placeholder="Mercado de la semana"
                maxLength={150}
                className={inputClass}
              />
            </div>

            {cart.length === 0 ? (
              <p className="rounded-xl bg-surface px-4 py-6 text-center text-sm font-normal text-muted">
                Agrega productos desde el catálogo para comenzar.
              </p>
            ) : (
              <div className="max-h-[360px] space-y-3 overflow-y-auto">
                {cart.map((item) => {
                  const product = productById.get(item.producto_id);
                  const storeOptions = product?.precios ?? [];
                  return (
                    <article
                      key={item.producto_id}
                      className="rounded-xl border border-black/5 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-primary">
                            {item.nombre_producto}
                          </h3>
                          <p className="text-xs font-normal text-muted">
                            {item.categoria_nombre} · {item.unidad}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.producto_id)}
                          aria-label={`Quitar ${item.nombre_producto}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-600"
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

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`cantidad-${item.producto_id}`}
                            className="mb-1 block text-xs font-normal text-muted"
                          >
                            Cantidad ({item.unidad})
                          </label>
                          <input
                            id={`cantidad-${item.producto_id}`}
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={item.cantidad}
                            onChange={(event) =>
                              updateQuantity(
                                item.producto_id,
                                event.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`tienda-${item.producto_id}`}
                            className="mb-1 block text-xs font-normal text-muted"
                          >
                            Tienda
                          </label>
                          <select
                            id={`tienda-${item.producto_id}`}
                            value={item.tienda_id ?? ""}
                            onChange={(event) =>
                              updateStore(
                                item.producto_id,
                                event.target.value,
                              )
                            }
                            className={inputClass}
                          >
                            {storeOptions.map((option) => (
                              <option
                                key={option.id}
                                value={option.tienda_id ?? ""}
                              >
                                {option.tienda_nombre ?? "Sin tienda"} ·{" "}
                                {formatCurrency(option.precio)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-normal text-muted">
                          {formatCurrency(item.precio_unitario)} ×{" "}
                          {item.cantidad}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(
                            roundMoney(
                              item.precio_unitario * item.cantidad,
                            ),
                          )}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
              <span className="text-sm font-bold text-primary">
                Total de la compra
              </span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(total)}
              </span>
            </div>

            {formError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
                {formError}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => openPayment("completo")}
                disabled={saving}
                className={primaryButtonClass}
              >
                Pagar completo
              </button>
              <button
                type="button"
                onClick={() => openPayment("cachea")}
                disabled={saving}
                className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cachea
              </button>
              <button
                type="button"
                onClick={handleSaveWithoutPayment}
                disabled={saving}
                className={secondaryButtonClass}
              >
                {saving ? "Guardando..." : "Guardar sin pagar"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {paymentMode && (
        <MercadoPagoModal
          mode={paymentMode}
          total={total}
          onClose={() => setPaymentMode(null)}
          onConfirm={submitList}
        />
      )}
    </div>
  );
}
