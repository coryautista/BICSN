import { IInfoRepository } from '../../domain/repositories/IInfoRepository.js';
import { Info, UpdateInfoData } from '../../domain/entities/Info.js';
import {
  InfoNotFoundError,
  InvalidInfoIdError,
  InvalidInfoNameError,
  InvalidInfoColorError,
  InfoRepositoryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateInfoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateInfoInput {
  id: number;
  nombre?: string;
  icono?: string;
  color?: string;
  colorBotones?: string;
  colorEncabezados?: string;
  colorLetra?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export class UpdateInfoCommand {
  constructor(private infoRepo: IInfoRepository) {}

  async execute(input: UpdateInfoInput, _userId?: string): Promise<Info> {
    try {
      logger.info({
        operation: 'updateInfo',
        infoId: input.id,
        nombre: input.nombre,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando actualización de información');

      // Validaciones de entrada
      this.validateInput(input);

      // Verificar que el info existe
      const existing = await this.infoRepo.findById(input.id);
      if (!existing) {
        logger.warn({
          operation: 'updateInfo',
          infoId: input.id,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Intento de actualizar información inexistente');
        throw new InfoNotFoundError(input.id);
      }

      const updateData: UpdateInfoData = {
        nombre: input.nombre?.trim(),
        icono: input.icono?.trim(),
        color: input.color?.trim(),
        colorBotones: input.colorBotones?.trim(),
        colorEncabezados: input.colorEncabezados?.trim(),
        colorLetra: input.colorLetra?.trim(),
        updatedAt: input.updatedAt,
        updatedBy: input.updatedBy
      };

      const updated = await this.infoRepo.update(input.id, updateData);
      if (!updated) {
        logger.error({
          operation: 'updateInfo',
          infoId: input.id,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'La actualización no afectó ningún registro');
        throw new InfoRepositoryError('update', new Error('No rows affected'));
      }

      logger.info({
        operation: 'updateInfo',
        infoId: updated.id,
        nombre: updated.nombre,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Información actualizada exitosamente');

      return updated;
    } catch (error) {
      if (error instanceof InfoNotFoundError ||
          error instanceof InvalidInfoIdError ||
          error instanceof InvalidInfoNameError ||
          error instanceof InvalidInfoColorError) {
        throw error;
      }

      logger.error({
        operation: 'updateInfo',
        error: (error as Error).message,
        infoId: input.id,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al actualizar información');

      throw new InfoRepositoryError('update', error as Error);
    }
  }

  private validateInput(input: UpdateInfoInput): void {
    // Validar ID
    if (!input.id || typeof input.id !== 'number' || input.id <= 0) {
      throw new InvalidInfoIdError(input.id);
    }

    // Validar nombre si está presente
    if (input.nombre !== undefined) {
      const nombre = input.nombre.trim();

      if (nombre.length === 0) {
        throw new InvalidInfoNameError(nombre, 'el nombre no puede estar vacío');
      }

      if (nombre.length > 100) {
        throw new InvalidInfoNameError(nombre, 'el nombre no puede tener más de 100 caracteres');
      }

      // Validar formato del nombre
      const nombreRegex = /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/;
      if (!nombreRegex.test(nombre)) {
        throw new InvalidInfoNameError(nombre, 'el nombre contiene caracteres no válidos');
      }
    }

    // Validar colores si están presentes
    const colorFields = ['color', 'colorBotones', 'colorEncabezados', 'colorLetra'] as const;
    for (const field of colorFields) {
      const colorValue = input[field];
      if (colorValue !== undefined) {
        this.validateColor(field, colorValue);
      }
    }
  }

  private validateColor(colorType: string, colorValue: string): void {
    // Validar formato de color hexadecimal
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    // Validar nombres de colores comunes
    const namedColors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey'];

    if (!hexColorRegex.test(colorValue) && !namedColors.includes(colorValue.toLowerCase())) {
      throw new InvalidInfoColorError(colorType, colorValue);
    }
  }
}
