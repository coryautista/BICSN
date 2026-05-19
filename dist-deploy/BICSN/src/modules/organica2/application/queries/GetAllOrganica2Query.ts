import { IOrganica2Repository } from '../../domain/repositories/IOrganica2Repository.js';
import { Organica2 } from '../../domain/entities/Organica2.js';

export class GetAllOrganica2Query {
  constructor(private organica2Repo: IOrganica2Repository) {}

  async execute(userId?: string): Promise<Organica2[]> {
    console.log('ORGANICA2_QUERY', {
      operation: 'GET_ALL_ORGANICA2',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString()
    });

    try {
      const result = await this.organica2Repo.findAll();

      console.log('ORGANICA2_QUERY_SUCCESS', {
        operation: 'GET_ALL_ORGANICA2',
        userId: userId || 'SYSTEM',
        resultCount: result.length,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA2_QUERY_ERROR', {
        operation: 'GET_ALL_ORGANICA2',
        userId: userId || 'SYSTEM',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}
