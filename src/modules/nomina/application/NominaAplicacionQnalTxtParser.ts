import { NominaAplicacionQnalRegistroParsed } from '../domain/entities/NominaAplicacionQnalTxt.js';

export interface NominaAplicacionQnalParseResult {
  registros: NominaAplicacionQnalRegistroParsed[];
  errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>;
}

const DETAIL_FIELD_COUNT = 20;
const MONEY_FIELD_MAX = 9_999_999_999.99;

export function parseNominaAplicacionQnalTxt(buffer: Buffer): NominaAplicacionQnalParseResult {
  const text = buffer.toString('latin1').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/);
  const registros: NominaAplicacionQnalRegistroParsed[] = [];
  const errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }> = [];

  lines.forEach((line, index) => {
    const numeroLinea = index + 1;
    if (line.trim().length === 0) return;
    const fields = normalizeFields(line.split('@'));
    const tipoRegistro = fields[1]?.trim();

    if (tipoRegistro === '1') return;

    if (tipoRegistro !== '2') {
      errores.push({ numeroLinea, campo: 'TipoRegistro', mensaje: 'Tipo de registro inválido; se esperaba 2 para detalle.' });
      return;
    }

    if (fields.length !== DETAIL_FIELD_COUNT) {
      errores.push({ numeroLinea, campo: 'Layout', mensaje: `Layout inválido: se esperaban 20 campos y se recibieron ${fields.length}.` });
      return;
    }

    const registro = mapDetailLine(fields, numeroLinea, line, errores);
    validateRequired(registro, errores);
    registros.push(registro);
  });

  if (registros.length === 0) {
    errores.push({ numeroLinea: 0, mensaje: 'El archivo no contiene registros detalle válidos.' });
  }

  return { registros, errores };
}

function mapDetailLine(
  fields: string[],
  numeroLinea: number,
  lineaOriginal: string,
  errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>
): NominaAplicacionQnalRegistroParsed {
  const money = (index: number, campo: string) => parseMoney(fields[index], numeroLinea, campo, errores);
  const sueldoMensual = money(11, 'SueldoMensual');
  const baseCotizacionSueldo = money(9, 'BaseCotizacionSueldo');

  for (const index of [12, 15, 17, 18, 19]) {
    validateUncertifiedMoney(fields[index], numeroLinea, index + 1, errores);
  }

  return {
    numeroLinea,
    lote: clean(fields[0]),
    tipoRegistro: clean(fields[1]),
    clavePersonal: clean(fields[2]),
    rfc: clean(fields[3]),
    nombreAfiliado: clean(fields[4]),
    aportacionAfiliadoFondoAhorro: money(5, 'AportacionAfiliadoFondoAhorro'),
    aportacionEntidadFondoAhorro: money(6, 'AportacionEntidadFondoAhorro'),
    aportacionAfiliadoEBI: null,
    aportacionEntidadEBI: null,
    baseCotizacionSueldo,
    baseCotizacionQuinquenios: money(10, 'BaseCotizacionQuinquenios'),
    sueldoMensual,
    ayudasMensuales: null,
    quinqueniosMensual: money(13, 'QuinqueniosMensual'),
    descuentoPrestamoCortoPlazo: money(7, 'DescuentoPrestamoCortoPlazo'),
    descuentoPrestamoHipotecario: money(8, 'DescuentoPrestamoHipotecario'),
    fechaMovimiento: parseDate(fields[14], numeroLinea, 'FechaMovimiento', errores),
    descuentoPrestamoMedianoPlazo: null,
    descuentosOtros: null,
    cair: money(16, 'CAIR'),
    cairVoluntario: null,
    fechaRegistro: new Date(),
    diasLaborados: calculateDiasLaborados(baseCotizacionSueldo, sueldoMensual),
    layoutVersion: '20',
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

function parseMoney(
  value: string | undefined,
  numeroLinea: number,
  campo: string,
  errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>
): number | null {
  const cleanValue = clean(value);
  if (!cleanValue) return null;
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(cleanValue)) {
    errores.push({ numeroLinea, campo, mensaje: `${campo} debe ser un importe con máximo dos decimales.` });
    return null;
  }
  const parsed = Number(cleanValue);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > MONEY_FIELD_MAX) {
    errores.push({ numeroLinea, campo, mensaje: `${campo} excede el rango NUMERIC(12,2).` });
    return null;
  }
  return parsed;
}

function validateUncertifiedMoney(
  value: string | undefined,
  numeroLinea: number,
  fieldNumber: number,
  errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>
): void {
  const cleanValue = clean(value);
  if (!cleanValue) return;
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(cleanValue) || Number(cleanValue) !== 0) {
    errores.push({
      numeroLinea,
      campo: `Campo${fieldNumber}`,
      mensaje: `El campo ${fieldNumber} no está certificado y sólo admite vacío o cero.`
    });
  }
}

function parseDate(
  value: string | undefined,
  numeroLinea: number,
  campo: string,
  errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>
): Date | null {
  const cleanValue = clean(value);
  if (!cleanValue) return null;
  if (!/^\d{8}$/.test(cleanValue)) {
    errores.push({ numeroLinea, campo, mensaje: `${campo} debe usar el formato AAAAMMDD.` });
    return null;
  }
  const year = Number(cleanValue.slice(0, 4));
  const month = Number(cleanValue.slice(4, 6));
  const day = Number(cleanValue.slice(6, 8));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
    errores.push({ numeroLinea, campo, mensaje: `${campo} no es una fecha válida.` });
    return null;
  }
  return parsed;
}

function calculateDiasLaborados(baseCotizacionSueldo: number | null, sueldoMensual: number | null): number | null {
  if (!baseCotizacionSueldo || !sueldoMensual || sueldoMensual <= 0) return null;
  const value = Math.round((baseCotizacionSueldo / sueldoMensual) * 30 * 100) / 100;
  return Math.max(0, Math.min(15, value));
}
