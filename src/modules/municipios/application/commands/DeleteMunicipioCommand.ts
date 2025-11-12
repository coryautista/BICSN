import { IMunicipioRepository } from '../../domain/repositories/IMunicipioRepository.js';
import {
  MunicipioNotFoundError,
  MunicipioInvalidIdError,
  MunicipioInUseError,
  MunicipioError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteMunicipioCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteMunicipioInput {
  municipioId: number;
}

export class DeleteMunicipioCommand {
  constructor(private municipioRepo: IMunicipioRepository) {}

  async execute(input: DeleteMunicipioInput, tx?: any): Promise<boolean> {
    try {
      logger.info({
        operation: 'deleteMunicipio',
        municipioId: input.municipioId,
        timestamp: new Date().toISOString()
      }, 'Iniciando eliminación de municipio');

      // Validar ID
      this.validateId(input.municipioId);

      // Verificar que el municipio existe
      const municipio = await this.municipioRepo.findById(input.municipioId);
      if (!municipio) {
        throw new MunicipioNotFoundError(input.municipioId);
      }

      // Validar que se puede eliminar (verificar si está en uso)
      await this.validateCanDelete();

      // Eliminar municipio
      const deleted = await this.municipioRepo.delete(input.municipioId, tx);
      if (!deleted) {
        throw new MunicipioError('Error al eliminar municipio en la base de datos', 'MUNICIPIO_DELETE_FAILED', 500);
      }

      logger.info({
        operation: 'deleteMunicipio',
        municipioId: input.municipioId,
        estadoId: municipio.estadoId,
        claveMunicipio: municipio.claveMunicipio,
        nombreMunicipio: municipio.nombreMunicipio,
        timestamp: new Date().toISOString()
      }, 'Municipio eliminado exitosamente');

      return deleted;
    } catch (error) {
      if (error instanceof MunicipioNotFoundError ||
          error instanceof MunicipioInvalidIdError ||
          error instanceof MunicipioInUseError) {
        throw error;
      }

      logger.error({
        operation: 'deleteMunicipio',
        error: (error as Error).message,
        municipioId: input.municipioId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al eliminar municipio');

      throw new MunicipioError('Error interno al eliminar municipio', 'MUNICIPIO_DELETE_ERROR', 500);
    }
  }

  private validateId(municipioId: number): void {
    if (!Number.isInteger(municipioId) || municipioId <= 0) {
      throw new MunicipioInvalidIdError('debe ser un número entero positivo');
    }
  }

  private async validateCanDelete(): Promise<void> {
    // Aquí se podrían agregar validaciones para verificar si el municipio está siendo usado
    // por ejemplo, en direcciones, colonias, etc.
    // Por ahora, permitimos eliminar cualquier municipio válido

    // Ejemplo de validación futura:
    // const inUse = await this.checkIfMunicipioIsInUse(municipio.municipioId);
    // if (inUse) {
    //   throw new MunicipioInUseError(municipio.municipioId);
    // }
  }
}
