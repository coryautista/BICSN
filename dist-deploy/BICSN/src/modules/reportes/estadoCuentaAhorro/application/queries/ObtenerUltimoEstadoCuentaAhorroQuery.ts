import { ParametrosEstadoCuentaAhorro } from '../../domain/entities/EstadoCuentaAhorro.js';
import { AfectacionOrgService } from '../../../../afectacionOrg/infrastructure/services/AfectacionOrgService.js';

type OrganicasEstadoCuentaAhorro = Pick<ParametrosEstadoCuentaAhorro, 'org0' | 'org1' | 'org2' | 'org3'>;

export interface QnaVigenteEstadoCuentaAhorro extends OrganicasEstadoCuentaAhorro {
  quincena: number;
  anio: number;
  periodo: string;
  fecha: string | null;
}

export class ObtenerUltimoEstadoCuentaAhorroQuery {
  constructor(private afectacionOrgService: AfectacionOrgService) {}

  async execute(organicas: OrganicasEstadoCuentaAhorro): Promise<QnaVigenteEstadoCuentaAhorro> {
    const qnaActual = await this.afectacionOrgService.getQuincenaFromFirebird(
      organicas.org0,
      organicas.org1,
      organicas.org2,
      organicas.org3
    );
    return {
      ...organicas,
      quincena: qnaActual.quincena,
      anio: qnaActual.anio,
      periodo: `${String(qnaActual.quincena).padStart(2, '0')}${String(qnaActual.anio).slice(-2)}`,
      fecha: qnaActual.fecha
    };
  }
}
