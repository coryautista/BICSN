import sql, { ConnectionPool } from 'mssql';
import {
  FORMULA_CALCULO_CLAVE,
  FORMULA_PRECISION_POLICY,
  FORMULA_PARAMETRO_CLAVES,
  type FormulaCalculo,
  type FormulaCalculoParametro,
  type FormulaCalculoParametros,
  type FormulaParametroClave,
  type FormulaParametroUnidad
} from '../../domain/entities/FormulaCalculo.js';
import { AportacionFondoDomainError, AportacionFondoError } from '../../domain/errors.js';
import { IFormulaCalculoRepository } from '../../domain/repositories/IFormulaCalculoRepository.js';

const PARAMETER_KEYS = new Set<string>(FORMULA_PARAMETRO_CLAVES);
const PARAMETER_UNITS = new Set<string>(['TASA', 'DIAS', 'DIVISOR']);
const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

function canonicalDecimal9(value: unknown): string {
  const text = String(value).trim();
  const match = DECIMAL_PATTERN.exec(text);
  if (!match || (match[3]?.length ?? 0) > 9) {
    throw new Error(`DECIMAL_PARAMETRO_INVALIDO:${text}`);
  }
  const sign = match[1] === '-' && !/^0*$/.test(`${match[2]}${match[3] ?? ''}`) ? '-' : '';
  return `${sign}${match[2]}.${(match[3] ?? '').padEnd(9, '0')}`;
}

export class FormulaCalculoRepository implements IFormulaCalculoRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async obtenerPorPeriodo(
    anio: number,
    quincena: number,
    claveFormula = FORMULA_CALCULO_CLAVE
  ): Promise<FormulaCalculo> {
    if (!Number.isInteger(anio) || anio < 2000 || anio > 2100 || !Number.isInteger(quincena) || quincena < 1 || quincena > 24) {
      throw new AportacionFondoDomainError(
        'Año o quincena fuera de rango',
        AportacionFondoError.FORMULA_CALCULO_PARAMETROS_INVALIDOS
      );
    }

    try {
      const result = await this.mssqlPool.request()
        .input('ClaveFormula', sql.VarChar(50), claveFormula)
        .input('Anio', sql.SmallInt, anio)
        .input('Quincena', sql.TinyInt, quincena)
        .execute('aportaciones.spObtenerFormulaCalculoPeriodo');

      const recordsets = result.recordsets as sql.IRecordSet<Record<string, unknown>>[];
      const versionRows = recordsets[0];
      if (!versionRows || versionRows.length !== 1) {
        throw this.invalidFormula('La fórmula no devolvió una única versión');
      }

      const version = versionRows[0];
      const formulaId = String(version.FormulaCalculoVersionId ?? '');
      if (!/^\d+$/.test(formulaId)) {
        throw this.invalidFormula('El identificador de fórmula es inválido');
      }

      // Read DECIMAL as text to avoid converting official parameters through IEEE-754.
      const parameterRows = recordsets[1];
      const details = parameterRows.map((row): FormulaCalculoParametro => {
        const key = String(row.ClaveParametro);
        const unit = String(row.Unidad);
        if (!PARAMETER_KEYS.has(key) || !PARAMETER_UNITS.has(unit)) {
          throw this.invalidFormula(`Parámetro desconocido: ${key}`);
        }
        let value: string;
        try {
          value = canonicalDecimal9(row.Valor);
        } catch {
          throw this.invalidFormula(`Valor decimal inválido para ${key}`);
        }
        return {
          clave: key as FormulaParametroClave,
          valor: value,
          unidad: unit as FormulaParametroUnidad,
          fuente: String(row.Fuente),
          observaciones: row.Observaciones == null ? null : String(row.Observaciones)
        };
      });

      if (details.length !== FORMULA_PARAMETRO_CLAVES.length) {
        throw this.invalidFormula(`Se esperaban 15 parámetros y se encontraron ${details.length}`);
      }

      if (String(version.ClaveFormula) !== claveFormula
          || Number(version.AnioVigencia) !== anio
          || quincena < Number(version.QuincenaDesde)
          || quincena > Number(version.QuincenaHasta)
          || String(version.Estado) !== 'ACTIVA'
          || String(version.PrecisionPolicy) !== FORMULA_PRECISION_POLICY) {
        throw this.invalidFormula('La versión resuelta no corresponde al periodo o política solicitados');
      }

      const expectedUnits: Record<FormulaParametroClave, FormulaParametroUnidad> = {
        DIAS_MES: 'DIVISOR',
        DIAS_DEFAULT_SIN_TXT: 'DIAS',
        DIAS_MIN: 'DIAS',
        DIAS_MAX: 'DIAS',
        CAIR_SUELDO: 'TASA',
        FRA_SUELDO: 'TASA',
        FRA_OTRAS: 'TASA',
        FRA_QUINQUENIOS: 'TASA',
        FRE_SUELDO: 'TASA',
        FRE_OTRAS: 'TASA',
        FRE_QUINQUENIOS: 'TASA',
        FH_SUELDO: 'TASA',
        FV_SUELDO: 'TASA',
        FAA_SUELDO: 'TASA',
        FAE_SUELDO: 'TASA'
      };
      if (details.some((parameter) => expectedUnits[parameter.clave] !== parameter.unidad)) {
        throw this.invalidFormula('La fórmula contiene unidades incompatibles con sus claves');
      }

      const parameterMap = new Map(details.map((parameter) => [parameter.clave, parameter.valor]));
      if (parameterMap.size !== FORMULA_PARAMETRO_CLAVES.length
          || FORMULA_PARAMETRO_CLAVES.some((key) => !parameterMap.has(key))) {
        throw this.invalidFormula('La fórmula contiene parámetros faltantes o duplicados');
      }
      const scaled = (key: FormulaParametroClave) => BigInt(parameterMap.get(key)!.replace('.', ''));
      const minimumDays = scaled('DIAS_MIN');
      const maximumDays = scaled('DIAS_MAX');
      const defaultDays = scaled('DIAS_DEFAULT_SIN_TXT');
      if (minimumDays > maximumDays || defaultDays < minimumDays || defaultDays > maximumDays || scaled('DIAS_MES') <= 0n) {
        throw this.invalidFormula('La fórmula contiene rangos de días o divisor inconsistentes');
      }

      return {
        formulaCalculoVersionId: formulaId,
        claveFormula: String(version.ClaveFormula),
        anioVigencia: Number(version.AnioVigencia),
        numeroVersion: Number(version.NumeroVersion),
        quincenaDesde: Number(version.QuincenaDesde),
        quincenaHasta: Number(version.QuincenaHasta),
        precisionPolicy: String(version.PrecisionPolicy),
        estado: 'ACTIVA',
        parametros: Object.fromEntries(parameterMap) as FormulaCalculoParametros,
        detalleParametros: details
      };
    } catch (error: unknown) {
      if (error instanceof AportacionFondoDomainError) throw error;
      const sqlError = error as { number?: number };
      if (sqlError.number === 51011) {
        throw new AportacionFondoDomainError(
          'No existe una fórmula activa para el periodo',
          AportacionFondoError.FORMULA_CALCULO_NO_ENCONTRADA
        );
      }
      if (sqlError.number === 51012) {
        throw new AportacionFondoDomainError(
          'Existen fórmulas activas traslapadas para el periodo',
          AportacionFondoError.FORMULA_CALCULO_TRASLAPADA
        );
      }
      throw new AportacionFondoDomainError(
        'No fue posible obtener la fórmula de cálculo',
        AportacionFondoError.ERROR_SQL_FORMULA_CALCULO
      );
    }
  }

  private invalidFormula(message: string): AportacionFondoDomainError {
    return new AportacionFondoDomainError(
      message,
      AportacionFondoError.FORMULA_CALCULO_PARAMETROS_INVALIDOS
    );
  }
}
