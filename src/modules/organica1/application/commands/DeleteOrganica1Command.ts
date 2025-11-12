import { IOrganica1Repository } from '../../domain/repositories/IOrganica1Repository.js';
import {
  Organica1NotFoundError,
  Organica1InUseError
} from '../../domain/errors.js';

export class DeleteOrganica1Command {
  constructor(private organica1Repo: IOrganica1Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, userId?: string): Promise<{ claveOrganica0: string; claveOrganica1: string; deleted: boolean }> {
    console.log('ORGANICA1_COMMAND', {
      operation: 'DELETE_ORGANICA1',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica0,
      claveOrganica1
    });

    // Validar claves
    this.validateClaveOrganica0(claveOrganica0);
    this.validateClaveOrganica1(claveOrganica1);

    try {
      // Verificar que la entidad existe
      const existing = await this.organica1Repo.findById(claveOrganica0, claveOrganica1);
      if (!existing) {
        console.warn('ORGANICA1_COMMAND_WARNING', {
          operation: 'DELETE_ORGANICA1',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          reason: 'ORGANICA1_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica1NotFoundError(claveOrganica0, claveOrganica1);
      }

      // Verificar si la entidad está siendo utilizada (lógica de negocio)
      await this.checkOrganica1InUse(claveOrganica0, claveOrganica1);

      // Eliminar la entidad
      const deleted = await this.organica1Repo.delete(claveOrganica0, claveOrganica1);
      if (!deleted) {
        console.error('ORGANICA1_COMMAND_ERROR', {
          operation: 'DELETE_ORGANICA1',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          reason: 'DELETE_OPERATION_FAILED',
          timestamp: new Date().toISOString()
        });
        throw new Error('No se pudo eliminar la entidad organica1');
      }

      console.log('ORGANICA1_COMMAND_SUCCESS', {
        operation: 'DELETE_ORGANICA1',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        timestamp: new Date().toISOString()
      });

      return { claveOrganica0, claveOrganica1, deleted: true };

    } catch (error) {
      console.error('ORGANICA1_COMMAND_ERROR', {
        operation: 'DELETE_ORGANICA1',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private validateClaveOrganica0(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Error('La clave organica0 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Error('La clave organica0 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Error('La clave organica0 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica1(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Error('La clave organica1 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Error('La clave organica1 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Error('La clave organica1 no puede tener más de 50 caracteres');
    }
  }

  private async checkOrganica1InUse(claveOrganica0: string, claveOrganica1: string): Promise<void> {
    // Aquí se implementaría la lógica para verificar si la entidad está siendo utilizada
    // Por ejemplo, verificar si existen entidades organica2, organica3, etc. que dependan de esta
    // o si hay usuarios/afiliados asignados a esta estructura organizacional

    // Esta es una implementación básica - en un sistema real, esto requeriría
    // consultas a otras tablas para verificar dependencias

    // Por ahora, asumiremos que no hay dependencias por ahora
    // En una implementación real, aquí irían las validaciones de integridad referencial
  }
}
