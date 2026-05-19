import { IOrganica1Repository } from '../../domain/repositories/IOrganica1Repository.js';
import { Organica1 } from '../../domain/entities/Organica1.js';
import { DynamicQuery } from '../../organica1.schemas.js';

export class GetOrganica1DynamicQuery {
  constructor(private organica1Repo: IOrganica1Repository) {}

  async execute(query: DynamicQuery, userId?: string): Promise<Organica1[]> {
    console.log('ORGANICA1_QUERY', {
      operation: 'GET_ORGANICA1_DYNAMIC',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      query
    });

    try {
      const records = await this.organica1Repo.dynamicQuery(query);

      console.log('ORGANICA1_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA1_DYNAMIC',
        userId: userId || 'SYSTEM',
        recordCount: records.length,
        timestamp: new Date().toISOString()
      });

      return records;
    } catch (error) {
      console.error('ORGANICA1_QUERY_ERROR', {
        operation: 'GET_ORGANICA1_DYNAMIC',
        userId: userId || 'SYSTEM',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}
