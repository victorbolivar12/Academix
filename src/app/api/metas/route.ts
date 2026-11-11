import { NextResponse } from "next/server";
import { dbExecute, dbQuery } from "@/lib/db";
import { parseMetaInput } from "@/lib/meta";
import type { MetaItem } from "@/lib/types";

interface MetaRow {
  id: number;
  nombre: string;
  precio: string;
  fecha_compra: string;
  completado: number | boolean;
  created_at: string;
  updated_at: string;
}

function mapMeta(row: MetaRow): MetaItem {
  return {
    id: row.id,
    nombre: row.nombre,
    precio: Number(row.precio),
    fecha_compra: row.fecha_compra,
    completado: Boolean(row.completado),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET() {
  try {
    const rows = await dbQuery<MetaRow>(
      `SELECT id, nombre, precio, fecha_compra, completado, created_at, updated_at
       FROM metas
       ORDER BY completado ASC, fecha_compra ASC, id ASC`,
    );

    return NextResponse.json({ items: rows.map(mapMeta) });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener las metas" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseMetaInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { value } = parsed;
    const result = await dbExecute(
      `INSERT INTO metas (nombre, precio, fecha_compra, completado)
       VALUES (?, ?, ?, ?)`,
      [value.nombre, value.precio, value.fecha_compra, value.completado],
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al guardar la meta" },
      { status: 500 },
    );
  }
}
