// Domain entity for ORG_PERSONAL table
export interface OrgPersonal {
  interno: number;
  clave_organica_0: string | null;
  clave_organica_1: string | null;
  clave_organica_2: string | null;
  clave_organica_3: string | null;
  sueldo: number | null;
  otras_prestaciones: number | null;
  quinquenios: number | null;
  activo: string | null;
  fecha_mov_alt: string | null;
  orgs1: string | null;
  orgs2: string | null;
  orgs3: string | null;
  orgs: string | null;
  dsueldo: number | null;
  dotras_prestaciones: number | null;
  dquinquenios: number | null;
  aplicar: string | null;
  bc: string | null;
  porcentaje: number | null;
}

export type CreateOrgPersonalData = Omit<OrgPersonal, 'orgs1' | 'orgs2' | 'orgs3' | 'orgs'>;
export type UpdateOrgPersonalData = Partial<Omit<OrgPersonal, 'interno' | 'orgs1' | 'orgs2' | 'orgs3' | 'orgs'>>;
