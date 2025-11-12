// Domain entity for Log
export interface LogStats {
  totalFiles: number;
  totalSize: number;
  oldestFile: string | null;
  newestFile: string | null;
  files: LogFileInfo[];
}

export interface LogFileInfo {
  name: string;
  size: number;
  created: Date;
  modified: Date;
}

export interface LogContent {
  content: string;
  totalLines: number;
  hasMore: boolean;
}

export interface LogSearchResult {
  file: string;
  line: number;
  content: string;
  timestamp: string;
}

export interface CleanupResult {
  deletedFiles: string[];
  totalDeleted: number;
}

export interface ArchiveResult {
  archivedFiles: string[];
  totalArchived: number;
}
