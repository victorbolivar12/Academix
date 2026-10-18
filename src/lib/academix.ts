import type { DbParam } from "@/lib/db";
import { SPANISH_MONTHS } from "@/lib/months";

export interface AcademixRecordInput {
  codigo: string | null;
  titulo: string;
  fecha_entrega_real: string | null;
  precio: number;
  estado: string;
  estado_pago: string;
}
export function buildMesCondition(
  mes: string | null,
  column = "mes_registro",
): {
  clause: string;
  params: DbParam[];
} {
  if (!mes) return { clause: "", params: [] };

  const match = /^(\d{4})-(\d{2})$/.exec(mes);
  if (match) {
    const monthName = SPANISH_MONTHS[Number(match[2]) - 1];
    return {
      clause: `(${column} = ? OR ${column} = ? OR ${column} = ?)`,
      params: [mes, `${monthName} ${match[1]}`, monthName],
    };
  }
  return { clause: `${column} = ?`, params: [mes] };
}

export type ParseRecordResult =
  | { ok: true; value: AcademixRecordInput }
  | { ok: false; error: string };

export function parseRecordInput(body: unknown): ParseRecordResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }

  const { codigo, titulo, fecha_entrega_real, precio, estado, estado_pago } =
    body as Record<string, unknown>;

  if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
    return { ok: false, error: "El título es obligatorio" };
  }

  const precioNumber = Number(precio);
  if (!Number.isFinite(precioNumber) || precioNumber < 0) {
    return {
      ok: false,
      error: "El precio es obligatorio y debe ser un número válido",
    };
  }

  return {
    ok: true,
    value: {
      codigo:
        typeof codigo === "string" && codigo.trim() ? codigo.trim() : null,
      titulo: titulo.trim(),
      fecha_entrega_real:
        typeof fecha_entrega_real === "string" && fecha_entrega_real
          ? fecha_entrega_real
          : null,
      precio: precioNumber,
      estado:
        typeof estado === "string" && estado.trim() ? estado.trim() : "Pendiente",
      estado_pago:
        typeof estado_pago === "string" && estado_pago.trim()
          ? estado_pago.trim()
          : "Pendiente",
    },
  };
}

export interface ParsedAcademixMessage {
  titulo: string | null;
  codigo: string | null;
  precio: string | null;
  fecha_entrega_real: string | null;
}

const EMOJI_PATTERN = /\p{Extended_Pictographic}|\uFE0F|\u200D/gu;

function cleanValue(value: string): string {
  return value
    .replace(EMOJI_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAmount(value: string): string | null {
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");
  const normalized = !hasDot && hasComma ? cleaned.replace(",", ".") : cleaned.replace(/,/g, "");

  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  return String(amount);
}

function toIsoDate(year: string, month: string, day: string): string | null {
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    return null;
  }
  return `${year.padStart(4, "0")}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
}

function parseDate(value: string): string | null {
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (isoMatch) {
    return toIsoDate(isoMatch[1], isoMatch[2], isoMatch[3]);
  }

  const dayFirstMatch = /^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?$/.exec(value);
  if (dayFirstMatch) {
    const rawYear = dayFirstMatch[3];
    const year = rawYear
      ? rawYear.length === 2
        ? `20${rawYear}`
        : rawYear
      : String(new Date().getFullYear());
    return toIsoDate(year, dayFirstMatch[2], dayFirstMatch[1]);
  }

  return null;
}

export function parseAcademixMessage(text: string): ParsedAcademixMessage {
  const result: ParsedAcademixMessage = {
    titulo: null,
    codigo: null,
    precio: null,
    fecha_entrega_real: null,
  };

  const titleParts: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = /^(valor|precio|fecha|hora|c[oó]digo|n[uú]mero)\s*:\s*(.*)$/i.exec(line);
    if (match) {
      const key = match[1].toLowerCase();
      const value = cleanValue(match[2]);

      if (key === "valor" || key === "precio") {
        result.precio = parseAmount(value);
      } else if (key === "fecha") {
        result.fecha_entrega_real = parseDate(value);
      } else if (key === "código" || key === "codigo") {
        result.codigo = value || null;
      }
      continue;
    }

    const titlePart = cleanValue(line);
    if (titlePart) titleParts.push(titlePart);
  }

  const titulo = titleParts.join(" ").trim();
  if (titulo) result.titulo = titulo;

  return result;
}
