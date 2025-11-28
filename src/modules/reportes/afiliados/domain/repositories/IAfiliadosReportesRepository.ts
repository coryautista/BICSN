import { HistorialMovimientosQuin } from '../entities/HistorialMovimientosQuin.js';
import { HistorialMovPromedioSdo } from '../entities/HistorialMovPromedioSdo.js';

export interface IAfiliadosReportesRepository {
  getHistorialMovimientosQuin(periodo: string): Promise<HistorialMovimientosQuin[]>;
  getHistorialMovPromedioSdo(periodo: string, pOrg0: string, pOrg1: string, pOrg2: string, pOrg3: string): Promise<HistorialMovPromedioSdo[]>;
}

