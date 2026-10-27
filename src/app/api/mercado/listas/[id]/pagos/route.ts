import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { dbTransaction } from "@/lib/db";
import { parsePaymentInput, roundMoney } from "@/lib/mercado";

class ValidationError extends Error {}

function parseId(id: string): number | null {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/mercado/listas/[id]/pagos">,
) {
  try {
    const { id } = await ctx.params;
    const listId = parseId(id);
    if (listId === null) {
      return NextResponse.json(
        { error: "Identificador de lista no válido" },
        { status: 400 },
      );
    }

    const body = await request.json();

    await dbTransaction(async (connection) => {
      const [listRows] = await connection.execute<RowDataPacket[]>(
        "SELECT total FROM mercado_listas WHERE id = ? FOR UPDATE",
        [listId],
      );
      if (listRows.length === 0) {
        throw new ValidationError("Lista no encontrada");
      }

      const [paymentRows] = await connection.execute<RowDataPacket[]>(
        "SELECT tipo, monto, fecha_vencimiento FROM mercado_pagos WHERE lista_id = ?",
        [listId],
      );

      const total = Number((listRows[0] as { total: string }).total);
      const paid = roundMoney(
        paymentRows.reduce(
          (sum, row) => sum + Number((row as { monto: string }).monto),
          0,
        ),
      );
      const pending = roundMoney(Math.max(total - paid, 0));

      const parsed = parsePaymentInput(body, {
        total,
        pending,
        hasPayments: paymentRows.length > 0,
      });
      if (!parsed.ok) {
        throw new ValidationError(parsed.error);
      }

      const pago = parsed.value;
      await connection.execute(
        `INSERT INTO mercado_pagos
           (lista_id, tipo, porcentaje, monto, fecha_pago, fecha_vencimiento)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          listId,
          pago.tipo,
          pago.porcentaje,
          pago.monto,
          pago.fecha_pago,
          pago.fecha_vencimiento,
        ],
      );
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      const status = error.message === "Lista no encontrada" ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Error al registrar el pago" },
      { status: 500 },
    );
  }
}
