import { IOrganica3Repository } from '../../domain/repositories/IOrganica3Repository.js';
import { Organica3 } from '../../domain/entities/Organica3.js';
import { DynamicQuery } from '../../organica3.schemas.js';

export class GetOrganica3DynamicQuery {
  constructor(private organica3Repo: IOrganica3Repository) {}

  async execute(query: DynamicQuery, userId?: string): Promise<Organica3[]> {
    console.log('ORGANICA3_QUERY', {
      operation: 'GET_ORGANICA3_DYNAMIC',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      query
    });

    try {
      const result = await this.organica3Repo.dynamicQuery(query);

      console.log('ORGANICA3_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA3_DYNAMIC',
        userId: userId || 'SYSTEM',
        resultCount: result.length,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('ORGANICA3_QUERY_ERROR', {
        operation: 'GET_ORGANICA3_DYNAMIC',
        userId: userId || 'SYSTEM',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}
