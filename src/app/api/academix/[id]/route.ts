import { NextResponse } from "next/server";
import { dbExecute, type DbParam } from "@/lib/db";
import { parseRecordInput } from "@/lib/academix";

function isValidId(id: string): number | null {
  const recordId = Number(id);
  if (!Number.isInteger(recordId) || recordId <= 0) return null;
  return recordId;
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/academix/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const recordId = isValidId(id);
    if (recordId === null) {
      return NextResponse.json(
        { error: "Identificador de registro no válido" },
        { status: 400 },
      );
    }

    const parsed = parseRecordInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { value } = parsed;
    const result = await dbExecute(
      `UPDATE registros_trabajos
       SET codigo = ?, titulo = ?, fecha_entrega_real = ?, hora = ?, comentario = ?,
           precio = ?, porcentaje = ?, estado = ?, estado_pago = ?
       WHERE id = ?`,
      [
        value.codigo,
        value.titulo,
        value.fecha_entrega_real,
        value.hora,
        value.comentario,
        value.precio,
        value.precio * 0.75,
        value.estado,
        value.estado_pago,
        recordId,
      ],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar el registro" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/academix/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const recordId = isValidId(id);
    if (recordId === null) {
      return NextResponse.json(
        { error: "Identificador de registro no válido" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      estado?: unknown;
      estado_pago?: unknown;
    };

    const fields: string[] = [];
    const values: DbParam[] = [];

    if (typeof body.estado === "string" && body.estado.trim()) {
      fields.push("estado = ?");
      values.push(body.estado.trim());
    }
    if (typeof body.estado_pago === "string" && body.estado_pago.trim()) {
      fields.push("estado_pago = ?");
      values.push(body.estado_pago.trim());
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No se enviaron campos para actualizar" },
        { status: 400 },
      );
    }

    const result = await dbExecute(
      `UPDATE registros_trabajos SET ${fields.join(", ")} WHERE id = ?`,
      [...values, recordId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar el estado" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/academix/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const recordId = isValidId(id);
    if (recordId === null) {
      return NextResponse.json(
        { error: "Identificador de registro no válido" },
        { status: 400 },
      );
    }

    const result = await dbExecute(
      "DELETE FROM registros_trabajos WHERE id = ?",
      [recordId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el registro" },
      { status: 500 },
    );
  }
}
