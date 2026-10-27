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

export interface MercadoCategoria {
  id: number;
  nombre: string;
}

export interface MercadoTienda {
  id: number;
  nombre: string;
}

export interface MercadoPrecio {
  id: number;
  producto_id: number;
  tienda_id: number | null;
  tienda_nombre: string | null;
  precio: number;
  actualizado_en: string;
}

export interface MercadoProducto {
  id: number;
  nombre: string;
  categoria_id: number;
  categoria_nombre: string;
  unidad: string;
  activo: boolean;
  precios: MercadoPrecio[];
}

export interface MercadoCatalogoResponse {
  categorias: MercadoCategoria[];
  tiendas: MercadoTienda[];
  productos: MercadoProducto[];
}

export interface MercadoPago {
  id: number;
  tipo: string;
  porcentaje: number | null;
  monto: number;
  fecha_pago: string;
  fecha_vencimiento: string | null;
}

export interface MercadoListaItem {
  id: number;
  producto_id: number | null;
  nombre_producto: string;
  tienda_id: number | null;
  tienda_nombre: string | null;
  precio_unitario: number;
  cantidad: number;
  unidad: string;
  subtotal: number;
}

export type MercadoPaymentStatus =
  | "pagado"
  | "pendiente"
  | "cachea"
  | "vencido";

export interface MercadoLista {
  id: number;
  nombre: string;
  estado: string;
  presupuesto: number | null;
  total: number;
  pagado: number;
  saldo: number;
  diferencia: number | null;
  estado_pago: MercadoPaymentStatus;
  fecha_vencimiento: string | null;
  created_at: string;
  updated_at: string;
  pagos: MercadoPago[];
  items: MercadoListaItem[];
}

export interface MercadoListasResponse {
  listas: MercadoLista[];
}
