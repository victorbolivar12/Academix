import { NextResponse } from "next/server";
import { dbExecute, dbQuery, type DbParam } from "@/lib/db";
import { buildMesCondition } from "@/lib/academix";
import { getMonthIndex, parseSidorInput } from "@/lib/sidor";
import type { SidorListResponse, SidorPago } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const titulo = searchParams.get("titulo");

    const conditions: string[] = [];
    const params: DbParam[] = [];

    const mesCondition = buildMesCondition(mes, "mes");
    if (mesCondition.clause) {
      conditions.push(mesCondition.clause);
      params.push(...mesCondition.params);
    }
    if (titulo) {
      conditions.push("titulo LIKE ?");
      params.push(`%${titulo}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const records = await dbQuery<SidorPago>(
      `SELECT id, titulo, monto, mes, fecha_pago
       FROM pagos_sidor
       ${where}
       ORDER BY fecha_pago DESC, id DESC`,
      params,
    );

    const monthRows = await dbQuery<{ mes: string }>(
      "SELECT DISTINCT mes FROM pagos_sidor",
    );
    const months = monthRows
      .map((row) => row.mes)
      .filter(Boolean)
      .sort((a, b) => {
        const indexA = getMonthIndex(a);
        const indexB = getMonthIndex(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

    const summaryRows = await dbQuery<{ total: number; monthTotal: string | null }>(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(monto), 0) AS monthTotal
       FROM pagos_sidor
       ${mesCondition.clause ? `WHERE ${mesCondition.clause}` : ""}`,
      mesCondition.params,
    );

    const response: SidorListResponse = {
      records,
      months,
      monthCount: Number(summaryRows[0]?.total ?? 0),
      monthTotal: Number(summaryRows[0]?.monthTotal ?? 0),
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener los pagos de Sidor" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseSidorInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { value } = parsed;
    const result = await dbExecute(
      `INSERT INTO pagos_sidor (titulo, monto, mes, fecha_pago)
       VALUES (?, ?, ?, ?)`,
      [value.titulo, value.monto, value.mes, value.fecha_pago],
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al guardar el pago" },
      { status: 500 },
    );
  }
}
