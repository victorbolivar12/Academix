import { NextResponse } from "next/server";
import { dbExecute, dbQuery, type DbParam } from "@/lib/db";
import {
  parseMetaCompletado,
  parseMetaFecha,
  parseMetaNombre,
  parseMetaPrecio,
} from "@/lib/meta";

function parseId(id: string): number | null {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/metas/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const metaId = parseId(id);
    if (metaId === null) {
      return NextResponse.json(
        { error: "Identificador de meta no válido" },
        { status: 400 },
      );
    }

    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const updates: string[] = [];
    const params: DbParam[] = [];

    if ("nombre" in data) {
      const parsed = parseMetaNombre(data.nombre);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      updates.push("nombre = ?");
      params.push(parsed.value);
    }

    if ("precio" in data) {
      const parsed = parseMetaPrecio(data.precio);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      updates.push("precio = ?");
      params.push(parsed.value);
    }

    if ("fecha_compra" in data) {
      const parsed = parseMetaFecha(data.fecha_compra);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      updates.push("fecha_compra = ?");
      params.push(parsed.value);
    }

    if ("completado" in data) {
      const parsed = parseMetaCompletado(data.completado);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      updates.push("completado = ?");
      params.push(parsed.value ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No hay cambios para guardar" },
        { status: 400 },
      );
    }

    params.push(metaId);
    const result = await dbExecute(
      `UPDATE metas SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    if (result.affectedRows === 0) {
      const existing = await dbQuery<{ id: number }>(
        "SELECT id FROM metas WHERE id = ?",
        [metaId],
      );
      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Meta no encontrada" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar la meta" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/metas/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const metaId = parseId(id);
    if (metaId === null) {
      return NextResponse.json(
        { error: "Identificador de meta no válido" },
        { status: 400 },
      );
    }

    const result = await dbExecute("DELETE FROM metas WHERE id = ?", [metaId]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Meta no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar la meta" },
      { status: 500 },
    );
  }
}
