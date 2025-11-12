export interface AuditLog {
  id: number;
  entidad: string;
  entidadId: string;
  accion: string;
  datosAntes: string | null;
  datosDespues: string | null;
  fecha: string;
  userId: string | null;
  userName: string | null;
  appName: string;
  ip: string;
  userAgent: string;
  requestId: string;
}

export interface GetAuditLogsByDateRangeData {
  fechaInicio: string;
  fechaFin: string;
}
