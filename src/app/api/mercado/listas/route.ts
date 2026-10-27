import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { dbTransaction } from "@/lib/db";
import {
  parseListaInput,
  parsePaymentInput,
  roundMoney,
} from "@/lib/mercado";
import { fetchMercadoListas } from "@/lib/mercado-server";

class ValidationError extends Error {}

export async function GET() {
  try {
    const listas = await fetchMercadoListas();
    return NextResponse.json({ listas });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener las listas de mercado" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseListaInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { value } = parsed;
    const total = roundMoney(
      value.items.reduce(
        (sum, item) => sum + item.precio_unitario * item.cantidad,
        0,
      ),
    );

    const rawPago = (body as Record<string, unknown>).pago;
    const hasPago = rawPago !== undefined && rawPago !== null;
    const parsedPago = hasPago
      ? parsePaymentInput(rawPago, {
          total,
          pending: total,
          hasPayments: false,
        })
      : null;

    if (parsedPago && !parsedPago.ok) {
      return NextResponse.json({ error: parsedPago.error }, { status: 400 });
    }

    const listId = await dbTransaction(async (connection) => {
      // 1. Validar productos en lote con una sola consulta
      const productIds = Array.from(
        new Set(value.items.map((i) => i.producto_id)),
      );
      const [productRows] = await connection.query<RowDataPacket[]>(
        "SELECT id, nombre, unidad FROM mercado_productos WHERE id IN (?)",
        [productIds],
      );
      const productMap = new Map<number, { nombre: string; unidad: string }>();
      for (const row of productRows as Array<{
        id: number;
        nombre: string;
        unidad: string;
      }>) {
        productMap.set(row.id, { nombre: row.nombre, unidad: row.unidad });
      }

      for (const item of value.items) {
        if (!productMap.has(item.producto_id)) {
          throw new ValidationError(
            "Uno de los productos seleccionados ya no existe",
          );
        }
      }

      // 2. Validar tiendas en lote con una sola consulta
      const storeIds = Array.from(
        new Set(
          value.items
            .map((i) => i.tienda_id)
            .filter((id): id is number => id !== null),
        ),
      );
      const storeMap = new Map<number, string>();
      if (storeIds.length > 0) {
        const [storeRows] = await connection.query<RowDataPacket[]>(
          "SELECT id, nombre FROM mercado_tiendas WHERE id IN (?)",
          [storeIds],
        );
        for (const row of storeRows as Array<{ id: number; nombre: string }>) {
          storeMap.set(row.id, row.nombre);
        }

        for (const item of value.items) {
          if (item.tienda_id !== null && !storeMap.has(item.tienda_id)) {
            throw new ValidationError(
              "Una de las tiendas seleccionadas ya no existe",
            );
          }
        }
      }

      // 3. Insertar la lista
      const [listResult] = await connection.execute(
        `INSERT INTO mercado_listas (nombre, estado, presupuesto, total)
         VALUES (?, 'pendiente', ?, ?)`,
        [value.nombre, value.presupuesto, total],
      );

      const insertId = (listResult as { insertId: number }).insertId;

      // 4. Inserción de todos los items en lote con una sola consulta
      const itemValues = value.items.map((item) => {
        const product = productMap.get(item.producto_id)!;
        const storeName =
          item.tienda_id !== null ? (storeMap.get(item.tienda_id) ?? null) : null;
        return [
          insertId,
          item.producto_id,
          product.nombre,
          item.tienda_id,
          storeName,
          item.precio_unitario,
          item.cantidad,
          product.unidad,
        ];
      });

      await connection.query(
        `INSERT INTO mercado_lista_items
           (lista_id, producto_id, nombre_producto, tienda_id, tienda_nombre,
            precio_unitario, cantidad, unidad)
         VALUES ?`,
        [itemValues],
      );

      if (parsedPago?.ok) {
        const pago = parsedPago.value;
        await connection.execute(
          `INSERT INTO mercado_pagos
             (lista_id, tipo, porcentaje, monto, fecha_pago, fecha_vencimiento)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            insertId,
            pago.tipo,
            pago.porcentaje,
            pago.monto,
            pago.fecha_pago,
            pago.fecha_vencimiento,
          ],
        );
      }

      return insertId;
    });

    return NextResponse.json({ id: listId }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al guardar la lista de mercado" },
      { status: 500 },
    );
  }
}
