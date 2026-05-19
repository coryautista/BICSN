// Domain entity for Usuario
export interface Usuario {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  photoPath: string | null;
  isLockedOut: boolean;
  lockoutEndAt: Date | null;
  accessFailedCount: number;
  idOrganica0: string | null;
  idOrganica1: string | null;
  idOrganica2: string | null;
  idOrganica3: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateUsuarioData {
  usuarioId?: string | null;
  username: string;
  email: string | null;
  passwordHash: string;
  passwordAlgo: string;
  displayName?: string | null;
  photoPath?: string | null;
  idOrganica0?: string | null;
  idOrganica1?: string | null;
  idOrganica2?: string | null;
  idOrganica3?: string | null;
}

export interface UpdateUsuarioData {
  email?: string | null;
  displayName?: string | null;
  photoPath?: string | null;
  idOrganica0?: string | null;
  idOrganica1?: string | null;
  idOrganica2?: string | null;
  idOrganica3?: string | null;
}

export interface UsuarioRole {
  roleId: string;
  roleName: string;
  isEntidad: boolean;
}
