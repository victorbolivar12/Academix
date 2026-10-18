import { NextResponse } from "next/server";
import { dbExecute } from "@/lib/db";
import { buildMesCondition } from "@/lib/academix";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { mes?: unknown };
    const rawMes: unknown = body.mes;
    const mes = typeof rawMes === "string" ? rawMes.trim() : "";

    if (!mes) {
      return NextResponse.json(
        { error: "Selecciona un mes para marcar los pagos" },
        { status: 400 },
      );
    }

    const { clause, params } = buildMesCondition(mes);
    const mesWhere = clause || "1 = 0";

    const result = await dbExecute(
      `UPDATE registros_trabajos
       SET estado_pago = 'Listo'
       WHERE ${mesWhere}
         AND estado = 'listo'
         AND estado_pago = 'pendiente'`,
      params,
    );

    return NextResponse.json({ updated: result.affectedRows });
  } catch {
    return NextResponse.json(
      { error: "Error al marcar los pagos del mes" },
      { status: 500 },
    );
  }
}
