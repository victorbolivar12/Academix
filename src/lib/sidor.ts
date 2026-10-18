import { SPANISH_MONTHS } from "@/lib/months";

export const SIDOR_TITULOS = [
  "Quincena I",
  "Rojita",
  "Bono I",
  "Quincena II",
  "Bono II",
];

export interface SidorInput {
  titulo: string;
  monto: number;
  mes: string;
  fecha_pago: string;
}

export type ParseSidorResult =
  | { ok: true; value: SidorInput }
  | { ok: false; error: string };

export function getMonthIndex(mes: string): number {
  return SPANISH_MONTHS.findIndex(
    (month) => month.toLowerCase() === mes.trim().toLowerCase(),
  );
}

export function getMonthNameFromDate(fecha: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!match) return null;
  const monthName = SPANISH_MONTHS[Number(match[2]) - 1];
  return monthName ?? null;
}

export function parseSidorInput(body: unknown): ParseSidorResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }

  const { titulo, monto, fecha_pago } = body as Record<string, unknown>;

  if (typeof titulo !== "string" || !titulo.trim()) {
    return { ok: false, error: "El título es obligatorio" };
  }

  const tituloValue = titulo.trim();
  if (tituloValue.length > 100) {
    return {
      ok: false,
      error: "El título no puede tener más de 100 caracteres",
    };
  }

  const montoNumber = Number(monto);
  if (!Number.isFinite(montoNumber) || montoNumber < 0) {
    return {
      ok: false,
      error: "El monto es obligatorio y debe ser un número válido",
    };
  }

  if (
    typeof fecha_pago !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha_pago)
  ) {
    return { ok: false, error: "La fecha de pago es obligatoria" };
  }

  const mes = getMonthNameFromDate(fecha_pago);
  if (!mes) {
    return { ok: false, error: "La fecha de pago no es válida" };
  }

  return {
    ok: true,
    value: { titulo: tituloValue, monto: montoNumber, mes, fecha_pago },
  };
}
