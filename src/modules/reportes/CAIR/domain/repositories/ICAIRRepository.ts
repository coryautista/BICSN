import { EstadoCuentaCAIR } from '../entities/EstadoCuentaCAIR.js';
import { CAIREntregado } from '../entities/CAIREntregado.js';

export interface ICAIRRepository {
  getEstadoCuentaCAIR(quincena: string, scope: { org0: string; org1: string }): Promise<EstadoCuentaCAIR[]>;
  getCAIREntregado(fi: string, ff: string, tipo: string, scope: { org0: string; org1: string }): Promise<CAIREntregado[]>;
}

