import { FastifyRequest } from 'fastify';
import { AportacionQuincenalResumen } from '../entities/AportacionQuincenalResumen.js';
import { ResumenOrgQnaAll } from '../entities/ResumenOrgQnaAll.js';
import { GuardarHistoricoAportaciones, GuardarHistoricoRetenciones } from '../../aplicacionQuincenal.schemas.js';

export interface GuardarHistoricoAportacionesResult {
  procesados: string[];
  totalRegistros: Record<string, number>;
}

export interface GuardarHistoricoRetencionesResult {
  procesados: string[];
  totalRegistros: Record<string, number>;
}

export interface HistoricoAportacionesResult {
  ahorro: any[];
  vivienda: any[];
  prestaciones: any[];
  cair: any[];
  transitorio: any[];
  guarderias: any[];
  aguinaldo: any[];
}

export interface ValidarAplicacionQnaAportacionesResult {
  aplicada: boolean;
  organica0: string;
  organica1: string;
  periodo: string;
  quincena: number;
  anio: number;
  bitacora: Record<string, unknown> | null;
  parametrosAplicacion: {
    aplicarC: Record<string, unknown>;
    aplicarF: Record<string, unknown>;
  } | null;
  aportaciones: (HistoricoAportacionesResult & {
    detalleAguinaldo: any[];
    resumen: any[];
  }) | null;
  totales: Record<string, number> | null;
}

export interface HistoricoRetencionesResult {
  prestamosCortoPlazo: any[];
  prestamosMedianoPlazo: any[];
  prestamosHipotecarios: any[];
}

export interface IAplicacionQuincenalRepository {
  getAportacionQuincenalResumen(
    org0: string,
    org1: string,
    periodo: string
  ): Promise<AportacionQuincenalResumen[]>;
  getResumenOrgQnaAll(
    org0: string,
    org1: string,
    periodo: string
  ): Promise<ResumenOrgQnaAll[]>;
  getEntidadesRptPdfInserta(
    organica0: string,
    organica1: string,
    periodo: string
  ): Promise<Record<string, unknown>[]>;
  validarAplicacionQnaAportaciones(
    organica0: string,
    organica1: string,
    periodo: string
  ): Promise<ValidarAplicacionQnaAportacionesResult>;
  guardarHistoricoAportaciones(
    req: FastifyRequest,
    data: GuardarHistoricoAportaciones,
    snapshotV2Required?: boolean
  ): Promise<GuardarHistoricoAportacionesResult>;
  guardarHistoricoRetenciones(
    req: FastifyRequest,
    data: GuardarHistoricoRetenciones
  ): Promise<GuardarHistoricoRetencionesResult>;
  obtenerHistoricoAportaciones(
    org0: string,
    org1: string,
    quincena: number,
    anio: number
  ): Promise<HistoricoAportacionesResult>;
  obtenerHistoricoRetenciones(
    org0: string,
    org1: string,
    quincena: number,
    anio: number
  ): Promise<HistoricoRetencionesResult>;
}
