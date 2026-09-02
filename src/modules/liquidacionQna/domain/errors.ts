export class LiquidacionQnaError extends Error {
  constructor(message: string, readonly code: string, readonly statusCode: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LiquidacionQnaError';
  }
}

export function qnaFail(message: string, code: string, statusCode = 409, cause?: unknown): never {
  throw new LiquidacionQnaError(message, code, statusCode, cause === undefined ? undefined : { cause });
}
