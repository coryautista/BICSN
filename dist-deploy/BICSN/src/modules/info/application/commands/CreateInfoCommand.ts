import { IInfoRepository } from '../../domain/repositories/IInfoRepository.js';
import { Info, CreateInfoData } from '../../domain/entities/Info.js';
import {
  InfoAlreadyExistsError,
  InvalidInfoNameError,
  InvalidInfoColorError,
  InfoCreationDataMissingError,
  InfoRepositoryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createInfoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateInfoInput {
  nombre: string;
  icono?: string;
  color?: string;
  colorBotones?: string;
  colorEncabezados?: string;
  colorLetra?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export class CreateInfoCommand {
  constructor(private infoRepo: IInfoRepository) {}

  async execute(input: CreateInfoInput, _userId?: string): Promise<Info> {
    try {
      logger.info({
        operation: 'createInfo',
        nombre: input.nombre,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando creación de información');

      // Validaciones de entrada
      this.validateInput(input);

      const createData: CreateInfoData = {
        nombre: input.nombre.trim(),
        icono: input.icono?.trim(),
        color: input.color?.trim(),
        colorBotones: input.colorBotones?.trim(),
        colorEncabezados: input.colorEncabezados?.trim(),
        colorLetra: input.colorLetra?.trim(),
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        createdBy: input.createdBy,
        updatedBy: input.updatedBy
      };

      // Verificar si ya existe un info con el mismo nombre
      // Nota: La verificación de duplicados se maneja a nivel de base de datos con constraints únicos

      const result = await this.infoRepo.create(createData);

      logger.info({
        operation: 'createInfo',
        infoId: result.id,
        nombre: result.nombre,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Información creada exitosamente');

      return result;
    } catch (error) {
      if (error instanceof InfoAlreadyExistsError ||
          error instanceof InvalidInfoNameError ||
          error instanceof InvalidInfoColorError ||
          error instanceof InfoCreationDataMissingError) {
        throw error;
      }

      logger.error({
        operation: 'createInfo',
        error: (error as Error).message,
        nombre: input.nombre,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al crear información');

      throw new InfoRepositoryError('create', error as Error);
    }
  }

  private validateInput(input: CreateInfoInput): void {
    // Validar nombre requerido
    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new InfoCreationDataMissingError(['nombre']);
    }

    const nombre = input.nombre.trim();

    // Validar longitud del nombre
    if (nombre.length === 0) {
      throw new InvalidInfoNameError(nombre, 'el nombre no puede estar vacío');
    }

    if (nombre.length > 100) {
      throw new InvalidInfoNameError(nombre, 'el nombre no puede tener más de 100 caracteres');
    }

    // Validar formato del nombre (solo letras, números, espacios y algunos caracteres especiales)
    const nombreRegex = /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/;
    if (!nombreRegex.test(nombre)) {
      throw new InvalidInfoNameError(nombre, 'el nombre contiene caracteres no válidos');
    }

    // Validar colores si están presentes
    const colorFields = ['color', 'colorBotones', 'colorEncabezados', 'colorLetra'] as const;
    for (const field of colorFields) {
      const colorValue = input[field];
      if (colorValue) {
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
