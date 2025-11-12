import { connectFirebirdDatabase } from '../../../../db/firebird.js';
import pino from 'pino';
import {
  InvalidInternoError,
  InternoNotFoundInFirebirdError,
  AfiliadoQueryError
} from '../../domain/errors.js';

const logger = pino({
  name: 'validateInternoInFirebirdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class ValidateInternoInFirebirdQuery {
  async execute(interno: number): Promise<boolean> {
    const logContext = {
      operation: 'validateInternoInFirebird',
      interno
    };

    logger.info(logContext, 'Validando interno en base de datos Firebird');

    // Validar que el interno sea válido
    if (!interno || interno <= 0) {
      logger.warn(logContext, 'Número interno inválido');
      throw new InvalidInternoError(interno);
    }

    try {
      const db = await connectFirebirdDatabase();

      return new Promise((resolve, reject) => {
        // First check if interno exists in PERSONAL table
        db.query('SELECT FIRST 1 INTERNO FROM PERSONAL WHERE INTERNO = ?', [interno], (err, personalResult) => {
          if (err) {
            logger.error({
              ...logContext,
              error: err.message,
              table: 'PERSONAL'
            }, 'Error al validar interno en tabla PERSONAL');
            reject(new AfiliadoQueryError('Error validating interno in PERSONAL table', {
              interno,
              table: 'PERSONAL',
              originalError: err.message
            }));
            return;
          }

          if (!personalResult || personalResult.length === 0) {
            logger.warn({
              ...logContext,
              table: 'PERSONAL'
            }, 'Interno no encontrado en tabla PERSONAL');
            resolve(false);
            return;
          }

          // If exists in PERSONAL, check ORG_PERSONAL table
          db.query('SELECT FIRST 1 INTERNO FROM ORG_PERSONAL WHERE INTERNO = ?', [interno], (err2, orgPersonalResult) => {
            if (err2) {
              logger.error({
                ...logContext,
                error: err2.message,
                table: 'ORG_PERSONAL'
              }, 'Error al validar interno en tabla ORG_PERSONAL');
              reject(new AfiliadoQueryError('Error validating interno in ORG_PERSONAL table', {
                interno,
                table: 'ORG_PERSONAL',
                originalError: err2.message
              }));
              return;
            }

            const exists = orgPersonalResult && orgPersonalResult.length > 0;
            logger.info({
              ...logContext,
              exists,
              table: 'ORG_PERSONAL'
            }, 'Validación de interno en Firebird completada');

            resolve(exists);
          });
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al validar interno en Firebird');

      if (error instanceof InvalidInternoError) {
        throw error;
      }

      throw new InternoNotFoundInFirebirdError(interno);
    }
  }
}
