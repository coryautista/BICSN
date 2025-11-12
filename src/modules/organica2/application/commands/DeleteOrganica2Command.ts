import { IOrganica2Repository } from '../../domain/repositories/IOrganica2Repository.js';
import {
  Organica2NotFoundError,
  Organica2InvalidClaveOrganica0Error,
  Organica2InvalidClaveOrganica1Error,
  Organica2InvalidClaveOrganica2Error,
  Organica2DeletionError
} from '../../domain/errors.js';

export class DeleteOrganica2Command {
  constructor(private organica2Repo: IOrganica2Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, userId?: string): Promise<{ claveOrganica0: string; claveOrganica1: string; claveOrganica2: string; deleted: boolean }> {
    console.log('ORGANICA2_COMMAND', {
      operation: 'DELETE_ORGANICA2',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica0,
      claveOrganica1,
      claveOrganica2
    });

    // Validar claves
    this.validateClaveOrganica0(claveOrganica0);
    this.validateClaveOrganica1(claveOrganica1);
    this.validateClaveOrganica2(claveOrganica2);

    try {
      // Verificar que la entidad existe
      const existing = await this.organica2Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2);
      if (!existing) {
        console.warn('ORGANICA2_COMMAND_WARNING', {
          operation: 'DELETE_ORGANICA2',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          claveOrganica2,
          reason: 'ORGANICA2_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica2NotFoundError(claveOrganica0, claveOrganica1, claveOrganica2);
      }

      // Verificar reglas de negocio antes de eliminar
      await this.validateDeletionRules(claveOrganica0, claveOrganica1, claveOrganica2);

      // Eliminar la entidad
      const deleted = await this.organica2Repo.delete(claveOrganica0, claveOrganica1, claveOrganica2);
      if (!deleted) {
        console.warn('ORGANICA2_COMMAND_WARNING', {
          operation: 'DELETE_ORGANICA2',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          claveOrganica2,
          reason: 'DELETE_OPERATION_FAILED',
          timestamp: new Date().toISOString()
        });
        throw new Organica2DeletionError('La eliminación de la organica2 falló');
      }

      console.log('ORGANICA2_COMMAND_SUCCESS', {
        operation: 'DELETE_ORGANICA2',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        timestamp: new Date().toISOString()
      });

      return { claveOrganica0, claveOrganica1, claveOrganica2, deleted: true };

    } catch (error) {
      console.error('ORGANICA2_COMMAND_ERROR', {
        operation: 'DELETE_ORGANICA2',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private validateClaveOrganica0(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica1(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica2(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 no puede tener más de 50 caracteres');
    }
  }

  private async validateDeletionRules(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<void> {
    // Verificar si hay dependencias que impidan la eliminación
    // Por ejemplo, verificar si hay registros en organica3 que dependan de esta organica2

    try {
      // Aquí irían las validaciones de negocio específicas
      // Por ejemplo, verificar dependencias en otras tablas

      // Si hay dependencias, lanzar error
      // throw new Organica2DeletionError('No se puede eliminar la organica2 porque tiene dependencias');

    } catch (error) {
      console.warn('ORGANICA2_DELETION_VALIDATION_WARNING', {
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });

      if (error instanceof Organica2DeletionError) {
        throw error;
      }

      // Si es otro tipo de error, permitir la eliminación pero loguear
      console.warn('ORGANICA2_DELETION_DEPENDENCY_CHECK_FAILED', {
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
}
