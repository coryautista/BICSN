import { EstadoCuentaAhorro, ParametrosEstadoCuentaAhorro } from '../../domain/entities/EstadoCuentaAhorro.js';
import { IEstadoCuentaAhorroRepository } from '../../domain/repositories/IEstadoCuentaAhorroRepository.js';
import { AfectacionOrgService } from '../../../../afectacionOrg/infrastructure/services/AfectacionOrgService.js';

type OrganicasEstadoCuentaAhorro = Pick<ParametrosEstadoCuentaAhorro, 'org0' | 'org1' | 'org2' | 'org3'>;

export class GenerarEstadoCuentaAhorroCommand {
  constructor(
    private estadoCuentaAhorroRepo: IEstadoCuentaAhorroRepository,
    private afectacionOrgService: AfectacionOrgService
  ) {}

  async execute(organicas: OrganicasEstadoCuentaAhorro, periodoSolicitado: string, generadoPor?: string): Promise<EstadoCuentaAhorro> {
    const qnaActual = await this.afectacionOrgService.getQuincenaFromFirebird(
      organicas.org0,
      organicas.org1,
      organicas.org2,
      organicas.org3
    );
    const parametros: ParametrosEstadoCuentaAhorro = { ...organicas, quincena: qnaActual.quincena, anio: qnaActual.anio };
    const periodoActual = `${String(qnaActual.quincena).padStart(2, '0')}${String(qnaActual.anio).slice(-2)}`;
    if (periodoSolicitado !== periodoActual) {
      throw new Error(`PERIODO_NO_VIGENTE: el periodo ${periodoSolicitado} no coincide con la QNA vigente ${periodoActual}.`);
    }
    return this.estadoCuentaAhorroRepo.generar(parametros, generadoPor);
  }
}
