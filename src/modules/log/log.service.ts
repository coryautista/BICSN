import { logManager } from '../../utils/logManager.js';

export async function getLogStats() {
  return logManager.getLogStats();
}

export async function getLogContent(fileName: string, lines: number = 100) {
  return logManager.getLogContent(fileName, lines);
}

export async function searchLogs(searchTerm: string, maxResults: number = 100) {
  return logManager.searchLogs(searchTerm, maxResults);
}

export async function cleanupLogs(maxAgeDays: number = 30, maxFiles: number = 50) {
  return logManager.cleanupOldLogs(maxAgeDays, maxFiles);
}

export async function archiveLogs(archiveDir?: string) {
  return logManager.archiveLogs(archiveDir);
}