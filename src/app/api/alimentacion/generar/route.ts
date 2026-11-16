import { NextResponse } from "next/server";
import { addDays } from "@/lib/alimentacion";
import {
  generateWeekPlan,
  type GeneratorFood,
} from "@/lib/alimentacion-generator";
import { dbQuery, dbTransaction } from "@/lib/db";
import { isValidIsoDate } from "@/lib/meta";

interface AlimentoRow {
  id: number;
  nombre: string;
  categoria: string;
  calorias_por_100g: string;
}

function buildDays(desde: string, hasta: string): string[] {
  const days: string[] = [];
  let current = desde;
  while (current <= hasta && days.length < 8) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const desde = data.desde;
    const hasta = data.hasta;

    if (typeof desde !== "string" || !isValidIsoDate(desde)) {
      return NextResponse.json(
        { error: "La fecha inicial no es válida" },
        { status: 400 },
      );
    }
    if (typeof hasta !== "string" || !isValidIsoDate(hasta)) {
      return NextResponse.json(
        { error: "La fecha final no es válida" },
        { status: 400 },
      );
    }

    const days = buildDays(desde, hasta);
    if (days.length === 0 || days.length > 7) {
      return NextResponse.json(
        { error: "El rango debe ser de máximo 7 días" },
        { status: 400 },
      );
    }

    const rows = await dbQuery<AlimentoRow>(
      `SELECT id, nombre, categoria, calorias_por_100g
       FROM alimentacion_alimentos
       ORDER BY id ASC`,
    );

    const foods: GeneratorFood[] = rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      categoria: row.categoria,
      calorias_por_100g: Number(row.calorias_por_100g),
    }));

    const generated = generateWeekPlan(foods, days);
    if (!generated.ok) {
      return NextResponse.json({ error: generated.error }, { status: 400 });
    }

    const total = await dbTransaction(async (connection) => {
      await connection.execute(
        `DELETE FROM alimentacion_registros WHERE fecha BETWEEN ? AND ?`,
        [desde, hasta],
      );

      const records = generated.records;
      const placeholders = records
        .map(() => "(?, ?, ?, ?, ?, ?, ?)")
        .join(", ");
      const params = records.flatMap((record) => [
        record.fecha,
        record.tipo_comida,
        record.alimento_id,
        record.nombre,
        record.calorias_por_100g,
        record.gramos,
        record.calorias,
      ]);

      await connection.execute(
        `INSERT INTO alimentacion_registros
           (fecha, tipo_comida, alimento_id, nombre, calorias_por_100g, gramos, calorias)
         VALUES ${placeholders}`,
        params,
      );

      return records.length;
    });

    return NextResponse.json({ ok: true, total });
  } catch {
    return NextResponse.json(
      { error: "Error al generar las comidas" },
      { status: 500 },
    );
  }
}
