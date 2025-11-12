import { IOrganica1Repository } from '../../domain/repositories/IOrganica1Repository.js';
import { Organica1 } from '../../domain/entities/Organica1.js';

export class GetOrganica1ByClaveOrganica0Query {
  constructor(private organica1Repo: IOrganica1Repository) {}

  async execute(claveOrganica0: string, userId?: string): Promise<Organica1[]> {
    console.log('ORGANICA1_QUERY', {
      operation: 'GET_ORGANICA1_BY_CLAVE_ORGANICA0',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica0
    });

    // Validar clave organica0
    this.validateClaveOrganica0(claveOrganica0);

    try {
      const records = await this.organica1Repo.findByClaveOrganica0(claveOrganica0);

      console.log('ORGANICA1_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA1_BY_CLAVE_ORGANICA0',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        recordCount: records.length,
        timestamp: new Date().toISOString()
      });

      return records;

    } catch (error) {
      console.error('ORGANICA1_QUERY_ERROR', {
        operation: 'GET_ORGANICA1_BY_CLAVE_ORGANICA0',
        userId: userId || 'SYSTEM',
        claveOrganica0,
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
}
