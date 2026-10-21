export interface AcademixRecord {
  id: number;
  codigo: string | null;
  titulo: string | null;
  fecha_entrega_real: string | null;
  hora: string | null;
  comentario: string | null;
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

export interface SidorPago {
  id: number;
  titulo: string;
  monto: string;
  mes: string;
  fecha_pago: string;
}

export interface SidorListResponse {
  records: SidorPago[];
  months: string[];
  monthCount: number;
  monthTotal: number;
}

export interface GananciasMonth {
  mes: string;
  academix: number;
  sidor: number;
  total: number;
}

export interface GananciasResponse {
  months: string[];
  series: GananciasMonth[];
  selected: GananciasMonth;
}
