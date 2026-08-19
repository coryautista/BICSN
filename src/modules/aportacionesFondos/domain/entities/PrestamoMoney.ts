export const PRESTAMOS_PRECISION_POLICY = 'MXN-DETAIL6-AGG2-TRUNC-v1' as const;
export const PRESTAMOS_SOURCE_SCALE = 2 as const;

const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

export function d2ToD6(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const normalized = value.trim();
  const match = DECIMAL_PATTERN.exec(normalized);
  if (!match || (match[3]?.length ?? 0) > 2) {
    throw new Error(`D2_INVALIDO:${value}`);
  }

  const integer = match[2].replace(/^0+(?=\d)/, '');
  const fraction = (match[3] ?? '').padEnd(2, '0');
  const isZero = /^0+$/.test(integer) && /^0*$/.test(fraction);
  const sign = match[1] === '-' && !isZero ? '-' : '';
  return `${sign}${integer}.${fraction}0000`;
}

export function d6ToLegacyNumber(value: string | null): number | null {
  return value === null ? null : Number(value);
}

export function sumD6ToA2(values: ReadonlyArray<string | null | undefined>): string {
  let micros = 0n;
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const match = /^(-?)(\d+)\.(\d{6})$/.exec(value);
    if (!match) throw new Error(`D6_INVALIDO:${value}`);
    const units = BigInt(match[2]) * 1_000_000n + BigInt(match[3]);
    micros += match[1] === '-' ? -units : units;
  }

  const cents = micros / 10_000n;
  const absolute = cents < 0n ? -cents : cents;
  const sign = cents < 0n ? '-' : '';
  return `${sign}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}
