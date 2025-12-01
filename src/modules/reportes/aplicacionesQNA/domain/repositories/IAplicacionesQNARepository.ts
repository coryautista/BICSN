import { MovimientoQuincenal } from '../entities/MovimientoQuincenal.js';
import { AplicacionAportaciones } from '../entities/AplicacionAportaciones.js';
import { AplicacionPCP } from '../entities/AplicacionPCP.js';
import { AplicacionPMP } from '../entities/AplicacionPMP.js';
import { AplicacionHIP } from '../entities/AplicacionHIP.js';
import { Concentrado } from '../entities/Concentrado.js';

export interface PeriodoTrabajo {
  periodo: string;
  quincena: number;
  anio: number;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;    // YYYY-MM-DD
}

export interface IAplicacionesQNARepository {
  getMovimientosQuincenales(periodo: string, pOrg0: string, pOrg1: string): Promise<MovimientoQuincenal[]>;
  getAplicacionAportaciones(pOrg0: string, pOrg1: string, periodo: string): Promise<AplicacionAportaciones[]>;
  getAplicacionPCP(pOrg0: string, pOrg1: string, pPeriodo: string): Promise<AplicacionPCP[]>;
  getAplicacionPMP(pOrg0: string, pOrg1: string, pPeriodo: string): Promise<AplicacionPMP[]>;
  getAplicacionHIP(org0: string, org1: string, quincena: string): Promise<AplicacionHIP[]>;
  getConcentrado(org0: string, org1: string, org2: string, org3: string, periodo: string): Promise<Concentrado[]>;
  obtenerPeriodoTrabajo(org0: string, org1: string): Promise<PeriodoTrabajo>;
}

