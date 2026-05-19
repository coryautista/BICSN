// Domain entity for Info
export interface Info {
  id: number;
  nombre: string;
  icono: string | null;
  color: string | null;
  colorBotones: string | null;
  colorEncabezados: string | null;
  colorLetra: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateInfoData {
  nombre: string;
  icono?: string;
  color?: string;
  colorBotones?: string;
  colorEncabezados?: string;
  colorLetra?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface UpdateInfoData {
  nombre?: string;
  icono?: string;
  color?: string;
  colorBotones?: string;
  colorEncabezados?: string;
  colorLetra?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DeleteInfoData {
  id: number;
}
