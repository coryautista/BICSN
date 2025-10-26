import { z } from 'zod';

export const GetLogStatsSchema = z.object({});

export const GetLogContentSchema = z.object({
  fileName: z.string(),
  lines: z.number().min(1).max(1000).optional().default(100)
});

export const SearchLogsSchema = z.object({
  searchTerm: z.string().min(1),
  maxResults: z.number().min(1).max(1000).optional().default(100)
});

export const CleanupLogsSchema = z.object({
  maxAgeDays: z.number().min(1).max(365).optional().default(30),
  maxFiles: z.number().min(1).max(100).optional().default(50)
});

export const ArchiveLogsSchema = z.object({
  archiveDir: z.string().optional()
});