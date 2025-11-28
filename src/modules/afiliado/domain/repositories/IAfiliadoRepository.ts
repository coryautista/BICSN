import { Afiliado, CreateAfiliadoData, UpdateAfiliadoData } from '../entities/Afiliado.js';

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
}
