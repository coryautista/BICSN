import { RegistrarAfectacionData, RegistrarAfectacionResult } from '../entities/RegistrarAfectacion.js';

export interface IAfectacionRepository {
  registrar(data: RegistrarAfectacionData): Promise<RegistrarAfectacionResult>;
}
