import { createHash } from 'node:crypto';
import type {
  SnapshotCalculoV2Detalle,
  SnapshotCalculoV2Input
} from '../entities/SnapshotCalculoV2.js';
import { AportacionesMonetaryKernel } from './AportacionesMonetaryKernel.js';
import { NominaDiasLaboradosResolver, type NominaDiasContext } from './NominaDiasLaboradosResolver.js';

type FondoBaseDetalle = {
  interno: number;
  sueldo: number;
  quinquenios: number;
  otras_prestaciones?: number | null;
};

type AhorroDetalle = FondoBaseDetalle & { afae: number; afaa: number; total: number };
type ViviendaDetalle = FondoBaseDetalle & { afe: number };
type PrestacionesDetalle = FondoBaseDetalle & { afpe: number; afpa: number };
type CairDetalle = FondoBaseDetalle & { afe: number };

export type SnapshotIdentidadFai = {
  interno: number;
  rfc: string | null;
  faiD6: string;
};

export type SnapshotCalculoV2FactoryInput = {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  ambiente: 'DESARROLLO' | 'CALIDAD' | 'PRODUCCION';
  formulaCalculoVersionId: string;
  nominaCargaId: string | null;
  usuarioId: string | null;
  ahorro: AhorroDetalle[];
  vivienda: ViviendaDetalle[];
  prestaciones: PrestacionesDetalle[];
  cair: CairDetalle[];
  identidadesFai: SnapshotIdentidadFai[];
  nomina: NominaDiasContext;
};

export type SnapshotCargaTxtVigente = {
  CargaId: unknown;
  EntidadId: unknown;
  Organica2: unknown;
  Organica3: unknown;
};

export function seleccionarCargaTxtSnapshotV2(rows: SnapshotCargaTxtVigente[]):
  | { carga: SnapshotCargaTxtVigente; reason: null }
  | { carga: null; reason: 'SIN_TXT_VIGENTE' | 'TXT_VIGENTE_AMBIGUO' } {
  if (rows.length === 0) return { carga: null, reason: 'SIN_TXT_VIGENTE' };
  if (rows.length !== 1) return { carga: null, reason: 'TXT_VIGENTE_AMBIGUO' };
  return { carga: rows[0], reason: null };
}

export class SnapshotCalculoV2Factory {
  constructor(
    private readonly kernel = new AportacionesMonetaryKernel(),
    private readonly diasResolver = new NominaDiasLaboradosResolver()
  ) {}

  crear(input: SnapshotCalculoV2FactoryInput): SnapshotCalculoV2Input {
    const ahorro = this.indexar(input.ahorro, 'AHORRO');
    const vivienda = this.indexar(input.vivienda, 'VIVIENDA');
    const prestaciones = this.indexar(input.prestaciones, 'PRESTACIONES');
    const cair = this.indexar(input.cair, 'CAIR');
    const identidades = this.indexar(input.identidadesFai, 'FAI');
    const internos = [...ahorro.keys()].sort((left, right) => left - right);
    if (internos.length === 0) throw new Error('SNAPSHOT_V2_SIN_DETALLE');
    this.validarMismosInternos(internos, vivienda, 'VIVIENDA');
    this.validarMismosInternos(internos, prestaciones, 'PRESTACIONES');
    this.validarMismosInternos(internos, cair, 'CAIR');
    this.validarMismosInternos(internos, identidades, 'FAI');

    const detalles = internos.map((interno, index): SnapshotCalculoV2Detalle => {
      const rowAhorro = ahorro.get(interno)!;
      const rowVivienda = vivienda.get(interno)!;
      const rowPrestaciones = prestaciones.get(interno)!;
      const rowCair = cair.get(interno)!;
      const identidad = identidades.get(interno)!;
      const dias = this.diasResolver.resolve(identidad.rfc, input.nomina, true);
      return {
        orden: index + 1,
        empleadoClaveHash: this.hashEmpleado(input, interno),
        diasLaborados: dias.dias.toFixed(2),
        diasOrigen: dias.origen,
        sueldoMensualD6: this.d6(rowAhorro.sueldo),
        otrasPrestacionesMensualesD6: this.nullableD6(rowAhorro.otras_prestaciones),
        quinqueniosMensualD6: this.d6(rowAhorro.quinquenios),
        baseCotizacionQuinqueniosD6: this.nullableD6(dias.baseCotizacionQuinquenios),
        cairD6: this.d6(rowCair.afe),
        fraD6: this.d6(rowPrestaciones.afpa),
        freD6: this.d6(rowPrestaciones.afpe),
        fhD6: this.kernel.multiplicarD6(String(rowVivienda.afe), '0.2'),
        fvD6: this.kernel.multiplicarD6(String(rowVivienda.afe), '0.8'),
        faaD6: this.d6(rowAhorro.afaa),
        faeD6: this.d6(rowAhorro.afae),
        fatD6: this.d6(rowAhorro.total),
        faiD6: this.d6(identidad.faiD6)
      };
    });
    const agregar = (field: keyof SnapshotCalculoV2Detalle): string =>
      this.kernel.agregarA2(detalles.map((row) => String(row[field] ?? '0')));

    return {
      entidadId: input.entidadId,
      anio: input.anio,
      quincena: input.quincena,
      organica0: input.organica0,
      organica1: input.organica1,
      organica2: input.organica2,
      organica3: input.organica3,
      ambiente: input.ambiente,
      fuente: 'LIQUIDACION_V2',
      estado: 'COMPLETO',
      formulaCalculoVersionId: input.formulaCalculoVersionId,
      nominaCargaId: input.nominaCargaId,
      precisionPolicy: 'MXN-DETAIL6-AGG2-TRUNC-v1',
      versionEsquema: 1,
      usuarioId: input.usuarioId,
      totalesA2: {
        CAIR: agregar('cairD6'),
        FRA: agregar('fraD6'),
        FRE: agregar('freD6'),
        FH: agregar('fhD6'),
        FV: agregar('fvD6'),
        FAA: agregar('faaD6'),
        FAE: agregar('faeD6'),
        FAT: agregar('fatD6'),
        FAI: agregar('faiD6')
      },
      detalles
    };
  }

  private indexar<T extends { interno: number }>(rows: T[], fondo: string): Map<number, T> {
    const result = new Map<number, T>();
    for (const row of rows) {
      if (!Number.isInteger(row.interno) || result.has(row.interno)) {
        throw new Error(`SNAPSHOT_V2_${fondo}_INTERNO_INVALIDO:${row.interno}`);
      }
      result.set(row.interno, row);
    }
    return result;
  }

  private validarMismosInternos<T>(internos: number[], rows: Map<number, T>, fondo: string): void {
    if (rows.size !== internos.length || internos.some((interno) => !rows.has(interno))) {
      throw new Error(`SNAPSHOT_V2_${fondo}_INCOMPLETO`);
    }
  }

  private hashEmpleado(input: SnapshotCalculoV2FactoryInput, interno: number): string {
    const periodo = `${String(input.quincena).padStart(2, '0')}${String(input.anio).slice(-2)}`;
    return createHash('sha256')
      .update(`${periodo}|${input.organica0}|${input.organica1}|${input.organica2}|${input.organica3}|${interno}`)
      .digest('hex')
      .toUpperCase();
  }

  private d6(value: number | string): string {
    return this.kernel.truncarD6(String(value));
  }

  private nullableD6(value: number | null | undefined): string | null {
    return value === null || value === undefined ? null : this.d6(value);
  }
}
