import { IAfiliadoRepository } from '../../domain/repositories/IAfiliadoRepository.js';
import { HistorialMovimientosQuincenaResult } from '../../domain/entities/HistorialMovimientosQuincena.js';
import { InvalidAfiliadoDataError } from '../../domain/errors.js';
import { normalizeClaveOrganica } from '../../../../utils/organica.js';

export interface GetHistorialMovimientosQuincenaSqlInput {
  org0?: string | number | null;
  org1?: string | number | null;
  periodo?: string | null;
  quincena?: number | null;
  anio?: number | null;
  buscar?: string | null;
  page?: number | null;
  pageSize?: number | null;
}

export class GetHistorialMovimientosQuincenaSqlQuery {
  constructor(private afiliadoRepo: IAfiliadoRepository) {}

  async execute(input: GetHistorialMovimientosQuincenaSqlInput): Promise<HistorialMovimientosQuincenaResult> {
    const org0 = normalizeClaveOrganica(input.org0);
    const org1 = normalizeClaveOrganica(input.org1);
    if (!org0 || !org1) {
      throw new InvalidAfiliadoDataError('organica', 'org0 y org1 son requeridos');
    }

    const { periodo, quincena, anio } = this.resolvePeriodo(input.periodo, input.quincena, input.anio);
    const page = Math.max(1, Number(input.page || 1));
    const pageSize = Math.min(500, Math.max(1, Number(input.pageSize || 100)));
    const quincenaId = `${anio}-${String(quincena).padStart(2, '0')}`;

    return this.afiliadoRepo.getHistorialMovimientosQuincena({
      org0,
      org1,
      periodo,
      quincena,
      anio,
      quincenaId,
      buscar: input.buscar?.trim() || undefined,
      page,
      pageSize
    });
  }

  private resolvePeriodo(periodoInput?: string | null, quincenaInput?: number | null, anioInput?: number | null) {
    const periodo = periodoInput?.trim();
    if (periodo) {
      if (!/^\d{4}$/.test(periodo)) {
        throw new InvalidAfiliadoDataError('periodo', 'Periodo debe tener formato QQAA, por ejemplo 0626');
      }
      const quincena = Number(periodo.slice(0, 2));
      const anio = 2000 + Number(periodo.slice(2, 4));
      this.validateQuincenaAnio(quincena, anio);
      return { periodo, quincena, anio };
    }

    const quincena = Number(quincenaInput);
    const anio = Number(anioInput);
    this.validateQuincenaAnio(quincena, anio);
    return { periodo: `${String(quincena).padStart(2, '0')}${String(anio).slice(-2)}`, quincena, anio };
  }

  private validateQuincenaAnio(quincena: number, anio: number) {
    if (!Number.isInteger(quincena) || quincena < 1 || quincena > 24) {
      throw new InvalidAfiliadoDataError('quincena', 'Quincena debe estar entre 1 y 24');
    }
    if (!Number.isInteger(anio) || anio < 2000 || anio > 2099) {
      throw new InvalidAfiliadoDataError('anio', 'Año debe estar entre 2000 y 2099');
    }
  }
}
