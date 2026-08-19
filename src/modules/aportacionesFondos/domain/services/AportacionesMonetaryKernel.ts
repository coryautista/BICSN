import {
  FORMULA_PARAMETRO_CLAVES,
  type FormulaCalculoParametros
} from '../entities/FormulaCalculo.js';
import { asMoneyA2, asMoneyD6, type MoneyA2, type MoneyD6 } from '../entities/Money.js';

const INTERNAL_DIGITS = 9;
const INTERNAL_SCALE = 1_000_000_000n;
const DETAIL_FACTOR = 1_000n;
const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

export interface AportacionesProportionalInput {
  diasLaborados: string;
  sueldoMensual: string;
  baseCotizacionSueldo?: string | null;
  otrasPrestacionesMensuales: string;
  baseCotizacionQuinquenios: string;
  parametros: FormulaCalculoParametros;
}

export interface AportacionesProportionalResult {
  sueldoProporcionalD6: MoneyD6;
  otrasPrestacionesProporcionalD6: MoneyD6;
  baseCotizacionQuinqueniosD6: MoneyD6;
  cairD6: MoneyD6;
  fraD6: MoneyD6;
  freD6: MoneyD6;
  fhD6: MoneyD6;
  fvD6: MoneyD6;
  faaD6: MoneyD6;
  faeD6: MoneyD6;
  fatD6: MoneyD6;
}

export class AportacionesMonetaryKernel {
  calcularProporcionales(input: AportacionesProportionalInput): AportacionesProportionalResult {
    this.validateParameters(input.parametros);
    const parameters = Object.fromEntries(
      FORMULA_PARAMETRO_CLAVES.map((key) => [key, this.parse(input.parametros[key])])
    ) as Record<keyof FormulaCalculoParametros, bigint>;

    const days = this.parse(input.diasLaborados);
    if (days < parameters.DIAS_MIN || days > parameters.DIAS_MAX) {
      throw new Error('DIAS_LABORADOS_FUERA_RANGO');
    }
    if (parameters.DIAS_MES === 0n) throw new Error('DIAS_MES_DIVISOR_CERO');
    const quinquenios = this.roundHalfEven(this.parse(input.baseCotizacionQuinquenios), 2);
    const proportionalSalary = input.baseCotizacionSueldo == null
      ? this.parse(this.proporcionarBaseA2D6(
          input.sueldoMensual,
          input.diasLaborados,
          input.parametros.DIAS_MES
        ))
      : this.roundHalfEven(this.parse(input.baseCotizacionSueldo), 2);
    const proportionalBenefits = this.parse(this.proporcionarBaseA2D6(
      input.otrasPrestacionesMensuales,
      input.parametros.DIAS_DEFAULT_SIN_TXT,
      input.parametros.DIAS_MES
    ));

    const component = (base: bigint, rate: bigint) => this.round(this.multiply(base, rate), 2);
    const cair = component(proportionalSalary, parameters.CAIR_SUELDO);
    const fra = this.round(
      this.multiply(proportionalSalary, parameters.FRA_SUELDO)
      + this.multiply(proportionalBenefits, parameters.FRA_OTRAS)
      + this.multiply(quinquenios, parameters.FRA_QUINQUENIOS),
      2
    );
    const fre = this.round(
      this.multiply(proportionalSalary, parameters.FRE_SUELDO)
      + this.multiply(proportionalBenefits, parameters.FRE_OTRAS)
      + this.multiply(quinquenios, parameters.FRE_QUINQUENIOS),
      2
    );
    const fh = component(proportionalSalary, parameters.FH_SUELDO);
    const fv = component(proportionalSalary, parameters.FV_SUELDO);
    const faa = component(proportionalSalary, parameters.FAA_SUELDO);
    const fae = component(proportionalSalary, parameters.FAE_SUELDO);
    const fat = faa + fae;

    return {
      sueldoProporcionalD6: asMoneyD6(this.format(proportionalSalary, 6)),
      otrasPrestacionesProporcionalD6: asMoneyD6(this.format(proportionalBenefits, 6)),
      baseCotizacionQuinqueniosD6: asMoneyD6(this.format(quinquenios, 6)),
      cairD6: asMoneyD6(this.format(cair, 6)),
      fraD6: asMoneyD6(this.format(fra, 6)),
      freD6: asMoneyD6(this.format(fre, 6)),
      fhD6: asMoneyD6(this.format(fh, 6)),
      fvD6: asMoneyD6(this.format(fv, 6)),
      faaD6: asMoneyD6(this.format(faa, 6)),
      faeD6: asMoneyD6(this.format(fae, 6)),
      fatD6: asMoneyD6(this.format(fat, 6))
    };
  }

  agregarA2(details: readonly string[]): MoneyA2 {
    const total = details.reduce((sum, value) => sum + this.round(this.parse(value), 6), 0n);
    return asMoneyA2(this.format(this.round(total, 2), 2));
  }

  agregarComponenteA2(details: readonly string[]): MoneyA2 {
    const total = details.reduce((sum, value) => sum + this.round(this.parse(value), 2), 0n);
    return asMoneyA2(this.format(total, 2));
  }

  truncarD6(value: string): MoneyD6 {
    return asMoneyD6(this.format(this.detail(this.parse(value)), 6));
  }

  truncarA2(value: string): MoneyA2 {
    return asMoneyA2(this.format(this.parse(value), 2));
  }

  redondearD6(value: string): MoneyD6 {
    return asMoneyD6(this.format(this.round(this.parse(value), 6), 6));
  }

  redondearA2(value: string): MoneyA2 {
    return asMoneyA2(this.format(this.round(this.parse(value), 2), 2));
  }

  sumarD6(values: readonly string[]): MoneyD6 {
    const total = values.reduce((sum, value) => sum + this.round(this.parse(value), 6), 0n);
    return asMoneyD6(this.format(this.round(total, 6), 6));
  }

  sumarA2(values: readonly string[]): MoneyA2 {
    const total = values.reduce((sum, value) => sum + this.parse(value), 0n);
    return asMoneyA2(this.format(total, 2));
  }

  restarD6(left: string, right: string): MoneyD6 {
    return asMoneyD6(this.format(this.detail(this.parse(left) - this.parse(right)), 6));
  }

  multiplicarD6(value: string, factor: string): MoneyD6 {
    return asMoneyD6(this.format(this.round(this.multiply(this.parse(value), this.parse(factor)), 6), 6));
  }

  proporcionarD6(value: string, numerador: string, divisor: string): MoneyD6 {
    return asMoneyD6(this.format(
      this.round(this.divide(this.multiply(this.parse(value), this.parse(numerador)), this.parse(divisor)), 6),
      6
    ));
  }

  proporcionarBaseA2D6(value: string, numerador: string, divisor: string): MoneyD6 {
    this.parse(value);
    this.parse(numerador);
    this.parse(divisor);
    const divisorNumber = Number(divisor);
    if (divisorNumber === 0) throw new Error('DIVISION_ENTRE_CERO');
    const result = (Number(value) * Number(numerador)) / divisorNumber;
    if (!Number.isFinite(result)) throw new Error('BASE_A2_NO_FINITA');
    return asMoneyD6(this.format(this.parse(result.toFixed(2)), 6));
  }

  private validateParameters(parameters: FormulaCalculoParametros): void {
    for (const key of FORMULA_PARAMETRO_CLAVES) {
      if (typeof parameters[key] !== 'string') throw new Error(`FORMULA_PARAMETRO_INVALIDO:${key}`);
    }
  }

  private parse(value: string): bigint {
    const match = DECIMAL_PATTERN.exec(value.trim());
    if (!match) throw new Error(`DECIMAL_INVALIDO:${value}`);
    const fraction = match[3] ?? '';
    if (fraction.length > INTERNAL_DIGITS) throw new Error(`DECIMAL_ESCALA_MAYOR_9:${value}`);
    const sign = match[1] === '-' ? -1n : 1n;
    const integer = BigInt(match[2]);
    const decimals = BigInt(fraction.padEnd(INTERNAL_DIGITS, '0') || '0');
    return sign * (integer * INTERNAL_SCALE + decimals);
  }

  private multiply(left: bigint, right: bigint): bigint {
    return (left * right) / INTERNAL_SCALE;
  }

  private divide(dividend: bigint, divisor: bigint): bigint {
    if (divisor === 0n) throw new Error('DIVISION_ENTRE_CERO');
    return (dividend * INTERNAL_SCALE) / divisor;
  }

  private detail(value: bigint): bigint {
    return (value / DETAIL_FACTOR) * DETAIL_FACTOR;
  }

  private truncate(value: bigint, digits: number): bigint {
    const factor = 10n ** BigInt(INTERNAL_DIGITS - digits);
    return (value / factor) * factor;
  }

  private round(value: bigint, digits: number): bigint {
    const factor = 10n ** BigInt(INTERNAL_DIGITS - digits);
    const quotient = value / factor;
    const remainder = value % factor;
    const absoluteRemainder = remainder < 0n ? -remainder : remainder;
    if (absoluteRemainder * 2n < factor) return quotient * factor;
    return (quotient + (value < 0n ? -1n : 1n)) * factor;
  }

  private roundHalfEven(value: bigint, digits: number): bigint {
    const factor = 10n ** BigInt(INTERNAL_DIGITS - digits);
    const quotient = value / factor;
    const remainder = value % factor;
    const absoluteRemainder = remainder < 0n ? -remainder : remainder;
    if (absoluteRemainder * 2n < factor) return quotient * factor;
    if (absoluteRemainder * 2n > factor) {
      return (quotient + (value < 0n ? -1n : 1n)) * factor;
    }
    if (quotient % 2n === 0n) return quotient * factor;
    return (quotient + (value < 0n ? -1n : 1n)) * factor;
  }

  private format(value: bigint, digits: number): string {
    if (!Number.isInteger(digits) || digits < 0 || digits > INTERNAL_DIGITS) {
      throw new Error('ESCALA_SALIDA_INVALIDA');
    }
    const factor = 10n ** BigInt(INTERNAL_DIGITS - digits);
    const scaled = value / factor;
    const sign = scaled < 0n ? '-' : '';
    const absolute = scaled < 0n ? -scaled : scaled;
    if (digits === 0) return `${sign}${absolute}`;
    const decimalScale = 10n ** BigInt(digits);
    const integer = absolute / decimalScale;
    const fraction = String(absolute % decimalScale).padStart(digits, '0');
    const normalizedSign = absolute === 0n ? '' : sign;
    return `${normalizedSign}${integer}.${fraction}`;
  }
}
