export interface Movimiento {
  id: number;
  quincenaId: string | null;
  tipoMovimientoId: number;
  afiliadoId: number;
  fecha: string | null;
  observaciones: string | null;
  folio: string | null;
  estatus: string | null;
  creadoPor: number | null;
  creadoPorUid: string | null;
  createdAt: string;
}

export interface CreateMovimientoData extends Omit<Movimiento, 'id' | 'createdAt'> {}

export interface UpdateMovimientoData extends Partial<Omit<Movimiento, 'id' | 'createdAt'>> {
  id: number;
}

export interface DeleteMovimientoData {
  id: number;
}
