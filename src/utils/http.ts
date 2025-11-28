export function ok<T>(data: T) {
  return { ok: true, data };
}

export function fail(message: string, code?: string, details?: any) {
  const error: any = { ok: false, error: { message, code } };
  if (details) {
    error.error.details = details;
  }
  return error;
}

export function validationError(errors: any[]) {
  if (!errors || errors.length === 0) {
    return fail('Error de validación en los datos proporcionados', 'VALIDATION_FAILED');
  }
  
  // Formatear mensajes de validación más descriptivos
  const validationMessages = errors.map((error: any) => {
    const field = error.path?.join('.') || error.instancePath?.replace('/', '') || error.params?.missingProperty || 'campo desconocido';
    const message = error.message || 'Valor inválido';
    return `${field}: ${message}`;
  });
  
  const message = validationMessages.length === 1 
    ? validationMessages[0]
    : `Errores de validación: ${validationMessages.join(', ')}`;
    
  return fail(message, 'VALIDATION_FAILED', { errors });
}

export function notFound(resource: string, id?: string) {
  const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
  return fail(message, 'NOT_FOUND');
}

export function conflict(resource: string, reason?: string) {
  const message = reason ? `${resource}: ${reason}` : `${resource} already exists`;
  return fail(message, 'CONFLICT');
}

export function conflictError(message: string) {
  return fail(message, 'CONFLICT');
}

export function unauthorized(message: string = 'Unauthorized access') {
  return fail(message, 'UNAUTHORIZED');
}

export function forbidden(message: string = 'Access forbidden') {
  return fail(message, 'FORBIDDEN');
}

export function badRequest(message: string, details?: any) {
  return fail(message, 'BAD_REQUEST', details);
}

export function internalError(message: string = 'Internal server error') {
  return fail(message, 'INTERNAL_ERROR');
}