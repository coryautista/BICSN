// Domain entity for User
export interface User {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  passwordAlgo: string;
  isLockedOut: boolean;
  lockoutEndAt: Date | null;
  accessFailedCount: number;
  displayName: string | null;
  photoPath: string | null;
  idOrganica0: string | null;
  idOrganica1: string | null;
  idOrganica2: string | null;
  idOrganica3: string | null;
}

export interface UserRole {
  name: string;
  isEntidad: boolean;
}

export interface RefreshToken {
  userId: string;
  tokenHash: Buffer;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
}

export interface CreateUserData {
  username: string;
  email: string | null;
  passwordHash: string;
  passwordAlgo: string;
  displayName?: string | null;
  photoPath?: string | null;
  idOrganica0?: number | null;
  idOrganica1?: number | null;
  idOrganica2?: number | null;
  idOrganica3?: number | null;
}

// Safe user type without sensitive data
export type SafeUser = Omit<User, 'passwordHash' | 'passwordAlgo'>;
