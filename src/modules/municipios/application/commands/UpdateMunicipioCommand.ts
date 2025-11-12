import { IMunicipioRepository } from '../../domain/repositories/IMunicipioRepository.js';
import { Municipio, UpdateMunicipioData } from '../../domain/entities/Municipio.js';
import {
  MunicipioNotFoundError,
  MunicipioInvalidIdError,
  MunicipioInvalidNombreError,
  MunicipioError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateMunicipioCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateMunicipioInput {
  municipioId: number;
  nombreMunicipio?: string;
  esValido?: boolean;
  userId?: string;
}

export class UpdateMunicipioCommand {
  constructor(private municipioRepo: IMunicipioRepository) {}

  async execute(input: UpdateMunicipioInput, tx?: any): Promise<Municipio> {
    try {
      logger.info({
        operation: 'updateMunicipio',
        municipioId: input.municipioId,
        nombreMunicipio: input.nombreMunicipio,
        esValido: input.esValido,
        userId: input.userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando actualización de municipio');

      // Validar ID
      this.validateId(input.municipioId);

      // Verificar que el municipio existe
      const existing = await this.municipioRepo.findById(input.municipioId);
      if (!existing) {
        throw new MunicipioNotFoundError(input.municipioId);
      }

      // Validaciones de entrada
      this.validateInput(input);

      const updateData: UpdateMunicipioData = {
        nombreMunicipio: input.nombreMunicipio,
        esValido: input.esValido,
        userId: input.userId
      };

      // Actualizar municipio
      const updated = await this.municipioRepo.update(input.municipioId, updateData, tx);
      if (!updated) {
        throw new MunicipioError('Error al actualizar municipio en la base de datos', 'MUNICIPIO_UPDATE_FAILED', 500);
      }

      logger.info({
        operation: 'updateMunicipio',
        municipioId: updated.municipioId,
        estadoId: updated.estadoId,
        claveMunicipio: updated.claveMunicipio,
        nombreMunicipio: updated.nombreMunicipio,
        esValido: updated.esValido,
        userId: input.userId,
        timestamp: new Date().toISOString()
      }, 'Municipio actualizado exitosamente');

      return updated;
    } catch (error) {
      if (error instanceof MunicipioNotFoundError ||
          error instanceof MunicipioInvalidIdError ||
          error instanceof MunicipioInvalidNombreError) {
        throw error;
      }

      logger.error({
        operation: 'updateMunicipio',
        error: (error as Error).message,
        municipioId: input.municipioId,
        nombreMunicipio: input.nombreMunicipio,
        esValido: input.esValido,
        userId: input.userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al actualizar municipio');

      throw new MunicipioError('Error interno al actualizar municipio', 'MUNICIPIO_UPDATE_ERROR', 500);
    }
  }

  private validateId(municipioId: number): void {
    if (!Number.isInteger(municipioId) || municipioId <= 0) {
      throw new MunicipioInvalidIdError('debe ser un número entero positivo');
    }
  }

  private validateInput(input: UpdateMunicipioInput): void {
    // Validar nombreMunicipio si se proporciona
    if (input.nombreMunicipio !== undefined) {
      if (typeof input.nombreMunicipio !== 'string') {
        throw new MunicipioInvalidNombreError('debe ser una cadena de texto');
      }

      const nombreTrimmed = input.nombreMunicipio.trim();
      if (nombreTrimmed.length === 0) {
        throw new MunicipioInvalidNombreError('no puede estar vacío');
      }

      if (nombreTrimmed.length > 100) {
        throw new MunicipioInvalidNombreError('no puede tener más de 100 caracteres');
      }

      // Validar que no contenga caracteres peligrosos
      const nombreRegex = /^[\w\sáéíóúÁÉÍÓÚñÑüÜ.,()-]+$/;
      if (!nombreRegex.test(nombreTrimmed)) {
        throw new MunicipioInvalidNombreError('contiene caracteres no permitidos');
      }
    }

    // Validar esValido si se proporciona
    if (input.esValido !== undefined && typeof input.esValido !== 'boolean') {
      throw new MunicipioInvalidNombreError('el campo esValido debe ser un valor booleano');
    }
  }
}
