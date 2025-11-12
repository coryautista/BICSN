export interface AfiliadoOrg {
  id: number;
  afiliadoId: number;
  nivel0Id: number | null;
  nivel1Id: number | null;
  nivel2Id: number | null;
  nivel3Id: number | null;
  claveOrganica0: string | null;
  claveOrganica1: string | null;
  claveOrganica2: string | null;
  claveOrganica3: string | null;
  interno: number | null;
  sueldo: number | null;
  otrasPrestaciones: number | null;
  quinquenios: number | null;
  activo: boolean;
  fechaMovAlt: string | null;
  orgs1: string | null;
  orgs2: string | null;
  orgs3: string | null;
  orgs4: string | null;
  dSueldo: string | null;
  dOtrasPrestaciones: string | null;
  dQuinquenios: string | null;
  aplicar: boolean | null;
  bc: string | null;
  porcentaje: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAfiliadoOrgData extends Omit<AfiliadoOrg, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateAfiliadoOrgData extends Partial<Omit<AfiliadoOrg, 'id' | 'createdAt' | 'updatedAt'>> {
  id: number;
}

export interface DeleteAfiliadoOrgData {
  id: number;
}
