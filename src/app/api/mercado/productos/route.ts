import { NextResponse } from "next/server";
import { dbExecute, dbQuery, type DbParam } from "@/lib/db";
import { isMysqlError, parseProductoInput } from "@/lib/mercado";
import type { MercadoPrecio, MercadoProducto } from "@/lib/types";

interface ProductRow {
  id: number;
  nombre: string;
  categoria_id: number;
  categoria_nombre: string;
  unidad: string;
  activo: number | boolean;
}

interface PriceRow {
  id: number;
  producto_id: number;
  tienda_id: number | null;
  tienda_nombre: string | null;
  precio: string;
  actualizado_en: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda");
    const categoria = Number(searchParams.get("categoria_id"));

    const conditions: string[] = [];
    const params: DbParam[] = [];

    if (busqueda) {
      conditions.push("p.nombre LIKE ?");
      params.push(`%${busqueda}%`);
    }

    if (Number.isInteger(categoria) && categoria > 0) {
      conditions.push("p.categoria_id = ?");
      params.push(categoria);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [productRows, priceRows] = await Promise.all([
      dbQuery<ProductRow>(
        `SELECT p.id, p.nombre, p.categoria_id, c.nombre AS categoria_nombre,
                p.unidad, p.activo
         FROM mercado_productos p
         INNER JOIN mercado_categorias c ON c.id = p.categoria_id
         ${where}
         ORDER BY p.nombre ASC`,
        params,
      ),
      dbQuery<PriceRow>(
        `SELECT pr.id, pr.producto_id, pr.tienda_id, t.nombre AS tienda_nombre,
                pr.precio, pr.actualizado_en
         FROM mercado_precios pr
         LEFT JOIN mercado_tiendas t ON t.id = pr.tienda_id
         ORDER BY t.nombre ASC`,
      ),
    ]);

    const pricesByProduct = new Map<number, MercadoPrecio[]>();
    for (const row of priceRows) {
      const price: MercadoPrecio = {
        id: row.id,
        producto_id: row.producto_id,
        tienda_id: row.tienda_id,
        tienda_nombre: row.tienda_nombre,
        precio: Number(row.precio),
        actualizado_en: row.actualizado_en,
      };
      const list = pricesByProduct.get(row.producto_id) ?? [];
      list.push(price);
      pricesByProduct.set(row.producto_id, list);
    }

    const productos: MercadoProducto[] = productRows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      categoria_id: row.categoria_id,
      categoria_nombre: row.categoria_nombre,
      unidad: row.unidad,
      activo: Boolean(row.activo),
      precios: (pricesByProduct.get(row.id) ?? []).sort(
        (a, b) => a.precio - b.precio,
      ),
    }));

    return NextResponse.json({ productos });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseProductoInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { value } = parsed;
    const result = await dbExecute(
      `INSERT INTO mercado_productos (nombre, categoria_id, unidad, activo)
       VALUES (?, ?, ?, ?)`,
      [value.nombre, value.categoria_id, value.unidad, value.activo],
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
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
      { error: "Error al guardar el producto" },
      { status: 500 },
    );
  }
}
