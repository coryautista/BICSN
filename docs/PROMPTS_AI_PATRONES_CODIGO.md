# Patrones de Código para Prompts de AI

Este documento contiene patrones, soluciones y mejores prácticas que deben aplicarse cuando se trabaja en este proyecto. **Úsalo como referencia en prompts de AI** para asegurar consistencia y evitar problemas conocidos.

## 🔴 Problema Crítico: Serialización Fastify

### Problema

Fastify tiene problemas serializando objetos que vienen de consultas a Firebird o que contienen estructuras complejas. Esto resulta en:
- Respuestas vacías `{}` en lugar de la estructura completa
- Arrays con objetos vacíos `[{}, {}, {}]`
- Pérdida de datos en respuestas de error (409, 500, etc.)

### Síntomas

- Los logs del servidor muestran que los datos se construyen correctamente
- El cliente (Postman, frontend) recibe objetos vacíos `{}`
- Ocurre especialmente con datos de Firebird y respuestas de error

### Solución OBLIGATORIA

**SIEMPRE aplicar esta solución cuando:**
- ✅ El endpoint retorna arrays de objetos complejos desde Firebird
- ✅ El endpoint retorna respuestas de error (409, 500, etc.) con datos estructurados
- ✅ Los datos vienen directamente de consultas a Firebird
- ✅ La respuesta incluye objetos anidados o estructuras complejas

### Patrón de Código

```typescript
// ❌ INCORRECTO - NO hacer esto
return reply.code(200).send({
  ok: true,
  data: resultados
});

// ✅ CORRECTO - Usar serialización manual
// 1. Limpiar los datos usando JSON para evitar problemas de serialización
const cleanData = JSON.parse(JSON.stringify(resultados));

// 2. Construir objeto de respuesta
const responseObject = {
  ok: true,
  data: cleanData,
  timestamp: new Date().toISOString()
};

// 3. Serializar manualmente ANTES de enviar
const jsonString = JSON.stringify(responseObject);

// 4. Asegurar que el content-type sea JSON explícitamente
reply.type('application/json');

// 5. Enviar el JSON serializado manualmente como string
return reply.code(200).send(jsonString);
```

### Ejemplo: Respuesta de Error (409)

```typescript
// ✅ CORRECTO - Respuesta de error con datos
const cleanRegistros = JSON.parse(JSON.stringify(registrosExistentes || {}));

const response409 = {
  ok: false,
  error: {
    code: error.code || 'RECORDS_ALREADY_EXIST',
    message: error.message || 'Ya existen registros...',
    timestamp: new Date().toISOString()
  },
  registrosExistentes: cleanRegistros
};

const jsonString = JSON.stringify(response409);
reply.type('application/json');
return reply.code(409).send(jsonString);
```

### Comentario en Código

Siempre incluir este comentario cuando se aplique la solución:

```typescript
// SOLUCIÓN AL PROBLEMA DE SERIALIZACIÓN DE FASTIFY
// Fastify a veces tiene problemas serializando objetos que tienen referencias circulares,
// getters/setters, o propiedades no enumerables. La solución es crear una copia profunda
// completamente limpia usando JSON.parse(JSON.stringify()). Esto elimina cualquier
// getter/setter, propiedades no enumerables, o referencias problemáticas.
// Este problema ha ocurrido constantemente en otros endpoints (HIP, Concentrado, Movimientos, etc.)
// y esta es la solución documentada y probada.
// Ver: docs/SOLUCION_SERIALIZACION_FASTIFY.md
```

### Referencias

- **Documentación completa**: `docs/SOLUCION_SERIALIZACION_FASTIFY.md`
- **Ejemplos en código**:
  - `src/modules/retencionesPorCobrar/retencionesPorCobrar.routes.ts` (líneas 319-340)
  - `src/modules/reportes/aplicacionesQNA/aplicacionesQNA.routes.ts` (líneas 79-122)
  - `src/modules/aplicacionQuincenal/aplicacionQuincenal.routes.ts` (líneas 267-291)

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Módulos

```
src/modules/[nombreModulo]/
├── domain/                    # Entidades, interfaces, errores
│   ├── entities/             # Entidades de dominio
│   ├── repositories/          # Interfaces de repositorios
│   └── errors.ts             # Errores de dominio
├── application/               # Commands & Queries (CQRS)
│   ├── commands/             # Comandos (write operations)
│   └── queries/              # Queries (read operations)
├── infrastructure/            # Implementaciones
│   ├── persistence/          # Implementaciones de repositorios
│   └── errorHandler.ts       # Manejador de errores
├── [nombre].routes.ts         # Rutas HTTP (Fastify)
└── [nombre].schemas.ts        # Validación (Zod)
```

### Patrones a Seguir

1. **Clean Architecture**: Separación estricta de capas
2. **DDD**: Domain-Driven Design con entidades y value objects
3. **CQRS**: Separar Commands (write) de Queries (read)
4. **Repository Pattern**: Abstraer acceso a datos
5. **Dependency Injection**: Usar Awilix para DI

### Referencias

- **Arquitectura completa**: `docs/ARQUITECTURA_PROYECTO.md`
- **Módulos complejos**: `docs/ARQUITECTURA_MODULOS_COMPLEJOS.md`

---

## 🗄️ Bases de Datos

### Firebird

- **Uso principal**: Sistema principal, mayoría de funcionalidad
- **Conexión**: `src/db/firebird.ts`
- **Funciones**: `executeSerializedQuery`, `executeInTransaction`, `executeQueryInTransaction`
- **⚠️ IMPORTANTE**: Siempre aplicar serialización manual en respuestas de Firebird

### SQL Server

- **Uso**: Sistema complementario, datos nuevos
- **Conexión**: `src/db/mssql.ts`
- **ORM**: mssql (raw queries)

---

## 🔐 Autenticación y Autorización

### Middleware

```typescript
import { requireAuth, requireRole } from '../auth/auth.middleware.js';

// Requiere autenticación
app.get('/ruta', {
  preHandler: [requireAuth],
  // ...
});

// Requiere rol específico
app.post('/ruta', {
  preHandler: [requireAuth, requireRole('admin')],
  // ...
});
```

### Obtener Usuario

```typescript
const user = (request as any).user;
const userId = user?.sub;
const userRoles = user?.roles;
```

---

## ✅ Validación con Zod

### Schema

```typescript
import { z } from 'zod';

export const MySchema = z.object({
  campo1: z.string().min(1).max(100),
  campo2: z.number().int().positive(),
  campo3: z.string().email().optional()
});

export type MyType = z.infer<typeof MySchema>;
```

### Uso en Route

```typescript
const parsed = MySchema.safeParse(request.body);
if (!parsed.success) {
  return reply.code(400).send({
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details: parsed.error.issues
    }
  });
}
```

---

## 🚨 Manejo de Errores

### Error Handler por Módulo

Cada módulo debe tener su propio error handler:

```typescript
// infrastructure/errorHandler.ts
import { FastifyReply } from 'fastify';
import { MyModuleError } from '../domain/errors.js';

export function handleMyModuleError(error: unknown, reply: FastifyReply): FastifyReply {
  if (error instanceof MyModuleError) {
    const response = {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
    
    // ⚠️ IMPORTANTE: Aplicar serialización manual si la respuesta incluye datos
    const jsonString = JSON.stringify(response);
    reply.type('application/json');
    return reply.code(error.statusCode).send(jsonString);
  }
  
  // Error genérico
  return reply.code(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor'
    }
  });
}
```

### Errores de Dominio

```typescript
// domain/errors.ts
export class MyModuleError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'MyModuleError';
    Object.setPrototypeOf(this, MyModuleError.prototype);
  }
}
```

---

## 📝 Checklist para Nuevos Endpoints

Antes de crear un nuevo endpoint, verificar:

- [ ] ¿Retorna arrays de objetos complejos desde Firebird? → **Aplicar serialización manual**
- [ ] ¿Retorna respuestas de error (409, 500, etc.) con datos? → **Aplicar serialización manual**
- [ ] ¿Usa validación con Zod? → **Crear schema y validar**
- [ ] ¿Requiere autenticación? → **Agregar `requireAuth`**
- [ ] ¿Requiere rol específico? → **Agregar `requireRole`**
- [ ] ¿Tiene manejo de errores? → **Usar error handler del módulo**
- [ ] ¿Sigue la estructura de Clean Architecture? → **Verificar capas**

---

## 🔗 Referencias Rápidas

- **Serialización Fastify**: `docs/SOLUCION_SERIALIZACION_FASTIFY.md`
- **Arquitectura**: `docs/ARQUITECTURA_PROYECTO.md`
- **Módulos complejos**: `docs/ARQUITECTURA_MODULOS_COMPLEJOS.md`
- **Versionado API**: `docs/INDEX-VERSIONADO.md`

---

## 🤖 Arquitectura de trabajo con GPT-5.4

### Objetivo

Trabajar con GPT-5.4 sin desperdiciar tokens y sin romper piezas sensibles del backend.

### Contexto por capas

#### Capa 0: bootstrap mínimo

Leer primero solo:

- `AGENTS.md`
- `package.json`
- archivo objetivo
- 1 archivo relacionado directo

#### Capa 1: contexto de módulo

Leer solo si el cambio lo requiere:

- `*.routes.ts` del módulo
- `*.schemas.ts` del módulo
- `application/commands` o `application/queries` afectadas
- repositorio de infraestructura afectado

#### Capa 2: contexto transversal

Leer solo si el cambio cruza límites del módulo:

- `src/app/routeRegistrar.ts`
- `src/di/container.ts`
- `src/server.ts`
- `src/config/env.ts`

#### Capa 3: contexto frío

Evitar salvo auditoría o planeación grande:

- `container.ts` completo
- `routeRegistrar.ts` completo
- módulos no relacionados
- documentación larga no vinculada a la tarea

### Reglas para ahorrar tokens

1. Nunca cargar `src/di/container.ts` completo al inicio.
2. Buscar por nombre de módulo, endpoint, clase o command antes de leer.
3. Leer ventanas parciales en archivos grandes.
4. Usar Swagger (`/docs` y `/docs/json`) como contrato vivo antes de recorrer varias rutas.
5. No pegar logs grandes en el prompt; resumir primero.

### Guardrails para no romper el proyecto

1. Si agregas un endpoint, valida si también requiere registro en DI.
2. No asumir que todas las consultas van a SQL Server; varias rutas dependen de Firebird.
3. `src/server.ts` es el entrypoint real; `server.original.ts` y `server.refactored.ts` son contexto auxiliar.
4. Evitar refactors globales en `container.ts` sin justificación clara.
5. Si cambia contrato HTTP, validar Swagger.
6. Si cambia auth, cookies o puertos, revisar `src/config/env.ts`.

### Skills locales recomendadas

- `bicsn-backend`
- `nodejs-backend-patterns`
- `bicsn-token-guard`

### Prompt interno recomendado

```text
Objetivo
Modulo afectado
Contrato que no debe romperse
Archivos que si se pueden tocar
Archivos que no se deben tocar sin confirmacion
Verificacion esperada
```

---

## 🔌 MCP recomendado

Se agregó la plantilla `.cursor/mcp.json.example` para evitar configuración dispersa.

### MCP sugeridos

- `filesystem`
- `git`
- `github`
- `openapi`
- `sqlserver_readonly`
- `firebird_readonly`

### Orden recomendado de uso

1. `filesystem`
2. `openapi`
3. `git`
4. `github`
5. `sqlserver_readonly`
6. `firebird_readonly`

### Política de seguridad

1. Los MCP de base de datos deben arrancar en modo solo lectura.
2. Los secretos deben venir de variables de entorno.
3. El acceso del MCP de archivos debe quedar acotado al workspace del backend.

### Nota operativa

La plantilla usa placeholders en los comandos (`YOUR_*`) para que puedas conectarla al runtime MCP real que uses en tu editor o cliente.

---

## 📅 Historial de Actualizaciones

- **4 de Enero, 2026**: Agregado patrón de serialización manual para respuestas de error (retencionesPorCobrar)
- **22 de Diciembre, 2025**: Documentación inicial de serialización Fastify

---

**⚠️ RECORDATORIO CRÍTICO**: Siempre aplicar serialización manual cuando se retornen datos de Firebird o respuestas de error con estructuras complejas. Este es un problema recurrente que debe prevenirse desde el inicio.

