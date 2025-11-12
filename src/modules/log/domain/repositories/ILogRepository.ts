import { LogStats, LogContent, LogSearchResult, CleanupResult, ArchiveResult } from '../entities/Log.js';

export interface ILogRepository {
  getStats(): Promise<LogStats>;
  getContent(fileName: string, lines: number): Promise<LogContent>;
  search(searchTerm: string, maxResults: number): Promise<LogSearchResult[]>;
  cleanup(maxAgeDays: number, maxFiles: number): Promise<CleanupResult>;
  archive(archiveDir?: string): Promise<ArchiveResult>;
}
