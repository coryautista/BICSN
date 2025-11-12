import { IOrganica0Repository } from '../../domain/repositories/IOrganica0Repository.js';
import { Organica0 } from '../../domain/entities/Organica0.js';
import { Organica0NotFoundError } from '../../domain/errors.js';

export class GetOrganica0ByIdQuery {
  constructor(private organica0Repo: IOrganica0Repository) {}

  async execute(claveOrganica: string, userId?: string): Promise<Organica0> {
    console.log('ORGANICA0_QUERY', {
      operation: 'GET_ORGANICA0_BY_ID',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica
    });

    // Validar clave organica0
    this.validateClaveOrganica(claveOrganica);

    try {
      const organica0 = await this.organica0Repo.findById(claveOrganica);

      if (!organica0) {
        console.warn('ORGANICA0_QUERY_WARNING', {
          operation: 'GET_ORGANICA0_BY_ID',
          userId: userId || 'SYSTEM',
          claveOrganica,
          reason: 'ORGANICA0_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica0NotFoundError(claveOrganica);
      }

      console.log('ORGANICA0_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA0_BY_ID',
        userId: userId || 'SYSTEM',
        claveOrganica,
        found: true,
        timestamp: new Date().toISOString()
      });

      return organica0;

    } catch (error) {
      console.error('ORGANICA0_QUERY_ERROR', {
        operation: 'GET_ORGANICA0_BY_ID',
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
}
