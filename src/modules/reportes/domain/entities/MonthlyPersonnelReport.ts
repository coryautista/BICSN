export interface MonthlyPersonnelReport {
  month: number;
  year: number;
  organica0: string;
  organica1: string;
  descripcionOrganica1: string;
  sueldoMensual: number;
  afiliados: number;
  primeraQuincena: {
    altas: number;
    bajas: number;
  };
  segundaQuincena: {
    altas: number;
    bajas: number;
  };
}

export interface PersonnelMovement {
  interno: number;
  nombreCompleto: string;
  organica0: string;
  organica1: string;
  tipoMovimiento: 'ALTA' | 'BAJA';
  fechaMovimiento: Date;
  quincena: 1 | 2;
  sueldo: number;
}

export interface ReportFilters {
  month: number;
  year: number;
  organica0?: string;
  organica1?: string;
}