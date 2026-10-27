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
      const [listResult] = await connection.execute(
        `INSERT INTO mercado_listas (nombre, estado, presupuesto, total)
         VALUES (?, 'pendiente', ?, ?)`,
        [value.nombre, value.presupuesto, total],
      );

      const insertId = (listResult as { insertId: number }).insertId;

      for (const item of value.items) {
        const [rows] = await connection.execute<RowDataPacket[]>(
          `SELECT p.nombre, p.unidad
           FROM mercado_productos p
           WHERE p.id = ?`,
          [item.producto_id],
        );
        if (rows.length === 0) {
          throw new ValidationError(
            "Uno de los productos seleccionados ya no existe",
          );
        }

        const product = rows[0] as { nombre: string; unidad: string };
        let storeName: string | null = null;
        if (item.tienda_id !== null) {
          const [storeRows] = await connection.execute<RowDataPacket[]>(
            "SELECT nombre FROM mercado_tiendas WHERE id = ?",
            [item.tienda_id],
          );
          if (storeRows.length === 0) {
            throw new ValidationError(
              "Una de las tiendas seleccionadas ya no existe",
            );
          }
          storeName = (storeRows[0] as { nombre: string }).nombre;
        }

        await connection.execute(
          `INSERT INTO mercado_lista_items
             (lista_id, producto_id, nombre_producto, tienda_id, tienda_nombre,
              precio_unitario, cantidad, unidad)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            insertId,
            item.producto_id,
            product.nombre,
            item.tienda_id,
            storeName,
            item.precio_unitario,
            item.cantidad,
            product.unidad,
          ],
        );
      }

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
