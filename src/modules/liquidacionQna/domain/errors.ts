export class LiquidacionQnaError extends Error {
  constructor(message: string, readonly code: string, readonly statusCode: number) {
    super(message);
    this.name = 'LiquidacionQnaError';
  }
}

export function qnaFail(message: string, code: string, statusCode = 409): never {
  throw new LiquidacionQnaError(message, code, statusCode);
}
