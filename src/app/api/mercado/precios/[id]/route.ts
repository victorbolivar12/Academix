import { NextResponse } from "next/server";
import { dbExecute } from "@/lib/db";

function parseId(id: string): number | null {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/mercado/precios/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const priceId = parseId(id);
    if (priceId === null) {
      return NextResponse.json(
        { error: "Identificador de precio no válido" },
        { status: 400 },
      );
    }

    const result = await dbExecute("DELETE FROM mercado_precios WHERE id = ?", [
      priceId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Precio no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el precio" },
      { status: 500 },
    );
  }
}
