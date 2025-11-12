export interface UltimaAfectacion {
  entidad: string;
  anio: number;
  orgNivel: number;
  org0: string;
  org1: string | null;
  org2: string | null;
  org3: string | null;
  quincena: number;
  accion: string;
  resultado: string;
  usuario: string;
  createdAt: Date;
  mensaje: string | null;
}
