export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface MetaInput {
  nombre: string;
  precio: number;
  fecha_compra: string;
  completado: boolean;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function parseMetaNombre(value: unknown): ParseResult<string> {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: "El nombre del producto es obligatorio" };
  }
  const nombre = value.trim();
  if (nombre.length > 150) {
    return {
      ok: false,
      error: "El nombre no puede tener más de 150 caracteres",
    };
  }
  return { ok: true, value: nombre };
}

export function parseMetaPrecio(value: unknown): ParseResult<number> {
  const precio = Number(value);
  if (!Number.isFinite(precio) || precio < 0) {
    return {
      ok: false,
      error: "El precio debe ser un número válido mayor o igual a 0",
    };
  }
  return { ok: true, value: roundMoney(precio) };
}

export function parseMetaFecha(value: unknown): ParseResult<string> {
  if (typeof value !== "string" || !isValidIsoDate(value)) {
    return { ok: false, error: "La fecha de compra no es válida" };
  }
  return { ok: true, value };
}

export function parseMetaCompletado(value: unknown): ParseResult<boolean> {
  if (typeof value === "boolean") {
    return { ok: true, value };
  }
  if (value === 0 || value === 1) {
    return { ok: true, value: value === 1 };
  }
  return { ok: false, error: "El estado no es válido" };
}

export function parseMetaInput(body: unknown): ParseResult<MetaInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }

  const data = body as Record<string, unknown>;

  const nombre = parseMetaNombre(data.nombre);
  if (!nombre.ok) return nombre;

  const precio = parseMetaPrecio(data.precio);
  if (!precio.ok) return precio;

  const fecha = parseMetaFecha(data.fecha_compra);
  if (!fecha.ok) return fecha;

  const completado =
    data.completado === undefined
      ? ({ ok: true, value: false } as const)
      : parseMetaCompletado(data.completado);
  if (!completado.ok) return completado;

  return {
    ok: true,
    value: {
      nombre: nombre.value,
      precio: precio.value,
      fecha_compra: fecha.value,
      completado: completado.value,
    },
  };
}
