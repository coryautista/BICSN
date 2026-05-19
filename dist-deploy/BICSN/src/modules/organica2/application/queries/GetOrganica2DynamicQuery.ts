import { IOrganica2Repository } from '../../domain/repositories/IOrganica2Repository.js';
import { Organica2 } from '../../domain/entities/Organica2.js';
import { DynamicQuery } from '../../organica2.schemas.js';

export class GetOrganica2DynamicQuery {
  constructor(private organica2Repo: IOrganica2Repository) {}

  async execute(query: DynamicQuery, userId?: string): Promise<Organica2[]> {
    console.log('ORGANICA2_QUERY', {
      operation: 'GET_ORGANICA2_DYNAMIC',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      query
    });

    try {
      const result = await this.organica2Repo.dynamicQuery(query);

      console.log('ORGANICA2_QUERY_SUCCESS', {
        operation: 'GET_ORGANICA2_DYNAMIC',
        userId: userId || 'SYSTEM',
        resultCount: result.length,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('ORGANICA2_QUERY_ERROR', {
        operation: 'GET_ORGANICA2_DYNAMIC',
        userId: userId || 'SYSTEM',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}
