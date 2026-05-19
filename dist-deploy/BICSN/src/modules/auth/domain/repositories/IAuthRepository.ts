import { User, UserRole, CreateUserData } from '../entities/User.js';

export interface IAuthRepository {
  // User queries
  findUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  findUserById(userId: string): Promise<User | undefined>;
  createUser(data: CreateUserData): Promise<User>;
  
  // Role queries
  getUserRoles(userId: string): Promise<UserRole[]>;
  
  // Authentication tracking
  registerFailedLogin(userId: string, maxFailures?: number, lockoutMinutes?: number): Promise<void>;
  registerSuccessfulLogin(userId: string): Promise<void>;
  
  // Refresh token management
  issueRefreshToken(userId: string, tokenHash: Buffer, ttlMinutes: number, ip?: string, ua?: string): Promise<void>;
  rotateRefreshToken(currentHash: Buffer, newHash: Buffer, ttlMinutes: number, ip?: string, ua?: string): Promise<void>;
  revokeAllRefreshTokensForUser(userId: string): Promise<void>;
  
  // JWT denylist
  denylistJwt(jti: string, userId: string | null, expiresAt: Date, reason?: string): Promise<void>;
  isJtiDenylisted(jti: string): Promise<boolean>;
}
