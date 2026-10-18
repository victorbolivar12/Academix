export interface AcademixRecord {
  id: number;
  codigo: string | null;
  titulo: string | null;
  fecha_entrega_real: string | null;
  precio: string | null;
  porcentaje: string | null;
  estado: string | null;
  estado_pago: string | null;
  mes_registro: string;
}

export interface AcademixStats {
  acumulado: number;
  ganancia: number;
  totalAcademia: number;
  totalGanancia: number;
}

export interface AcademixListResponse {
  records: AcademixRecord[];
  months: string[];
  monthCount: number;
  stats: AcademixStats;
}
