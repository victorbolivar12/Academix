import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2/promise";
import { dbExecute, dbQuery, dbTransaction } from "@/lib/db";
import { isMysqlError, parsePrecioInput } from "@/lib/mercado";

function parseId(id: string): number | null {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/mercado/productos/[id]/precios">,
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

    const parsed = parsePrecioInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const products = await dbQuery<{ id: number }>(
      "SELECT id FROM mercado_productos WHERE id = ?",
      [productId],
    );
    if (products.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    const { value } = parsed;
    const result =
      value.tienda_id === null
        ? await dbTransaction(async (connection) => {
            await connection.execute(
              `DELETE FROM mercado_precios
               WHERE producto_id = ? AND tienda_id IS NULL`,
              [productId],
            );
            const [inserted] = await connection.execute<ResultSetHeader>(
              `INSERT INTO mercado_precios (producto_id, tienda_id, precio)
               VALUES (?, NULL, ?)`,
              [productId, value.precio],
            );
            return inserted;
          })
        : await dbExecute(
            `INSERT INTO mercado_precios (producto_id, tienda_id, precio)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE precio = VALUES(precio)`,
            [productId, value.tienda_id, value.precio],
          );

    return NextResponse.json({ id: result.insertId, ok: true });
  } catch (error) {
    if (isMysqlError(error, "ER_NO_REFERENCED_ROW_2")) {
      return NextResponse.json(
        { error: "La tienda seleccionada no existe" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Error al guardar el precio" },
      { status: 500 },
    );
  }
}
