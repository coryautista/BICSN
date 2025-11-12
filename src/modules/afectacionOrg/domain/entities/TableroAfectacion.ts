export interface TableroAfectacion {
  entidad: string;
  anio: number;
  orgNivel: number;
  org0: string;
  org1: string | null;
  org2: string | null;
  org3: string | null;
  quincenaActual: number;
  ultimaFecha: Date | null;
  ultimoUsuario: string | null;
  accion: string | null;
  resultado: string | null;
  mensaje: string | null;
}
