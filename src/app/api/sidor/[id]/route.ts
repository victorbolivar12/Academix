import { NextResponse } from "next/server";
import { dbExecute } from "@/lib/db";
import { parseSidorInput } from "@/lib/sidor";

function isValidId(id: string): number | null {
  const recordId = Number(id);
  if (!Number.isInteger(recordId) || recordId <= 0) return null;
  return recordId;
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/sidor/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const recordId = isValidId(id);
    if (recordId === null) {
      return NextResponse.json(
        { error: "Identificador de pago no válido" },
        { status: 400 },
      );
    }

    const parsed = parseSidorInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { value } = parsed;
    const result = await dbExecute(
      `UPDATE pagos_sidor
       SET titulo = ?, monto = ?, mes = ?, fecha_pago = ?
       WHERE id = ?`,
      [value.titulo, value.monto, value.mes, value.fecha_pago, recordId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar el pago" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/sidor/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const recordId = isValidId(id);
    if (recordId === null) {
      return NextResponse.json(
        { error: "Identificador de pago no válido" },
        { status: 400 },
      );
    }

    const result = await dbExecute("DELETE FROM pagos_sidor WHERE id = ?", [
      recordId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el pago" },
      { status: 500 },
    );
  }
}
