import { NextResponse } from "next/server";
import { dbExecute } from "@/lib/db";
import { isMysqlError, parseProductoInput } from "@/lib/mercado";

function parseId(id: string): number | null {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/mercado/productos/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const productId = parseId(id);
    if (productId === null) {
      return NextResponse.json(
        { error: "Identificador de producto no válido" },
        { status: 400 },
      );
    }

    const parsed = parseProductoInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { value } = parsed;
    const result = await dbExecute(
      `UPDATE mercado_productos
       SET nombre = ?, categoria_id = ?, unidad = ?, activo = ?
       WHERE id = ?`,
      [value.nombre, value.categoria_id, value.unidad, value.activo, productId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY")) {
      return NextResponse.json(
        { error: "Ya existe un producto con ese nombre en la categoría" },
        { status: 409 },
      );
    }
    if (isMysqlError(error, "ER_NO_REFERENCED_ROW_2")) {
      return NextResponse.json(
        { error: "La categoría seleccionada no existe" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar el producto" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/mercado/productos/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const productId = parseId(id);
    if (productId === null) {
      return NextResponse.json(
        { error: "Identificador de producto no válido" },
        { status: 400 },
      );
    }

    const result = await dbExecute(
      "DELETE FROM mercado_productos WHERE id = ?",
      [productId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el producto" },
      { status: 500 },
    );
  }
}
