import { dbQuery } from "@/lib/db";
import { buildListSummary, roundMoney } from "@/lib/mercado";
import type {
  MercadoLista,
  MercadoListaItem,
  MercadoPago,
} from "@/lib/types";

interface ListaRow {
  id: number;
  nombre: string;
  estado: string;
  presupuesto: string | null;
  total: string;
  created_at: string;
  updated_at: string;
}

interface ItemRow {
  id: number;
  lista_id: number;
  producto_id: number | null;
  nombre_producto: string;
  tienda_id: number | null;
  tienda_nombre: string | null;
  precio_unitario: string;
  cantidad: string;
  unidad: string;
}

interface PagoRow {
  id: number;
  lista_id: number;
  tipo: string;
  porcentaje: string | null;
  monto: string;
  fecha_pago: string;
  fecha_vencimiento: string | null;
}

function mapItem(row: ItemRow): MercadoListaItem {
  const price = Number(row.precio_unitario);
  const quantity = Number(row.cantidad);
  return {
    id: row.id,
    producto_id: row.producto_id,
    nombre_producto: row.nombre_producto,
    tienda_id: row.tienda_id,
    tienda_nombre: row.tienda_nombre,
    precio_unitario: price,
    cantidad: quantity,
    unidad: row.unidad,
    subtotal: roundMoney(price * quantity),
  };
}

function mapPago(row: PagoRow): MercadoPago {
  return {
    id: row.id,
    tipo: row.tipo,
    porcentaje: row.porcentaje === null ? null : Number(row.porcentaje),
    monto: Number(row.monto),
    fecha_pago: row.fecha_pago,
    fecha_vencimiento: row.fecha_vencimiento,
  };
}

function buildList(
  row: ListaRow,
  itemRows: ItemRow[],
  pagoRows: PagoRow[],
): MercadoLista {
  const items = itemRows.map(mapItem);
  const pagos = pagoRows.map(mapPago);
  const presupuesto =
    row.presupuesto === null ? null : Number(row.presupuesto);
  const total = Number(row.total);
  const summary = buildListSummary(total, presupuesto, pagos);

  return {
    id: row.id,
    nombre: row.nombre,
    estado: row.estado,
    presupuesto,
    total: summary.total,
    pagado: summary.pagado,
    saldo: summary.saldo,
    diferencia: summary.diferencia,
    estado_pago: summary.estado_pago,
    fecha_vencimiento: summary.fecha_vencimiento,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pagos,
    items,
  };
}

export async function fetchMercadoListas(): Promise<MercadoLista[]> {
  const listRows = await dbQuery<ListaRow>(
    `SELECT id, nombre, estado, presupuesto, total, created_at, updated_at
     FROM mercado_listas
     ORDER BY created_at DESC, id DESC`,
  );

  if (listRows.length === 0) return [];

  const [itemRows, pagoRows] = await Promise.all([
    dbQuery<ItemRow>(
      `SELECT id, lista_id, producto_id, nombre_producto, tienda_id,
              tienda_nombre, precio_unitario, cantidad, unidad
       FROM mercado_lista_items
       ORDER BY id ASC`,
    ),
    dbQuery<PagoRow>(
      `SELECT id, lista_id, tipo, porcentaje, monto, fecha_pago, fecha_vencimiento
       FROM mercado_pagos
       ORDER BY fecha_pago ASC, id ASC`,
    ),
  ]);

  const itemsByList = new Map<number, ItemRow[]>();
  for (const item of itemRows) {
    const list = itemsByList.get(item.lista_id) ?? [];
    list.push(item);
    itemsByList.set(item.lista_id, list);
  }

  const paymentsByList = new Map<number, PagoRow[]>();
  for (const pago of pagoRows) {
    const list = paymentsByList.get(pago.lista_id) ?? [];
    list.push(pago);
    paymentsByList.set(pago.lista_id, list);
  }

  return listRows.map((row) =>
    buildList(
      row,
      itemsByList.get(row.id) ?? [],
      paymentsByList.get(row.id) ?? [],
    ),
  );
}

export async function fetchMercadoLista(
  listId: number,
): Promise<MercadoLista | null> {
  const listRows = await dbQuery<ListaRow>(
    `SELECT id, nombre, estado, presupuesto, total, created_at, updated_at
     FROM mercado_listas
     WHERE id = ?`,
    [listId],
  );

  if (listRows.length === 0) return null;

  const [itemRows, pagoRows] = await Promise.all([
    dbQuery<ItemRow>(
      `SELECT id, lista_id, producto_id, nombre_producto, tienda_id,
              tienda_nombre, precio_unitario, cantidad, unidad
       FROM mercado_lista_items
       WHERE lista_id = ?
       ORDER BY id ASC`,
      [listId],
    ),
    dbQuery<PagoRow>(
      `SELECT id, lista_id, tipo, porcentaje, monto, fecha_pago, fecha_vencimiento
       FROM mercado_pagos
       WHERE lista_id = ?
       ORDER BY fecha_pago ASC, id ASC`,
      [listId],
    ),
  ]);

  return buildList(listRows[0], itemRows, pagoRows);
}
