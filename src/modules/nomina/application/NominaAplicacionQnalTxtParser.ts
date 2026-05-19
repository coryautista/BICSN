import { NominaAplicacionQnalRegistroParsed } from '../domain/entities/NominaAplicacionQnalTxt.js';

export interface NominaAplicacionQnalParseResult {
  registros: NominaAplicacionQnalRegistroParsed[];
  errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>;
}

const DETAIL_FIELD_COUNTS = new Set([20, 35]);

export function parseNominaAplicacionQnalTxt(buffer: Buffer): NominaAplicacionQnalParseResult {
  const text = buffer.toString('latin1').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const registros: NominaAplicacionQnalRegistroParsed[] = [];
  const errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }> = [];

  lines.forEach((line, index) => {
    const numeroLinea = index + 1;
    const fields = normalizeFields(line.split('@'));
    const tipoRegistro = fields[1]?.trim();

    if (tipoRegistro === '1') return;

    if (tipoRegistro !== '2') {
      errores.push({ numeroLinea, campo: 'TipoRegistro', mensaje: 'Tipo de registro inválido; se esperaba 2 para detalle.' });
      return;
    }

    if (!DETAIL_FIELD_COUNTS.has(fields.length)) {
      errores.push({ numeroLinea, mensaje: `Layout inválido: se esperaban 20 o 35 campos y se recibieron ${fields.length}.` });
      return;
    }

    const registro = mapDetailLine(fields, numeroLinea, line, fields.length === 35 ? '35' : '20');
    validateRequired(registro, errores);
    registros.push(registro);
  });

  if (registros.length === 0) {
    errores.push({ numeroLinea: 0, mensaje: 'El archivo no contiene registros detalle válidos.' });
  }

  return { registros, errores };
}

function mapDetailLine(fields: string[], numeroLinea: number, lineaOriginal: string, layoutVersion: '20' | '35'): NominaAplicacionQnalRegistroParsed {
  const sueldoMensual = parseMoney(fields[11]);
  const baseCotizacionSueldo = parseMoney(fields[9]);

  return {
    numeroLinea,
    lote: clean(fields[0]),
    tipoRegistro: clean(fields[1]),
    clavePersonal: clean(fields[2]),
    rfc: clean(fields[3]),
    nombreAfiliado: clean(fields[4]),
    aportacionAfiliadoFondoAhorro: parseMoney(fields[5]),
    aportacionEntidadFondoAhorro: parseMoney(fields[6]),
    aportacionAfiliadoEBI: parseMoney(fields[7]),
    aportacionEntidadEBI: parseMoney(fields[8]),
    baseCotizacionSueldo,
    baseCotizacionQuinquenios: parseMoney(fields[10]),
    sueldoMensual,
    descuentoPrestamoCortoPlazo: parseMoney(fields[12]),
    descuentoPrestamoHipotecario: parseMoney(fields[13]),
    fechaMovimiento: parseDate(fields[14]),
    descuentoPrestamoMedianoPlazo: parseMoney(fields[15]),
    descuentosOtros: parseMoney(fields[16]),
    cair: parseMoney(fields[17]),
    cairVoluntario: parseMoney(fields[18]),
    fechaRegistro: new Date(),
    diasLaborados: calculateDiasLaborados(baseCotizacionSueldo, sueldoMensual),
    layoutVersion,
    lineaOriginal
  };
}

function normalizeFields(fields: string[]): string[] {
  if (fields.length > 0 && fields[fields.length - 1].trim() === '') {
    return fields.slice(0, -1);
  }

  return fields;
}

function validateRequired(registro: NominaAplicacionQnalRegistroParsed, errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>) {
  if (!registro.clavePersonal) errores.push({ numeroLinea: registro.numeroLinea, campo: 'ClavePersonal', mensaje: 'ClavePersonal es requerida.' });
  if (!registro.rfc) errores.push({ numeroLinea: registro.numeroLinea, campo: 'RFC', mensaje: 'RFC es requerido.' });
  if (!registro.nombreAfiliado) errores.push({ numeroLinea: registro.numeroLinea, campo: 'NombreAfiliado', mensaje: 'NombreAfiliado es requerido.' });
}

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

function parseMoney(value: string | undefined): number | null {
  const cleanValue = clean(value).replace(/,/g, '');
  if (!cleanValue) return null;
  const parsed = Number(cleanValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string | undefined): Date | null {
  const cleanValue = clean(value);
  if (!cleanValue) return null;
  if (/^\d{8}$/.test(cleanValue)) {
    const year = Number(cleanValue.slice(0, 4));
    const month = Number(cleanValue.slice(4, 6)) - 1;
    const day = Number(cleanValue.slice(6, 8));
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(cleanValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function calculateDiasLaborados(baseCotizacionSueldo: number | null, sueldoMensual: number | null): number | null {
  if (!baseCotizacionSueldo || !sueldoMensual || sueldoMensual <= 0) return null;
  const value = Math.round((baseCotizacionSueldo / sueldoMensual) * 30 * 100) / 100;
  return Math.max(0, Math.min(15, value));
}
