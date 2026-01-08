import { FastifyRequest } from 'fastify';
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
}

