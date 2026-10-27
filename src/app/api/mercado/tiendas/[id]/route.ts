import { NextResponse } from "next/server";
import { dbExecute } from "@/lib/db";
import { isMysqlError, parseTiendaInput } from "@/lib/mercado";

function parseId(id: string): number | null {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/mercado/tiendas/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const storeId = parseId(id);
    if (storeId === null) {
      return NextResponse.json(
        { error: "Identificador de tienda no válido" },
        { status: 400 },
      );
    }

    const parsed = parseTiendaInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await dbExecute(
      "UPDATE mercado_tiendas SET nombre = ? WHERE id = ?",
      [parsed.value.nombre, storeId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY")) {
      return NextResponse.json(
        { error: "Ya existe una tienda con ese nombre" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar la tienda" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/mercado/tiendas/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const storeId = parseId(id);
    if (storeId === null) {
      return NextResponse.json(
        { error: "Identificador de tienda no válido" },
        { status: 400 },
      );
    }

    const result = await dbExecute("DELETE FROM mercado_tiendas WHERE id = ?", [
      storeId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar la tienda" },
      { status: 500 },
    );
  }
}
