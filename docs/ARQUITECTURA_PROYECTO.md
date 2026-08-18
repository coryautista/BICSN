# 🏗️ Arquitectura del Proyecto BICSN

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura Principal](#arquitectura-principal)
3. [Estructura de Módulos](#estructura-de-módulos)
4. [Patrones de Diseño](#patrones-de-diseño)
5. [Flujo de Datos](#flujo-de-datos)
6. [Inyección de Dependencias](#inyección-de-dependencias)
7. [Registro de Rutas](#registro-de-rutas)
8. [Manejo de Bases de Datos](#manejo-de-bases-de-datos)
9. [Módulos Modulares](#módulos-modulares)

---

## 🎯 Visión General

**BICSN** es una API REST construida con **Node.js 20**, **TypeScript** y **Fastify**, que implementa **Clean Architecture** combinada con **Domain-Driven Design (DDD)** y **CQRS (Command Query Responsibility Segregation)**.

### Stack Tecnológico

- **Runtime**: Node.js 20+
- **Framework**: Fastify (web framework de alto rendimiento)
- **Lenguaje**: TypeScript
- **Bases de Datos**: 
  - SQL Server (complementario - datos nuevos)
  - Firebird (principal - mayoría de funcionalidad)
- **Autenticación**: JWT con Argon2
- **Logging**: Pino
- **DI Container**: Awilix
- **Validación**: Zod
- **Documentación**: Swagger/OpenAPI

### Principios Arquitectónicos

1. **Clean Architecture**: Separación en capas (Domain, Application, Infrastructure)
2. **DDD**: Modelado basado en el dominio de negocio
3. **CQRS**: Separación de comandos (escritura) y queries (lectura)
4. **Dependency Injection**: Inversión de dependencias con Awilix
5. **Repository Pattern**: Abstracción del acceso a datos
6. **API Versioning**: Versionado basado en headers

---

## 🏛️ Arquitectura Principal

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │   Schemas    │  │  Middleware  │     │
│  │  (Fastify)   │  │   (Zod)      │  │  (Auth, etc) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   Commands   │              │    Queries   │            │
│  │  (Write Ops) │              │  (Read Ops)  │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Entities    │  │  Interfaces  │  │    Errors    │     │
│  │  (Business)  │  │ (Repositories)│  │  (Domain)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                INFRASTRUCTURE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Repositories │  │   Database   │  │   External   │     │
│  │ (Implement.) │  │  Connections │  │   Services   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Responsabilidades por Capa

#### 1. Presentation Layer (Routes, Schemas, Middleware)
- **Responsabilidad**: Manejo de HTTP, validación de entrada, autenticación/autorización
- **Tecnologías**: Fastify, Zod, JWT
- **No debe contener**: Lógica de negocio, acceso directo a base de datos

#### 2. Application Layer (Commands & Queries)
- **Responsabilidad**: Orquestación de casos de uso, coordinación entre capas
- **Patrón**: CQRS
  - **Commands**: Operaciones que modifican estado (Create, Update, Delete)
  - **Queries**: Operaciones de solo lectura (Get, GetAll, Search)
- **No debe contener**: Lógica de negocio compleja, detalles de implementación

#### 3. Domain Layer (Entities, Interfaces, Errors)
- **Responsabilidad**: Lógica de negocio pura, reglas del dominio, contratos
- **Contiene**:
  - **Entities**: Objetos de dominio con lógica de negocio
  - **Repository Interfaces**: Contratos para acceso a datos
  - **Domain Errors**: Errores específicos del dominio
- **No debe depender de**: Infrastructure, Application, Presentation

#### 4. Infrastructure Layer (Repositories, Database, External Services)
- **Responsabilidad**: Implementaciones técnicas, acceso a datos, servicios externos
- **Contiene**:
  - **Repository Implementations**: Implementación concreta de acceso a datos
  - **Database Connections**: Conexiones a SQL Server, Firebird
  - **External Services**: Integraciones con APIs externas
- **Depende de**: Domain (interfaces)

---

## 📦 Estructura de Módulos

### Estructura Estándar (Módulos Pequeños/Medianos)

La mayoría de los módulos siguen esta estructura:

```
src/modules/[nombreModulo]/
├── domain/                          # Capa de Dominio
│   ├── entities/
│   │   └── [Entidad].ts            # Entidades del dominio
│   ├── repositories/
│   │   └── I[Nombre]Repository.ts   # Interfaces de repositorios
│   └── errors.ts                    # Errores específicos del dominio
│
├── application/                     # Capa de Aplicación
│   ├── commands/                    # Comandos (modifican estado)
│   │   ├── Create[Nombre]Command.ts
│   │   ├── Update[Nombre]Command.ts
│   │   └── Delete[Nombre]Command.ts
│   └── queries/                     # Queries (solo lectura)
│       ├── Get[Nombre]ByIdQuery.ts
│       ├── GetAll[Nombre]sQuery.ts
│       └── Search[Nombre]sQuery.ts
│
├── infrastructure/                   # Capa de Infraestructura
│   ├── persistence/
│   │   └── [Nombre]Repository.ts    # Implementación del repositorio
│   └── errorHandler.ts              # Manejo de errores HTTP
│
├── [nombreModulo].routes.ts         # Rutas HTTP (Fastify)
├── [nombreModulo].schemas.ts         # Esquemas de validación (Zod)
├── [nombreModulo].service.ts         # ⚠️ DEPRECATED: Servicios legacy (solo en módulos no migrados)
└── [nombreModulo].repo.ts            # ⚠️ DEPRECATED: Repositorios legacy (solo en módulos no migrados)
```

### Estructura Modular (Módulos Grandes)

Para módulos grandes (>2000 líneas) como `reportes/` y `tablero/`, se usa una estructura modular con submódulos. Ver [ARQUITECTURA_MODULOS_COMPLEJOS.md](./ARQUITECTURA_MODULOS_COMPLEJOS.md) para detalles completos.

---

## 🎨 Patrones de Diseño

### 1. Clean Architecture

**Principio**: Las dependencias apuntan hacia adentro (hacia el dominio).

```
Infrastructure → Application → Domain
     ↓              ↓
  Routes      Commands/Queries
```

**Reglas**:
- Domain no depende de nada
- Application depende solo de Domain
- Infrastructure depende de Domain y Application
- Routes dependen de Application

### 2. CQRS (Command Query Responsibility Segregation)

**Separación de responsabilidades**:

```typescript
// COMMAND: Modifica estado
export class CreateAfiliadoCommand {
  async execute(data: CreateAfiliadoData): Promise<Afiliado> {
    // Validación de negocio
    // Creación de entidad
    // Persistencia
    return afiliado;
  }
}

// QUERY: Solo lectura
export class GetAllAfiliadosQuery {
  async execute(filters?: Filters): Promise<Afiliado[]> {
    // Consulta a repositorio
    // Sin modificación de estado
    return afiliados;
  }
}
```

### 3. Repository Pattern

**Abstracción del acceso a datos**:

```typescript
// Domain: Interface (contrato)
export interface IAfiliadoRepository {
  findById(id: number): Promise<Afiliado | null>;
  findAll(filters?: Filters): Promise<Afiliado[]>;
  create(data: CreateAfiliadoData): Promise<Afiliado>;
  update(id: number, data: UpdateAfiliadoData): Promise<Afiliado>;
  delete(id: number): Promise<void>;
}

// Infrastructure: Implementación
export class AfiliadoRepository implements IAfiliadoRepository {
  async findById(id: number): Promise<Afiliado | null> {
    // Implementación con SQL Server o Firebird
  }
}
```

### 4. Dependency Injection (Awilix)

**Inversión de dependencias**:

```typescript
// En src/di/container.ts
container.register({
  // Repositories
  afiliadoRepo: asClass(AfiliadoRepository).scoped(),
  
  // Commands
  createAfiliadoCommand: asClass(CreateAfiliadoCommand).scoped(),
  
  // Queries
  getAllAfiliadosQuery: asClass(GetAllAfiliadosQuery).scoped(),
});

// En routes
const command = request.diScope.resolve<CreateAfiliadoCommand>('createAfiliadoCommand');
const result = await command.execute(data);
```

---

## 🔄 Flujo de Datos

### Flujo Completo: Crear un Afiliado

```
1. HTTP Request
   POST /v1/afiliado
   Body: { nombre: "...", interno: 123 }

2. Routes Layer (afiliado.routes.ts)
   ├── Validación con Schema (Zod)
   ├── Autenticación (JWT)
   └── Extracción de datos

3. Application Layer (CreateAfiliadoCommand)
   ├── Validación de negocio
   ├── Creación de entidad
   └── Llamada a Repository

4. Domain Layer (Afiliado Entity)
   ├── Reglas de negocio
   └── Validaciones de dominio

5. Infrastructure Layer (AfiliadoRepository)
   ├── Construcción de query SQL
   ├── Ejecución en SQL Server o Firebird
   └── Mapeo a entidad

6. Response
   └── HTTP 201 Created
       Body: { ok: true, data: { id: 1, ... } }
```

### Diagrama de Flujo

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP POST /v1/afiliado
       ▼
┌─────────────────────────────────┐
│  Routes (afiliado.routes.ts)    │
│  - Schema Validation (Zod)      │
│  - Auth Middleware              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Command (CreateAfiliadoCommand)│
│  - Business Validation         │
│  - Entity Creation             │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Entity (Afiliado)              │
│  - Domain Rules                 │
│  - Business Logic              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Repository (AfiliadoRepository)│
│  - SQL Query Construction      │
│  - Database Execution          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Database (SQL Server/Firebird) │
│  - Data Persistence            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Response                       │
│  - HTTP 201 Created            │
│  - JSON Body                   │
└─────────────────────────────────┘
```

---

## 💉 Inyección de Dependencias

### Contenedor DI (Awilix)

**Ubicación**: `src/di/container.ts`

**Lifetimes**:
- **Singleton**: Una instancia compartida (pools de base de datos)
- **Scoped**: Nueva instancia por request HTTP (repositorios, commands, queries)
- **Transient**: Nueva instancia cada vez (no usado actualmente)

### Registro de Dependencias

```typescript
container.register({
  // Infrastructure (Singleton)
  mssqlPool: asFunction(getMssqlPool).singleton(),
  firebirdDb: asFunction(getFirebirdDb).singleton(),
  
  // Repositories (Scoped)
  afiliadoRepo: asClass(AfiliadoRepository).scoped(),
  
  // Commands (Scoped)
  createAfiliadoCommand: asClass(CreateAfiliadoCommand).scoped(),
  
  // Queries (Scoped)
  getAllAfiliadosQuery: asClass(GetAllAfiliadosQuery).scoped(),
});
```

### Uso en Routes

```typescript
app.post('/afiliado', async (request, reply) => {
  // Resolver del contenedor DI
  const command = request.diScope.resolve<CreateAfiliadoCommand>('createAfiliadoCommand');
  
  // Ejecutar comando
  const result = await command.execute(request.body);
  
  return reply.code(201).send(ok(result));
});
```

### Inyección en Commands/Queries

```typescript
export class CreateAfiliadoCommand {
  constructor(
    private afiliadoRepo: IAfiliadoRepository  // Inyectado por nombre
  ) {}
  
  async execute(data: CreateAfiliadoData): Promise<Afiliado> {
    // Usar repositorio inyectado
    return await this.afiliadoRepo.create(data);
  }
}
```

---

## 🛣️ Registro de Rutas

### Route Registrar

**Ubicación**: `src/app/routeRegistrar.ts`

**Responsabilidad**: Centralizar el registro de todas las rutas del proyecto.

### Grupos de Rutas

```typescript
const ROUTE_GROUPS = {
  AUTH: 'auth',           // Autenticación y autorización
  CORE: 'core',           // Sistema core (info, logs, audit)
  MODULES: 'modules',     // Módulos de negocio
  TABLERO: 'tablero',     // Módulo tablero (modular)
  ORGANICACASCADE: 'organicaCascade',
  AFILIADOS: 'afiliados',
  REPORTES: 'reportes'   // Módulo reportes (modular)
} as const;
```

### Configuración de Rutas

```typescript
const ROUTE_CONFIGS: RouteConfig[] = [
  {
    plugin: authRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AUTH }
  },
  {
    plugin: afiliadoRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AFILIADOS }
  },
  {
    plugin: reportesRoutes,
    prefix: '/v1/reportes',
    options: { group: ROUTE_GROUPS.REPORTES }
  },
  // ... más rutas
];
```

### Registro en Server

```typescript
// En src/server.ts
const routeRegistrar = createRouteRegistrar(app);
await routeRegistrar.registerAllRoutes();
```

---

## 🗄️ Manejo de Bases de Datos

El proyecto BICSN utiliza **dos bases de datos** como parte de un sistema **híbrido** que integra un sistema legacy con nuevas funcionalidades:

### Contexto: Sistema Híbrido

- **Firebird**: Sistema principal/legacy
  - Contiene la **mayoría de la funcionalidad** del sistema
  - Se realizan **operaciones CRUD completas** (Create, Read, Update, Delete)
  - Sistema legacy activo y en uso
  - Datos históricos y operacionales principales

- **SQL Server**: Sistema complementario
  - Almacena **datos nuevos que no existen en Firebird**
  - Extiende funcionalidades del sistema principal
  - Integra nuevas características de negocio
  - Complementa la información de Firebird

### Configuración

**Ubicación**: `src/config/env.ts`

```typescript
export const env = {
  sql: {
    user: process.env.SQLSERVER_USER!,
    password: process.env.SQLSERVER_PASSWORD!,
    server: process.env.SQLSERVER_SERVER!,
    database: process.env.SQLSERVER_DB!,
    port: Number(process.env.SQLSERVER_PORT ?? 1433),
    options: {
      encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
      trustServerCertificate: process.env.SQLSERVER_TRUST_CERT === 'true'
    },
    pool: { max: 10, min: 1, idleTimeoutMillis: 30000 }
  },
  firebird: {
    host: process.env.FIREBIRD_HOST!,
    port: Number(process.env.FIREBIRD_PORT ?? 3050),
    database: process.env.FIREBIRD_DATABASE!,
    user: process.env.FIREBIRD_USER!,
    password: process.env.FIREBIRD_PASSWORD!,
    charset: process.env.FIREBIRD_CHARSET ?? 'NONE' // NONE, WIN1252, UTF8, ISO8859_1
  }
};
```

### Firebird - Sistema Principal

**Ubicación**: `src/db/firebird.ts`

**Propósito**: 
- Sistema principal donde está la **mayoría de la funcionalidad**
- Operaciones CRUD completas (Create, Read, Update, Delete)
- Sistema legacy activo y operacional

**Características**:
- **CRUD completo**: Soporta todas las operaciones (no solo lectura)
- **Serialización de consultas**: Firebird no es thread-safe, todas las consultas se serializan
- **Corrección de mojibake**: Sistema automático para corregir caracteres especiales del español (Ñ, acentos)
- **Múltiples charsets**: Soporte para NONE, WIN1252, UTF8, ISO8859_1
- **Conexión única**: Una sola conexión compartida (no pooling)
- **Transacciones**: Soporte completo para transacciones

**Conexión**:
```typescript
import { connectFirebirdDatabase, getFirebirdDb, executeSafeQuery } from '../../db/firebird.js';

// Conectar (se hace una vez al inicio)
await connectFirebirdDatabase();

// Obtener conexión
const db = getFirebirdDb();

// Ejecutar query (serializada automáticamente)
const results = await executeSafeQuery(
  'SELECT * FROM PERSONAL WHERE INTERNO = ?',
  [123]
);
```

**Operaciones de Escritura**:
```typescript
import { executeInTransaction, executeQueryInTransaction } from '../../db/firebird.js';

// Insertar en Firebird
await executeInTransaction(async (transaction) => {
  await executeQueryInTransaction(
    transaction,
    'INSERT INTO PERSONAL (INTERNO, NOMBRE) VALUES (?, ?)',
    [123, 'Juan Pérez']
  );
  // Commit automático al finalizar
});

// Actualizar en Firebird
await executeInTransaction(async (transaction) => {
  await executeQueryInTransaction(
    transaction,
    'UPDATE PERSONAL SET NOMBRE = ? WHERE INTERNO = ?',
    ['Juan Carlos Pérez', 123]
  );
});
```

**Serialización Automática**:
```typescript
// Todas las consultas se serializan automáticamente
import { executeSerializedQuery } from '../../db/firebird.js';

await executeSerializedQuery(async (db) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM PERSONAL', [], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
});
```

**Corrección de Mojibake**:
Firebird tiene problemas con caracteres especiales del español. El sistema corrige automáticamente:
- `´┐¢` → `Ñ`
- `Ã±` → `ñ`
- `Ã¡` → `á`
- Y muchos otros patrones comunes

**Registro en DI Container**:
```typescript
// src/di/container.ts
firebirdDb: asFunction(getFirebirdDb).singleton(),
```

### SQL Server - Sistema Complementario

**Ubicación**: `src/db/mssql.ts`

**Propósito**: 
- Almacenar datos nuevos que no existen en Firebird
- Extender funcionalidades del sistema principal
- Integrar nuevas características de negocio

**Características**:
- Connection pooling (singleton)
- Transacciones nativas
- Timeouts configurables
- Session context para auditoría

**Conexión**:
```typescript
import { getPool, sql } from '../../db/mssql.js';

// Obtener pool de conexiones
const pool = await getPool();

// Ejecutar query
const result = await pool.request()
  .input('id', sql.Int, 123)
  .query('SELECT * FROM Afiliados WHERE id = @id');
```

**Transacciones**:
```typescript
import { withDbContext } from '../../db/context.js';

await withDbContext(request, async (tx) => {
  // Ejecutar operaciones dentro de la transacción
  const request = new sql.Request(tx);
  await request.query('INSERT INTO ...');
  // Commit automático al finalizar
});
```

**Registro en DI Container**:
```typescript
// src/di/container.ts
mssqlPool: asFunction(getMssqlPool).singleton(),
```

### Patrón de Uso: Principal en Firebird, Complemento en SQL Server

El patrón típico es:

1. **Operaciones principales en Firebird** (sistema principal)
   - La mayoría de funcionalidades
   - CRUD completo
   - Operaciones operacionales

2. **Datos nuevos en SQL Server** (sistema complementario)
   - Solo cuando el dato no existe en Firebird
   - Nuevas funcionalidades
   - Extensiones del sistema

**Ejemplo Completo**:

```typescript
export async function createAfiliado(data: CreateAfiliadoData) {
  // 1. Verificar si existe en Firebird (sistema principal)
  const firebirdResults = await executeSafeQuery(
    'SELECT FIRST 1 INTERNO FROM PERSONAL WHERE INTERNO = ?',
    [data.interno]
  );
  
  if (firebirdResults.length > 0) {
    // Existe en Firebird, usar Firebird como sistema principal
    await executeInTransaction(async (transaction) => {
      await executeQueryInTransaction(
        transaction,
        'UPDATE PERSONAL SET NOMBRE = ? WHERE INTERNO = ?',
        [data.nombre, data.interno]
      );
    });
    return firebirdResults[0];
  }
  
  // 2. No existe en Firebird, crear en SQL Server (sistema complementario)
  const pool = await getPool();
  const result = await pool.request()
    .input('nombre', sql.NVarChar, data.nombre)
    .input('interno', sql.Int, data.interno)
    .input('datosAdicionales', sql.NVarChar, data.datosAdicionales)
    .query(`
      INSERT INTO Afiliados (nombre, interno, datosAdicionales, fechaCreacion)
      VALUES (@nombre, @interno, @datosAdicionales, GETDATE())
    `);
  
  return result.recordset[0];
}
```

### Consideraciones Importantes

#### Firebird (Sistema Principal)
- ✅ **CRUD completo**: Todas las operaciones (Create, Read, Update, Delete)
- ✅ **Mayoría de funcionalidad**: Sistema operacional principal
- ⚠️ **No es thread-safe**: Todas las consultas se serializan
- ⚠️ **Una sola conexión**: No hay pooling
- ⚠️ **Problemas de charset**: Requiere corrección de mojibake
- ✅ **Transacciones**: Soporte completo para transacciones
- ✅ **Sistema activo**: Sistema legacy en uso activo

#### SQL Server (Sistema Complementario)
- ✅ **Datos nuevos**: Almacenar información que no existe en Firebird
- ✅ **Connection pooling**: Mejor rendimiento
- ✅ **Transacciones robustas**: Soporte completo
- ✅ **Extensiones**: Nuevas funcionalidades y características
- ✅ **Integración**: Complementa el sistema principal

### Inicialización en el Servidor

**Ubicación**: `src/server.ts`

```typescript
// Database connections
await connectDatabase();        // SQL Server (sistema complementario)
await connectFirebirdDatabase(); // Firebird (sistema principal)
```

Ambas conexiones se inicializan al arrancar el servidor.

### Health Checks

El sistema incluye health checks para ambas bases de datos:

```typescript
// SQL Server
app.get('/health/db', async () => {
  const ok = await ping(); // SQL Server ping
  return { ok };
});

// Health check detallado verifica ambas conexiones
app.get('/health/detailed', async () => {
  // Verifica SQL Server y Firebird
});
```

### Mejores Prácticas

1. **Firebird (Principal) - CRUD Completo**
   - ✅ Usar para la mayoría de operaciones
   - ✅ Todas las operaciones CRUD
   - ✅ Sistema operacional principal
   - ✅ Transacciones cuando sea necesario

2. **SQL Server (Complementario) - Datos Nuevos**
   - ✅ Crear registros que no existen en Firebird
   - ✅ Nuevas funcionalidades
   - ✅ Extensiones del sistema
   - ✅ Datos complementarios

3. **Patrón de Decisión**
   - Si el dato existe en Firebird → operar en Firebird
   - Si el dato no existe en Firebird → usar SQL Server
   - Combinar datos de ambos cuando sea necesario

4. **Manejo de Errores**
   - Firebird es crítico (sistema principal)
   - SQL Server es complementario (puede no estar disponible para algunas operaciones)
   - Health checks para monitorear ambas conexiones

5. **Transacciones**
   - Firebird: Usar `executeInTransaction` para operaciones que requieren transacciones
   - SQL Server: Usar `withDbContext` para transacciones
   - **No mezclar transacciones entre bases de datos** (son sistemas independientes)

---

## 🧩 Módulos Modulares

Para módulos grandes (>2000 líneas), se usa una estructura modular. Ver [ARQUITECTURA_MODULOS_COMPLEJOS.md](./ARQUITECTURA_MODULOS_COMPLEJOS.md) para detalles completos.

**Módulos Modulares en el Proyecto**:
- `reportes/` - Router principal con submódulos ✅ **Migrado a CQRS**
- `tablero/` - Submódulos independientes ✅ **Migrado a CQRS**

---

## 🔄 Estado de Migración a CQRS

El proyecto está en proceso de migración del patrón legacy (Services + Repos) al patrón moderno CQRS (Commands/Queries).

### ✅ Módulos Completamente Migrados

Los siguientes módulos han sido completamente migrados a CQRS y ya no utilizan servicios legacy:

1. **`tablero/`** ✅
   - **Estado**: Completamente migrado
   - **Submódulos migrados**: `eje/`, `dimension/`, `unidad-medida/`, `dependencia/`, `linea-estrategica/`, `programa/`, `indicador/`, `indicador-anual/`
   - **Cambios**: 
     - Eliminados todos los archivos `.service.ts` legacy
     - Eliminados todos los archivos `.repo.ts` legacy
     - Lógica SQL movida directamente a los repositorios
     - Rutas actualizadas para usar Commands/Queries directamente

2. **`reportes/`** ✅
   - **Estado**: Completamente migrado
   - **Submódulos migrados**: `aplicacionesQNA/`, `CAIR/`, `afiliados/`, módulo principal
   - **Cambios**:
     - Eliminado `ReportesService` (era solo un wrapper)
     - Rutas actualizadas para usar Queries directamente
     - Todos los submódulos ya usaban CQRS

### ⚠️ Módulos Legacy (Pendientes de Migración)

Los siguientes módulos aún utilizan el patrón legacy y están pendientes de migración:

1. **`organica1/`** - Usa `Organica1Service`
2. **`organica2/`** - Usa `Organica2Service`
3. **`organica3/`** - Usa `Organica3Service`
4. **`afectacionOrg/`** - Usa `AfectacionOrgService`

### 📋 Plan de Migración

Para migrar un módulo legacy a CQRS, seguir estos pasos:

1. **Crear Repository Interface** (Domain)
   - Definir métodos en `domain/repositories/I[Nombre]Repository.ts`

2. **Migrar Repository Implementation** (Infrastructure)
   - Mover lógica SQL directamente al repositorio
   - Eliminar dependencia de archivos `.repo.ts` legacy

3. **Crear Commands** (Application)
   - `Create[Nombre]Command.ts`
   - `Update[Nombre]Command.ts`
   - `Delete[Nombre]Command.ts`

4. **Crear Queries** (Application)
   - `GetAll[Nombre]sQuery.ts`
   - `Get[Nombre]ByIdQuery.ts`
   - Queries específicas según necesidades

5. **Actualizar Routes**
   - Reemplazar `Service` por `Commands/Queries`
   - Usar `req.diScope.resolve<Command|Query>()`

6. **Registrar en DI Container**
   - Registrar Repository, Commands y Queries
   - Eliminar registro de Service legacy

7. **Limpieza**
   - Eliminar archivos `.service.ts` y `.repo.ts` legacy
   - Actualizar imports si es necesario

### 📊 Progreso de Migración

- **Módulos migrados**: 2 de ~30 módulos principales
- **Progreso estimado**: ~7% del proyecto
- **Próximos objetivos**: Módulos `organica*` y `afectacionOrg/`

---

## 📚 Referencias

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Dependency Injection](https://martinfowler.com/articles/injection.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

### Documentación del Proyecto

- [ARQUITECTURA_MODULOS_COMPLEJOS.md](./ARQUITECTURA_MODULOS_COMPLEJOS.md) - Estructura modular
- [INDEX-VERSIONADO.md](./INDEX-VERSIONADO.md) - Sistema de versionado
- [README.md](../README.md) - Documentación general

---

## 🔄 Historial de Cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2025-11-30 | Documentación inicial de arquitectura completa | Sistema |

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0

