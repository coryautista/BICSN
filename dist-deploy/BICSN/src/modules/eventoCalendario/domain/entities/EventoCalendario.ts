export interface EventoCalendario {
  id: number;
  fecha: string; // YYYY-MM-DD format
  tipo: 'ARCHIVO_APLICACION' | 'ASUETO' | 'ALTA_BAJA_CAMBIO' | 'PAGO' | 'HIPOTECARIO' | 'INTERESES_MORATORIOS' | 'REPORTES';
  anio: number;
  createdAt: string;
}

export interface CreateEventoCalendarioData {
  fecha: string; // YYYY-MM-DD format
  tipo: 'ARCHIVO_APLICACION' | 'ASUETO' | 'ALTA_BAJA_CAMBIO' | 'PAGO' | 'HIPOTECARIO' | 'INTERESES_MORATORIOS' | 'REPORTES';
  anio: number;
  createdAt?: string;
}

export interface UpdateEventoCalendarioData {
  id: number;
  fecha?: string;
  tipo?: 'ARCHIVO_APLICACION' | 'ASUETO' | 'ALTA_BAJA_CAMBIO' | 'PAGO' | 'HIPOTECARIO' | 'INTERESES_MORATORIOS' | 'REPORTES';
  anio?: number;
  createdAt?: string;
}

export interface DeleteEventoCalendarioData {
  id: number;
}
