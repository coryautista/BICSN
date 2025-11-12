import { ProgresoUsuario } from '../entities/ProgresoUsuario.js';

export interface ProgresoUsuarioFilters {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  usuario?: string;
}

export interface IProgresoUsuarioRepository {
  findAll(filters: ProgresoUsuarioFilters): Promise<ProgresoUsuario[]>;
}
