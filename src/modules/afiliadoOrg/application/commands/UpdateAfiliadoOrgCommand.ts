import { IAfiliadoOrgRepository } from '../../domain/repositories/IAfiliadoOrgRepository.js';
import { AfiliadoOrg, UpdateAfiliadoOrgData } from '../../domain/entities/AfiliadoOrg.js';
import {
  AfiliadoOrgNotFoundError,
  InvalidAfiliadoOrgDataError,
  InvalidOrgLevelError,
  InvalidSueldoError,
  InvalidOrgHierarchyError,
  InvalidFechaMovAltError,
  AfiliadoOrgUpdateError,
  InvalidOrgClaveError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateAfiliadoOrgCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateAfiliadoOrgCommand {
  constructor(private afiliadoOrgRepo: IAfiliadoOrgRepository) {}

  async execute(data: UpdateAfiliadoOrgData): Promise<AfiliadoOrg> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'updateAfiliadoOrg',
      id: data.id,
      afiliadoId: data.afiliadoId,
      claveOrganica0: data.claveOrganica0,
      sueldo: data.sueldo,
      activo: data.activo
    };

    logger.info(logContext, 'Iniciando actualización de relación afiliado-org');

    try {
      // Verificar que el registro existe
      const existing = await this.afiliadoOrgRepo.findById(data.id);
      if (!existing) {
        logger.warn({ ...logContext, afiliadoOrgId: data.id }, 'Relación afiliado-org no encontrada para actualización');
        throw new AfiliadoOrgNotFoundError({ id: data.id });
      }

      const result = await this.afiliadoOrgRepo.update(data);

      logger.info({
        ...logContext,
        afiliadoOrgId: result.id
      }, 'Relación afiliado-org actualizada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof AfiliadoOrgNotFoundError ||
          error instanceof InvalidAfiliadoOrgDataError ||
          error instanceof InvalidOrgLevelError ||
          error instanceof InvalidSueldoError ||
          error instanceof InvalidOrgHierarchyError ||
          error instanceof InvalidFechaMovAltError ||
          error instanceof InvalidOrgClaveError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al actualizar relación afiliado-org');

      throw new AfiliadoOrgUpdateError('Error interno al actualizar relación afiliado-org', {
        originalError: error.message,
        id: data.id
      });
    }
  }

  private validateInput(data: UpdateAfiliadoOrgData): void {
    // Validar ID
    if (!data.id || data.id <= 0) {
      throw new InvalidAfiliadoOrgDataError('id', 'El ID es requerido y debe ser positivo');
    }

    // Validar jerarquía organizacional si se están actualizando claves
    if (data.claveOrganica0 !== undefined ||
        data.claveOrganica1 !== undefined ||
        data.claveOrganica2 !== undefined ||
        data.claveOrganica3 !== undefined) {
      this.validateOrgHierarchy(data);
    }

    // Validar sueldo si está presente
    if (data.sueldo !== undefined && data.sueldo !== null && data.sueldo < 0) {
      throw new InvalidSueldoError(data.sueldo);
    }

    // Validar otras prestaciones si están presentes
    if (data.otrasPrestaciones !== undefined && data.otrasPrestaciones !== null && data.otrasPrestaciones < 0) {
      throw new InvalidAfiliadoOrgDataError('otrasPrestaciones', 'Las otras prestaciones no pueden ser negativas');
    }

    // Validar quinquenios si están presentes
    if (data.quinquenios !== undefined && data.quinquenios !== null && data.quinquenios < 0) {
      throw new InvalidAfiliadoOrgDataError('quinquenios', 'Los quinquenios no pueden ser negativos');
    }

    // Validar fecha de movimiento/alta si está presente
    if (data.fechaMovAlt !== undefined && data.fechaMovAlt !== null) {
      this.validateFechaMovAlt(data.fechaMovAlt);
    }

    // Validar porcentaje si está presente
    if (data.porcentaje !== undefined && data.porcentaje !== null && (data.porcentaje < 0 || data.porcentaje > 100)) {
      throw new InvalidAfiliadoOrgDataError('porcentaje', 'El porcentaje debe estar entre 0 y 100');
    }
  }

  private validateOrgHierarchy(data: UpdateAfiliadoOrgData): void {
    // Validar que las claves orgánicas tengan el formato correcto (2 caracteres)
    if (data.claveOrganica0 && data.claveOrganica0.length !== 2) {
      throw new InvalidOrgClaveError(data.claveOrganica0, 0);
    }

    if (data.claveOrganica1 && data.claveOrganica1.length !== 2) {
      throw new InvalidOrgClaveError(data.claveOrganica1, 1);
    }

    if (data.claveOrganica2 && data.claveOrganica2.length !== 2) {
      throw new InvalidOrgClaveError(data.claveOrganica2, 2);
    }

    if (data.claveOrganica3 && data.claveOrganica3.length !== 2) {
      throw new InvalidOrgClaveError(data.claveOrganica3, 3);
    }

    // Validar consistencia de jerarquía
    const hasNivel1 = data.nivel1Id !== undefined && data.nivel1Id !== null;
    const hasClave1 = data.claveOrganica1?.trim();

    if (hasNivel1 && !hasClave1) {
      throw new InvalidOrgHierarchyError('Si se especifica nivel1Id, debe incluirse claveOrganica1');
    }

    if (!hasNivel1 && hasClave1) {
      throw new InvalidOrgHierarchyError('Si se incluye claveOrganica1, debe especificarse nivel1Id');
    }

    const hasNivel2 = data.nivel2Id !== undefined && data.nivel2Id !== null;
    const hasClave2 = data.claveOrganica2?.trim();

    if (hasNivel2 && !hasClave2) {
      throw new InvalidOrgHierarchyError('Si se especifica nivel2Id, debe incluirse claveOrganica2');
    }

    if (!hasNivel2 && hasClave2) {
      throw new InvalidOrgHierarchyError('Si se incluye claveOrganica2, debe especificarse nivel2Id');
    }

    const hasNivel3 = data.nivel3Id !== undefined && data.nivel3Id !== null;
    const hasClave3 = data.claveOrganica3?.trim();

    if (hasNivel3 && !hasClave3) {
      throw new InvalidOrgHierarchyError('Si se especifica nivel3Id, debe incluirse claveOrganica3');
    }

    if (!hasNivel3 && hasClave3) {
      throw new InvalidOrgHierarchyError('Si se incluye claveOrganica3, debe especificarse nivel3Id');
    }
  }

  private validateFechaMovAlt(fecha: string): void {
    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha)) {
      throw new InvalidFechaMovAltError(fecha);
    }

    // Validar que sea una fecha válida
    const date = new Date(fecha);
    if (isNaN(date.getTime())) {
      throw new InvalidFechaMovAltError(fecha);
    }

    // Validar que no sea una fecha futura
    const now = new Date();
    if (date > now) {
      throw new InvalidAfiliadoOrgDataError('fechaMovAlt', 'La fecha de movimiento/alta no puede ser futura');
    }
  }
}
