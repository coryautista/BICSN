import { createHash } from 'node:crypto';
import type {
  SnapshotCalculoV2Detalle,
  SnapshotCalculoV2Input
} from '../entities/SnapshotCalculoV2.js';
import { AportacionesMonetaryKernel } from './AportacionesMonetaryKernel.js';
import { NominaDiasLaboradosResolver, type NominaDiasContext } from './NominaDiasLaboradosResolver.js';
import { FORMULA_PRECISION_POLICY } from '../entities/FormulaCalculo.js';

type FondoBaseDetalle = {
  interno: number;
  sueldo: number;
  quinquenios: number;
  otras_prestaciones?: number | null;
  sueldo_d6?: string;
  quinquenios_d6?: string;
  otras_prestaciones_d6?: string;
};

type AhorroDetalle = FondoBaseDetalle & { afae: number; afaa: number; total: number; afae_d6?: string; afaa_d6?: string; total_d6?: string };
type ViviendaDetalle = FondoBaseDetalle & { afe: number; afe_d6?: string; fh_d6?: string; fv_d6?: string; total_d6?: string };
type PrestacionesDetalle = FondoBaseDetalle & {
  afpe: number;
  afpa: number;
  afpe_d6?: string;
  afpa_d6?: string;
  quinquenios_aplicado_d6?: string | null;
  total?: number;
  total_d6?: string;
};
type CairDetalle = FondoBaseDetalle & { afe: number; afe_d6?: string; total_d6?: string };

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
  diasPolicy: { default: number; min: number; max: number };
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
  constructor(private readonly kernel = new AportacionesMonetaryKernel()) {}

  crear(input: SnapshotCalculoV2FactoryInput): SnapshotCalculoV2Input {
    const diasResolver = new NominaDiasLaboradosResolver(
      input.diasPolicy.default,
      input.diasPolicy.min,
      input.diasPolicy.max
    );
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
      const dias = diasResolver.resolve(identidad.rfc, input.nomina, true);
      const baseCotizacionSueldo = dias.origen === 'nomina' ? dias.baseCotizacionSueldo : null;
      if (dias.origen === 'nomina' && baseCotizacionSueldo == null) {
        throw new Error(`SNAPSHOT_V2_BASE_COTIZACION_SUELDO_REQUERIDA:${identidad.rfc ?? interno}`);
      }
      return {
        orden: index + 1,
        empleadoClaveHash: this.hashEmpleado(input, interno),
        diasLaborados: this.diasD2(dias.dias, input.diasPolicy.max),
        diasOrigen: dias.origen,
        sueldoMensualD6: this.d6(rowAhorro.sueldo_d6 ?? rowAhorro.sueldo),
        otrasPrestacionesMensualesD6: this.nullableD6(rowAhorro.otras_prestaciones_d6 ?? rowAhorro.otras_prestaciones),
        quinqueniosMensualD6: this.d6(rowAhorro.quinquenios_d6 ?? rowAhorro.quinquenios),
        baseCotizacionSueldoD6: baseCotizacionSueldo == null ? null : this.d6(baseCotizacionSueldo),
        baseCotizacionQuinqueniosD6: this.nullableD6(rowPrestaciones.quinquenios_aplicado_d6),
        cairD6: this.d6(rowCair.afe_d6 ?? rowCair.afe),
        cairFondoD6: this.d6(rowCair.total_d6 ?? rowCair.afe_d6 ?? rowCair.afe),
        fraD6: this.d6(rowPrestaciones.afpa_d6 ?? rowPrestaciones.afpa),
        freD6: this.d6(rowPrestaciones.afpe_d6 ?? rowPrestaciones.afpe),
        prestacionesD6: this.d6(rowPrestaciones.total_d6 ?? rowPrestaciones.total ?? this.kernel.sumarD6([
          String(rowPrestaciones.afpa_d6 ?? rowPrestaciones.afpa),
          String(rowPrestaciones.afpe_d6 ?? rowPrestaciones.afpe)
        ])),
        fhD6: this.d6(rowVivienda.fh_d6 ?? this.kernel.multiplicarD6(String(rowVivienda.afe_d6 ?? rowVivienda.afe), '0.2')),
        fvD6: this.d6(rowVivienda.fv_d6 ?? this.kernel.multiplicarD6(String(rowVivienda.afe_d6 ?? rowVivienda.afe), '0.8')),
        viviendaD6: this.d6(rowVivienda.total_d6 ?? rowVivienda.afe_d6 ?? rowVivienda.afe),
        faaD6: this.d6(rowAhorro.afaa_d6 ?? rowAhorro.afaa),
        faeD6: this.d6(rowAhorro.afae_d6 ?? rowAhorro.afae),
        fatD6: this.d6(rowAhorro.total_d6 ?? rowAhorro.total),
        faiD6: this.d6(identidad.faiD6)
      };
    });
    const agregarComponente = (field: keyof SnapshotCalculoV2Detalle): string =>
      this.kernel.agregarComponenteA2(detalles.map((row) => String(row[field] ?? '0')));

    const faaA2 = agregarComponente('faaD6');
    const faeA2 = agregarComponente('faeD6');
    const cairA2 = agregarComponente('cairD6');
    const fraA2 = agregarComponente('fraD6');
    const freA2 = agregarComponente('freD6');
    const fhA2 = agregarComponente('fhD6');
    const fvA2 = agregarComponente('fvD6');
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
      precisionPolicy: FORMULA_PRECISION_POLICY,
      versionEsquema: 4,
      usuarioId: input.usuarioId,
      totalesA2: {
        CAIR: cairA2,
        CAIR_FONDO: cairA2,
        FRA: fraA2,
        FRE: freA2,
        PRESTACIONES: this.kernel.sumarA2([fraA2, freA2]),
        FH: fhA2,
        FV: fvA2,
        VIVIENDA: this.kernel.sumarA2([fhA2, fvA2]),
        FAA: faaA2,
        FAE: faeA2,
        FAT: this.kernel.sumarA2([faaA2, faeA2]),
        FAI: agregarComponente('faiD6')
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
    return this.kernel.redondearD6(String(value));
  }

  private nullableD6(value: number | string | null | undefined): string | null {
    return value === null || value === undefined ? null : this.d6(value);
  }

  private diasD2(value: number, maximum: number): string {
    if (!Number.isFinite(value) || value < 0 || value > maximum) throw new Error('DIAS_LABORADOS_FUERA_RANGO');
    const text = String(value);
    const [integer, fraction = ''] = text.split('.');
    if (fraction.length > 2) throw new Error('DIAS_LABORADOS_ESCALA_INVALIDA');
    return `${integer}.${fraction.padEnd(2, '0')}`;
  }
}
