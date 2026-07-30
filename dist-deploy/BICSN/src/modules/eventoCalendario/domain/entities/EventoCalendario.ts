export interface EventoCalendario {
  id: number;
  fecha: string; // YYYY-MM-DD format
  tipo: 'ARCHIVO_APLICACION' | 'ASUETO' | 'ALTA_BAJA_CAMBIO' | 'BA_MOVIMIENTO' | 'PAGO' | 'HIPOTECARIO' | 'INTERESES_MORATORIOS' | 'REPORTES';
  anio: number;
  createdAt: string;
  origen: 'MANUAL' | 'AUTOMATICO';
  periodoQna?: string | null;
  eventoHipotecarioId?: number | null;
}

export interface CreateEventoCalendarioData {
  fecha: string; // YYYY-MM-DD format
  tipo: 'ARCHIVO_APLICACION' | 'ASUETO' | 'ALTA_BAJA_CAMBIO' | 'BA_MOVIMIENTO' | 'PAGO' | 'HIPOTECARIO' | 'INTERESES_MORATORIOS' | 'REPORTES';
  anio: number;
  createdAt?: string;
  origen?: 'MANUAL' | 'AUTOMATICO';
  periodoQna?: string | null;
  eventoHipotecarioId?: number | null;
}

export interface UpdateEventoCalendarioData {
  id: number;
  fecha?: string;
  tipo?: 'ARCHIVO_APLICACION' | 'ASUETO' | 'ALTA_BAJA_CAMBIO' | 'BA_MOVIMIENTO' | 'PAGO' | 'HIPOTECARIO' | 'INTERESES_MORATORIOS' | 'REPORTES';
  anio?: number;
  createdAt?: string;
  confirmarImpactoBA?: boolean;
}

export interface DeleteEventoCalendarioData {
  id: number;
}
