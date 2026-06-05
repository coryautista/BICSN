import { LineaCapturaPeriodoRepository, LineaCapturaPeriodoRecord } from '../../infrastructure/persistence/LineaCapturaPeriodoRepository.js';

export interface GetLineaCapturaPeriodoParams {
  org0: string;
  org1: string;
  periodo: string;
  importe?: number;
}

export class GetLineaCapturaPeriodoQuery {
  constructor(private lineaCapturaPeriodoRepo: LineaCapturaPeriodoRepository) {}

  async execute(params: GetLineaCapturaPeriodoParams): Promise<LineaCapturaPeriodoRecord | null> {
    return this.lineaCapturaPeriodoRepo.findVigente(params.org0, params.org1, params.periodo, params.importe);
  }
}
