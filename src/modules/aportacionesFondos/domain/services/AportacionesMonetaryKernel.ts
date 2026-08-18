import {
  FORMULA_PARAMETRO_CLAVES,
  type FormulaCalculoParametros
} from '../entities/FormulaCalculo.js';

const INTERNAL_DIGITS = 9;
const INTERNAL_SCALE = 1_000_000_000n;
const DETAIL_FACTOR = 1_000n;
const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

export interface AportacionesProportionalInput {
  diasLaborados: string;
  sueldoMensual: string;
  otrasPrestacionesMensuales: string;
  baseCotizacionQuinquenios: string;
  parametros: FormulaCalculoParametros;
}

export interface AportacionesProportionalResult {
  sueldoProporcionalD6: string;
  otrasPrestacionesProporcionalD6: string;
  baseCotizacionQuinqueniosD6: string;
  cairD6: string;
  fraD6: string;
  freD6: string;
  fhD6: string;
  fvD6: string;
  faaD6: string;
  faeD6: string;
  fatD6: string;
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

    const salary = this.parse(input.sueldoMensual);
    const otherBenefits = this.parse(input.otrasPrestacionesMensuales);
    const quinquenios = this.detail(this.parse(input.baseCotizacionQuinquenios));
    const proportionalSalary = this.detail(this.divide(this.multiply(salary, days), parameters.DIAS_MES));
    const proportionalBenefits = this.detail(this.divide(this.multiply(otherBenefits, days), parameters.DIAS_MES));

    const component = (base: bigint, rate: bigint) => this.detail(this.multiply(base, rate));
    const cair = component(proportionalSalary, parameters.CAIR_SUELDO);
    const fra = this.detail(
      component(proportionalSalary, parameters.FRA_SUELDO)
      + component(proportionalBenefits, parameters.FRA_OTRAS)
      + component(quinquenios, parameters.FRA_QUINQUENIOS)
    );
    const fre = this.detail(
      component(proportionalSalary, parameters.FRE_SUELDO)
      + component(proportionalBenefits, parameters.FRE_OTRAS)
      + component(quinquenios, parameters.FRE_QUINQUENIOS)
    );
    const fh = component(proportionalSalary, parameters.FH_SUELDO);
    const fv = component(proportionalSalary, parameters.FV_SUELDO);
    const faa = component(proportionalSalary, parameters.FAA_SUELDO);
    const fae = component(proportionalSalary, parameters.FAE_SUELDO);
    const fat = this.detail(faa + fae);

    return {
      sueldoProporcionalD6: this.format(proportionalSalary, 6),
      otrasPrestacionesProporcionalD6: this.format(proportionalBenefits, 6),
      baseCotizacionQuinqueniosD6: this.format(quinquenios, 6),
      cairD6: this.format(cair, 6),
      fraD6: this.format(fra, 6),
      freD6: this.format(fre, 6),
      fhD6: this.format(fh, 6),
      fvD6: this.format(fv, 6),
      faaD6: this.format(faa, 6),
      faeD6: this.format(fae, 6),
      fatD6: this.format(fat, 6)
    };
  }

  agregarA2(details: readonly string[]): string {
    const total = details.reduce((sum, value) => sum + this.detail(this.parse(value)), 0n);
    return this.format(total, 2);
  }

  truncarD6(value: string): string {
    return this.format(this.detail(this.parse(value)), 6);
  }

  truncarA2(value: string): string {
    return this.format(this.parse(value), 2);
  }

  restarD6(left: string, right: string): string {
    return this.format(this.detail(this.parse(left) - this.parse(right)), 6);
  }

  multiplicarD6(value: string, factor: string): string {
    return this.format(this.detail(this.multiply(this.parse(value), this.parse(factor))), 6);
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
