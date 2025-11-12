import { IOrganica1Repository } from '../../domain/repositories/IOrganica1Repository.js';
import { Organica1 } from '../../domain/entities/Organica1.js';
import { Organica1NotFoundError } from '../../domain/errors.js';

export class GetOrganica1ByIdQuery {
  constructor(private organica1Repo: IOrganica1Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, userId?: string): Promise<Organica1> {
    console.log('ORGANICA1_QUERY', {
      operation: 'GET_ORGANICA1_BY_ID',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica0,
      claveOrganica1
    });

    // Validar claves
    this.validateClaveOrganica0(claveOrganica0);
    this.validateClaveOrganica1(claveOrganica1);

    try {
      const organica1 = await this.organica1Repo.findById(claveOrganica0, claveOrganica1);

      if (!organica1) {
        console.warn('ORGANICA1_QUERY_WARNING', {
          operation: 'GET_ORGANICA1_BY_ID',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          reason: 'ORGANICA1_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica1NotFoundError(claveOrganica0, claveOrganica1);
      }

      console.log('ORGANICA1_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA1_BY_ID',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        found: true,
        timestamp: new Date().toISOString()
      });

      return organica1;

    } catch (error) {
      console.error('ORGANICA1_QUERY_ERROR', {
        operation: 'GET_ORGANICA1_BY_ID',
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
}
