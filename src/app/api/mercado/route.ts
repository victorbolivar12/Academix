import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { withConnection } from "@/lib/db";
import { fetchMercadoListas } from "@/lib/mercado-server";
import type {
  MercadoCatalogoResponse,
  MercadoCategoria,
  MercadoPrecio,
  MercadoProducto,
  MercadoTienda,
} from "@/lib/types";

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

export async function GET() {
  try {
    const response = await withConnection<MercadoCatalogoResponse>(
      async (connection) => {
        // Ejecución secuencial en una única conexión para respetar max_user_connections = 5
        const [catRows] = await connection.execute<RowDataPacket[]>(
          "SELECT id, nombre FROM mercado_categorias ORDER BY nombre ASC",
        );
        const [tiendaRows] = await connection.execute<RowDataPacket[]>(
          "SELECT id, nombre FROM mercado_tiendas ORDER BY nombre ASC",
        );
        const [prodRows] = await connection.execute<RowDataPacket[]>(
          `SELECT p.id, p.nombre, p.categoria_id, c.nombre AS categoria_nombre,
                  p.unidad, p.activo
           FROM mercado_productos p
           INNER JOIN mercado_categorias c ON c.id = p.categoria_id
           ORDER BY p.nombre ASC`,
        );
        const [priceRowsResult] = await connection.execute<RowDataPacket[]>(
          `SELECT pr.id, pr.producto_id, pr.tienda_id, t.nombre AS tienda_nombre,
                  pr.precio, pr.actualizado_en
           FROM mercado_precios pr
           LEFT JOIN mercado_tiendas t ON t.id = pr.tienda_id
           ORDER BY t.nombre ASC`,
        );

        // Obtenemos también las listas en la misma conexión sin abrir otra
        const listas = await fetchMercadoListas(connection);

        const priceRows = priceRowsResult as unknown as PriceRow[];
        const productRows = prodRows as unknown as ProductRow[];

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

        return {
          categorias: catRows as unknown as MercadoCategoria[],
          tiendas: tiendaRows as unknown as MercadoTienda[],
          productos,
          listas,
        };
      },
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error detallado al obtener el catálogo:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      {
        error: "Error al obtener el catálogo de Mercado",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}