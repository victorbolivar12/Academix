import { NextResponse } from "next/server";
import {
  computeCalories,
  parseAlimentacionRegistroInput,
} from "@/lib/alimentacion";
import {
  mapAlimento,
  mapRegistro,
  resolveAlimento,
  type AlimentacionAlimentoRow,
  type AlimentacionRegistroRow,
} from "@/lib/alimentacion-server";
import { dbExecute, dbQuery, type DbParam } from "@/lib/db";
import { isValidIsoDate } from "@/lib/meta";
import type { AlimentacionResponse } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    if (desde && !isValidIsoDate(desde)) {
      return NextResponse.json(
        { error: "La fecha inicial no es válida" },
        { status: 400 },
      );
    }
    if (hasta && !isValidIsoDate(hasta)) {
      return NextResponse.json(
        { error: "La fecha final no es válida" },
        { status: 400 },
      );
    }

    const conditions: string[] = [];
    const params: DbParam[] = [];

    if (desde) {
      conditions.push("fecha >= ?");
      params.push(desde);
    }
    if (hasta) {
      conditions.push("fecha <= ?");
      params.push(hasta);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const alimentoRows = await dbQuery<AlimentacionAlimentoRow>(
      `SELECT id, nombre, categoria, calorias_por_100g
       FROM alimentacion_alimentos
       ORDER BY categoria ASC, nombre ASC`,
    );

    const registroRows = await dbQuery<AlimentacionRegistroRow>(
      `SELECT id, fecha, tipo_comida, alimento_id, nombre, calorias_por_100g,
              gramos, calorias, created_at, updated_at
       FROM alimentacion_registros
       ${where}
       ORDER BY fecha ASC, FIELD(tipo_comida, 'desayuno', 'almuerzo', 'cena'), id ASC`,
      params,
    );

    const response: AlimentacionResponse = {
      alimentos: alimentoRows.map(mapAlimento),
      registros: registroRows.map(mapRegistro),
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener la información de alimentación" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseAlimentacionRegistroInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { value } = parsed;
    const resolved = await resolveAlimento(value.alimento_id ?? 0, {
      nombre: value.nombre,
      calorias_por_100g: value.calorias_por_100g,
    });

    if (!resolved) {
      return NextResponse.json(
        { error: "El alimento seleccionado no existe" },
        { status: 400 },
      );
    }

    const calorias = computeCalories(resolved.calorias_por_100g, value.gramos);

    const result = await dbExecute(
      `INSERT INTO alimentacion_registros
         (fecha, tipo_comida, alimento_id, nombre, calorias_por_100g, gramos, calorias)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        value.fecha,
        value.tipo_comida,
        value.alimento_id,
        resolved.nombre,
        resolved.calorias_por_100g,
        value.gramos,
        calorias,
      ],
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al guardar la comida" },
      { status: 500 },
    );
  }
}
