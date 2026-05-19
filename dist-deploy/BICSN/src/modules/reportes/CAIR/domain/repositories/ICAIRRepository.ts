import { EstadoCuentaCAIR } from '../entities/EstadoCuentaCAIR.js';
import { CAIREntregado } from '../entities/CAIREntregado.js';

export interface ICAIRRepository {
  getEstadoCuentaCAIR(quincena: string): Promise<EstadoCuentaCAIR[]>;
  getCAIREntregado(fi: string, ff: string, tipo: string): Promise<CAIREntregado[]>;
}

