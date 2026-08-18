import { AportacionFondoDomainError, AportacionFondoError } from '../errors.js';

export type DiasLaboradosOrigen = 'nomina' | 'movimiento' | 'default' | 'nomina_sin_coincidencia';

export type NominaDiasDetalle = {
  dias: number | null;
  baseCotizacionQuinquenios: number | null;
};

export type NominaDiasContext = {
  tieneArchivo: boolean;
  fuente?: 'txt' | 'movimiento' | 'default';
  registros: Map<string, NominaDiasDetalle>;
};

export type NominaDiasResultado = {
  dias: number;
  origen: DiasLaboradosOrigen;
  baseCotizacionQuinquenios: number | null;
};

export class NominaDiasLaboradosResolver {
  constructor(private readonly diasDefault = 15) {}

  resolve(
    rfc: string | null | undefined,
    contexto: NominaDiasContext,
    usarDiasLaboradosNomina: boolean
  ): NominaDiasResultado {
    if (!usarDiasLaboradosNomina) {
      return { dias: this.diasDefault, origen: 'default', baseCotizacionQuinquenios: null };
    }

    const fuente = contexto.fuente ?? (contexto.tieneArchivo ? 'txt' : 'default');
    const key = this.normalizeRfc(rfc);
    const found = key ? contexto.registros.get(key) : undefined;
    if (fuente === 'default' || (fuente === 'movimiento' && !found)) {
      return { dias: this.diasDefault, origen: 'default', baseCotizacionQuinquenios: null };
    }
    if (!found) {
      return { dias: 0, origen: 'nomina_sin_coincidencia', baseCotizacionQuinquenios: null };
    }

    const dias = found.dias ?? 0;
    if (!Number.isFinite(dias) || dias < 0 || dias > this.diasDefault) {
      throw new AportacionFondoDomainError(
        `DiasLaborados fuera de rango para RFC ${key}: ${String(found.dias)}`,
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }

    return {
      dias,
      origen: fuente === 'movimiento' ? 'movimiento' : 'nomina',
      baseCotizacionQuinquenios: found.baseCotizacionQuinquenios
    };
  }

  normalizeRfc(rfc: string | null | undefined): string | null {
    const normalized = String(rfc ?? '').trim().toUpperCase();
    return normalized || null;
  }
}
