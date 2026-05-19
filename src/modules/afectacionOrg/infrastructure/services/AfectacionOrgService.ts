import { executeSelectableProcedure } from '../../../../db/firebird.js';
import {
  AfectacionQueryError,
  InvalidDateForQuincenaError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'afectacionOrg-service',
  level: process.env.LOG_LEVEL || 'info'
});

export class AfectacionOrgService {
  async calculateQuincenaFromDate(fecha: string) {
    const logContext = { operation: 'calculateQuincenaFromDate', fecha };
    logger.info(logContext, 'Calculando quincena desde fecha');

    try {
      let date: Date;
      const fechaTrimmed = fecha.trim();

      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(fechaTrimmed)) {
        const fechaPart = fechaTrimmed.split('T')[0];
        const [year, month, day] = fechaPart.split('-').map(Number);

        if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
          logger.warn({ ...logContext, fechaPart }, 'Formato de fecha inválido');
          throw new InvalidDateForQuincenaError(fecha);
        }

        date = new Date(year, month - 1, day);

        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
          logger.warn({ ...logContext, fechaPart }, 'Fecha inválida');
          throw new InvalidDateForQuincenaError(fecha);
        }
      } else {
        const timestamp = Date.parse(fechaTrimmed);
        if (isNaN(timestamp)) {
          logger.warn(logContext, 'Formato de fecha inválido');
          throw new InvalidDateForQuincenaError(fecha);
        }
        date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          logger.warn(logContext, 'Fecha inválida');
          throw new InvalidDateForQuincenaError(fecha);
        }
      }

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      if (year < 2000 || year > 2100) {
        logger.warn({ ...logContext, year }, 'Año fuera del rango válido');
        throw new InvalidDateForQuincenaError(fecha);
      }

      const quincenaInMonth = day <= 14 ? 1 : 2;
      const quincena = (month * 2) + quincenaInMonth;

      if (quincena < 1 || quincena > 24) {
        logger.warn({ ...logContext, quincena }, 'Quincena fuera del rango válido');
        throw new InvalidDateForQuincenaError(fecha);
      }

      const result = {
        fecha: fechaTrimmed,
        anio: year,
        mes: month + 1,
        dia: day,
        quincena,
        quincenaEnMes: quincenaInMonth,
        descripcion: `Quincena ${quincena} del año ${year} (${day <= 14 ? '1-14' : '15+'} de ${date.toLocaleString('es-MX', { month: 'long' })})`
      };

      logger.info({ ...logContext, result }, 'Quincena calculada exitosamente');
      return result;
    } catch (error: any) {
      logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al calcular quincena');
      if (error instanceof InvalidDateForQuincenaError) throw error;
      throw new InvalidDateForQuincenaError(fecha);
    }
  }

  async getQuincenaFromFirebird(org0: string, org1: string, org2?: string | null, org3?: string | null) {
    const logContext = { operation: 'getQuincenaFromFirebird', org0, org1, org2, org3 };
    logger.info(logContext, 'Obteniendo quincena desde Firebird AP_G_APLICADO_TIPO');

    try {
      const org2Final = (!org2 || (typeof org2 === 'string' && org2.trim() === '')) ? '01' : String(org2).padStart(2, '0').substring(0, 2);
      const org3Final = (!org3 || (typeof org3 === 'string' && org3.trim() === '')) ? '01' : String(org3).padStart(2, '0').substring(0, 2);

      if (!org0 || !org1) {
        throw new Error('org0 y org1 son requeridos para consultar Firebird');
      }

      const spResult = await executeSelectableProcedure('AP_G_APLICADO_TIPO', [org0, org1, org2Final, org3Final], {
        alias: 'p',
        columns: ['p.QUINCENA', 'p.FECHA']
      });

      if (!spResult || spResult.length === 0) {
        throw new Error('AP_G_APLICADO_TIPO no retornó resultados');
      }

      const firebirdResult = {
        QUINCENA: spResult[0].QUINCENA,
        FECHA: spResult[0].FECHA
      };

      const quincenaStr = String(firebirdResult.QUINCENA).padStart(4, '0');
      const quincena = parseInt(quincenaStr.substring(0, 2));
      const anioFromQuincena = 2000 + parseInt(quincenaStr.substring(2, 4));

      let anioFromFecha: number | null = null;
      if (firebirdResult.FECHA) {
        const fecha = firebirdResult.FECHA as unknown;
        if (fecha instanceof Date) {
          anioFromFecha = fecha.getFullYear();
        } else {
          const fechaStr = String(firebirdResult.FECHA);
          const fechaParts = fechaStr.split('.');
          if (fechaParts.length === 3) {
            anioFromFecha = parseInt(fechaParts[2]);
          } else {
            const isoParts = fechaStr.split('-');
            if (isoParts.length === 3) anioFromFecha = parseInt(isoParts[0]);
          }
        }
      }

      const anio = (anioFromFecha && anioFromFecha >= 2000 && anioFromFecha <= 2100)
        ? anioFromFecha
        : anioFromQuincena;

      let fecha: string | null = null;
      if (firebirdResult.FECHA) {
        const fechaValue = firebirdResult.FECHA as unknown;
        fecha = fechaValue instanceof Date ? fechaValue.toISOString().split('T')[0] : String(firebirdResult.FECHA);
      }

      const result = { quincena, anio, fecha };
      logger.info({ ...logContext, result }, 'Quincena obtenida exitosamente desde Firebird');
      return result;
    } catch (error: any) {
      logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al obtener quincena desde Firebird');
      throw new AfectacionQueryError(`getQuincenaFromFirebird: ${error.message || 'Error desconocido al consultar Firebird'}`, {
        org0,
        org1,
        org2,
        org3,
        originalError: error.message,
        errorName: error.name,
        errorCode: error.code
      });
    }
  }
}
