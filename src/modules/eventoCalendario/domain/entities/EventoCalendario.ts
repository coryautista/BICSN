export interface EventoCalendario {
  id: number;
  fecha: string; // YYYY-MM-DD format
  tipo: 'FERIADO' | 'VACACIONES' | 'EVENTO_ESPECIAL' | 'DIA_NO_LABORABLE';
  anio: number;
  createdAt: string;
}

export interface CreateEventoCalendarioData {
  fecha: string; // YYYY-MM-DD format
  tipo: 'FERIADO' | 'VACACIONES' | 'EVENTO_ESPECIAL' | 'DIA_NO_LABORABLE';
  anio: number;
  createdAt?: string;
}

export interface UpdateEventoCalendarioData {
  id: number;
  fecha?: string;
  tipo?: 'FERIADO' | 'VACACIONES' | 'EVENTO_ESPECIAL' | 'DIA_NO_LABORABLE';
  anio?: number;
  createdAt?: string;
}

export interface DeleteEventoCalendarioData {
  id: number;
}
