import { IOrganica3Repository } from '../../domain/repositories/IOrganica3Repository.js';
import {
  Organica3NotFoundError,
  Organica3InvalidClaveOrganica0Error,
  Organica3InvalidClaveOrganica1Error,
  Organica3InvalidClaveOrganica2Error,
  Organica3InvalidClaveOrganica3Error,
  Organica3DeletionError
} from '../../domain/errors.js';

export class DeleteOrganica3Command {
  constructor(private organica3Repo: IOrganica3Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string, userId?: string): Promise<{ claveOrganica0: string; claveOrganica1: string; claveOrganica2: string; claveOrganica3: string; deleted: boolean }> {
    console.log('ORGANICA3_COMMAND', {
      operation: 'DELETE_ORGANICA3',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica0,
      claveOrganica1,
      claveOrganica2,
      claveOrganica3
    });

    // Validar claves
    this.validateClaveOrganica0(claveOrganica0);
    this.validateClaveOrganica1(claveOrganica1);
    this.validateClaveOrganica2(claveOrganica2);
    this.validateClaveOrganica3(claveOrganica3);

    try {
      // Verificar que la entidad existe
      const existing = await this.organica3Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
      if (!existing) {
        console.warn('ORGANICA3_COMMAND_WARNING', {
          operation: 'DELETE_ORGANICA3',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          claveOrganica2,
          claveOrganica3,
          reason: 'ORGANICA3_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica3NotFoundError(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
      }

      // Verificar reglas de negocio antes de eliminar
      await this.validateDeletionRules(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);

      // Eliminar la entidad
      const deleted = await this.organica3Repo.delete(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
      if (!deleted) {
        console.warn('ORGANICA3_COMMAND_WARNING', {
          operation: 'DELETE_ORGANICA3',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          claveOrganica2,
          claveOrganica3,
          reason: 'DELETE_OPERATION_FAILED',
          timestamp: new Date().toISOString()
        });
        throw new Organica3DeletionError('La eliminación de la organica3 falló');
      }

      console.log('ORGANICA3_COMMAND_SUCCESS', {
        operation: 'DELETE_ORGANICA3',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        claveOrganica3,
        timestamp: new Date().toISOString()
      });

      return { claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3, deleted: true };

    } catch (error) {
      console.error('ORGANICA3_COMMAND_ERROR', {
        operation: 'DELETE_ORGANICA3',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        claveOrganica3,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private validateClaveOrganica0(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica3InvalidClaveOrganica0Error('La clave organica0 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidClaveOrganica0Error('La clave organica0 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica3InvalidClaveOrganica0Error('La clave organica0 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica1(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica3InvalidClaveOrganica1Error('La clave organica1 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidClaveOrganica1Error('La clave organica1 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica3InvalidClaveOrganica1Error('La clave organica1 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica2(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica3InvalidClaveOrganica2Error('La clave organica2 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidClaveOrganica2Error('La clave organica2 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica3InvalidClaveOrganica2Error('La clave organica2 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica3(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica3InvalidClaveOrganica3Error('La clave organica3 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidClaveOrganica3Error('La clave organica3 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica3InvalidClaveOrganica3Error('La clave organica3 no puede tener más de 50 caracteres');
    }
  }

  private async validateDeletionRules(_claveOrganica0: string, _claveOrganica1: string, _claveOrganica2: string, _claveOrganica3: string): Promise<void> {
    // Verificar si hay dependencias que impidan la eliminación
    // Por ejemplo, verificar si hay registros en otras tablas que dependan de esta organica3

    try {
      // Aquí irían las validaciones de negocio específicas
      // Por ejemplo, verificar dependencias en otras tablas

      // Si hay dependencias, lanzar error
      // throw new Organica3DeletionError('No se puede eliminar la organica3 porque tiene dependencias');

    } catch (error) {
      console.warn('ORGANICA3_DELETION_VALIDATION_WARNING', {
        claveOrganica0: _claveOrganica0,
        claveOrganica1: _claveOrganica1,
        claveOrganica2: _claveOrganica2,
        claveOrganica3: _claveOrganica3,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });

      // Si es otro tipo de error, permitir la eliminación pero loguear
      console.warn('ORGANICA3_DELETION_DEPENDENCY_CHECK_FAILED', {
        claveOrganica0: _claveOrganica0,
        claveOrganica1: _claveOrganica1,
        claveOrganica2: _claveOrganica2,
        claveOrganica3: _claveOrganica3,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
}
