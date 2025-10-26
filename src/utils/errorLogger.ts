import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  requestId?: string;
  userId?: string;
  userName?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  responseTime?: number;
  body?: any;
  query?: any;
  params?: any;
  headers?: any;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
}

class ErrorLogger {
  private logDir: string;
  private currentLogFile: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxFiles: number = 10;

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
    this.currentLogFile = this.getCurrentLogFile();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getCurrentLogFile(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `error-${dateStr}.log`);
  }

  private shouldRotateFile(): boolean {
    try {
      const stats = fs.statSync(this.currentLogFile);
      return stats.size > this.maxFileSize;
    } catch {
      return false;
    }
  }

  private rotateLogFile(): void {
    const files = fs.readdirSync(this.logDir)
      .filter(file => file.startsWith('error-'))
      .sort()
      .reverse();

    // Remove old files if we exceed maxFiles
    if (files.length >= this.maxFiles) {
      for (let i = this.maxFiles - 1; i < files.length; i++) {
        try {
          fs.unlinkSync(path.join(this.logDir, files[i]));
        } catch (err) {
          console.error('Error removing old log file:', err);
        }
      }
    }

    // Rename current file with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const newFileName = `error-${timestamp}.log`;
    const newFilePath = path.join(this.logDir, newFileName);

    try {
      fs.renameSync(this.currentLogFile, newFilePath);
    } catch (err) {
      console.error('Error rotating log file:', err);
    }

    this.currentLogFile = this.getCurrentLogFile();
  }

  private formatLogEntry(entry: ErrorLogEntry): string {
    const logLine = {
      timestamp: entry.timestamp,
      level: entry.level.toUpperCase(),
      message: entry.message,
      requestId: entry.requestId,
      userId: entry.userId,
      userName: entry.userName,
      method: entry.method,
      url: entry.url,
      ip: entry.ip,
      userAgent: entry.userAgent,
      statusCode: entry.statusCode,
      responseTime: entry.responseTime,
      error: entry.error,
      stack: entry.stack,
      body: entry.body,
      query: entry.query,
      params: entry.params,
      headers: entry.headers
    };

    return JSON.stringify(logLine) + '\n';
  }

  public log(entry: ErrorLogEntry): void {
    try {
      // Check if we need to rotate the file
      if (this.shouldRotateFile()) {
        this.rotateLogFile();
      }

      // Update current log file if date changed
      const newLogFile = this.getCurrentLogFile();
      if (newLogFile !== this.currentLogFile) {
        this.currentLogFile = newLogFile;
      }

      const logLine = this.formatLogEntry(entry);
      fs.appendFileSync(this.currentLogFile, logLine);
    } catch (err) {
      console.error('Error writing to log file:', err);
    }
  }

  public logError(error: Error, req?: any, res?: any): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };

    if (req) {
      entry.requestId = req.id;
      entry.method = req.method;
      entry.url = req.url;
      entry.ip = req.ip || req.connection?.remoteAddress;
      entry.userAgent = req.headers['user-agent'];
      entry.body = req.body;
      entry.query = req.query;
      entry.params = req.params;
      entry.headers = req.headers;

      // Extract user info if available
      if (req.user) {
        entry.userId = req.user.id?.toString();
        entry.userName = req.user.username || req.user.name;
      }
    }

    if (res) {
      entry.statusCode = res.statusCode;
      entry.responseTime = res.getResponseTime ? res.getResponseTime() : undefined;
    }

    this.log(entry);
  }

  public logRequestError(req: any, error: Error, statusCode?: number): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Request error: ${error.message}`,
      stack: error.stack,
      requestId: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      statusCode,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
      error: {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        stack: error.stack
      }
    };

    // Extract user info if available
    if (req.user) {
      entry.userId = req.user.id?.toString();
      entry.userName = req.user.username || req.user.name;
    }

    this.log(entry);
  }

  public logWarning(message: string, req?: any, additionalData?: any): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...additionalData
    };

    if (req) {
      entry.requestId = req.id;
      entry.method = req.method;
      entry.url = req.url;
      entry.ip = req.ip || req.connection?.remoteAddress;
      entry.userAgent = req.headers['user-agent'];

      if (req.user) {
        entry.userId = req.user.id?.toString();
        entry.userName = req.user.username || req.user.name;
      }
    }

    this.log(entry);
  }

  public logInfo(message: string, req?: any, additionalData?: any): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...additionalData
    };

    if (req) {
      entry.requestId = req.id;
      entry.method = req.method;
      entry.url = req.url;
      entry.ip = req.ip || req.connection?.remoteAddress;
      entry.userAgent = req.headers['user-agent'];

      if (req.user) {
        entry.userId = req.user.id?.toString();
        entry.userName = req.user.username || req.user.name;
      }
    }

    this.log(entry);
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();
export default errorLogger;