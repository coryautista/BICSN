import { EventoCalendario, CreateEventoCalendarioData, UpdateEventoCalendarioData } from '../entities/EventoCalendario.js';

export interface IEventoCalendarioRepository {
  findById(id: number): Promise<EventoCalendario | undefined>;
  findAll(): Promise<EventoCalendario[]>;
  findByAnio(anio: number): Promise<EventoCalendario[]>;
  findByDateRange(fechaInicio: string, fechaFin: string, tipo?: string): Promise<EventoCalendario[]>;
  create(data: CreateEventoCalendarioData): Promise<EventoCalendario>;
  update(data: UpdateEventoCalendarioData): Promise<EventoCalendario>;
  delete(id: number): Promise<number>;
}
