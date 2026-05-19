/**
 * Utilidades de normalización de encoding para datos legacy (Firebird/ODBC).
 *
 * Problemas típicos:
 * - Caracteres UTF-8 interpretados como latin1/win1252: "MuÃ±oz" -> "Muñoz"
 * - Mojibake CP850/otros: secuencias como "´┐¢" usadas por el proyecto para "Ñ"
 * - Caracter de reemplazo: "�" (U+FFFD) o "?" entre letras
 */

function cleanLegacyMojibakeString(value: string): string {
  let v = value;

  // Secuencias específicas observadas en el proyecto
  v = v.replace(/\u00B4\u2510\u00A2/g, 'Ñ'); // ´┐¢ -> Ñ (ej: MU´┐¢OZ -> MUÑOZ)
  v = v.replace(/\u00B4\u2510\u00A4/g, 'ñ'); // ´┐¤ -> ñ

  // Reemplazo genérico para caracteres problemáticos (U+FFFD o '?') entre letras
  v = v.replace(
    /([A-Za-zÁÉÍÓÚÑáéíóúñ])([\uFFFD?])([A-Za-zÁÉÍÓÚÑáéíóúñ])/g,
    (_m, before, _problem, after) => {
      const isUpper = /[A-ZÁÉÍÓÚÑ]/.test(before) && /[A-ZÁÉÍÓÚÑ]/.test(after);
      return before + (isUpper ? 'Ñ' : 'ñ') + after;
    }
  );

  return v;
}

function tryRepairUtf8MisdecodedAsLatin1(value: string): string {
  // Señales típicas de UTF-8 mal interpretado como latin1/win1252
  const suspicious = /Ã|Â|â€|â€™|â€œ|â€|â€“|â€”|â€¦/;
  if (!suspicious.test(value)) return value;

  try {
    // Interpretar la cadena actual como bytes latin1 y re-decodificar como UTF-8
    const repaired = Buffer.from(value, 'latin1').toString('utf8');

    // Heurística simple: si el reparado reduce mojibake, úsalo.
    const score = (s: string) => {
      let n = 0;
      if (s.includes('\uFFFD')) n += 3;
      // Penalizar patrones típicos de mojibake UTF-8->latin1
      n += (s.match(/Ã/g) || []).length * 2;
      n += (s.match(/Â/g) || []).length * 1;
      return n;
    };

    return score(repaired) <= score(value) ? repaired : value;
  } catch {
    return value;
  }
}

export function normalizeText(value: string): string {
  // Orden: primero reparar UTF-8 mal decodificado, luego limpiar mojibake legacy.
  const repaired = tryRepairUtf8MisdecodedAsLatin1(value);
  return cleanLegacyMojibakeString(repaired);
}

export function normalizeTextDeep<T>(input: T): T {
  if (input == null) return input;
  if (typeof input === 'string') return normalizeText(input) as unknown as T;
  if (input instanceof Date) return input;
  if (Array.isArray(input)) return input.map((x) => normalizeTextDeep(x)) as unknown as T;
  if (typeof input === 'object') {
    const out: any = Array.isArray(input) ? [] : {};
    for (const [k, v] of Object.entries(input as any)) out[k] = normalizeTextDeep(v);
    return out;
  }
  return input;
}

