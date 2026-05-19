import { IOrganica1Repository } from '../../domain/repositories/IOrganica1Repository.js';
import { Organica1 } from '../../domain/entities/Organica1.js';

export class GetAllOrganica1Query {
  constructor(private organica1Repo: IOrganica1Repository) {}

  async execute(userId?: string): Promise<Organica1[]> {
    console.log('ORGANICA1_QUERY', {
      operation: 'GET_ALL_ORGANICA1',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString()
    });

    try {
      const records = await this.organica1Repo.findAll();

      console.log('ORGANICA1_QUERY_SUCCESS', {
        operation: 'GET_ALL_ORGANICA1',
        userId: userId || 'SYSTEM',
        recordCount: records.length,
        timestamp: new Date().toISOString()
      });

      return records;

    } catch (error) {
      console.error('ORGANICA1_QUERY_ERROR', {
        operation: 'GET_ALL_ORGANICA1',
        userId: userId || 'SYSTEM',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}
