import { AportacionFondoDomainError, AportacionFondoError } from '../errors.js';

export type DiasLaboradosOrigen = 'nomina' | 'movimiento' | 'default' | 'nomina_sin_coincidencia';

export type NominaDiasDetalle = {
  dias: number | null;
  baseCotizacionSueldo?: number | string | null;
  baseCotizacionQuinquenios: number | string | null;
};

export type NominaDiasContext = {
  tieneArchivo: boolean;
  fuente?: 'txt' | 'movimiento' | 'default';
  registros: Map<string, NominaDiasDetalle>;
};

export type NominaDiasResultado = {
  dias: number;
  origen: DiasLaboradosOrigen;
  baseCotizacionSueldo: number | string | null;
  baseCotizacionQuinquenios: number | string | null;
};

export class NominaDiasLaboradosResolver {
  constructor(
    private readonly diasDefault = 15,
    private readonly diasMin = 0,
    private readonly diasMax = diasDefault
  ) {
    if (!Number.isFinite(diasDefault) || !Number.isFinite(diasMin) || !Number.isFinite(diasMax)
        || diasMin > diasMax || diasDefault < diasMin || diasDefault > diasMax) {
      throw new Error('POLITICA_DIAS_INVALIDA');
    }
  }

  resolve(
    rfc: string | null | undefined,
    contexto: NominaDiasContext,
    usarDiasLaboradosNomina: boolean
  ): NominaDiasResultado {
    if (!usarDiasLaboradosNomina) {
      return { dias: this.diasDefault, origen: 'default', baseCotizacionSueldo: null, baseCotizacionQuinquenios: null };
    }

    const fuente = contexto.fuente ?? (contexto.tieneArchivo ? 'txt' : 'default');
    const key = this.normalizeRfc(rfc);
    const found = key ? contexto.registros.get(key) : undefined;
    if (fuente === 'default' || (fuente === 'movimiento' && !found)) {
      return { dias: this.diasDefault, origen: 'default', baseCotizacionSueldo: null, baseCotizacionQuinquenios: null };
    }
    if (!found) {
      return { dias: 0, origen: 'nomina_sin_coincidencia', baseCotizacionSueldo: null, baseCotizacionQuinquenios: null };
    }

    const dias = found.dias ?? 0;
    if (!Number.isFinite(dias) || dias < this.diasMin || dias > this.diasMax) {
      throw new AportacionFondoDomainError(
        `DiasLaborados fuera de rango para RFC ${key}: ${String(found.dias)}`,
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }

    return {
      dias,
      origen: fuente === 'movimiento' ? 'movimiento' : 'nomina',
      baseCotizacionSueldo: found.baseCotizacionSueldo ?? null,
      baseCotizacionQuinquenios: found.baseCotizacionQuinquenios
    };
  }

  normalizeRfc(rfc: string | null | undefined): string | null {
    const normalized = String(rfc ?? '').trim().toUpperCase();
    return normalized || null;
  }
}
