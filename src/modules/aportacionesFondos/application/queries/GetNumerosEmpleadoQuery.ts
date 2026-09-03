import {
  IAportacionFondoRepository,
  NumerosEmpleadoLookup
} from '../../domain/repositories/IAportacionFondoRepository.js';

export class GetNumerosEmpleadoQuery {
  constructor(private aportacionFondoRepo: IAportacionFondoRepository) {}

  async execute(internos: number[], rfcs: string[], org0: string, org1: string): Promise<NumerosEmpleadoLookup> {
    return this.aportacionFondoRepo.obtenerNumerosEmpleado(internos, rfcs, org0, org1);
  }
}
