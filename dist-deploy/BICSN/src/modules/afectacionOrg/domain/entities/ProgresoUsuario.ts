export interface ProgresoUsuario {
  entidad: string;
  anio: number;
  orgNivel: number;
  org0: string;
  org1: string | null;
  org2: string | null;
  org3: string | null;
  usuario: string;
  quincenaUltima: number;
  fechaUltima: Date | null;
}
