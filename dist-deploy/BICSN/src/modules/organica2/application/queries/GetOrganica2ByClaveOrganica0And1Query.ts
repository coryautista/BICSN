import { IOrganica2Repository } from '../../domain/repositories/IOrganica2Repository.js';
import { Organica2 } from '../../domain/entities/Organica2.js';
import {
  Organica2InvalidClaveOrganica0Error,
  Organica2InvalidClaveOrganica1Error
} from '../../domain/errors.js';

export class GetOrganica2ByClaveOrganica0And1Query {
  constructor(private organica2Repo: IOrganica2Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, userId?: string): Promise<Organica2[]> {
    console.log('ORGANICA2_QUERY', {
      operation: 'GET_ORGANICA2_BY_CLAVE_ORGANICA0_AND_1',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica0,
      claveOrganica1
    });

    // Validar claves
    this.validateClaveOrganica0(claveOrganica0);
    this.validateClaveOrganica1(claveOrganica1);

    try {
      const result = await this.organica2Repo.findByClaveOrganica0And1(claveOrganica0, claveOrganica1);

      console.log('ORGANICA2_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA2_BY_CLAVE_ORGANICA0_AND_1',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        resultCount: result.length,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA2_QUERY_ERROR', {
        operation: 'GET_ORGANICA2_BY_CLAVE_ORGANICA0_AND_1',
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
}
