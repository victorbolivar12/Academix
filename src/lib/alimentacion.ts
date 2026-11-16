import { isValidIsoDate, type ParseResult } from "@/lib/meta";
import type { MealType } from "@/lib/types";

export const MEAL_TYPES: MealType[] = ["desayuno", "almuerzo", "cena"];

export const MEAL_LABELS: Record<MealType, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
};

export const DAILY_CALORIE_TARGET = 2000;

const MAX_GRAMS = 5000;
const MAX_CALORIES_PER_100G = 1000;

export interface AlimentacionRegistroInput {
  fecha: string;
  tipo_comida: MealType;
  alimento_id: number | null;
  nombre: string;
  calorias_por_100g: number;
  gramos: number;
}

export function isMealType(value: unknown): value is MealType {
  return (
    typeof value === "string" && MEAL_TYPES.includes(value as MealType)
  );
}

export function computeCalories(
  caloriesPer100g: number,
  grams: number,
): number {
  return Math.round((caloriesPer100g * grams) / 100);
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function getWeekStart(value: string): string {
  const date = parseIsoDate(value);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toIsoDate(date);
}

export function getWeekDays(startIso: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(startIso, index));
}

export function parseAlimentoId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export function parseAlimentacionRegistroInput(
  body: unknown,
): ParseResult<AlimentacionRegistroInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }

  const data = body as Record<string, unknown>;

  const fecha = data.fecha;
  if (typeof fecha !== "string" || !isValidIsoDate(fecha)) {
    return { ok: false, error: "La fecha no es válida" };
  }

  const tipoComida = data.tipo_comida;
  if (!isMealType(tipoComida)) {
    return { ok: false, error: "El tipo de comida no es válido" };
  }

  const nombre =
    typeof data.nombre === "string" ? data.nombre.trim() : "";
  if (!nombre) {
    return { ok: false, error: "El nombre de la comida es obligatorio" };
  }
  if (nombre.length > 150) {
    return {
      ok: false,
      error: "El nombre no puede tener más de 150 caracteres",
    };
  }

  const caloriasPor100g = Number(data.calorias_por_100g);
  if (
    !Number.isFinite(caloriasPor100g) ||
    caloriasPor100g < 0 ||
    caloriasPor100g > MAX_CALORIES_PER_100G
  ) {
    return {
      ok: false,
      error: "Las calorías por 100 g no son válidas",
    };
  }

  const gramos = Number(data.gramos);
  if (!Number.isFinite(gramos) || gramos <= 0 || gramos > MAX_GRAMS) {
    return {
      ok: false,
      error: "El peso debe ser mayor que 0 y menor o igual a 5000 g",
    };
  }

  return {
    ok: true,
    value: {
      fecha,
      tipo_comida: tipoComida,
      alimento_id: parseAlimentoId(data.alimento_id),
      nombre,
      calorias_por_100g: caloriasPor100g,
      gramos,
    },
  };
}
