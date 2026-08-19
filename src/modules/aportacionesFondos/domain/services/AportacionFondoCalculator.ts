import type { AportacionFondo, TipoFondo } from '../entities/AportacionFondo.js';
import type { FormulaCalculo } from '../entities/FormulaCalculo.js';
import type { DiasLaboradosOrigen } from './NominaDiasLaboradosResolver.js';
import { AportacionesMonetaryKernel } from './AportacionesMonetaryKernel.js';

export type AportacionFondoCalculationInput = {
  interno: number;
  nombre: string | null;
  sueldoMensual: string;
  otrasPrestacionesMensuales: string;
  quinqueniosMensual: string;
  diasLaborados: number;
  diasOrigen: DiasLaboradosOrigen;
  baseCotizacionSueldo: string | null;
  baseCotizacionQuinquenios: string | null;
};

export class AportacionFondoCalculator {
  constructor(private readonly kernel = new AportacionesMonetaryKernel()) {}

  calcular(
    tipo: TipoFondo,
    input: AportacionFondoCalculationInput,
    formula: FormulaCalculo
  ): AportacionFondo {
    const dias = String(input.diasLaborados);
    const usaBasesTxt = input.diasOrigen === 'nomina';
    if (usaBasesTxt && (input.baseCotizacionSueldo == null || input.baseCotizacionQuinquenios == null)) {
      throw new Error('NOMINA_BASE_COTIZACION_REQUERIDA');
    }
    const baseCotizacionQuinquenios = usaBasesTxt
      ? input.baseCotizacionQuinquenios!
      : this.kernel.proporcionarBaseA2D6(
          input.quinqueniosMensual,
          formula.parametros.DIAS_DEFAULT_SIN_TXT,
          formula.parametros.DIAS_MES
        );
    const calculo = this.kernel.calcularProporcionales({
      diasLaborados: dias,
      sueldoMensual: input.sueldoMensual,
      baseCotizacionSueldo: usaBasesTxt ? input.baseCotizacionSueldo : null,
      otrasPrestacionesMensuales: input.otrasPrestacionesMensuales,
      baseCotizacionQuinquenios,
      parametros: formula.parametros
    });
    const quinqueniosAplicadoD6 = calculo.baseCotizacionQuinqueniosD6;
    const sueldoD6 = this.kernel.truncarD6(input.sueldoMensual);
    const otrasPrestacionesD6 = this.kernel.truncarD6(input.otrasPrestacionesMensuales);
    const quinqueniosD6 = this.kernel.truncarD6(input.quinqueniosMensual);
    const sueldoBaseD6 = this.kernel.sumarD6([
      calculo.sueldoProporcionalD6,
      calculo.otrasPrestacionesProporcionalD6,
      quinqueniosAplicadoD6
    ]);
    const result: AportacionFondo = {
      interno: input.interno,
      nombre: input.nombre,
      sueldo: Number(sueldoD6),
      quinquenios: Number(quinqueniosD6),
      otras_prestaciones: Number(otrasPrestacionesD6),
      sueldo_proporcional: Number(calculo.sueldoProporcionalD6),
      sueldo_base: Number(sueldoBaseD6),
      total: 0,
      tipo,
      dias_laborados: input.diasLaborados,
      dias_laborados_origen: input.diasOrigen,
      base_cotizacion_quinquenios: usaBasesTxt ? Number(quinqueniosAplicadoD6) : null,
      quinquenios_aplicado: tipo === 'prestaciones' ? Number(quinqueniosAplicadoD6) : null,
      base_cotizacion_quinquenios_d6: usaBasesTxt ? quinqueniosAplicadoD6 : null,
      quinquenios_aplicado_d6: tipo === 'prestaciones' ? quinqueniosAplicadoD6 : null,
      sueldo_d6: sueldoD6,
      quinquenios_d6: quinqueniosD6,
      otras_prestaciones_d6: otrasPrestacionesD6,
      sueldo_proporcional_d6: calculo.sueldoProporcionalD6,
      sueldo_base_d6: sueldoBaseD6,
      total_d6: this.kernel.truncarD6('0')
    };

    if (tipo === 'ahorro') {
      result.afae_d6 = calculo.faeD6;
      result.afaa_d6 = calculo.faaD6;
      result.total_d6 = calculo.fatD6;
      result.afae = Number(result.afae_d6);
      result.afaa = Number(result.afaa_d6);
    } else if (tipo === 'vivienda') {
      result.fh_d6 = calculo.fhD6;
      result.fv_d6 = calculo.fvD6;
      result.afe_d6 = this.kernel.truncarD6(this.kernel.sumarA2([
        this.kernel.redondearA2(calculo.fhD6),
        this.kernel.redondearA2(calculo.fvD6)
      ]));
      result.total_d6 = result.afe_d6;
      result.afe = Number(result.afe_d6);
    } else if (tipo === 'prestaciones') {
      result.afpe_d6 = calculo.freD6;
      result.afpa_d6 = calculo.fraD6;
      result.total_d6 = this.kernel.truncarD6(this.kernel.sumarA2([
        this.kernel.redondearA2(result.afpe_d6),
        this.kernel.redondearA2(result.afpa_d6)
      ]));
      result.afpe = Number(result.afpe_d6);
      result.afpa = Number(result.afpa_d6);
    } else {
      result.afe_d6 = calculo.cairD6;
      result.total_d6 = result.afe_d6;
      result.afe = Number(result.afe_d6);
    }

    result.total = Number(result.total_d6);
    return result;
  }
}
