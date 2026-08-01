import {
  IAportacionFondoRepository,
  NumerosEmpleadoLookup
} from '../../domain/repositories/IAportacionFondoRepository.js';

export class GetNumerosEmpleadoQuery {
  constructor(private aportacionFondoRepo: IAportacionFondoRepository) {}

  async execute(internos: number[], rfcs: string[]): Promise<NumerosEmpleadoLookup> {
    return this.aportacionFondoRepo.obtenerNumerosEmpleado(internos, rfcs);
  }
}
