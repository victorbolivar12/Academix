import { NextResponse } from "next/server";
import {
  computeCalories,
  parseAlimentacionRegistroInput,
} from "@/lib/alimentacion";
import { resolveAlimento } from "@/lib/alimentacion-server";
import { dbExecute, dbQuery } from "@/lib/db";

function parseId(id: string): number | null {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/alimentacion/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const registroId = parseId(id);
    if (registroId === null) {
      return NextResponse.json(
        { error: "Identificador de comida no válido" },
        { status: 400 },
      );
    }

    const parsed = parseAlimentacionRegistroInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const existing = await dbQuery<{ id: number }>(
      "SELECT id FROM alimentacion_registros WHERE id = ?",
      [registroId],
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Comida no encontrada" },
        { status: 404 },
      );
    }

    const { value } = parsed;
    const resolved = await resolveAlimento(value.alimento_id ?? 0, {
      nombre: value.nombre,
      calorias_por_100g: value.calorias_por_100g,
    });

    if (!resolved) {
      return NextResponse.json(
        { error: "El alimento seleccionado no existe" },
        { status: 400 },
      );
    }

    const calorias = computeCalories(resolved.calorias_por_100g, value.gramos);

    await dbExecute(
      `UPDATE alimentacion_registros
       SET fecha = ?, tipo_comida = ?, alimento_id = ?, nombre = ?,
           calorias_por_100g = ?, gramos = ?, calorias = ?
       WHERE id = ?`,
      [
        value.fecha,
        value.tipo_comida,
        value.alimento_id,
        resolved.nombre,
        resolved.calorias_por_100g,
        value.gramos,
        calorias,
        registroId,
      ],
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar la comida" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/alimentacion/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const registroId = parseId(id);
    if (registroId === null) {
      return NextResponse.json(
        { error: "Identificador de comida no válido" },
        { status: 400 },
      );
    }

    const result = await dbExecute(
      "DELETE FROM alimentacion_registros WHERE id = ?",
      [registroId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Comida no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar la comida" },
      { status: 500 },
    );
  }
}
