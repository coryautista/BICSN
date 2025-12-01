import { AplicacionesQNAError, AplicacionesQNAErrorCode } from '../errors.js';

/**
 * Servicio de dominio para generar líneas de captura SPEI de 11 posiciones
 */
export class LineaCapturaService {
  private readonly ANIO_BASE = 2014;

  /**
   * Calcula la fecha condensada de 4 dígitos con año base 2014.
   * Fórmula: F = (año - añoBase) * 372 + (mes - 1) * 31 + (día - 1)
   * 
   * @param fecha Fecha límite de pago (Date o string aceptado por new Date())
   * @param anioBase Año base del algoritmo (por defecto 2014)
   * @returns Cadena de 4 caracteres numéricos
   */
  calcularFechaCondensada(fecha: Date | string, anioBase: number = this.ANIO_BASE): string {
    // Normalizamos a objeto Date
    const d = fecha instanceof Date ? fecha : new Date(fecha);

    // Validamos que la fecha sea válida
    if (Number.isNaN(d.getTime())) {
      throw new AplicacionesQNAError(
        'Fecha inválida para fecha condensada',
        AplicacionesQNAErrorCode.INVALID_PARAMETERS,
        400
      );
    }

    // Obtenemos año, mes (1–12) y día (1–31)
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // getMonth() es 0–11, por eso +1
    const day = d.getDate();

    // Aplicamos la fórmula
    const parte1 = (year - anioBase) * 372;
    const parte2 = (month - 1) * 31;
    const parte3 = (day - 1);
    const valor = parte1 + parte2 + parte3;

    // Validar que el valor sea positivo
    if (valor < 0) {
      throw new AplicacionesQNAError(
        `La fecha ${fecha} es anterior al año base ${anioBase}`,
        AplicacionesQNAErrorCode.INVALID_PARAMETERS,
        400
      );
    }

    // Regresamos exactamente 4 dígitos, rellenando con ceros a la izquierda
    return valor.toString().padStart(4, '0');
  }

  /**
   * Calcula el monto condensado estándar (1 dígito).
   * Algoritmo:
   *   1) Tomar el importe en centavos (ej. 5620.50 -> 562050)
   *   2) De derecha a izquierda multiplicar por factores 7, 3, 1, 7, 3, 1...
   *   3) Sumar los productos
   *   4) El remanente módulo 10 es el monto condensado (0–9)
   * 
   * @param importe Importe total con centavos
   * @returns Dígito 0–9
   */
  calcularMontoCondensado(importe: number | string): number {
    // Convertimos a número y validamos
    const numero = Number(importe);
    if (!Number.isFinite(numero) || numero < 0) {
      throw new AplicacionesQNAError(
        'Importe inválido para monto condensado. Debe ser un número positivo',
        AplicacionesQNAErrorCode.INVALID_PARAMETERS,
        400
      );
    }

    // Trabajamos en centavos para evitar problemas de flotante
    const centavos = Math.round(numero * 100);

    // Separamos cada dígito del número de centavos
    const digitos = centavos.toString().split('').map(d => Number(d));

    // Factores cíclicos 7, 3, 1
    const pesos = [7, 3, 1];
    let suma = 0;
    let idxPeso = 0;

    // Recorremos de derecha a izquierda aplicando los factores
    for (let i = digitos.length - 1; i >= 0; i--) {
      const dig = digitos[i];
      const peso = pesos[idxPeso];
      suma += dig * peso;
      idxPeso = (idxPeso + 1) % pesos.length; // 0 -> 1 -> 2 -> 0 -> ...
    }

    // El remanente módulo 10 es el monto condensado
    return suma % 10;
  }

  /**
   * Convierte un carácter a su valor numérico para el algoritmo Base 97.
   * - '0'..'9' -> 0..9
   * - 'A'..'Z' -> 10..35
   * 
   * @param ch Carácter a convertir
   * @returns Valor numérico
   */
  private charToValue(ch: string): number {
    // Si es dígito 0–9, devolvemos su valor numérico
    if (/[0-9]/.test(ch)) {
      return ch.charCodeAt(0) - 48; // '0' tiene código ASCII 48
    }

    // Convertimos a mayúscula y evaluamos A–Z
    const c = ch.toUpperCase();
    if (c >= 'A' && c <= 'Z') {
      return 10 + (c.charCodeAt(0) - 65); // 'A' es 10, 'B' es 11, etc.
    }

    // Si llega aquí, el carácter no es válido para la referencia
    throw new AplicacionesQNAError(
      `Carácter inválido en la referencia: "${ch}"`,
      AplicacionesQNAErrorCode.INVALID_PARAMETERS,
      400
    );
  }

  /**
   * Calcula el dígito verificador Base 97 de la línea sin DV.
   * Algoritmo:
   *   1) Tomar la línea sin DV
   *   2) De derecha a izquierda aplicar factores 11, 13, 17, 19, 23
   *   3) Sumar los productos
   *   4) DV = (suma MOD 97) + 1  -> rango 1–97
   *   5) Formatear a 2 dígitos (01–97)
   * 
   * @param lineaSinDV Cadena sin el DV (en este caso posiciones 1–9)
   * @returns Dos dígitos numéricos
   */
  calcularDVBase97(lineaSinDV: string): string {
    const pesos = [11, 13, 17, 19, 23];
    let suma = 0;
    let idxPeso = 0;

    // Recorremos de derecha a izquierda (último carácter -> primero)
    for (let i = lineaSinDV.length - 1; i >= 0; i--) {
      const ch = lineaSinDV[i];
      const valor = this.charToValue(ch);      // Convertimos carácter a número
      const peso = pesos[idxPeso];             // Tomamos el factor actual
      suma += valor * peso;                    // Acumulamos el producto
      idxPeso = (idxPeso + 1) % pesos.length;
    }

    // Aplicamos módulo 97 y sumamos 1, según la especificación
    const dv = (suma % 97) + 1;

    // Regresamos en 2 dígitos (01, 02, ..., 97)
    return dv.toString().padStart(2, '0');
  }

  /**
   * Genera la referencia SPEI de 11 posiciones para línea de captura.
   * 
   * Estructura:
   *   Pos  1–4 : referencia base (alfa-numérica, ej. '0101', '04A0')
   *   Pos  5–8 : fecha condensada (año base 2014)
   *   Pos  9   : monto condensado
   *   Pos 10–11: dígito verificador Base 97
   * 
   * @param params Parámetros para generar la referencia
   * @param params.referencia4 Primeras 4 posiciones (alfa-numéricas)
   * @param params.fechaLimite Fecha límite de pago
   * @param params.importe Importe total con centavos
   * @returns Referencia completa de 11 caracteres
   */
  generarReferencia11(params: {
    referencia4: string;
    fechaLimite: Date | string;
    importe: number | string;
  }): string {
    const { referencia4, fechaLimite, importe } = params;

    // Validamos que la referencia base tenga exactamente 4 caracteres
    if (!referencia4 || referencia4.toString().length !== 4) {
      throw new AplicacionesQNAError(
        'referencia4 debe tener exactamente 4 caracteres',
        AplicacionesQNAErrorCode.INVALID_PARAMETERS,
        400
      );
    }

    // Validar que sea alfanumérica
    if (!/^[A-Z0-9]{4}$/i.test(referencia4)) {
      throw new AplicacionesQNAError(
        'referencia4 debe contener solo caracteres alfanuméricos (A-Z, 0-9)',
        AplicacionesQNAErrorCode.INVALID_PARAMETERS,
        400
      );
    }

    // Normalizamos a string y a mayúsculas (para soportar letras como 'A')
    const ref4 = referencia4.toString().toUpperCase();

    // Calculamos la fecha condensada de 4 dígitos
    const fechaCond = this.calcularFechaCondensada(fechaLimite, this.ANIO_BASE);

    // Calculamos el monto condensado (un solo dígito)
    const montoCond = this.calcularMontoCondensado(importe).toString();

    // Construimos las primeras 9 posiciones: referencia4 + fechaCondensada + montoCondensado
    const cuerpo9 = (ref4 + fechaCond + montoCond).toUpperCase();

    // Calculamos el DV Base 97 sobre las 9 posiciones
    const dv97 = this.calcularDVBase97(cuerpo9);

    // Concatenamos todo: 4 + 4 + 1 + 2 = 11 caracteres
    const referencia11 = cuerpo9 + dv97;

    return referencia11;
  }
}

