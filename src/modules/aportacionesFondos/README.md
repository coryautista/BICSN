# Módulo de Aportaciones a Fondos

## Descripción General

Este módulo implementa el cálculo y consulta de aportaciones a diferentes fondos (ahorro, vivienda, prestaciones, cair) basado en los datos de personal orgánico. El módulo sigue la arquitectura Clean Architecture + DDD utilizada en el proyecto BICSN.

## Características Principales

### 1. Tipos de Fondos Soportados
- **Ahorro**: Incluye contribuciones patronales (AFAA) y del empleado (AFAA)
- **Vivienda**: Solo contribución patronal (AFE)
- **Prestaciones**: Incluye contribuciones patronales (AFPE) y del empleado (AFPA)
- **CAIR**: Solo contribución patronal (AFE)

### 2. Autorización Basada en Roles
- **Usuarios con isEntidad = 0**: Pueden consultar cualquier clave orgánica
- **Usuarios con isEntidad = 1**: Solo pueden consultar sus claves orgánicas del token

### 3. Cálculos Implementados
```typescript
// Fórmula base para sueldo base (aplicada a todos los tipos)
sueldo_base = ((sueldo + otras_prestaciones + quinquenios) / 30) * 15

// Ahorro
afae = ((sueldo / 30) * 15) * 0.0250  // Contribución patronal
afaa = ((sueldo / 30) * 15) * 0.050   // Contribución empleado

// Vivienda
afe = ((sueldo / 30) * 15) * 0.0175   // Contribución patronal

// Prestaciones
afpe = (sueldo_base) * 0.2225         // Contribución patronal
afpa = (sueldo_base) * 0.0450         // Contribución empleado

// CAIR
afe = ((sueldo / 30) * 15) * 0.020    // Contribución patronal
```

## Arquitectura

### Estructura del Módulo
```
src/modules/aportacionesFondos/
├── domain/
│   ├── entities/
│   │   └── AportacionFondo.ts       # Entidades del dominio
│   ├── repositories/
│   │   └── IAportacionFondoRepository.ts # Interface del repositorio
│   └── errors.ts                    # Errores específicos del dominio
├── application/
│   └── queries/
│       ├── GetAportacionesIndividualesQuery.ts # Consulta individual
│       └── GetAportacionesCompletasQuery.ts    # Consulta completa
├── infrastructure/
│   ├── persistence/
│   │   └── AportacionFondoRepository.ts       # Implementación del repositorio
│   └── errorHandler.ts              # Manejo de errores
├── aportacionesFondos.schemas.ts    # Esquemas de validación
├── aportacionesFondos.routes.ts     # Rutas de la API
└── README.md                        # Esta documentación
```

## API Endpoints

### 1. Consultas Individuales
**GET** `/v1/aportacionesFondos/individuales/{tipo}`

**Parámetros:**
- `tipo`: Tipo de fondo (ahorro, vivienda, prestaciones, cair)
- `clave_organica_0`: (Opcional, requerido si isEntidad = 0)
- `clave_organica_1`: (Opcional, requerido si isEntidad = 0)

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "tipo": "ahorro",
    "clave_organica_0": "01",
    "clave_organica_1": "01",
    "datos": [
      {
        "interno": 12345,
        "sueldo": 15000,
        "quinquenios": 500,
        "otras_prestaciones": 1000,
        "sueldo_base": 5500,
        "afae": 125.0,
        "afaa": 250.0,
        "total": 375.0,
        "tipo": "ahorro"
      }
    ],
    "resumen": {
      "total_empleados": 1,
      "total_contribucion": 375.0,
      "total_sueldo_base": 5500.0
    }
  }
}
```

### 2. Consultas Completas
**GET** `/v1/aportacionesFondos/completas`

**Parámetros:**
- `clave_organica_0`: (Opcional, requerido si isEntidad = 0)
- `clave_organica_1`: (Opcional, requerido si isEntidad = 0)

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "clave_organica_0": "01",
    "clave_organica_1": "01",
    "ahorro": { /* datos de ahorro */ },
    "vivienda": { /* datos de vivienda */ },
    "prestaciones": { /* datos de prestaciones */ },
    "cair": { /* datos de cair */ },
    "resumen_general": {
      "total_empleados": 10,
      "total_contribucion_general": 25000.0,
      "total_sueldo_base_general": 50000.0,
      "fondos_incluidos": ["ahorro", "vivienda", "prestaciones", "cair"]
    }
  }
}
```

## Dependencias Registradas

### DI Container (src/di/container.ts)
```typescript
// Repositories (Scoped)
aportacionFondoRepo: asClass(AportacionFondoRepository).scoped(),

// Queries (Scoped)
getAportacionesIndividualesQuery: asClass(GetAportacionesIndividualesQuery).scoped(),
getAportacionesCompletasQuery: asClass(GetAportacionesCompletasQuery).scoped()
```

### Server Registration (src/server.ts)
```typescript
await app.register(aportacionesFondosRoutes, { prefix: '/v1' });
```

## Casos de Uso

### Ejemplo de Uso
```typescript
// Para usuarios con isEntidad = 1 (entidad), se usan sus claves del token:
GET /v1/aportacionesFondos/individuales/ahorro
// Resultado: Consulta usando las claves orgánicas del token del usuario

// Para usuarios con isEntidad = 0 (no entidad), deben especificar claves:
GET /v1/aportacionesFondos/individuales/ahorro?clave_organica_0=01&clave_organica_1=02
// Resultado: Consulta usando las claves especificadas

// Consulta completa (todos los fondos):
GET /v1/aportacionesFondos/completas?clave_organica_0=01&clave_organica_1=02
```

## Manejo de Errores

El módulo incluye manejo específico de errores:
- **TIPO_FONDO_INVALIDO**: Tipo de fondo no válido (400)
- **CLAVE_ORGANICA_REQUERIDA**: Claves orgánicas requeridas (400)
- **USUARIO_NO_AUTORIZADO**: Usuario no autorizado (403)
- **DATOS_NO_ENCONTRADOS**: No se encontraron datos (404)
- **ERROR_CALCULO_APORTACION**: Error interno del cálculo (500)

## Validación de Datos

### Esquemas de Validación
- **AportacionesIndividualesSchema**: Valida parámetros para consultas individuales
- **AportacionesCompletasSchema**: Valida parámetros para consultas completas

### Validaciones Implementadas
- Tipo de fondo debe ser uno de: 'ahorro', 'vivienda', 'prestaciones', 'cair'
- Claves orgánicas deben tener máximo 2 caracteres
- Claves orgánicas requeridas para usuarios no-entidad

## Logging

El módulo incluye logging detallado:
- Registro de operaciones con tipo de consulta y usuario
- Logging de errores con contexto
- Resúmenes de cantidad de registros encontrados

## Consideraciones de Rendimiento

1. **Consultas Paralelas**: Las consultas de diferentes fondos se ejecutan en paralelo para optimizar el tiempo de respuesta
2. **Filtrado Eficiente**: Los datos se filtran directamente en la consulta inicial
3. **Cálculos en Memoria**: Los cálculos de aportaciones se realizan en memoria para mayor flexibilidad

## Seguridad

- **Autenticación JWT**: Todos los endpoints requieren autenticación
- **Autorización por Roles**: Control de acceso basado en isEntidad del usuario
- **Validación de Entrada**: Todas las entradas son validadas con Zod
- **Sanitización**: Claves orgánicas validadas contra patrones específicos

API Endpoints Available
Individual Fund Query: GET /v1/aportacionesFondos/individuales/{tipo}?clave_organica_0&clave_organica_1
Combined Funds Query: GET /v1/aportacionesFondos/completas?clave_organica_0&clave_organica_1