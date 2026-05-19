import { IOrganica3Repository } from '../../domain/repositories/IOrganica3Repository.js';
import { Organica3 } from '../../domain/entities/Organica3.js';
import {
  Organica3NotFoundError,
  Organica3InvalidClaveOrganica0Error,
  Organica3InvalidClaveOrganica1Error,
  Organica3InvalidClaveOrganica2Error,
  Organica3InvalidClaveOrganica3Error
} from '../../domain/errors.js';

export class GetOrganica3ByIdQuery {
  constructor(private organica3Repo: IOrganica3Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string, userId?: string): Promise<Organica3> {
    console.log('ORGANICA3_QUERY', {
      operation: 'GET_ORGANICA3_BY_ID',
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
      const organica3 = await this.organica3Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
      if (!organica3) {
        console.warn('ORGANICA3_QUERY_WARNING', {
          operation: 'GET_ORGANICA3_BY_ID',
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

      console.log('ORGANICA3_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA3_BY_ID',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        claveOrganica3,
        found: true,
        timestamp: new Date().toISOString()
      });

      return organica3;

    } catch (error) {
      console.error('ORGANICA3_QUERY_ERROR', {
        operation: 'GET_ORGANICA3_BY_ID',
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
}
