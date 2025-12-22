import { LineaCapturaService } from '../../domain/services/LineaCapturaService.js';
import pino from 'pino';

const logger = pino({
  name: 'GenerateLineaCapturaQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export interface GenerateLineaCapturaParams {
  referencia4: string;
  fechaLimite: string;
  importe: number;
}

export interface GenerateLineaCapturaResult {
  lineaCaptura: string;
  referencia4: string;
  fechaLimite: string;
  importe: number;
  fechaCondensada: string;
  montoCondensado: number;
  digitoVerificador: string;
}

export class GenerateLineaCapturaQuery {
  constructor(private lineaCapturaService: LineaCapturaService) {}

  async execute(params: GenerateLineaCapturaParams, userId?: string): Promise<GenerateLineaCapturaResult> {
    const logContext = {
      operation: 'GENERATE_LINEA_CAPTURA',
      userId: userId || 'SYSTEM',
      referencia4: params.referencia4,
      fechaLimite: params.fechaLimite,
      importe: params.importe,
      timestamp: new Date().toISOString()
    };

    logger.info(logContext, 'Iniciando generación de línea de captura');

    try {
      // Validar parámetros
      if (!params.referencia4 || params.referencia4.trim().length === 0) {
        throw new Error('referencia4 es requerido');
      }

      if (!params.fechaLimite || params.fechaLimite.trim().length === 0) {
        throw new Error('fechaLimite es requerido');
      }

      if (params.importe === undefined || params.importe === null || params.importe < 0) {
        throw new Error('importe debe ser un número positivo');
      }

      // Generar la referencia completa de 15 caracteres
      const lineaCaptura = this.lineaCapturaService.generarReferencia11({
        referencia4: params.referencia4,
        fechaLimite: params.fechaLimite,
        importe: params.importe
      });

      // Calcular componentes individuales para la respuesta
      const fechaCondensada = this.lineaCapturaService.calcularFechaCondensada(params.fechaLimite);
      const montoCondensado = this.lineaCapturaService.calcularMontoCondensado(params.importe);
      
      // Extraer el dígito verificador de la línea de captura (posiciones 14-15)
      const digitoVerificador = lineaCaptura.substring(13, 15);

      const result: GenerateLineaCapturaResult = {
        lineaCaptura,
        referencia4: params.referencia4.toUpperCase(),
        fechaLimite: params.fechaLimite,
        importe: params.importe,
        fechaCondensada,
        montoCondensado,
        digitoVerificador
      };

      logger.info({
        ...logContext,
        lineaCaptura,
        fechaCondensada,
        montoCondensado,
        digitoVerificador
      }, 'Línea de captura generada exitosamente');

      return result;
    } catch (error) {
      logger.error({
        ...logContext,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al generar línea de captura');
      throw error;
    }
  }
}

