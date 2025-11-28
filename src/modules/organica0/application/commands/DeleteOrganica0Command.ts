import { IOrganica0Repository } from '../../domain/repositories/IOrganica0Repository.js';
import {
  Organica0NotFoundError,
  Organica0InUseError
} from '../../domain/errors.js';

export class DeleteOrganica0Command {
  constructor(private organica0Repo: IOrganica0Repository) {}

  async execute(claveOrganica: string, userId?: string): Promise<{ claveOrganica: string; deleted: boolean }> {
    console.log('ORGANICA0_COMMAND', {
      operation: 'DELETE_ORGANICA0',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica
    });

    // Validar clave organica0
    this.validateClaveOrganica(claveOrganica);

    try {
      // Verificar que la entidad existe
      const existing = await this.organica0Repo.findById(claveOrganica);
      if (!existing) {
        console.warn('ORGANICA0_COMMAND_WARNING', {
          operation: 'DELETE_ORGANICA0',
          userId: userId || 'SYSTEM',
          claveOrganica,
          reason: 'ORGANICA0_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica0NotFoundError(claveOrganica);
      }

      // Verificar si la entidad está siendo utilizada (lógica de negocio)
      // Esto podría incluir verificar si hay entidades hijas (organica1, organica2, etc.) que dependan de esta
      await this.checkOrganica0InUse(claveOrganica);

      // Eliminar la entidad
      const deleted = await this.organica0Repo.delete(claveOrganica);
      if (!deleted) {
        console.error('ORGANICA0_COMMAND_ERROR', {
          operation: 'DELETE_ORGANICA0',
          userId: userId || 'SYSTEM',
          claveOrganica,
          reason: 'DELETE_OPERATION_FAILED',
          timestamp: new Date().toISOString()
        });
        throw new Error('No se pudo eliminar la entidad organica0');
      }

      console.log('ORGANICA0_COMMAND_SUCCESS', {
        operation: 'DELETE_ORGANICA0',
        userId: userId || 'SYSTEM',
        claveOrganica,
        timestamp: new Date().toISOString()
      });

      return { claveOrganica, deleted: true };

    } catch (error) {
      console.error('ORGANICA0_COMMAND_ERROR', {
        operation: 'DELETE_ORGANICA0',
        userId: userId || 'SYSTEM',
        claveOrganica,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private validateClaveOrganica(clave: string): void {
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

  private async checkOrganica0InUse(claveOrganica: string): Promise<void> {
    const isInUse = await this.organica0Repo.isInUse(claveOrganica);
    if (isInUse) {
      throw new Organica0InUseError(claveOrganica);
    }
  }

 
}
