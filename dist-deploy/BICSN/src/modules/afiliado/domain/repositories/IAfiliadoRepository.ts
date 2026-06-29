import { Afiliado, CreateAfiliadoData, UpdateAfiliadoData } from '../entities/Afiliado.js';
import { HistorialMovimientosQuincenaFilters, HistorialMovimientosQuincenaResult } from '../entities/HistorialMovimientosQuincena.js';

export interface AplicarBDIsspeaLoteResult {
  afiliadosProcesados: Array<{
    afiliadoId: number;
    folio: number | null;
    nombreCompleto: string;
    estadoAnterior: string;
    estadoNuevo: string;
    exito: boolean;
    mensaje: string;
  }>;
  afiliadosCambiadosEstado: number;
  afiliadosFallidos: number;
  afiliadosCompletos: number;
  bitacoraActualizada: number;
  resumen: {
    totalEncontrados: number;
    procesadosExitosamente: number;
    procesadosConError: number;
    organica: string;
  };
  periodo?: string;
  quincena?: number;
  anio?: number;
  quincenaId?: string;
  afectacionId?: number;
  detallesMigracion?: Array<{
    afiliadoId: number;
    movimientoId: number;
    tipoMovimientoId: number;
    codigoMovimiento: string | null;
    exito: boolean;
    cveError: number;
    nomError: string;
  }>;
}

export interface IAfiliadoRepository {
  findAll(): Promise<Afiliado[]>;
  findById(id: number): Promise<Afiliado | undefined>;
  create(data: CreateAfiliadoData): Promise<Afiliado>;
  update(data: UpdateAfiliadoData): Promise<Afiliado>;
  delete(id: number): Promise<void>;
  aplicarBDIsspeaLote(
    org0: string,
    org1: string,
    usuarioId: string,
    motivo?: string,
    observaciones?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AplicarBDIsspeaLoteResult>;
  findByStatusAndOrganica(
    org0: string,
    org1: string,
    estados: number[]
  ): Promise<Afiliado[]>;
  getHistorialMovimientosQuincena(
    filters: HistorialMovimientosQuincenaFilters
  ): Promise<HistorialMovimientosQuincenaResult>;
}
