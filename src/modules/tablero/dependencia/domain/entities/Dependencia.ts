export type TipoDependencia = 'SECRETARIA' | 'DIRECCION_GENERAL' | 'DIRECCION' | 'DEPARTAMENTO' | 'UNIDAD' | 'OFICINA';

export interface Dependencia {
  id: number;
  nombre: string;
  descripcion: string;
  tipoDependencia: TipoDependencia;
  idDependenciaPadre: number | null;
  claveDependencia: string;
  responsable: string | null;
  telefono: string | null;
  email: string | null;
  esActiva: boolean;
  dependenciaPadre?: {
    id: number;
    nombre: string;
  } | null;
}

export interface DependenciaWithHijas extends Dependencia {
  dependenciasHijas: Array<{
    id: number;
    nombre: string;
    descripcion: string;
    tipoDependencia: TipoDependencia;
    claveDependencia: string;
    responsable: string | null;
    telefono: string | null;
    email: string | null;
    esActiva: boolean;
  }>;
}

