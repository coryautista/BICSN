import { IOrganica0Repository } from '../../domain/repositories/IOrganica0Repository.js';
import { Organica0 } from '../../domain/entities/Organica0.js';

export class GetAllOrganica0Query {
  constructor(private organica0Repo: IOrganica0Repository) {}

  async execute(userId?: string): Promise<Organica0[]> {
    console.log('ORGANICA0_QUERY', {
      operation: 'GET_ALL_ORGANICA0',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString()
    });

    try {
      const records = await this.organica0Repo.findAll();

      console.log('ORGANICA0_QUERY_SUCCESS', {
        operation: 'GET_ALL_ORGANICA0',
        userId: userId || 'SYSTEM',
        recordCount: records.length,
        timestamp: new Date().toISOString()
      });

      return records;

    } catch (error) {
      console.error('ORGANICA0_QUERY_ERROR', {
        operation: 'GET_ALL_ORGANICA0',
        userId: userId || 'SYSTEM',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}
