import { NextResponse } from "next/server";
import { dbExecute, dbQuery } from "@/lib/db";
import { isMysqlError, parseTiendaInput } from "@/lib/mercado";
import type { MercadoTienda } from "@/lib/types";

export async function GET() {
  try {
    const tiendas = await dbQuery<MercadoTienda>(
      "SELECT id, nombre FROM mercado_tiendas ORDER BY nombre ASC",
    );
    return NextResponse.json({ tiendas });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener las tiendas" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseTiendaInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await dbExecute(
      "INSERT INTO mercado_tiendas (nombre) VALUES (?)",
      [parsed.value.nombre],
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY")) {
      return NextResponse.json(
        { error: "Ya existe una tienda con ese nombre" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Error al guardar la tienda" },
      { status: 500 },
    );
  }
}
