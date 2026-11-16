import { dbQuery } from "@/lib/db";
import type {
  AlimentacionAlimento,
  AlimentacionRegistro,
  MealType,
} from "@/lib/types";

export interface AlimentacionAlimentoRow {
  id: number;
  nombre: string;
  categoria: string;
  calorias_por_100g: string;
}

export interface AlimentacionRegistroRow {
  id: number;
  fecha: string;
  tipo_comida: MealType;
  alimento_id: number | null;
  nombre: string;
  calorias_por_100g: string;
  gramos: string;
  calorias: string;
  created_at: string;
  updated_at: string;
}

export function mapAlimento(
  row: AlimentacionAlimentoRow,
): AlimentacionAlimento {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    calorias_por_100g: Number(row.calorias_por_100g),
  };
}

export function mapRegistro(
  row: AlimentacionRegistroRow,
): AlimentacionRegistro {
  return {
    id: row.id,
    fecha: row.fecha,
    tipo_comida: row.tipo_comida,
    alimento_id: row.alimento_id,
    nombre: row.nombre,
    calorias_por_100g: Number(row.calorias_por_100g),
    gramos: Number(row.gramos),
    calorias: Number(row.calorias),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface ResolvedAlimento {
  nombre: string;
  calorias_por_100g: number;
}

export async function resolveAlimento(
  alimentoId: number,
  fallback: ResolvedAlimento,
): Promise<ResolvedAlimento | null> {
  if (!alimentoId) return fallback;

  const rows = await dbQuery<{
    nombre: string;
    calorias_por_100g: string;
  }>(
    `SELECT nombre, calorias_por_100g
     FROM alimentacion_alimentos
     WHERE id = ?`,
    [alimentoId],
  );

  if (rows.length === 0) return null;

  return {
    nombre: rows[0].nombre,
    calorias_por_100g: Number(rows[0].calorias_por_100g),
  };
}
