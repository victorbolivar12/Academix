"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  DAILY_CALORIE_TARGET,
  getWeekDays,
  getWeekStart,
  MEAL_LABELS,
  MEAL_TYPES,
} from "@/lib/alimentacion";
import { formatDate, getTodayIso } from "@/lib/format";
import type {
  AlimentacionAlimento,
  AlimentacionRegistro,
  AlimentacionResponse,
  MealType,
} from "@/lib/types";
import AlimentacionMealModal from "./alimentacion/AlimentacionMealModal";

const WEEKDAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

interface MealModalState {
  day: string;
  meal: MealType;
  entry: AlimentacionRegistro | null;
}

interface DayViewProps {
  day: string;
  weekday: string;
  records: AlimentacionRegistro[];
  isToday: boolean;
  onAdd: (day: string, meal: MealType) => void;
  onEdit: (day: string, meal: MealType, entry: AlimentacionRegistro) => void;
}

function MealSection({
  meal,
  records,
  onAdd,
  onEdit,
}: {
  meal: MealType;
  records: AlimentacionRegistro[];
  onAdd: () => void;
  onEdit: (entry: AlimentacionRegistro) => void;
}) {
  const mealTotal = records.reduce((sum, item) => sum + item.calorias, 0);

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
          {MEAL_LABELS[meal]}
        </p>
        {mealTotal > 0 && (
          <span className="text-[11px] font-bold text-primary">
            {mealTotal} kcal
          </span>
        )}
      </div>

      <ul className="mt-1.5 space-y-1">
        {records.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="flex w-full items-start justify-between gap-2 rounded-lg bg-white/70 px-2 py-1.5 text-left transition-colors hover:bg-white"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-primary">
                  {item.nombre}
                </span>
                <span className="block text-[11px] font-normal text-muted">
                  {item.gramos} g
                </span>
              </span>
              <span className="shrink-0 text-xs font-bold text-secondary">
                {item.calorias}
              </span>
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onAdd}
            className="w-full rounded-lg border border-dashed border-black/10 px-2 py-1.5 text-[11px] font-bold text-muted transition-colors hover:border-secondary/40 hover:text-secondary"
          >
            + Agregar
          </button>
        </li>
      </ul>
    </>
  );
}

function DayCard({
  day,
  weekday,
  records,
  isToday,
  onAdd,
  onEdit,
}: DayViewProps) {
  const dayTotal = records.reduce((sum, item) => sum + item.calorias, 0);

  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${
        isToday ? "border-secondary/50" : "border-black/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {weekday}
          </p>
          <p className="mt-1 text-lg font-bold text-primary">
            {day.slice(8, 10)}/{day.slice(5, 7)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            dayTotal > 0
              ? "bg-secondary/10 text-secondary"
              : "bg-surface text-muted"
          }`}
        >
          {dayTotal} kcal
        </span>
      </div>

      {isToday && (
        <span className="mt-2 inline-flex w-fit rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary">
          Hoy
        </span>
      )}

      <div className="mt-3 flex flex-1 flex-col gap-3">
        {MEAL_TYPES.map((meal) => {
          const mealRecords = records.filter(
            (item) => item.tipo_comida === meal,
          );
          return (
            <div
              key={meal}
              className="border-t border-black/5 pt-3 first:border-0 first:pt-0"
            >
              <MealSection
                meal={meal}
                records={mealRecords}
                onAdd={() => onAdd(day, meal)}
                onEdit={(entry) => onEdit(day, meal, entry)}
              />
            </div>
          );
        })}
      </div>
    </article>
  );
}

function DayRow({
  day,
  weekday,
  records,
  isToday,
  onAdd,
  onEdit,
}: DayViewProps) {
  const dayTotal = records.reduce((sum, item) => sum + item.calorias, 0);

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        isToday ? "border-secondary/50" : "border-black/5"
      }`}
    >
      <div className="flex gap-4">
        <div className="w-40 shrink-0 border-r border-black/5 pr-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {weekday}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xl font-bold text-primary">
              {day.slice(8, 10)}/{day.slice(5, 7)}
            </p>
            {isToday && (
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                Hoy
              </span>
            )}
          </div>
          <span
            className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
              dayTotal > 0
                ? "bg-secondary/10 text-secondary"
                : "bg-surface text-muted"
            }`}
          >
            {dayTotal} kcal
          </span>
          <p className="mt-1.5 text-[11px] font-normal text-muted">
            Meta: {DAILY_CALORIE_TARGET} kcal
          </p>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-3">
          {MEAL_TYPES.map((meal) => {
            const mealRecords = records.filter(
              (item) => item.tipo_comida === meal,
            );
            return (
              <div key={meal} className="rounded-xl bg-surface p-3">
                <MealSection
                  meal={meal}
                  records={mealRecords}
                  onAdd={() => onAdd(day, meal)}
                  onEdit={(entry) => onEdit(day, meal, entry)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export default function AlimentacionModule() {
  const [alimentos, setAlimentos] = useState<AlimentacionAlimento[]>([]);
  const [registros, setRegistros] = useState<AlimentacionRegistro[]>([]);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<MealModalState | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const weekDays = useMemo(
    () => (weekStart ? getWeekDays(weekStart) : []),
    [weekStart],
  );
  const weekEnd = weekDays[6] ?? "";

  const fetchData = useCallback(async () => {
    if (!weekStart || !weekEnd) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/alimentacion?desde=${weekStart}&hasta=${weekEnd}`,
      );
      if (!res.ok) throw new Error();
      const data: AlimentacionResponse = await res.json();
      setAlimentos(data.alimentos);
      setRegistros(data.registros);
      setError(null);
    } catch {
      setError("Error al cargar la información de alimentación");
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentDay = getTodayIso();
      setToday(currentDay);
      setWeekStart(getWeekStart(currentDay));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!weekStart) return;
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData, weekStart]);

  const registrosPorDia = useMemo(() => {
    const map = new Map<string, AlimentacionRegistro[]>();
    for (const registro of registros) {
      const list = map.get(registro.fecha) ?? [];
      list.push(registro);
      map.set(registro.fecha, list);
    }
    return map;
  }, [registros]);

  const summary = useMemo(() => {
    const total = registros.reduce((sum, item) => sum + item.calorias, 0);
    const daysWithRecords = weekDays.filter(
      (day) => (registrosPorDia.get(day) ?? []).length > 0,
    ).length;
    return {
      total,
      average: Math.round(total / 7),
      daysWithRecords,
    };
  }, [registros, registrosPorDia, weekDays]);

  function goToWeek(offset: number) {
    if (!weekStart) return;
    setWeekStart(addDays(weekStart, offset * 7));
  }

  function goToCurrentWeek() {
    setWeekStart(getWeekStart(getTodayIso()));
  }

  function openMeal(day: string, meal: MealType, entry: AlimentacionRegistro | null) {
    setModal({ day, meal, entry });
  }

  async function handleSaved() {
    setModal(null);
    await fetchData();
  }

  function openGenerateConfirm() {
    setGenerateError(null);
    setShowGenerateConfirm(true);
  }

  async function handleGenerate() {
    if (!weekStart || !weekEnd) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/alimentacion/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desde: weekStart, hasta: weekEnd }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setGenerateError(data.error ?? "Error al generar las comidas");
        return;
      }
      setShowGenerateConfirm(false);
      await fetchData();
    } catch {
      setGenerateError("Error al generar las comidas");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
            Módulo 6
          </span>
          <h1 className="mt-4 text-3xl font-bold text-primary">Alimentación</h1>
          <p className="mt-2 max-w-2xl text-base font-normal text-muted">
            Planifica tus comidas de la semana y lleva un control aproximado de
            las calorías diarias según el peso de cada alimento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openGenerateConfirm}
            disabled={!weekStart || loading}
            className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
              <path d="M12 3l1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z" />
              <path d="M19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
            </svg>
            Generar comidas
          </button>
          <button
            type="button"
            onClick={() => goToWeek(-1)}
            aria-label="Semana anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/15 text-primary transition-colors hover:bg-surface"
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
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToCurrentWeek}
            className="rounded-full border border-primary/15 px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-surface"
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => goToWeek(1)}
            aria-label="Semana siguiente"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/15 text-primary transition-colors hover:bg-surface"
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
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm font-normal text-muted">Calorías de la semana</p>
          <p className="mt-3 text-2xl font-bold text-primary">
            {summary.total} kcal
          </p>
          <p className="mt-1 text-xs font-normal text-muted">
            Suma de todas las comidas registradas
          </p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm font-normal text-muted">Promedio diario</p>
          <p className="mt-3 text-2xl font-bold text-primary">
            {summary.average} kcal
          </p>
          <p className="mt-1 text-xs font-normal text-muted">
            Meta aproximada: {DAILY_CALORIE_TARGET} kcal por día
          </p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm font-normal text-muted">Días con registro</p>
          <p className="mt-3 text-2xl font-bold text-secondary">
            {summary.daysWithRecords} de 7
          </p>
          <p className="mt-1 text-xs font-normal text-muted">
            Agrega desayuno, almuerzo y cena a cada día
          </p>
        </article>
      </section>

      <section
        className={`mt-8 transition-opacity ${loading ? "opacity-50" : ""}`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-primary">
            Semana del {weekStart ? formatDate(weekStart) : "—"}
            {weekEnd ? ` al ${formatDate(weekEnd)}` : ""}
          </h2>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-primary">
            Las calorías son aproximadas
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:hidden">
          {weekDays.map((day, index) => (
            <DayCard
              key={day}
              day={day}
              weekday={WEEKDAY_LABELS[index]}
              records={registrosPorDia.get(day) ?? []}
              isToday={day === today}
              onAdd={(selectedDay, selectedMeal) =>
                openMeal(selectedDay, selectedMeal, null)
              }
              onEdit={openMeal}
            />
          ))}
        </div>

        <div className="hidden flex-col gap-3 lg:flex">
          {weekDays.map((day, index) => (
            <DayRow
              key={day}
              day={day}
              weekday={WEEKDAY_LABELS[index]}
              records={registrosPorDia.get(day) ?? []}
              isToday={day === today}
              onAdd={(selectedDay, selectedMeal) =>
                openMeal(selectedDay, selectedMeal, null)
              }
              onEdit={openMeal}
            />
          ))}
        </div>
      </section>

      {showGenerateConfirm && weekStart && weekEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!generating) setShowGenerateConfirm(false);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-primary">Generar comidas</h2>
            <p className="mt-2 text-sm font-normal leading-6 text-muted">
              Se generarán{" "}
              <span className="font-bold text-primary">21 comidas</span>{" "}
              balanceadas para la semana del{" "}
              <span className="font-bold text-primary">
                {formatDate(weekStart)}
              </span>{" "}
              al{" "}
              <span className="font-bold text-primary">
                {formatDate(weekEnd)}
              </span>
              . Cada día tendrá entre{" "}
              <span className="font-bold text-primary">2000 y 2200 kcal</span>,
              combinando proteínas, vegetales y carbohidratos.
            </p>
            <p className="mt-3 text-sm font-normal leading-6 text-muted">
              El desayuno y la cena usarán huevo, atún o pechuga de pollo. Se
              reemplazarán las comidas que ya estén registradas en esa semana.
            </p>

            {generateError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
                {generateError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowGenerateConfirm(false)}
                disabled={generating}
                className="rounded-full border border-primary/15 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? "Generando..." : "Generar comidas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <AlimentacionMealModal
          day={modal.day}
          meal={modal.meal}
          entry={modal.entry}
          alimentos={alimentos}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
