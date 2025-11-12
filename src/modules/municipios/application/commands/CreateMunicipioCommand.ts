import { IMunicipioRepository } from '../../domain/repositories/IMunicipioRepository.js';
import { Municipio, CreateMunicipioData } from '../../domain/entities/Municipio.js';
import {
  MunicipioAlreadyExistsError,
  MunicipioInvalidEstadoError,
  MunicipioInvalidClaveError,
  MunicipioInvalidNombreError,
  MunicipioError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createMunicipioCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateMunicipioInput {
  estadoId: string;
  claveMunicipio: string;
  nombreMunicipio: string;
  esValido: boolean;
  userId?: string;
}

export class CreateMunicipioCommand {
  constructor(private municipioRepo: IMunicipioRepository) {}

  async execute(input: CreateMunicipioInput, tx?: any): Promise<Municipio> {
    try {
      logger.info({
        operation: 'createMunicipio',
        estadoId: input.estadoId,
        claveMunicipio: input.claveMunicipio,
        nombreMunicipio: input.nombreMunicipio,
        esValido: input.esValido,
        userId: input.userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando creación de municipio');

      // Validaciones de entrada
      this.validateInput(input);

      // Verificar unicidad de la clave del municipio
      const existingMunicipio = await this.municipioRepo.findByClave(input.claveMunicipio);
      if (existingMunicipio) {
        throw new MunicipioAlreadyExistsError(input.claveMunicipio);
      }

      const createData: CreateMunicipioData = {
        estadoId: input.estadoId,
        claveMunicipio: input.claveMunicipio,
        nombreMunicipio: input.nombreMunicipio,
        esValido: input.esValido,
        userId: input.userId
      };

      // Crear municipio
      const municipio = await this.municipioRepo.create(createData, tx);

      logger.info({
        operation: 'createMunicipio',
        municipioId: municipio.municipioId,
        estadoId: municipio.estadoId,
        claveMunicipio: municipio.claveMunicipio,
        nombreMunicipio: municipio.nombreMunicipio,
        userId: input.userId,
        timestamp: new Date().toISOString()
      }, 'Municipio creado exitosamente');

      return municipio;
    } catch (error) {
      if (error instanceof MunicipioAlreadyExistsError ||
          error instanceof MunicipioInvalidEstadoError ||
          error instanceof MunicipioInvalidClaveError ||
          error instanceof MunicipioInvalidNombreError) {
        throw error;
      }

      logger.error({
        operation: 'createMunicipio',
        error: (error as Error).message,
        estadoId: input.estadoId,
        claveMunicipio: input.claveMunicipio,
        nombreMunicipio: input.nombreMunicipio,
        userId: input.userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al crear municipio');

      throw new MunicipioError('Error interno al crear municipio', 'MUNICIPIO_CREATE_ERROR', 500);
    }
  }

  private validateInput(input: CreateMunicipioInput): void {
    // Validar estadoId
    if (!input.estadoId || typeof input.estadoId !== 'string') {
      throw new MunicipioInvalidEstadoError('debe ser una cadena de texto');
    }

    const estadoIdTrimmed = input.estadoId.trim();
    if (estadoIdTrimmed.length === 0) {
      throw new MunicipioInvalidEstadoError('no puede estar vacío');
    }

    if (estadoIdTrimmed.length !== 2) {
      throw new MunicipioInvalidEstadoError('debe tener exactamente 2 caracteres');
    }

    // Solo permitir letras mayúsculas para códigos de estado
    const estadoRegex = /^[A-Z]{2}$/;
    if (!estadoRegex.test(estadoIdTrimmed)) {
      throw new MunicipioInvalidEstadoError('debe contener solo letras mayúsculas');
    }

    // Validar claveMunicipio
    if (!input.claveMunicipio || typeof input.claveMunicipio !== 'string') {
      throw new MunicipioInvalidClaveError('debe ser una cadena de texto');
    }

    const claveTrimmed = input.claveMunicipio.trim();
    if (claveTrimmed.length === 0) {
      throw new MunicipioInvalidClaveError('no puede estar vacía');
    }

    if (claveTrimmed.length > 3) {
      throw new MunicipioInvalidClaveError('no puede tener más de 3 caracteres');
    }

    // Solo permitir letras, números y algunos caracteres especiales
    const claveRegex = /^[A-Z0-9\-]+$/;
    if (!claveRegex.test(claveTrimmed)) {
      throw new MunicipioInvalidClaveError('solo puede contener letras mayúsculas, números y guiones');
    }

    // Validar nombreMunicipio
    if (!input.nombreMunicipio || typeof input.nombreMunicipio !== 'string') {
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

    // Validar esValido
    if (typeof input.esValido !== 'boolean') {
      throw new MunicipioInvalidEstadoError('el campo esValido debe ser un valor booleano');
    }
  }
}
