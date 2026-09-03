# Plan: Usuario Firebird por Orgánica con Catálogo SQL

## Estado

APROBADO Y EN ESPERA DE EJECUCION. El plan esta guardado para seguimiento; la implementacion inicia cuando los ajustes pendientes marcados por el usuario lo permitan. No iniciar ninguna fase sin autorizacion explicita.

## Objetivo

Conectar a Firebird con un usuario por organica (`org0`/`org1`) para que la columna de auditoria que registra `CURRENT_USER` refleje la dependencia real que ejecuta cada operacion, reemplazando el uso de un unico usuario tecnico (DES) para todas las organicas.

El proposito es exclusivamente auditoria y trazabilidad. No es row-level security: Firebird no tiene RLS nativo y el filtrado por organica sigue realizandose en SQL.

## Decisiones Confirmadas

1. **Sin fallback silencioso**: si una organica no tiene fila activa en el catalogo, la operacion se rechaza con error explicito (`FIREBIRD_CREDENCIAL_ORGANICA_NO_CONFIGURADA`) indicando que el DBA debe darla de alta. No se conecta con el usuario default.
2. **Alcance total**: todas las llamadas Firebird (escritura y lectura) migran a conexion por organica en una sola entrega, no por fases de dominios.
3. **Auditoria automatica**: la columna de auditoria se llena por `CURRENT_USER` sin intervencion del backend; la verificacion solo comprueba el usuario efectivo de la conexion.
4. **Rol parametrizado**: `RolFirebird` es una columna del catalogo por fila. La primera fila se precarga con los datos actuales para `04`/`24` (usuario y rol vigentes en env, p. ej. DES + R_DESARROLLO en Desarrollo).
5. **Administracion**: el alta y rotacion de usuarios Firebird las realiza el DBA fuera del sistema; el backend solo lee el catalogo SQL y nunca crea usuarios.

## Diseño

### Catalogo SQL Server

Nueva tabla `config.FirebirdOrganicaCredential`, migracion idempotente:

```text
Org0            varchar(2)   not null
Org1            varchar(2)   not null
UsuarioFirebird varchar(64)  not null
SecretoCifrado  varbinary(max) not null   -- AES-256-GCM versionado
RolFirebird     varchar(64)  null
Activo          bit          not null default 1
FechaAlta       datetime2    not null
FechaRotacion   datetime2    null
```

- Indice unico `(Org0, Org1)`.
- La tabla vive en la base SQL de cada ambiente; respeta la matriz obligatoria de `DATABASE_ENVIRONMENTS.md` (Desarrollo `SII-ISSSSPEA-DES`, Calidad `SII-ISSSSPEA`, Produccion `SII-ISSSSPEA-PROD`).
- El backend solo realiza `SELECT`; el DBA inserta y rota.

### Cifrado

- Nuevo utilitario `src/shared/crypto/symmetric.ts`: AES-256-GCM con formato versionado (iv + tag + ciphertext).
- Clave maestra en variable de ambiente `FIREBIRD_CATALOG_MASTER_KEY`; requerida cuando el catalogo esta habilitado.
- CLI para el DBA: `npm run firebird:credential:encrypt` imprime el ciphertext listo para INSERT/UPDATE.

### Capa de conexion (`src/db/firebird.ts`)

- De singleton a registro por scope: `Map<"org0|org1", { attachment, charsetApplied }>`.
- `getAttachment(scope?)`:
  - Con scope: resuelve credenciales del catalogo (con cache TTL), rechaza con error explicito si no hay fila activa.
  - Sin scope: usuario de env actual (solo para operaciones tecnicas internas como health/test; ninguna llamada de negocio).
- Credenciales rechazadas por Firebird: invalidar cache de credenciales y reintentar una vez; si persiste, propagar error.
- `closeFirebirdPool` cierra todos los attachments del registro.
- Todas las funciones publicas aceptan `scope?: { org0, org1 }` con tipado que permita al compilador detectar llamadas de negocio sin scope:
  - `executeSafeQuery`, `executeInTransaction`, `executeInTransactionWithOutcome`, `executeTypedTransaction`, `executeQueryInTransaction`, `executeProcedureInTransaction`, `executeSelectableProcedure`, `executeExecutableProcedure`, `executeQueryWithNewConnection`, `executeSerializedQuery`, compat `FirebirdDbCompat`.

### Configuracion

Nuevas variables en `env.ts` + `validation.ts`:

```text
FIREBIRD_CATALOG_ENABLED     default true
FIREBIRD_CATALOG_TTL_MS      default 300000 (5 min)
FIREBIRD_CATALOG_MASTER_KEY  requerida si el catalogo esta habilitado
```

### Salud y observabilidad

- `src/utils/health.ts` reporta `firebirdCatalog: { enabled, scopesActivos, ttlMs }` sin exponer secretos.

### Documentacion

- Seccion nueva en `DATABASE_ENVIRONMENTS.md`: catalogo por ambiente y responsabilidad del DBA.
- ADR corto: usuarios por organica para auditoria, no RLS; administracion externa por DBA.

## Archivos Previstos

```text
database/migrations/NNNN_firebird_organica_credential.sql
src/shared/crypto/symmetric.ts
src/db/firebirdCatalog.ts
src/db/firebird.ts
src/config/env.ts
src/config/validation.ts
src/utils/health.ts
scripts/firebird-credential-encrypt.ts
scripts/verify-firebird-organica-credentials.ts
DATABASE_ENVIRONMENTS.md
docs/ai/ (ADR)
```

Consumidores a hilvanar con scope (org0/org1 ya disponible en cada uno):

```text
src/modules/afiliado/infrastructure/services/AfiliadoBdiSspeaFirebirdService.ts
src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts
src/modules/ (AplicacionesQNARepository y demas consumidores de firebird.ts)
src/modules/liquidacionQna (flujos de captura que ejecutan SP Firebird)
```

## Fases de Implementacion

| Fase | Contenido | Salida esperada |
|---|---|---|
| 1 | Crypto simetrico + migracion del catalogo + repositorio con cache TTL + CLI de cifrado | Migracion aplicada en Desarrollo; fila semilla 04/24 lista para el DBA |
| 2 | Refactor de `firebird.ts` a registro por scope con compat tipada | Compila sin consumidores rotos; default env solo para operaciones tecnicas |
| 3 | Threading de scope en todos los consumidores | Grep final sin llamadas de negocio sin scope; typecheck del compilador como red |
| 4 | Health, docs y ADR | `DATABASE_ENVIRONMENTS.md` y ADR actualizados |
| 5 | Validacion en Desarrollo | `npm run typecheck`, `npm run build`, suites afectadas y `verify-firebird-organica-credentials` aprobados con credencial real cargada por el DBA |

## Puertas de Salida

- Ninguna llamada de negocio Firebird sin scope despues de la fase 3.
- Rechazo explicito verificado para organica sin credencial activa.
- `CURRENT_USER` de Firebird refleja el usuario del catalogo en Desarrollo.
- Calidad y Produccion fuera de alcance hasta completar Desarrollo y autorizacion operativa.

## Riesgos y Controles

| Riesgo | Control |
|---|---|
| Llamada olvidada sin scope | Tipado del scope + grep final sobre exports de `firebird.ts` |
| Credencial rotada en catalogo sigue en cache | TTL maximo 5 min; rechazo 401 de Firebird fuerza re-lectura inmediata |
| Organica sin alta produce fallo en operacion | Error explicito documentado; es el comportamiento acordado |
| Mezcla con matriz de ambientes | Respetar `DATABASE_ENVIRONMENTS.md`; no alterar parejas SQL/Firebird |
| Fuga de secretos | Cifrado AES-256-GCM; health y logs nunca exponen secretos ni ciphertext |

## Bitacora

| Fecha | Estado | Cambio | Notas |
|---|---|---|---|
| 2026-08-31 | PLAN_GUARDADO | Plan aprobado por el usuario y documentado para seguimiento | Ejecucion diferida hasta cerrar ajustes pendientes marcados por el usuario |
