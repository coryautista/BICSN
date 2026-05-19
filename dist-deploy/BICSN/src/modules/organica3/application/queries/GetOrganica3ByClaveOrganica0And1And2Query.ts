import { IOrganica3Repository } from '../../domain/repositories/IOrganica3Repository.js';
import { Organica3 } from '../../domain/entities/Organica3.js';
import {
  Organica3InvalidClaveOrganica0Error,
  Organica3InvalidClaveOrganica1Error,
  Organica3InvalidClaveOrganica2Error
} from '../../domain/errors.js';

export class GetOrganica3ByClaveOrganica0And1And2Query {
  constructor(private organica3Repo: IOrganica3Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, userId?: string): Promise<Organica3[]> {
    console.log('ORGANICA3_QUERY', {
      operation: 'GET_ORGANICA3_BY_CLAVE_ORGANICA0_AND_1_AND_2',
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
      const result = await this.organica3Repo.findByClaveOrganica0And1And2(claveOrganica0, claveOrganica1, claveOrganica2);

      console.log('ORGANICA3_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA3_BY_CLAVE_ORGANICA0_AND_1_AND_2',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        resultCount: result.length,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA3_QUERY_ERROR', {
        operation: 'GET_ORGANICA3_BY_CLAVE_ORGANICA0_AND_1_AND_2',
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
}
