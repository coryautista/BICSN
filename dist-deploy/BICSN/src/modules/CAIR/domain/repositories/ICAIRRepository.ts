import { DevueltoTipo } from '../entities/DevueltoTipo.js';
import { ChequeLeyenda } from '../entities/ChequeLeyenda.js';
import { SARDevolucion } from '../entities/SARDevolucion.js';

export interface ICAIRRepository {
  getDevueltoTipos(): Promise<DevueltoTipo[]>;
  getChequesLeyendas(): Promise<ChequeLeyenda[]>;
  getSARDevolucion(interno: string, tipo: string): Promise<SARDevolucion[]>;
}

