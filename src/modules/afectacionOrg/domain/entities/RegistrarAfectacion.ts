export interface RegistrarAfectacionData {
  entidad: string;
  anio: number;
  quincena: number;
  orgNivel: number;
  org0: string;
  org1?: string;
  org2?: string;
  org3?: string;
  accion: string;
  resultado: string;
  mensaje?: string;
  usuario: string;
  appName: string;
  ip: string;
}

export interface RegistrarAfectacionResult {
  success: boolean;
  afectacionId: number;
  message: string;
}
