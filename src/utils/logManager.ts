import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LogStats {
  totalFiles: number;
  totalSize: number;
  oldestFile: string | null;
  newestFile: string | null;
  files: Array<{
    name: string;
    size: number;
    created: Date;
    modified: Date;
  }>;
}

class LogManager {
  private logDir: string;

  constructor(logDir?: string) {
    this.logDir = logDir || path.join(__dirname, '../../logs');
  }

  public getLogStats(): LogStats {
    const stats: LogStats = {
      totalFiles: 0,
      totalSize: 0,
      oldestFile: null,
      newestFile: null,
      files: []
    };

    try {
      if (!fs.existsSync(this.logDir)) {
        return stats;
      }

      const files = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => {
          const filePath = path.join(this.logDir, file);
          const fileStats = fs.statSync(filePath);

          return {
            name: file,
            size: fileStats.size,
            created: fileStats.birthtime,
            modified: fileStats.mtime
          };
        })
        .sort((a, b) => a.created.getTime() - b.created.getTime());

      stats.totalFiles = files.length;
      stats.totalSize = files.reduce((sum, file) => sum + file.size, 0);
      stats.files = files;

      if (files.length > 0) {
        stats.oldestFile = files[0].name;
        stats.newestFile = files[files.length - 1].name;
      }
    } catch (error) {
      console.error('Error getting log stats:', error);
    }

    return stats;
  }

  public cleanupOldLogs(maxAgeDays: number = 30, maxFiles: number = 50): { deletedFiles: string[]; totalDeleted: number } {
    const deletedFiles: string[] = [];
    let totalDeleted = 0;

    try {
      if (!fs.existsSync(this.logDir)) {
        return { deletedFiles, totalDeleted };
      }

      const now = new Date();
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

      const files = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => {
          const filePath = path.join(this.logDir, file);
          const fileStats = fs.statSync(filePath);

          return {
            name: file,
            path: filePath,
            created: fileStats.birthtime,
            modified: fileStats.mtime,
            size: fileStats.size
          };
        })
        .sort((a, b) => a.created.getTime() - b.created.getTime()); // Oldest first

      // Delete files older than maxAgeDays
      const oldFiles = files.filter(file => (now.getTime() - file.created.getTime()) > maxAgeMs);
      for (const file of oldFiles) {
        try {
          fs.unlinkSync(file.path);
          deletedFiles.push(file.name);
          totalDeleted++;
        } catch (error) {
          console.error(`Error deleting old log file ${file.name}:`, error);
        }
      }

      // If still too many files, delete oldest ones
      if (files.length - totalDeleted > maxFiles) {
        const remainingFiles = files.slice(totalDeleted); // Skip already deleted files
        const filesToDelete = remainingFiles.slice(0, remainingFiles.length - maxFiles);

        for (const file of filesToDelete) {
          try {
            fs.unlinkSync(file.path);
            deletedFiles.push(file.name);
            totalDeleted++;
          } catch (error) {
            console.error(`Error deleting excess log file ${file.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error during log cleanup:', error);
    }

    return { deletedFiles, totalDeleted };
  }

  public archiveLogs(archiveDir?: string): { archivedFiles: string[]; totalArchived: number } {
    const archivedFiles: string[] = [];
    let totalArchived = 0;

    try {
      const targetDir = archiveDir || path.join(this.logDir, 'archive');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      if (!fs.existsSync(this.logDir)) {
        return { archivedFiles, totalArchived };
      }

      const files = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.log') && !file.includes('archive'));

      for (const file of files) {
        const sourcePath = path.join(this.logDir, file);
        const targetPath = path.join(targetDir, file);

        try {
          fs.renameSync(sourcePath, targetPath);
          archivedFiles.push(file);
          totalArchived++;
        } catch (error) {
          console.error(`Error archiving log file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during log archiving:', error);
    }

    return { archivedFiles, totalArchived };
  }

  public searchLogs(searchTerm: string, maxResults: number = 100): Array<{
    file: string;
    line: number;
    content: string;
    timestamp: string;
  }> {
    const results: Array<{
      file: string;
      line: number;
      content: string;
      timestamp: string;
    }> = [];

    try {
      if (!fs.existsSync(this.logDir)) {
        return results;
      }

      const files = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .sort()
        .reverse(); // Newest files first

      for (const file of files) {
        if (results.length >= maxResults) break;

        const filePath = path.join(this.logDir, file);

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
              try {
                const logEntry = JSON.parse(line);
                results.push({
                  file,
                  line: i + 1,
                  content: line,
                  timestamp: logEntry.timestamp || 'unknown'
                });

                if (results.length >= maxResults) break;
              } catch {
                // If not valid JSON, still include it
                results.push({
                  file,
                  line: i + 1,
                  content: line,
                  timestamp: 'unknown'
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error reading log file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error searching logs:', error);
    }

    return results;
  }

  public getLogContent(fileName: string, lines: number = 100): {
    content: string;
    totalLines: number;
    hasMore: boolean;
  } {
    try {
      const filePath = path.join(this.logDir, fileName);

      if (!fs.existsSync(filePath)) {
        return { content: '', totalLines: 0, hasMore: false };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const allLines = content.split('\n');
      const totalLines = allLines.length;

      const requestedLines = allLines.slice(-lines); // Get last N lines
      const resultContent = requestedLines.join('\n');

      return {
        content: resultContent,
        totalLines,
        hasMore: totalLines > lines
      };
    } catch (error) {
      console.error(`Error reading log file ${fileName}:`, error);
      return { content: '', totalLines: 0, hasMore: false };
    }
  }
}

// Export singleton instance
export const logManager = new LogManager();
export default logManager;