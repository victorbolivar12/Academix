"use client";

import { useMemo, useState } from "react";
import { computeCalories, MEAL_LABELS } from "@/lib/alimentacion";
import { formatDate } from "@/lib/format";
import type {
  AlimentacionAlimento,
  AlimentacionRegistro,
  MealType,
} from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-normal text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40";

const labelClass = "mb-1.5 block text-sm font-bold text-primary";

type FoodMode = "catalogo" | "personalizado";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function foodMatchesFilters(
  food: AlimentacionAlimento,
  category: string,
  name: string,
): boolean {
  const term = normalizeText(name.trim());
  const matchesCategory = category === "todas" || food.categoria === category;
  const matchesName = !term || normalizeText(food.nombre).includes(term);
  return matchesCategory && matchesName;
}

interface AlimentacionMealModalProps {
  day: string;
  meal: MealType;
  entry: AlimentacionRegistro | null;
  alimentos: AlimentacionAlimento[];
  onClose: () => void;
  onSaved: () => void;
}

export default function AlimentacionMealModal({
  day,
  meal,
  entry,
  alimentos,
  onClose,
  onSaved,
}: AlimentacionMealModalProps) {
  const foodExists =
    entry?.alimento_id != null &&
    alimentos.some((item) => item.id === entry.alimento_id);

  const [mode, setMode] = useState<FoodMode>(
    entry && (entry.alimento_id == null || !foodExists)
      ? "personalizado"
      : "catalogo",
  );
  const [alimentoId, setAlimentoId] = useState(
    foodExists && entry?.alimento_id != null ? String(entry.alimento_id) : "",
  );
  const [customName, setCustomName] = useState(
    entry && !foodExists ? entry.nombre : "",
  );
  const [customCalories, setCustomCalories] = useState(
    entry && !foodExists ? String(entry.calorias_por_100g) : "",
  );
  const [grams, setGrams] = useState(entry ? String(entry.gramos) : "100");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [nameFilter, setNameFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(alimentos.map((item) => item.categoria))).sort(),
    [alimentos],
  );

  const filteredFoods = useMemo(
    () =>
      alimentos.filter((item) =>
        foodMatchesFilters(item, categoryFilter, nameFilter),
      ),
    [alimentos, categoryFilter, nameFilter],
  );

  const groupedFoods = useMemo(() => {
    const groups = new Map<string, AlimentacionAlimento[]>();
    for (const alimento of filteredFoods) {
      const list = groups.get(alimento.categoria) ?? [];
      list.push(alimento);
      groups.set(alimento.categoria, list);
    }
    return Array.from(groups.entries());
  }, [filteredFoods]);

  const selectedFood =
    filteredFoods.find((item) => String(item.id) === alimentoId) ?? null;

  function handleCategoryFilter(value: string) {
    setCategoryFilter(value);
    const current = alimentos.find((item) => String(item.id) === alimentoId);
    if (current && !foodMatchesFilters(current, value, nameFilter)) {
      setAlimentoId("");
    }
  }

  function handleNameFilter(value: string) {
    setNameFilter(value);
    const current = alimentos.find((item) => String(item.id) === alimentoId);
    if (current && !foodMatchesFilters(current, categoryFilter, value)) {
      setAlimentoId("");
    }
  }

  const caloriesPer100g =
    mode === "catalogo"
      ? selectedFood?.calorias_por_100g ?? 0
      : Number(customCalories);

  const gramsNumber = Number(grams);
  const estimatedCalories =
    Number.isFinite(caloriesPer100g) &&
    Number.isFinite(gramsNumber) &&
    gramsNumber > 0
      ? computeCalories(caloriesPer100g, gramsNumber)
      : 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "catalogo" && !selectedFood) {
      setError("Selecciona una comida de la lista o escribe una personalizada");
      return;
    }
    if (mode === "personalizado" && !customName.trim()) {
      setError("Escribe el nombre de la comida");
      return;
    }
    if (
      mode === "personalizado" &&
      (!Number.isFinite(Number(customCalories)) ||
        Number(customCalories) < 0)
    ) {
      setError("Escribe las calorías por 100 g de la comida");
      return;
    }
    if (!Number.isFinite(gramsNumber) || gramsNumber <= 0) {
      setError("El peso debe ser mayor que 0");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fecha: entry ? entry.fecha : day,
        tipo_comida: entry ? entry.tipo_comida : meal,
        alimento_id: mode === "catalogo" ? selectedFood?.id ?? null : null,
        nombre:
          mode === "catalogo"
            ? selectedFood?.nombre ?? ""
            : customName.trim(),
        calorias_por_100g:
          mode === "catalogo"
            ? selectedFood?.calorias_por_100g ?? 0
            : Number(customCalories),
        gramos: gramsNumber,
      };

      const res = await fetch(
        entry ? `/api/alimentacion/${entry.id}` : "/api/alimentacion",
        {
          method: entry ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al guardar la comida");
        return;
      }
      onSaved();
    } catch {
      setError("Error al guardar la comida");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/alimentacion/${entry.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al eliminar la comida");
        return;
      }
      onSaved();
    } catch {
      setError("Error al eliminar la comida");
    } finally {
      setDeleting(false);
    }
  }

  const mealLabel = entry ? MEAL_LABELS[entry.tipo_comida] : MEAL_LABELS[meal];
  const dateLabel = formatDate(entry ? entry.fecha : day);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar formulario"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {entry ? "Editar comida" : `Agregar a ${mealLabel.toLowerCase()}`}
            </h2>
            <p className="mt-1 text-sm font-normal text-muted">
              {mealLabel} · {dateLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-1">
            <button
              type="button"
              onClick={() => setMode("catalogo")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                mode === "catalogo"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted hover:text-primary"
              }`}
            >
              Comida precargada
            </button>
            <button
              type="button"
              onClick={() => setMode("personalizado")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                mode === "personalizado"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted hover:text-primary"
              }`}
            >
              Escribir comida
            </button>
          </div>

          {mode === "catalogo" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="alimentacion-categoria"
                    className={labelClass}
                  >
                    Categoría
                  </label>
                  <select
                    id="alimentacion-categoria"
                    value={categoryFilter}
                    onChange={(event) =>
                      handleCategoryFilter(event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="todas">Todas las categorías</option>
                    {categories.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="alimentacion-buscar" className={labelClass}>
                    Buscar por nombre
                  </label>
                  <input
                    id="alimentacion-buscar"
                    type="search"
                    value={nameFilter}
                    onChange={(event) => handleNameFilter(event.target.value)}
                    placeholder="Ej. pollo"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="alimentacion-alimento" className={labelClass}>
                  Comida
                </label>
                <select
                  id="alimentacion-alimento"
                  value={alimentoId}
                  onChange={(event) => setAlimentoId(event.target.value)}
                  disabled={filteredFoods.length === 0}
                  className={inputClass}
                >
                  <option value="">
                    {filteredFoods.length === 0
                      ? "Sin resultados"
                      : "Selecciona una comida"}
                  </option>
                  {groupedFoods.map(([categoria, foods]) => (
                    <optgroup key={categoria} label={categoria}>
                      {foods.map((food) => (
                        <option key={food.id} value={food.id}>
                          {food.nombre} ({food.calorias_por_100g} kcal / 100 g)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="mt-1 text-xs font-normal text-muted">
                  {filteredFoods.length}{" "}
                  {filteredFoods.length === 1
                    ? "alimento disponible"
                    : "alimentos disponibles"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="alimentacion-nombre" className={labelClass}>
                  Nombre de la comida
                </label>
                <input
                  id="alimentacion-nombre"
                  type="text"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Ej. Sándwich de pollo"
                  maxLength={150}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="alimentacion-calorias" className={labelClass}>
                  Calorías por 100 g
                </label>
                <input
                  id="alimentacion-calorias"
                  type="number"
                  min="0"
                  step="1"
                  value={customCalories}
                  onChange={(event) => setCustomCalories(event.target.value)}
                  placeholder="Ej. 250"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="alimentacion-gramos" className={labelClass}>
              Peso de la comida (gramos)
            </label>
            <input
              id="alimentacion-gramos"
              type="number"
              min="1"
              max="5000"
              step="1"
              value={grams}
              onChange={(event) => setGrams(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3">
            <span className="text-sm font-bold text-primary">
              Calorías estimadas
            </span>
            <span className="text-lg font-bold text-secondary">
              {estimatedCalories} kcal
            </span>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
              {error}
            </p>
          )}

          {confirmingDelete ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-normal text-red-700">
                ¿Seguro que deseas eliminar esta comida?
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-full border border-primary/15 bg-white px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              {entry ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                >
                  Eliminar
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
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
                    : entry
                      ? "Guardar cambios"
                      : "Agregar comida"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
