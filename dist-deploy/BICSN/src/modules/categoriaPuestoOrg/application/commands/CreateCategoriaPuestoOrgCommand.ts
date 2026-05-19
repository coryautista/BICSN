import { ICategoriaPuestoOrgRepository } from '../../domain/repositories/ICategoriaPuestoOrgRepository.js';
import { CategoriaPuestoOrg, CreateCategoriaPuestoOrgData } from '../../domain/entities/CategoriaPuestoOrg.js';
import {
  InvalidCategoriaPuestoOrgDataError,
  InvalidOrgHierarchyError,
  InvalidNivelError,
  InvalidIngresoBrutoError,
  InvalidVigenciaDatesError,
  DuplicateCategoriaPuestoOrgError,
  CategoriaPuestoOrgRegistrationError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createCategoriaPuestoOrgCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateCategoriaPuestoOrgCommand {
  constructor(private categoriaPuestoOrgRepo: ICategoriaPuestoOrgRepository) {}

  async execute(data: CreateCategoriaPuestoOrgData): Promise<CategoriaPuestoOrg> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'createCategoriaPuestoOrg',
      nivel: data.nivel,
      org0: data.org0,
      org1: data.org1,
      categoria: data.categoria,
      userId: data.userId
    };

    logger.info(logContext, 'Creando nueva categoría de puesto orgánico');

    try {
      // Verificar duplicados antes de crear
      await this.checkForDuplicates(data);

      const result = await this.categoriaPuestoOrgRepo.create(data);

      logger.info({
        ...logContext,
        categoriaPuestoOrgId: result.categoriaPuestoOrgId,
        nombreCategoria: result.nombreCategoria,
        ingresoBrutoMensual: result.ingresoBrutoMensual
      }, 'Categoría de puesto orgánico creada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof DuplicateCategoriaPuestoOrgError ||
          error instanceof InvalidCategoriaPuestoOrgDataError ||
          error instanceof InvalidOrgHierarchyError ||
          error instanceof InvalidNivelError ||
          error instanceof InvalidIngresoBrutoError ||
          error instanceof InvalidVigenciaDatesError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al crear categoría de puesto orgánico');

      throw new CategoriaPuestoOrgRegistrationError('Error al crear categoría de puesto orgánico', {
        originalError: error.message,
        data: data
      });
    }
  }

  private validateInput(data: CreateCategoriaPuestoOrgData): void {
    // Validar nivel
    if (data.nivel === undefined || data.nivel === null || typeof data.nivel !== 'number' || data.nivel < 0 || data.nivel > 3) {
      throw new InvalidNivelError(data.nivel || 0);
    }

    // Validar org0
    if (!data.org0 || typeof data.org0 !== 'string' || data.org0.trim().length !== 2) {
      throw new InvalidCategoriaPuestoOrgDataError('org0', 'Debe ser una cadena de exactamente 2 caracteres');
    }

    // Validar formato de org0 (solo letras mayúsculas y números)
    if (!/^[A-Z0-9]{2}$/.test(data.org0)) {
      throw new InvalidCategoriaPuestoOrgDataError('org0', 'Debe contener solo letras mayúsculas y números');
    }

    // Validar org1
    if (!data.org1 || typeof data.org1 !== 'string' || data.org1.trim().length !== 2) {
      throw new InvalidCategoriaPuestoOrgDataError('org1', 'Debe ser una cadena de exactamente 2 caracteres');
    }

    // Validar formato de org1
    if (!/^[A-Z0-9]{2}$/.test(data.org1)) {
      throw new InvalidCategoriaPuestoOrgDataError('org1', 'Debe contener solo letras mayúsculas y números');
    }

    // Validar org2 para niveles >= 2
    if (data.nivel >= 2) {
      if (!data.org2 || typeof data.org2 !== 'string' || data.org2.trim().length !== 2) {
        throw new InvalidOrgHierarchyError(`org2 es requerido para nivel ${data.nivel}`);
      }
      if (!/^[A-Z0-9]{2}$/.test(data.org2)) {
        throw new InvalidCategoriaPuestoOrgDataError('org2', 'Debe contener solo letras mayúsculas y números');
      }
    }

    // Validar org3 para niveles >= 3
    if (data.nivel >= 3) {
      if (!data.org3 || typeof data.org3 !== 'string' || data.org3.trim().length !== 2) {
        throw new InvalidOrgHierarchyError(`org3 es requerido para nivel ${data.nivel}`);
      }
      if (!/^[A-Z0-9]{2}$/.test(data.org3)) {
        throw new InvalidCategoriaPuestoOrgDataError('org3', 'Debe contener solo letras mayúsculas y números');
      }
    }

    // Validar categoria
    if (!data.categoria || typeof data.categoria !== 'string' || data.categoria.trim().length === 0) {
      throw new InvalidCategoriaPuestoOrgDataError('categoria', 'Es requerida y debe ser una cadena no vacía');
    }
    if (data.categoria.length > 200) {
      throw new InvalidCategoriaPuestoOrgDataError('categoria', 'No debe exceder 200 caracteres');
    }

    // Validar nombreCategoria
    if (!data.nombreCategoria || typeof data.nombreCategoria !== 'string' || data.nombreCategoria.trim().length === 0) {
      throw new InvalidCategoriaPuestoOrgDataError('nombreCategoria', 'Es requerido y debe ser una cadena no vacía');
    }
    if (data.nombreCategoria.length > 200) {
      throw new InvalidCategoriaPuestoOrgDataError('nombreCategoria', 'No debe exceder 200 caracteres');
    }

    // Validar ingresoBrutoMensual
    if (data.ingresoBrutoMensual === undefined || data.ingresoBrutoMensual === null || typeof data.ingresoBrutoMensual !== 'number' || data.ingresoBrutoMensual <= 0) {
      throw new InvalidIngresoBrutoError(data.ingresoBrutoMensual || 0);
    }

    // Validar vigenciaInicio
    if (!data.vigenciaInicio || typeof data.vigenciaInicio !== 'string') {
      throw new InvalidCategoriaPuestoOrgDataError('vigenciaInicio', 'Es requerida y debe ser una cadena');
    }

    // Validar formato de fecha (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.vigenciaInicio)) {
      throw new InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
    }

    // Validar que la fecha sea válida
    const vigenciaInicioDate = new Date(data.vigenciaInicio + 'T00:00:00.000Z');
    if (isNaN(vigenciaInicioDate.getTime())) {
      throw new InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
    }

    // Validar vigenciaFin si está presente
    if (data.vigenciaFin) {
      if (typeof data.vigenciaFin !== 'string') {
        throw new InvalidCategoriaPuestoOrgDataError('vigenciaFin', 'Debe ser una cadena');
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.vigenciaFin)) {
        throw new InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
      }

      const vigenciaFinDate = new Date(data.vigenciaFin + 'T23:59:59.999Z');
      if (isNaN(vigenciaFinDate.getTime())) {
        throw new InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
      }

      if (vigenciaInicioDate >= vigenciaFinDate) {
        throw new InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
      }
    }

    // Validar baseConfianza si está presente
    if (data.baseConfianza !== undefined && data.baseConfianza !== null) {
      if (typeof data.baseConfianza !== 'string') {
        throw new InvalidCategoriaPuestoOrgDataError('baseConfianza', 'Debe ser una cadena de texto');
      }
      if (data.baseConfianza.length !== 1) {
        throw new InvalidCategoriaPuestoOrgDataError('baseConfianza', 'Debe ser exactamente 1 carácter');
      }
    }

    // Validar porcentaje si está presente
    if (data.porcentaje !== undefined && data.porcentaje !== null) {
      if (typeof data.porcentaje !== 'number') {
        throw new InvalidCategoriaPuestoOrgDataError('porcentaje', 'Debe ser un número');
      }
      if (!Number.isInteger(data.porcentaje) || data.porcentaje < 0 || data.porcentaje > 100) {
        throw new InvalidCategoriaPuestoOrgDataError('porcentaje', 'Debe ser un entero entre 0 y 100');
      }
    }
  }

  private async checkForDuplicates(data: CreateCategoriaPuestoOrgData): Promise<void> {
    // Verificar si ya existe una categoría con los mismos datos orgánicos
    try {
      const filters = {
        nivel: data.nivel,
        org0: data.org0,
        org1: data.org1,
        org2: data.org2 || undefined,
        org3: data.org3 || undefined
      };

      const existing = await this.categoriaPuestoOrgRepo.findAll(filters);

      // Verificar si alguna de las existentes tiene la misma categoría
      const duplicate = existing.find(cat => cat.categoria === data.categoria);
      if (duplicate) {
        throw new DuplicateCategoriaPuestoOrgError(data.categoria, data.org0, data.org1);
      }
    } catch (error: any) {
      if (error instanceof DuplicateCategoriaPuestoOrgError) {
        throw error;
      }
      // Si hay error de conexión o similar, continuar (mejor fallar en la creación que prevenirla)
      logger.warn({
        operation: 'checkForDuplicates',
        categoria: data.categoria,
        org0: data.org0,
        org1: data.org1,
        error: error.message
      }, 'No se pudo verificar duplicados, continuando con la creación');
    }
  }
}
