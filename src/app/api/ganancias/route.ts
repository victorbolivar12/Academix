import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { normalizeMonthKey } from "@/lib/ganancias";
import { getMonthIndex } from "@/lib/sidor";
import type { GananciasMonth, GananciasResponse } from "@/lib/types";

interface GroupRow {
  mes: string;
  total: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mesFilter = searchParams.get("mes");

    const academixRows = await dbQuery<GroupRow>(
      `SELECT mes_registro AS mes,
              COALESCE(SUM(precio), 0) * 0.75 AS total
       FROM registros_trabajos
       WHERE estado = 'listo' AND estado_pago = 'listo'
       GROUP BY mes_registro`,
    );

    const sidorRows = await dbQuery<GroupRow>(
      `SELECT mes,
              COALESCE(SUM(monto), 0) AS total
       FROM pagos_sidor
       GROUP BY mes`,
    );

    const byMonth = new Map<string, { academix: number; sidor: number }>();

    for (const row of academixRows) {
      const key = normalizeMonthKey(row.mes);
      if (!key) continue;
      const current = byMonth.get(key) ?? { academix: 0, sidor: 0 };
      current.academix += Number(row.total ?? 0);
      byMonth.set(key, current);
    }

    for (const row of sidorRows) {
      const key = normalizeMonthKey(row.mes);
      if (!key) continue;
      const current = byMonth.get(key) ?? { academix: 0, sidor: 0 };
      current.sidor += Number(row.total ?? 0);
      byMonth.set(key, current);
    }

    const series: GananciasMonth[] = Array.from(byMonth.entries())
      .map(([mes, value]) => ({
        mes,
        academix: value.academix,
        sidor: value.sidor,
        total: value.academix + value.sidor,
      }))
      .sort((a, b) => getMonthIndex(a.mes) - getMonthIndex(b.mes));

    const selected: GananciasMonth = mesFilter
      ? (series.find((item) => item.mes === mesFilter) ?? {
          mes: mesFilter,
          academix: 0,
          sidor: 0,
          total: 0,
        })
      : series.reduce<GananciasMonth>(
          (acc, item) => ({
            mes: "",
            academix: acc.academix + item.academix,
            sidor: acc.sidor + item.sidor,
            total: acc.total + item.total,
          }),
          { mes: "", academix: 0, sidor: 0, total: 0 },
        );

    const response: GananciasResponse = {
      months: series.map((item) => item.mes).reverse(),
      series,
      selected,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener el resumen de ganancias" },
      { status: 500 },
    );
  }
}
