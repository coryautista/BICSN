import { IOrganica3Repository } from '../../domain/repositories/IOrganica3Repository.js';
import { Organica3 } from '../../domain/entities/Organica3.js';

export class GetAllOrganica3Query {
  constructor(private organica3Repo: IOrganica3Repository) {}

  async execute(userId?: string): Promise<Organica3[]> {
    console.log('ORGANICA3_QUERY', {
      operation: 'GET_ALL_ORGANICA3',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString()
    });

    try {
      const result = await this.organica3Repo.findAll();

      console.log('ORGANICA3_QUERY_SUCCESS', {
        operation: 'GET_ALL_ORGANICA3',
        userId: userId || 'SYSTEM',
        resultCount: result.length,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA3_QUERY_ERROR', {
        operation: 'GET_ALL_ORGANICA3',
        userId: userId || 'SYSTEM',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}
