/**
 * Función helper para normalizar claves orgánicas a formato de 2 dígitos
 * @param value - Valor a normalizar (string, number, null o undefined)
 * @returns String normalizado con 2 dígitos o null
 */
export function normalizeClaveOrganica(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim().toUpperCase();
  if (!trimmed) return null;
  return trimmed.padStart(2, '0');
}

