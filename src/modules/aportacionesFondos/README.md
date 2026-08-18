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

### 4. Días de nómina TXT (opt-in)

Con `usarDiasLaboradosNomina=1`, el cálculo consulta únicamente las cargas TXT aplicadas y vigentes para el periodo y las orgánicas solicitadas:

- Sin TXT vigente se conserva el cálculo existente de 15 días con origen `default`.
- Con TXT, se usa `DiasLaborados` y se conserva cero; un valor nulo se interpreta como cero.
- Si existe TXT pero un RFC de Firebird no tiene coincidencia, se usan cero días con origen `nomina_sin_coincidencia`.
- Los detalles se seleccionan por `CargaId`; movimientos y cargas reemplazadas no participan.
- Días fuera de `0..15` o un RFC ambiguo entre cargas vigentes detienen el cálculo.

La validación de coincidencia entre plantilla y archivo permanece en el frontend. Este módulo no vuelve a comparar el TXT contra la plantilla ni agrega un bloqueo de carga equivalente.

Firebird se consulta únicamente para la QNA vigente o la última QNA indicada por `afec.BitacoraAfectacionOrg`. Las QNA anteriores se leen desde las tablas históricas de SQL Server y no se enriquecen ni reconstruyen con PERSONAL u ORG_PERSONAL actuales.

La frontera puede verificarse en modo de solo lectura con `npm run verify:aportaciones:phase3:e2e`. El comando no carga archivos ni modifica históricos.

### 5. Snapshot de cálculo V2 (sombra)

`aportaciones.SnapshotCalculoV2` y `aportaciones.SnapshotCalculoV2Detalle` almacenan una captura aditiva e inmutable del cálculo. La persistencia:

- identifica fórmula, carga TXT, política de precisión y fuentes;
- conserva importes individuales D6 y agregados A2;
- calcula un SHA-256 canónico del contenido;
- asigna revisiones por ámbito y evita duplicados por hash;
- inserta encabezado y detalle en una sola transacción;
- rechaza actualizaciones y eliminaciones mediante triggers.

Esta infraestructura no modifica ni sustituye Línea de Pago, REVISA o los históricos existentes. Tampoco está conectada todavía a una lectura oficial. La sombra `1426` de Calidad se verifica con `npm run shadow:aportaciones:snapshot-v2:1426`.

La doble escritura automática se controla con `SNAPSHOT_CALCULO_V2_SHADOW_ENABLED=true` y permanece desactivada por defecto. Cuando está habilitada:

- exige ahorro, vivienda, prestaciones y CAIR con el mismo conjunto de internos;
- exige una única carga `TXT/APLICADA/EsVigente=1` para el periodo y ámbito;
- obtiene RFC y FAI mediante `AP_S_FONDOS` para el periodo solicitado;
- resuelve días desde el TXT y conserva la política de cero para RFC sin coincidencia;
- guarda únicamente snapshots `COMPLETO` dentro de la misma transacción que los históricos;
- omite la sombra sin interrumpir el guardado existente cuando falta TXT, fórmula o algún fondo.

La bandera habilita escritura sombra, no lectura oficial. El comportamiento puro se verifica con `npm run test:aportaciones:phase4`.

### 6. Consulta y conciliación V2

Con `SNAPSHOT_CALCULO_V2_READ_ENABLED=true`, un administrador puede consultar:

```text
GET /v1/aportacionesFondos/snapshots/v2/comparacion
```

La consulta requiere entidad, año, quincena y las cuatro orgánicas. Acepta `fuente`, `revision` e `incluirDetalles=1`. Devuelve importes como cadenas decimales, compara cada fondo contra REVISA e históricos SQL y agrega Línea de Pago solo como contexto. Los detalles no incluyen RFC ni nombre; únicamente exponen una clave SHA-256 por empleado. Esta ruta no sustituye ninguna lectura oficial.

### 7. Bandeja de conciliación

La Fase 6 agrega dos operaciones administrativas bajo la misma bandera de lectura:

```text
GET  /v1/aportacionesFondos/snapshots/v2
POST /v1/aportacionesFondos/snapshots/v2/:snapshotId/decision
```

La bandeja es paginada y permite filtrar por año, quincena, entidad, orgánicas, fuente y estado. La política `MXN-A2-DIFF-0.20-v1` clasifica cada comparación como coincidencia, diferencia esperada de precisión, diferencia a revisar o ausencia de baseline. El veredicto general puede ser `APROBADO`, `OBSERVADO` o `INCOMPLETO`.

Las decisiones humanas `APROBADO` y `OBSERVADO` son registros append-only asociados al snapshot, usuario, comentario y versión de política. No actualizan el snapshot ni el veredicto automático y no pueden modificarse ni eliminarse.

### 8. Lectura oficial agregada controlada

La Fase 7 agrega una lectura administrativa aislada, sin sustituir los históricos detallados ni conectar Línea de Pago:

```text
GET /v1/aportacionesFondos/snapshots/v2/oficial
```

La ruta se controla exclusivamente con `SNAPSHOT_CALCULO_V2_OFFICIAL_READ_ENABLED=true`, desactivada por defecto. Exige indicar el ámbito completo, `fuente` y `revision`; nunca selecciona implícitamente la revisión más reciente.

El Snapshot V2 solicitado se promueve únicamente cuando está `COMPLETO`, cerrado y su última decisión humana es `APROBADO` bajo la política de aceptación vigente. Si no existe, está incompleto, abierto, sin decisión, fue decidido con otra política o la última decisión es `OBSERVADO`, la respuesta usa los totales históricos de SQL Server e informa la causa en `fallback.motivo`. Si tampoco existen registros históricos, responde `404 LECTURA_OFICIAL_NO_DISPONIBLE` en lugar de fabricar totales cero.

La respuesta conserva importes como cadenas decimales. El fallback histórico devuelve `FAI: null` porque esa fuente no tiene un baseline equivalente. La ruta permanece restringida a administradores durante la promoción controlada.

### 9. Expediente administrativo e historial

La Fase 8 expone el historial completo de decisiones para la interfaz de conciliación:

```text
GET /v1/aportacionesFondos/snapshots/v2/:snapshotId/decisiones
```

La respuesta conserva todas las decisiones en orden descendente por fecha e identificador, e indica la última decisión sin modificar registros anteriores. El registro de una decisión se limita a snapshots `COMPLETO` y cerrados; una observación exige comentario. La persistencia continúa protegida por el trigger append-only existente y no requiere migraciones adicionales.

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
- `usarDiasLaboradosNomina`: (Opcional) `1` activa la resolución de días desde TXT vigente
- `periodo`: (Opcional) periodo `QQAA` usado para seleccionar la carga TXT

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
snapshotCalculoV2Repo: asClass(SnapshotCalculoV2Repository).scoped(),

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
