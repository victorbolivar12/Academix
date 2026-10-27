import { NextResponse } from "next/server";
import { dbExecute, dbQuery, type DbParam } from "@/lib/db";
import {
  MERCADO_LISTA_ESTADOS,
  parsePresupuestoInput,
} from "@/lib/mercado";
import { fetchMercadoLista } from "@/lib/mercado-server";

function parseId(id: string): number | null {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/mercado/listas/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const listId = parseId(id);
    if (listId === null) {
      return NextResponse.json(
        { error: "Identificador de lista no válido" },
        { status: 400 },
      );
    }

    const lista = await fetchMercadoLista(listId);
    if (!lista) {
      return NextResponse.json(
        { error: "Lista no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ lista });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener la lista de mercado" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/mercado/listas/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const listId = parseId(id);
    if (listId === null) {
      return NextResponse.json(
        { error: "Identificador de lista no válido" },
        { status: 400 },
      );
    }

    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const updates: string[] = [];
    const params: DbParam[] = [];

    if ("nombre" in data) {
      if (typeof data.nombre !== "string" || !data.nombre.trim()) {
        return NextResponse.json(
          { error: "El nombre de la lista es obligatorio" },
          { status: 400 },
        );
      }
      const name = data.nombre.trim();
      if (name.length > 150) {
        return NextResponse.json(
          { error: "El nombre no puede tener más de 150 caracteres" },
          { status: 400 },
        );
      }
      updates.push("nombre = ?");
      params.push(name);
    }

    if ("presupuesto" in data) {
      const parsedBudget = parsePresupuestoInput(data.presupuesto);
      if (!parsedBudget.ok) {
        return NextResponse.json(
          { error: parsedBudget.error },
          { status: 400 },
        );
      }
      updates.push("presupuesto = ?");
      params.push(parsedBudget.value);
    }

    if ("estado" in data) {
      if (
        typeof data.estado !== "string" ||
        !MERCADO_LISTA_ESTADOS.includes(
          data.estado as (typeof MERCADO_LISTA_ESTADOS)[number],
        )
      ) {
        return NextResponse.json(
          { error: "Selecciona un estado válido para la lista" },
          { status: 400 },
        );
      }
      updates.push("estado = ?");
      params.push(data.estado);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No hay cambios para guardar" },
        { status: 400 },
      );
    }

    const existing = await dbQuery<{ id: number }>(
      "SELECT id FROM mercado_listas WHERE id = ?",
      [listId],
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Lista no encontrada" },
        { status: 404 },
      );
    }

    params.push(listId);
    await dbExecute(
      `UPDATE mercado_listas SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar la lista de mercado" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/mercado/listas/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const listId = parseId(id);
    if (listId === null) {
      return NextResponse.json(
        { error: "Identificador de lista no válido" },
        { status: 400 },
      );
    }

    const result = await dbExecute("DELETE FROM mercado_listas WHERE id = ?", [
      listId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Lista no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar la lista de mercado" },
      { status: 500 },
    );
  }
}
