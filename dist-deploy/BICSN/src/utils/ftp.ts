import Client from 'ssh2-sftp-client';
import { env } from '../config/env.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface FTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export class FTPService {
  private config: FTPConfig;

  constructor() {
    this.config = {
      host: env.ftp.host,
      port: env.ftp.port,
      username: env.ftp.user,
      password: env.ftp.password
    };
  }

  /**
   * Upload a file to FTP server
   * @param localFilePath - Path to the local file
   * @param remoteFilePath - Remote path where to store the file
   * @returns Promise<void>
   */
  async uploadFile(localFilePath: string, remoteFilePath: string): Promise<void> {
    const client = new Client();

    try {
      await client.connect(this.config);

      // Ensure remote directory exists
      const remoteDir = path.dirname(remoteFilePath);
      await client.mkdir(remoteDir, true);

      // Upload file
      await client.put(localFilePath, remoteFilePath);

    } catch (error) {
      console.error('FTP upload error:', error);
      throw new Error(`Failed to upload file to FTP: ${error}`);
    } finally {
      await client.end();
    }
  }

  /**
   * Download a file from FTP server
   * @param remoteFilePath - Remote path of the file
   * @param localFilePath - Local path where to save the file
   * @returns Promise<void>
   */
  async downloadFile(remoteFilePath: string, localFilePath: string): Promise<void> {
    const client = new Client();

    try {
      await client.connect(this.config);

      // Ensure local directory exists
      const localDir = path.dirname(localFilePath);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      // Download file
      await client.get(remoteFilePath, localFilePath);

    } catch (error) {
      console.error('FTP download error:', error);
      throw new Error(`Failed to download file from FTP: ${error}`);
    } finally {
      await client.end();
    }
  }

  /**
   * Delete a file from FTP server
   * @param remoteFilePath - Remote path of the file to delete
   * @returns Promise<void>
   */
  async deleteFile(remoteFilePath: string): Promise<void> {
    const client = new Client();

    try {
      await client.connect(this.config);
      await client.delete(remoteFilePath);
    } catch (error) {
      console.error('FTP delete error:', error);
      throw new Error(`Failed to delete file from FTP: ${error}`);
    } finally {
      await client.end();
    }
  }

  /**
   * Check if a file exists on FTP server
   * @param remoteFilePath - Remote path of the file
   * @returns Promise<boolean>
   */
  async fileExists(remoteFilePath: string): Promise<boolean> {
    const client = new Client();

    try {
      await client.connect(this.config);
      const stats = await client.stat(remoteFilePath);
      return !!stats;
    } catch (error) {
      return false;
    } finally {
      await client.end();
    }
  }

  /**
   * Generate SHA256 hash of a file
   * @param filePath - Path to the file
   * @returns Promise<string>
   */
  async generateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Generate storage path for expediente files
   * @param curp - CURP of the expediente
   * @param fileName - Original file name
   * @returns string
   */
  generateExpedientePath(curp: string, fileName: string): string {
    // Format: upload/expedientes/{CURP}/{timestamp}_{filename}
    const timestamp = Date.now();
    const fileExt = path.extname(fileName);
    const baseName = path.basename(fileName, fileExt);
    const newFileName = `${timestamp}_${baseName}${fileExt}`;

    return `upload/expedientes/${curp}/${newFileName}`;
  }

  /**
   * Get file stats from FTP server
   * @param remoteFilePath - Remote path of the file
   * @returns Promise<any>
   */
  async getFileStats(remoteFilePath: string): Promise<any> {
    const client = new Client();

    try {
      await client.connect(this.config);
      return await client.stat(remoteFilePath);
    } catch (error) {
      console.error('FTP stat error:', error);
      throw new Error(`Failed to get file stats from FTP: ${error}`);
    } finally {
      await client.end();
    }
  }
}

// Export singleton instance
export const ftpService = new FTPService();