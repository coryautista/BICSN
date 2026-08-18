import {
  NominaDiasLaboradosResolver,
  type NominaDiasContext
} from '../../../aportacionesFondos/domain/services/NominaDiasLaboradosResolver.js';

export interface RevisionAplicacionFondoRow {
  RFC?: unknown;
  SARE?: unknown;
  FRA?: unknown;
  FRE?: unknown;
  FHE?: unknown;
  FVE?: unknown;
  FAA?: unknown;
  FAE?: unknown;
  FAI?: unknown;
}

export interface RevisionAplicacionDiasResultado {
  registros: number;
  registrosNomina: number;
  registrosMovimiento: number;
  registrosDefault: number;
  CAIR: number;
  FRA: number;
  FRE: number;
  FH: number;
  FV: number;
  FAA: number;
  FAE: number;
  FAT: number;
  FAI: number;
}

const CAMPOS_AJUSTABLES = {
  CAIR: 'SARE',
  FRA: 'FRA',
  FRE: 'FRE',
  FH: 'FHE',
  FV: 'FVE',
  FAA: 'FAA',
  FAE: 'FAE'
} as const;

export class RevisionAplicacionDiasFactory {
  private readonly diasResolver = new NominaDiasLaboradosResolver(15);

  crear(
    rows: RevisionAplicacionFondoRow[],
    nomina: NominaDiasContext
  ): RevisionAplicacionDiasResultado {
    if (rows.length === 0) throw new Error('REVISION_APLICACION_SIN_DETALLE');

    if (nomina.tieneArchivo) {
      const rfcs = rows.map((row) => this.diasResolver.normalizeRfc(String(row.RFC ?? '')));
      const rfcsSinCoincidencia = rfcs.filter((rfc): rfc is string => !rfc || !nomina.registros.has(rfc));
      if (rfcsSinCoincidencia.length > 0) {
        throw new Error(`REVISION_APLICACION_TXT_RFC_SIN_COINCIDENCIA:${[...new Set(rfcsSinCoincidencia)].join(',')}`);
      }
      for (const rfc of rfcs as string[]) {
        if (nomina.registros.get(rfc)?.dias === null) {
          throw new Error(`REVISION_APLICACION_TXT_DIAS_NULOS:${rfc}`);
        }
      }
    }

    const centavos = {
      CAIR: 0,
      FRA: 0,
      FRE: 0,
      FH: 0,
      FV: 0,
      FAA: 0,
      FAE: 0,
      FAI: 0
    };
    let registrosNomina = 0;
    let registrosMovimiento = 0;

    for (const row of rows) {
      const dias = this.diasResolver.resolve(String(row.RFC ?? ''), nomina, true);
      if (dias.origen === 'nomina') registrosNomina += 1;
      if (dias.origen === 'movimiento') registrosMovimiento += 1;
      const factor = dias.dias / 15;
      for (const [fondo, campo] of Object.entries(CAMPOS_AJUSTABLES) as Array<
        [keyof typeof CAMPOS_AJUSTABLES, (typeof CAMPOS_AJUSTABLES)[keyof typeof CAMPOS_AJUSTABLES]]
      >) {
        centavos[fondo] += this.aCentavos(this.numero(row[campo]) * factor);
      }
      centavos.FAI += this.aCentavos(this.numero(row.FAI));
    }

    const importe = (value: number): number => value / 100;
    return {
      registros: rows.length,
      registrosNomina,
      registrosMovimiento,
      registrosDefault: rows.length - registrosNomina - registrosMovimiento,
      CAIR: importe(centavos.CAIR),
      FRA: importe(centavos.FRA),
      FRE: importe(centavos.FRE),
      FH: importe(centavos.FH),
      FV: importe(centavos.FV),
      FAA: importe(centavos.FAA),
      FAE: importe(centavos.FAE),
      FAT: importe(centavos.FAA + centavos.FAE),
      FAI: importe(centavos.FAI)
    };
  }

  private numero(value: unknown): number {
    const result = Number(value ?? 0);
    if (!Number.isFinite(result)) throw new Error(`REVISION_APLICACION_IMPORTE_INVALIDO:${String(value)}`);
    return result;
  }

  private aCentavos(value: number): number {
    return Math.round((value + Number.EPSILON) * 100);
  }
}
