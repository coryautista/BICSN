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
  guardarHistoricoAportaciones(
    req: FastifyRequest,
    data: GuardarHistoricoAportaciones
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

