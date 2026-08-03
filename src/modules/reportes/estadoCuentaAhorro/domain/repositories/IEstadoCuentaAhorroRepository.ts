import { EstadoCuentaAhorro, ParametrosEstadoCuentaAhorro } from '../entities/EstadoCuentaAhorro.js';

export interface IEstadoCuentaAhorroRepository {
  generar(parametros: ParametrosEstadoCuentaAhorro, generadoPor?: string): Promise<EstadoCuentaAhorro>;
  obtenerHistorico(idHistorico: number): Promise<EstadoCuentaAhorro | null>;
  obtenerUltimoHistorico(parametros: ParametrosEstadoCuentaAhorro): Promise<EstadoCuentaAhorro | null>;
}
