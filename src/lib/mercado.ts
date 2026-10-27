import { getTodayIso } from "@/lib/format";
import type { MercadoPago, MercadoPaymentStatus } from "@/lib/types";

export const MERCADO_UNIDADES = [
  "unidad",
  "kg",
  "g",
  "lb",
  "litro",
  "ml",
  "paquete",
  "docena",
] as const;

export const CACHEA_MIN_PERCENT = 20;
export const CACHEA_DUE_DAYS = 14;

export const MERCADO_LISTA_ESTADOS = ["pendiente", "comprada"] as const;

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface CategoriaInput {
  nombre: string;
}

export interface TiendaInput {
  nombre: string;
}

export interface ProductoInput {
  nombre: string;
  categoria_id: number;
  unidad: string;
  activo: boolean;
}

export interface PrecioInput {
  tienda_id: number | null;
  precio: number;
}

export interface ListaItemInput {
  producto_id: number;
  tienda_id: number | null;
  precio_unitario: number;
  cantidad: number;
}

export interface ListaInput {
  nombre: string;
  presupuesto: number | null;
  items: ListaItemInput[];
}

export type PagoTipo = "completo" | "cachea" | "saldo";

export interface PagoInput {
  tipo: PagoTipo;
  porcentaje: number | null;
  monto: number;
  fecha_pago: string;
  fecha_vencimiento: string | null;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isMysqlError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function addDaysIso(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function parseName(
  value: unknown,
  field: string,
  maxLength: number,
): ParseResult<string> {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: `El ${field} es obligatorio` };
  }
  const name = value.trim();
  if (name.length > maxLength) {
    return {
      ok: false,
      error: `El ${field} no puede tener más de ${maxLength} caracteres`,
    };
  }
  return { ok: true, value: name };
}

export function parseCategoriaInput(body: unknown): ParseResult<CategoriaInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }
  const parsed = parseName(
    (body as Record<string, unknown>).nombre,
    "nombre de la categoría",
    100,
  );
  if (!parsed.ok) return parsed;
  return { ok: true, value: { nombre: parsed.value } };
}

export function parseTiendaInput(body: unknown): ParseResult<TiendaInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }
  const parsed = parseName(
    (body as Record<string, unknown>).nombre,
    "nombre de la tienda",
    100,
  );
  if (!parsed.ok) return parsed;
  return { ok: true, value: { nombre: parsed.value } };
}

export function parseProductoInput(body: unknown): ParseResult<ProductoInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }

  const data = body as Record<string, unknown>;
  const parsedName = parseName(data.nombre, "nombre del producto", 150);
  if (!parsedName.ok) return parsedName;

  if (!isPositiveInteger(data.categoria_id)) {
    return { ok: false, error: "Selecciona una categoría válida" };
  }

  const unidad = typeof data.unidad === "string" ? data.unidad : "unidad";
  if (!MERCADO_UNIDADES.includes(unidad as (typeof MERCADO_UNIDADES)[number])) {
    return { ok: false, error: "Selecciona una unidad válida" };
  }

  return {
    ok: true,
    value: {
      nombre: parsedName.value,
      categoria_id: data.categoria_id,
      unidad,
      activo: data.activo === undefined ? true : Boolean(data.activo),
    },
  };
}

export function parsePrecioInput(body: unknown): ParseResult<PrecioInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }

  const data = body as Record<string, unknown>;
  const rawStoreId = data.tienda_id;
  const tiendaId =
    rawStoreId === null || rawStoreId === undefined || rawStoreId === ""
      ? null
      : rawStoreId;

  if (tiendaId !== null && !isPositiveInteger(tiendaId)) {
    return { ok: false, error: "Selecciona una tienda válida" };
  }

  const precio = Number(data.precio);
  if (!Number.isFinite(precio) || precio < 0) {
    return {
      ok: false,
      error: "El precio es obligatorio y debe ser un número válido",
    };
  }

  return {
    ok: true,
    value: {
      tienda_id: tiendaId,
      precio: roundMoney(precio),
    },
  };
}

function parseBudget(value: unknown): ParseResult<number | null> {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  const budget = Number(value);
  if (!Number.isFinite(budget) || budget < 0) {
    return {
      ok: false,
      error: "El presupuesto debe ser un número válido mayor o igual a 0",
    };
  }
  return { ok: true, value: roundMoney(budget) };
}

export function parsePresupuestoInput(
  value: unknown,
): ParseResult<number | null> {
  return parseBudget(value);
}

export function parseListaInput(body: unknown): ParseResult<ListaInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }

  const data = body as Record<string, unknown>;
  const parsedName = parseName(data.nombre, "nombre de la lista", 150);
  if (!parsedName.ok) return parsedName;

  const parsedBudget = parseBudget(data.presupuesto);
  if (!parsedBudget.ok) return parsedBudget;

  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { ok: false, error: "Agrega al menos un producto a la lista" };
  }

  if (data.items.length > 200) {
    return { ok: false, error: "La lista no puede tener más de 200 productos" };
  }

  const items: ListaItemInput[] = [];
  const seenProducts = new Set<number>();

  for (const rawItem of data.items) {
    if (typeof rawItem !== "object" || rawItem === null) {
      return { ok: false, error: "Hay un producto no válido en la lista" };
    }
    const item = rawItem as Record<string, unknown>;

    if (!isPositiveInteger(item.producto_id)) {
      return { ok: false, error: "Hay un producto no válido en la lista" };
    }
    if (seenProducts.has(item.producto_id)) {
      return { ok: false, error: "No repitas el mismo producto en la lista" };
    }
    seenProducts.add(item.producto_id);

    if (item.tienda_id !== null && !isPositiveInteger(item.tienda_id)) {
      return { ok: false, error: "Hay una tienda no válida en la lista" };
    }

    if (!isFiniteNumber(item.precio_unitario) || item.precio_unitario < 0) {
      return { ok: false, error: "Hay un precio no válido en la lista" };
    }

    if (!isFiniteNumber(item.cantidad) || item.cantidad <= 0) {
      return { ok: false, error: "La cantidad debe ser mayor que 0" };
    }

    items.push({
      producto_id: item.producto_id,
      tienda_id: (item.tienda_id as number | null | undefined) ?? null,
      precio_unitario: roundMoney(item.precio_unitario),
      cantidad: item.cantidad,
    });
  }

  return {
    ok: true,
    value: {
      nombre: parsedName.value,
      presupuesto: parsedBudget.value,
      items,
    },
  };
}

export interface PaymentContext {
  total: number;
  pending: number;
  hasPayments: boolean;
}

export function parsePaymentInput(
  body: unknown,
  context: PaymentContext,
): ParseResult<PagoInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Datos no válidos" };
  }

  const data = body as Record<string, unknown>;
  const tipo = data.tipo;
  if (tipo !== "completo" && tipo !== "cachea" && tipo !== "saldo") {
    return { ok: false, error: "Selecciona una forma de pago válida" };
  }

  const fechaPago =
    typeof data.fecha_pago === "string" && data.fecha_pago
      ? data.fecha_pago
      : getTodayIso();

  if (!isValidIsoDate(fechaPago)) {
    return { ok: false, error: "La fecha de pago no es válida" };
  }

  const total = roundMoney(context.total);
  if (total <= 0) {
    return { ok: false, error: "La lista no tiene un total para pagar" };
  }

  if (tipo === "completo") {
    if (context.hasPayments) {
      return {
        ok: false,
        error: "La lista ya tiene un pago registrado",
      };
    }
    return {
      ok: true,
      value: {
        tipo,
        porcentaje: 100,
        monto: total,
        fecha_pago: fechaPago,
        fecha_vencimiento: null,
      },
    };
  }

  if (tipo === "saldo") {
    if (!context.hasPayments) {
      return {
        ok: false,
        error: "Primero registra un pago inicial para la lista",
      };
    }
    const pending = roundMoney(context.pending);
    if (pending <= 0) {
      return { ok: false, error: "La lista no tiene saldo pendiente" };
    }
    return {
      ok: true,
      value: {
        tipo,
        porcentaje: null,
        monto: pending,
        fecha_pago: fechaPago,
        fecha_vencimiento: null,
      },
    };
  }

  if (context.hasPayments) {
    return {
      ok: false,
      error: "La lista ya tiene un pago inicial registrado",
    };
  }

  const rawPorcentaje = data.porcentaje;
  const rawMonto = data.monto;

  let porcentaje: number;
  let monto: number;

  if (rawPorcentaje !== undefined && rawPorcentaje !== null && rawPorcentaje !== "") {
    porcentaje = Number(rawPorcentaje);
    if (!Number.isFinite(porcentaje)) {
      return { ok: false, error: "El porcentaje no es válido" };
    }
    monto = roundMoney((total * porcentaje) / 100);
  } else if (rawMonto !== undefined && rawMonto !== null && rawMonto !== "") {
    monto = roundMoney(Number(rawMonto));
    if (!Number.isFinite(monto)) {
      return { ok: false, error: "El monto no es válido" };
    }
    porcentaje = roundMoney((monto / total) * 100);
  } else {
    return {
      ok: false,
      error: "Ingresa el porcentaje o el monto que deseas pagar",
    };
  }

  if (monto <= 0) {
    return { ok: false, error: "El monto a pagar debe ser mayor que 0" };
  }

  if (porcentaje < CACHEA_MIN_PERCENT) {
    return {
      ok: false,
      error: `El abono mínimo es del ${CACHEA_MIN_PERCENT}% del total`,
    };
  }

  if (monto >= total) {
    return {
      ok: false,
      error: "Para pagar el total usa la opción Pagar completo",
    };
  }

  return {
    ok: true,
    value: {
      tipo,
      porcentaje,
      monto,
      fecha_pago: fechaPago,
      fecha_vencimiento: addDaysIso(fechaPago, CACHEA_DUE_DAYS),
    },
  };
}

export interface ListSummary {
  total: number;
  pagado: number;
  saldo: number;
  diferencia: number | null;
  estado_pago: MercadoPaymentStatus;
  fecha_vencimiento: string | null;
}

export function buildListSummary(
  total: number,
  presupuesto: number | null,
  pagos: MercadoPago[],
): ListSummary {
  const normalizedTotal = roundMoney(total);
  const pagado = roundMoney(pagos.reduce((sum, pago) => sum + pago.monto, 0));
  const saldo = roundMoney(Math.max(normalizedTotal - pagado, 0));
  const cacheaPayment = pagos.find(
    (pago) => pago.tipo === "cachea" && pago.fecha_vencimiento,
  );
  const fechaVencimiento = cacheaPayment?.fecha_vencimiento ?? null;

  let estadoPago: MercadoPaymentStatus;
  if (saldo <= 0.004) {
    estadoPago = "pagado";
  } else if (fechaVencimiento && getTodayIso() > fechaVencimiento) {
    estadoPago = "vencido";
  } else if (pagos.length > 0) {
    estadoPago = "cachea";
  } else {
    estadoPago = "pendiente";
  }

  const base = pagos.length > 0 ? pagado : normalizedTotal;
  const diferencia =
    presupuesto === null ? null : roundMoney(presupuesto - base);

  return {
    total: normalizedTotal,
    pagado,
    saldo,
    diferencia,
    estado_pago: estadoPago,
    fecha_vencimiento: fechaVencimiento,
  };
}
