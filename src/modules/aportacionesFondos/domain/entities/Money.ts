const MONEY_D6_PATTERN = /^-?(0|[1-9]\d*)\.\d{6}$/;
const MONEY_A2_PATTERN = /^-?(0|[1-9]\d*)\.\d{2}$/;

export type MoneyD6 = string & { readonly __scale: 'D6' };
export type MoneyA2 = string & { readonly __scale: 'A2' };

export function asMoneyD6(value: string): MoneyD6 {
  if (!MONEY_D6_PATTERN.test(value) || value === '-0.000000') {
    throw new Error(`MONEY_D6_INVALIDO:${value}`);
  }
  return value as MoneyD6;
}

export function asMoneyA2(value: string): MoneyA2 {
  if (!MONEY_A2_PATTERN.test(value) || value === '-0.00') {
    throw new Error(`MONEY_A2_INVALIDO:${value}`);
  }
  return value as MoneyA2;
}

export function isMoneyD6(value: unknown): value is MoneyD6 {
  return typeof value === 'string' && MONEY_D6_PATTERN.test(value) && value !== '-0.000000';
}

export function isMoneyA2(value: unknown): value is MoneyA2 {
  return typeof value === 'string' && MONEY_A2_PATTERN.test(value) && value !== '-0.00';
}

export function decimalSourceToD6(value: unknown): MoneyD6 {
  const match = String(value ?? '').trim().match(/^([+-]?)(\d+)(?:\.(\d{1,6}))?$/);
  if (!match) throw new Error(`MONEY_SOURCE_INVALIDO:${String(value)}`);
  const integer = match[2].replace(/^0+(?=\d)/, '');
  const fraction = (match[3] ?? '').padEnd(6, '0');
  const zero = /^0+$/.test(integer) && /^0+$/.test(fraction);
  return asMoneyD6(`${match[1] === '-' && !zero ? '-' : ''}${integer}.${fraction}`);
}
