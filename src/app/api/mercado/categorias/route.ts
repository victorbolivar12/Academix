import { NextResponse } from "next/server";
import { dbExecute, dbQuery } from "@/lib/db";
import { isMysqlError, parseCategoriaInput } from "@/lib/mercado";
import type { MercadoCategoria } from "@/lib/types";

export async function GET() {
  try {
    const categorias = await dbQuery<MercadoCategoria>(
      "SELECT id, nombre FROM mercado_categorias ORDER BY nombre ASC",
    );
    return NextResponse.json({ categorias });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener las categorías" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseCategoriaInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await dbExecute(
      "INSERT INTO mercado_categorias (nombre) VALUES (?)",
      [parsed.value.nombre],
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY")) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Error al guardar la categoría" },
      { status: 500 },
    );
  }
}
