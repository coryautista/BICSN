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
  quincena: number;
  anio: number;
  periodo: string; // Formato QQAA (ej: "0225" para quincena 2 del año 2025)
  accion: string; // Acción del registro (ej: "APLICAR", "TERMINADO")
}
