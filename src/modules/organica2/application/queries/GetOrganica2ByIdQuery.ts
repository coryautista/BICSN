import { IOrganica2Repository } from '../../domain/repositories/IOrganica2Repository.js';
import { Organica2 } from '../../domain/entities/Organica2.js';
import {
  Organica2NotFoundError,
  Organica2InvalidClaveOrganica0Error,
  Organica2InvalidClaveOrganica1Error,
  Organica2InvalidClaveOrganica2Error
} from '../../domain/errors.js';

export class GetOrganica2ByIdQuery {
  constructor(private organica2Repo: IOrganica2Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, userId?: string): Promise<Organica2> {
    console.log('ORGANICA2_QUERY', {
      operation: 'GET_ORGANICA2_BY_ID',
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
      const organica2 = await this.organica2Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2);
      if (!organica2) {
        console.warn('ORGANICA2_QUERY_WARNING', {
          operation: 'GET_ORGANICA2_BY_ID',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          claveOrganica2,
          reason: 'ORGANICA2_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica2NotFoundError(claveOrganica0, claveOrganica1, claveOrganica2);
      }

      console.log('ORGANICA2_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA2_BY_ID',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        found: true,
        timestamp: new Date().toISOString()
      });

      return organica2;

    } catch (error) {
      console.error('ORGANICA2_QUERY_ERROR', {
        operation: 'GET_ORGANICA2_BY_ID',
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
}
