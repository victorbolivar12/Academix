import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { dbExecute, withConnection, type DbParam } from "@/lib/db";
import { buildMesCondition, parseRecordInput } from "@/lib/academix";
import type {
  AcademixListResponse,
  AcademixRecord,
  AcademixStats,
} from "@/lib/types";

interface StatsRow {
  acumulado: string | null;
  totalAcademia: string | null;
}

function buildConditions(searchParams: URLSearchParams): {
  where: string;
  params: DbParam[];
} {
  const conditions: string[] = [];
  const params: DbParam[] = [];

  const codigo = searchParams.get("codigo");
  const titulo = searchParams.get("titulo");
  const fecha = searchParams.get("fecha");

  const mesCondition = buildMesCondition(searchParams.get("mes"));
  if (mesCondition.clause) {
    conditions.push(mesCondition.clause);
    params.push(...mesCondition.params);
  }
  if (codigo) {
    conditions.push("codigo LIKE ?");
    params.push(`%${codigo}%`);
  }
  if (titulo) {
    conditions.push("titulo LIKE ?");
    params.push(`%${titulo}%`);
  }
  if (fecha) {
    conditions.push("fecha_entrega_real = ?");
    params.push(fecha);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { where, params } = buildConditions(searchParams);

    const mesCondition = buildMesCondition(searchParams.get("mes"));

    const { records, months, monthCount, acumulado, totalAcademia } =
      await withConnection(async (conn) => {
        const [recordsResult] = await conn.execute<RowDataPacket[]>(
          `SELECT id, codigo, titulo, fecha_entrega_real, hora, comentario, precio,
                  porcentaje, estado, estado_pago, mes_registro
           FROM registros_trabajos
           ${where}
           ORDER BY fecha_entrega_real DESC, id DESC`,
          params,
        );

        const [monthsResult] = await conn.execute<RowDataPacket[]>(
          `SELECT DISTINCT mes_registro
           FROM registros_trabajos
           ORDER BY mes_registro DESC`,
        );

        const [monthCountResult] = await conn.execute<RowDataPacket[]>(
          `SELECT COUNT(*) AS total
           FROM registros_trabajos
           ${mesCondition.clause ? `WHERE ${mesCondition.clause}` : ""}`,
          mesCondition.params,
        );

        const [statsResult] = await conn.execute<RowDataPacket[]>(
          `SELECT
             COALESCE(SUM(CASE WHEN estado = 'listo' AND estado_pago = 'pendiente' THEN precio END), 0) AS acumulado,
             COALESCE(SUM(CASE WHEN estado = 'listo' AND estado_pago = 'listo' THEN precio END), 0) AS totalAcademia
           FROM registros_trabajos
           ${where}`,
          params,
        );

        const statsRow = statsResult[0] as unknown as StatsRow | undefined;

        return {
          records: recordsResult as unknown as AcademixRecord[],
          months: monthsResult as unknown as Array<{ mes_registro: string }>,
          monthCount: Number(
            (monthCountResult[0] as unknown as { total: number })?.total ?? 0,
          ),
          acumulado: Number(statsRow?.acumulado ?? 0),
          totalAcademia: Number(statsRow?.totalAcademia ?? 0),
        };
      });

    const stats: AcademixStats = {
      acumulado,
      ganancia: acumulado * 0.75,
      totalAcademia,
      totalGanancia: totalAcademia * 0.75,
    };

    const response: AcademixListResponse = {
      records,
      months: months.map((row) => row.mes_registro),
      monthCount,
      stats,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener los datos de Academix" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseRecordInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { value } = parsed;
    const now = new Date();
    const mesRegistro = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const result = await dbExecute(
      `INSERT INTO registros_trabajos
         (codigo, titulo, fecha_entrega_real, hora, comentario, precio, porcentaje, estado, estado_pago, mes_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        value.codigo,
        value.titulo,
        value.fecha_entrega_real,
        value.hora,
        value.comentario,
        value.precio,
        value.precio * 0.75,
        value.estado,
        value.estado_pago,
        mesRegistro,
      ],
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al guardar el registro" },
      { status: 500 },
    );
  }
}
