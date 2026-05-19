export interface BitacoraAfectacion {
  afectacionId: number;
  orgNivel: number;
  org0: string;
  org1: string | null;
  org2: string | null;
  org3: string | null;
  entidad: string;
  entidadId: number | null;
  anio: number;
  quincena: number;
  accion: string;
  resultado: string;
  mensaje: string | null;
  usuario: string;
  userId: number | null;
  appName: string;
  ip: string;
  userAgent: string | null;
  requestId: string | null;
  createdAt: Date;
}

export type CreateBitacoraAfectacionData = Omit<BitacoraAfectacion, 'afectacionId' | 'createdAt'>;
