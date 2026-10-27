import { NextResponse } from "next/server";
import { dbExecute } from "@/lib/db";
import { isMysqlError, parseCategoriaInput } from "@/lib/mercado";

function parseId(id: string): number | null {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/mercado/categorias/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const categoryId = parseId(id);
    if (categoryId === null) {
      return NextResponse.json(
        { error: "Identificador de categoría no válido" },
        { status: 400 },
      );
    }

    const parsed = parseCategoriaInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await dbExecute(
      "UPDATE mercado_categorias SET nombre = ? WHERE id = ?",
      [parsed.value.nombre, categoryId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY")) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar la categoría" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/mercado/categorias/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const categoryId = parseId(id);
    if (categoryId === null) {
      return NextResponse.json(
        { error: "Identificador de categoría no válido" },
        { status: 400 },
      );
    }

    const result = await dbExecute(
      "DELETE FROM mercado_categorias WHERE id = ?",
      [categoryId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isMysqlError(error, "ER_ROW_IS_REFERENCED_2")) {
      return NextResponse.json(
        { error: "No se puede eliminar: la categoría tiene productos asociados" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Error al eliminar la categoría" },
      { status: 500 },
    );
  }
}
