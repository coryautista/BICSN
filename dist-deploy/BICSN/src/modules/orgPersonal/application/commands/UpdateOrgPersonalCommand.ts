import { IOrgPersonalRepository } from '../../domain/repositories/IOrgPersonalRepository.js';
import { OrgPersonal, UpdateOrgPersonalData } from '../../domain/entities/OrgPersonal.js';
import {
  OrgPersonalInvalidInternoError,
  OrgPersonalInvalidClaveOrganicaError,
  OrgPersonalInvalidSueldoError,
  OrgPersonalInvalidOtrasPrestacionesError,
  OrgPersonalInvalidQuinqueniosError,
  OrgPersonalInvalidActivoError,
  OrgPersonalInvalidFechaError,
  OrgPersonalInvalidPorcentajeError,
  OrgPersonalNotFoundError
} from '../../domain/errors.js';

export class UpdateOrgPersonalCommand {
  constructor(private orgPersonalRepo: IOrgPersonalRepository) {}

  async execute(interno: number, data: UpdateOrgPersonalData, userId?: string): Promise<OrgPersonal> {
    // Logging de la operación
    console.log(`[ORG_PERSONAL] Actualizando registro orgPersonal interno: ${interno}, usuario: ${userId || 'desconocido'}`);

    // Validaciones de entrada
    if (!interno || typeof interno !== 'number' || interno <= 0 || !Number.isInteger(interno)) {
      throw new OrgPersonalInvalidInternoError(interno);
    }

    this.validateUpdateData(data);

    try {
      // Verificar que el registro existe
      const existing = await this.orgPersonalRepo.findById(interno);
      if (!existing) {
        throw new OrgPersonalNotFoundError(interno);
      }

      const result = await this.orgPersonalRepo.update(interno, data);
      console.log(`[ORG_PERSONAL] Registro orgPersonal actualizado exitosamente: interno ${interno}`);
      return result;
    } catch (error: any) {
      // Si ya es un error de dominio, lo propagamos
      if (error instanceof OrgPersonalNotFoundError ||
          error instanceof OrgPersonalInvalidInternoError ||
          error instanceof OrgPersonalInvalidClaveOrganicaError ||
          error instanceof OrgPersonalInvalidSueldoError ||
          error instanceof OrgPersonalInvalidOtrasPrestacionesError ||
          error instanceof OrgPersonalInvalidQuinqueniosError ||
          error instanceof OrgPersonalInvalidActivoError ||
          error instanceof OrgPersonalInvalidFechaError ||
          error instanceof OrgPersonalInvalidPorcentajeError) {
        throw error;
      }

      console.error(`[ORG_PERSONAL] Error al actualizar registro orgPersonal interno ${interno}:`, error);
      throw error;
    }
  }

  private validateUpdateData(data: UpdateOrgPersonalData): void {
    // Validar claves orgánicas (pueden ser null)
    if (data.clave_organica_0 !== null && data.clave_organica_0 !== undefined) {
      this.validateClaveOrganica(data.clave_organica_0, 0);
    }
    if (data.clave_organica_1 !== null && data.clave_organica_1 !== undefined) {
      this.validateClaveOrganica(data.clave_organica_1, 1);
    }
    if (data.clave_organica_2 !== null && data.clave_organica_2 !== undefined) {
      this.validateClaveOrganica(data.clave_organica_2, 2);
    }
    if (data.clave_organica_3 !== null && data.clave_organica_3 !== undefined) {
      this.validateClaveOrganica(data.clave_organica_3, 3);
    }

    // Validar sueldo
    if (data.sueldo !== null && data.sueldo !== undefined) {
      if (typeof data.sueldo !== 'number' || data.sueldo < 0) {
        throw new OrgPersonalInvalidSueldoError(data.sueldo);
      }
    }

    // Validar otras prestaciones
    if (data.otras_prestaciones !== null && data.otras_prestaciones !== undefined) {
      if (typeof data.otras_prestaciones !== 'number' || data.otras_prestaciones < 0) {
        throw new OrgPersonalInvalidOtrasPrestacionesError(data.otras_prestaciones);
      }
    }

    // Validar quinquenios
    if (data.quinquenios !== null && data.quinquenios !== undefined) {
      if (typeof data.quinquenios !== 'number' || data.quinquenios < 0) {
        throw new OrgPersonalInvalidQuinqueniosError(data.quinquenios);
      }
    }

    // Validar activo
    if (data.activo !== null && data.activo !== undefined) {
      if (typeof data.activo !== 'string' || !['S', 'N'].includes(data.activo)) {
        throw new OrgPersonalInvalidActivoError(data.activo);
      }
    }

    // Validar fecha_mov_alt
    if (data.fecha_mov_alt !== null && data.fecha_mov_alt !== undefined) {
      if (typeof data.fecha_mov_alt !== 'string' || isNaN(Date.parse(data.fecha_mov_alt))) {
        throw new OrgPersonalInvalidFechaError(data.fecha_mov_alt);
      }
    }

    // Validar porcentaje
    if (data.porcentaje !== null && data.porcentaje !== undefined) {
      if (typeof data.porcentaje !== 'number' || data.porcentaje < 0 || data.porcentaje > 100) {
        throw new OrgPersonalInvalidPorcentajeError(data.porcentaje);
      }
    }
  }

  private validateClaveOrganica(clave: string, nivel: number): void {
    if (typeof clave !== 'string') {
      throw new OrgPersonalInvalidClaveOrganicaError(clave, nivel);
    }

    // Validar formato: 1-2 caracteres alfanuméricos
    const claveRegex = /^[A-Za-z0-9]{1,2}$/;
    if (!claveRegex.test(clave)) {
      throw new OrgPersonalInvalidClaveOrganicaError(clave, nivel);
    }
  }
}
