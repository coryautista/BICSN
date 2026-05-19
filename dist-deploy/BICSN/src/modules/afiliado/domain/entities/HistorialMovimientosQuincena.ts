import { Afiliado } from './Afiliado.js';
import { AfiliadoOrg } from '../../../afiliadoOrg/domain/entities/AfiliadoOrg.js';
import { Movimiento } from '../../../movimiento/domain/entities/Movimiento.js';
import { TipoMovimiento } from '../../../tipoMovimiento/domain/entities/TipoMovimiento.js';

export interface HistorialMovimientosQuincenaItem {
  afiliado: Afiliado & {
    nombreStatus: string | null;
    statusDescripcion: string | null;
    statusColor: string | null;
  };
  afiliadoOrg: AfiliadoOrg;
  movimiento: Movimiento;
  tipoMovimiento: TipoMovimiento | null;
}

export interface HistorialMovimientosQuincenaMeta {
  org0: string;
  org1: string;
  periodo: string;
  quincena: number;
  anio: number;
  quincenaId: string;
  numValidacion: 7;
  afiliadosComplete: 1;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HistorialMovimientosQuincenaResult {
  items: HistorialMovimientosQuincenaItem[];
  meta: HistorialMovimientosQuincenaMeta;
}

export interface HistorialMovimientosQuincenaFilters {
  org0: string;
  org1: string;
  periodo: string;
  quincena: number;
  anio: number;
  quincenaId: string;
  buscar?: string;
  page: number;
  pageSize: number;
}
