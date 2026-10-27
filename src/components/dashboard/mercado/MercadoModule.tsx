"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  MercadoCatalogoResponse,
  MercadoLista,
  MercadoListasResponse,
} from "@/lib/types";
import MercadoCatalogosTab from "./MercadoCatalogosTab";
import MercadoListaTab from "./MercadoListaTab";
import MercadoListasGuardadasTab from "./MercadoListasGuardadasTab";
import MercadoProductosTab from "./MercadoProductosTab";

type Tab = "lista" | "guardadas" | "productos" | "catalogos";

const tabs: { id: Tab; label: string }[] = [
  { id: "lista", label: "Lista" },
  { id: "guardadas", label: "Listas guardadas" },
  { id: "productos", label: "Productos" },
  { id: "catalogos", label: "Catálogos" },
];

const emptyCatalogo: MercadoCatalogoResponse = {
  categorias: [],
  tiendas: [],
  productos: [],
};

export default function MercadoModule() {
  const [catalogo, setCatalogo] =
    useState<MercadoCatalogoResponse>(emptyCatalogo);
  const [listas, setListas] = useState<MercadoLista[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("lista");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [catalogoResponse, listasResponse] = await Promise.all([
        fetch("/api/mercado"),
        fetch("/api/mercado/listas"),
      ]);

      if (!catalogoResponse.ok || !listasResponse.ok) {
        throw new Error();
      }

      const catalogoData =
        (await catalogoResponse.json()) as MercadoCatalogoResponse;
      const listasData =
        (await listasResponse.json()) as MercadoListasResponse;

      setCatalogo(catalogoData);
      setListas(listasData.listas);
      setError(null);
    } catch {
      setError("Error al cargar la información de Mercado");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const handleSaved = useCallback(async () => {
    await refresh();
    setActiveTab("guardadas");
  }, [refresh]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-8">
        <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
          Módulo 4
        </span>
        <h1 className="mt-4 text-3xl font-bold text-primary">Mercado</h1>
        <p className="mt-2 text-base font-normal text-muted">
          Arma tu lista, compara precios por tienda y controla tu presupuesto y
          pagos con Cachea.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {error}
        </div>
      )}

      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-white"
                : "border border-primary/15 bg-white text-primary hover:bg-surface"
            }`}
          >
            {tab.label}
            {tab.id === "guardadas" && listas.length > 0
              ? ` (${listas.length})`
              : ""}
          </button>
        ))}
      </nav>

      <div className={loading ? "opacity-50" : ""}>
        {activeTab === "lista" && (
          <MercadoListaTab catalogo={catalogo} onSaved={handleSaved} />
        )}
        {activeTab === "guardadas" && (
          <MercadoListasGuardadasTab listas={listas} onChanged={refresh} />
        )}
        {activeTab === "productos" && (
          <MercadoProductosTab catalogo={catalogo} onChanged={refresh} />
        )}
        {activeTab === "catalogos" && (
          <MercadoCatalogosTab catalogo={catalogo} onChanged={refresh} />
        )}
      </div>
    </div>
  );
}
