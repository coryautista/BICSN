import { ILogRepository } from '../../domain/repositories/ILogRepository.js';
import { LogStats, LogContent, LogSearchResult, CleanupResult, ArchiveResult } from '../../domain/entities/Log.js';
import { logManager } from '../../../../utils/logManager.js';

export class LogRepository implements ILogRepository {
  async getStats(): Promise<LogStats> {
    return await logManager.getLogStats();
  }

  async getContent(fileName: string, lines: number): Promise<LogContent> {
    return await logManager.getLogContent(fileName, lines);
  }

  async search(searchTerm: string, maxResults: number): Promise<LogSearchResult[]> {
    return await logManager.searchLogs(searchTerm, maxResults);
  }

  async cleanup(maxAgeDays: number, maxFiles: number): Promise<CleanupResult> {
    return await logManager.cleanupOldLogs(maxAgeDays, maxFiles);
  }

  async archive(archiveDir?: string): Promise<ArchiveResult> {
    return await logManager.archiveLogs(archiveDir);
  }
}
