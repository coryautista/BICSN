import { IAfiliadoOrgRepository } from '../../domain/repositories/IAfiliadoOrgRepository.js';
import { AfiliadoOrg, CreateAfiliadoOrgData } from '../../domain/entities/AfiliadoOrg.js';
import {
  InvalidAfiliadoOrgDataError,
  InvalidOrgLevelError,
  InvalidSueldoError,
  InvalidOrgHierarchyError,
  InvalidFechaMovAltError,
  AfiliadoOrgRegistrationError,
  InvalidOrgClaveError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createAfiliadoOrgCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateAfiliadoOrgCommand {
  constructor(private afiliadoOrgRepo: IAfiliadoOrgRepository) {}

  async execute(data: CreateAfiliadoOrgData): Promise<AfiliadoOrg> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'createAfiliadoOrg',
      afiliadoId: data.afiliadoId,
      claveOrganica0: data.claveOrganica0,
      claveOrganica1: data.claveOrganica1,
      claveOrganica2: data.claveOrganica2,
      claveOrganica3: data.claveOrganica3,
      sueldo: data.sueldo,
      activo: data.activo
    };

    logger.info(logContext, 'Iniciando creación de relación afiliado-org');

    try {
      const result = await this.afiliadoOrgRepo.create(data);

      logger.info({
        ...logContext,
        afiliadoOrgId: result.id
      }, 'Relación afiliado-org creada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof InvalidAfiliadoOrgDataError ||
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
      }, 'Error al crear relación afiliado-org');

      throw new AfiliadoOrgRegistrationError('Error interno al crear relación afiliado-org', {
        originalError: error.message,
        afiliadoId: data.afiliadoId
      });
    }
  }

  private validateInput(data: CreateAfiliadoOrgData): void {
    // Validar campos requeridos
    if (!data.afiliadoId || data.afiliadoId <= 0) {
      throw new InvalidAfiliadoOrgDataError('afiliadoId', 'El ID del afiliado es requerido y debe ser positivo');
    }

    if (!data.claveOrganica0?.trim()) {
      throw new InvalidAfiliadoOrgDataError('claveOrganica0', 'La clave orgánica 0 es requerida');
    }

    // Validar jerarquía organizacional
    this.validateOrgHierarchy(data);

    // Validar sueldo si está presente
    if (data.sueldo !== null && data.sueldo !== undefined && data.sueldo < 0) {
      throw new InvalidSueldoError(data.sueldo);
    }

    // Validar otras prestaciones si están presentes
    if (data.otrasPrestaciones !== null && data.otrasPrestaciones !== undefined && data.otrasPrestaciones < 0) {
      throw new InvalidAfiliadoOrgDataError('otrasPrestaciones', 'Las otras prestaciones no pueden ser negativas');
    }

    // Validar quinquenios si están presentes
    if (data.quinquenios !== null && data.quinquenios !== undefined && data.quinquenios < 0) {
      throw new InvalidAfiliadoOrgDataError('quinquenios', 'Los quinquenios no pueden ser negativos');
    }

    // Validar fecha de movimiento/alta si está presente
    if (data.fechaMovAlt) {
      this.validateFechaMovAlt(data.fechaMovAlt);
    }

    // Validar porcentaje si está presente
    if (data.porcentaje !== null && data.porcentaje !== undefined && (data.porcentaje < 0 || data.porcentaje > 100)) {
      throw new InvalidAfiliadoOrgDataError('porcentaje', 'El porcentaje debe estar entre 0 y 100');
    }
  }

  private validateOrgHierarchy(data: CreateAfiliadoOrgData): void {
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
    const hasNivel1 = data.nivel1Id !== null && data.nivel1Id !== undefined;
    const hasClave1 = data.claveOrganica1?.trim();

    if (hasNivel1 && !hasClave1) {
      throw new InvalidOrgHierarchyError('Si se especifica nivel1Id, debe incluirse claveOrganica1');
    }

    if (!hasNivel1 && hasClave1) {
      throw new InvalidOrgHierarchyError('Si se incluye claveOrganica1, debe especificarse nivel1Id');
    }

    const hasNivel2 = data.nivel2Id !== null && data.nivel2Id !== undefined;
    const hasClave2 = data.claveOrganica2?.trim();

    if (hasNivel2 && !hasClave2) {
      throw new InvalidOrgHierarchyError('Si se especifica nivel2Id, debe incluirse claveOrganica2');
    }

    if (!hasNivel2 && hasClave2) {
      throw new InvalidOrgHierarchyError('Si se incluye claveOrganica2, debe especificarse nivel2Id');
    }

    const hasNivel3 = data.nivel3Id !== null && data.nivel3Id !== undefined;
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
