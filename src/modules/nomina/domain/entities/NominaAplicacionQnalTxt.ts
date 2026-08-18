export interface NominaAplicacionQnalUploadInput {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  archivoNombre: string;
  archivoContenido: Buffer;
  usuarioId?: string;
}

export interface NominaAplicacionQnalRegistroParsed {
  numeroLinea: number;
  lote: string;
  tipoRegistro: string;
  clavePersonal: string;
  rfc: string;
  nombreAfiliado: string;
  aportacionAfiliadoFondoAhorro: number | null;
  aportacionEntidadFondoAhorro: number | null;
  aportacionAfiliadoEBI: number | null;
  aportacionEntidadEBI: number | null;
  baseCotizacionSueldo: number | null;
  baseCotizacionQuinquenios: number | null;
  sueldoMensual: number | null;
  descuentoPrestamoCortoPlazo: number | null;
  descuentoPrestamoHipotecario: number | null;
  fechaMovimiento: Date | null;
  descuentoPrestamoMedianoPlazo: number | null;
  descuentosOtros: number | null;
  cair: number | null;
  cairVoluntario: number | null;
  fechaRegistro: Date;
  diasLaborados: number | null;
  layoutVersion: '20' | '35';
  lineaOriginal: string;
}

export interface NominaAplicacionQnalUploadResult {
  cargaId: number;
  estado: 'ACEPTADA' | 'RECHAZADA';
  totalRegistros: number;
  totalErrores: number;
  errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>;
}

export interface NominaAplicacionQnalScope {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
}

export interface NominaAplicacionQnalQueryFilters extends NominaAplicacionQnalScope {
  buscar?: string;
  page: number;
  pageSize: number;
}

export interface NominaAplicacionQnalCargaVigente {
  cargaId: string;
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  archivoNombre: string;
  tipoCarga: 'TXT';
  estatus: 'APLICADA';
  esVigente: true;
  totalLineas: number;
  totalDetallesDeclarados: number;
  fechaRegistro: string;
  registrosVigentes: number;
  registrosCargaBase: number;
  registrosComplementarios: number;
  cargasEnDetalle: number;
  rfcUnicos: number;
  rfcDuplicados: number;
  diasParciales: number;
  diasCero: number;
  diasNulos: number;
  diasQuince: number;
}

export interface NominaAplicacionQnalQueryResult {
  data: Record<string, unknown>[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
