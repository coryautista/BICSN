import { DevueltoTipo } from '../entities/DevueltoTipo.js';
import { ChequeLeyenda } from '../entities/ChequeLeyenda.js';
import { SARDevolucion } from '../entities/SARDevolucion.js';

export interface ICAIRRepository {
  getDevueltoTipos(scope: { org0: string; org1: string }): Promise<DevueltoTipo[]>;
  getChequesLeyendas(scope: { org0: string; org1: string }): Promise<ChequeLeyenda[]>;
  getSARDevolucion(interno: string, tipo: string, scope: { org0: string; org1: string }): Promise<SARDevolucion[]>;
}

