# Plantilla objetivo de modulo para migracion

## Objetivo

Definir una plantilla unica para migrar modulos de BICSN por partes, sin cambiar endpoints, sin optimizar comportamiento y sin mezclar reglas del negocio con refactor estructural.

## Restricciones obligatorias

- no cambiar endpoints existentes
- no cambiar prefijos ni versionado
- no cambiar shape de respuesta
- no cambiar codigos HTTP sin aprobacion explicita
- no reinterpretar reglas del negocio
- no mezclar optimizacion con migracion

## Resultado esperado

Al terminar una migracion, el modulo debe:

- conservar el mismo contrato publico
- reducir dependencia de `*.service.ts` y `*.repo.ts` legacy
- usar una estructura consistente con CQRS y Awilix
- dejar las reglas sensibles documentadas aparte

## Estructura objetivo del modulo

```text
src/modules/<modulo>/
  application/
    commands/
    queries/
  domain/
    entities/
    repositories/
    errors.ts
  infrastructure/
    persistence/
    errorHandler.ts
  <modulo>.routes.ts
  <modulo>.schemas.ts
```

## Responsabilidad por capa

### `routes.ts`

Debe encargarse de:

- exponer los endpoints existentes
- conservar auth y roles existentes
- resolver `commands` y `queries` desde DI
- validar entradas con schemas
- mantener el contrato HTTP actual

No debe encargarse de:

- logica de negocio compleja
- acceso directo a base de datos
- reglas ocultas sin documentar

### `schemas.ts`

Debe encargarse de:

- validar entradas del endpoint
- conservar la forma actual del contrato
- hacer explicitos defaults si ya forman parte del comportamiento publico

### `application/commands`

Usar para:

- operaciones de escritura
- flujos que cambian estado
- procesos que coordinan varios pasos internos

### `application/queries`

Usar para:

- lecturas
- consultas filtradas
- dashboards, estados, reportes y búsquedas

### `domain/repositories`

Usar para:

- interfaces del acceso a datos
- contratos internos que la infraestructura implementa

### `domain/errors.ts`

Usar para:

- errores de validacion de dominio
- reglas violadas
- errores de negocio del modulo

### `infrastructure/persistence`

Usar para:

- implementaciones concretas de repositorios
- acceso a MSSQL, Firebird o ambos
- mapeos de resultados e interoperabilidad tecnica

### `infrastructure/errorHandler.ts`

Usar para:

- traducir errores del modulo a respuestas compatibles con el contrato actual

## Patrón de migracion recomendado

### Paso 1: congelar contrato

- listar endpoints del modulo
- listar schemas expuestos
- listar codigos HTTP visibles
- listar rutas protegidas y roles requeridos

### Paso 2: extraer reglas

- revisar `docs/reglas/` si ya existe documentacion
- si no existe, documentar reglas sensibles antes de cambiar estructura

### Paso 3: mapear legado

- identificar `*.service.ts`
- identificar `*.repo.ts`
- identificar llamadas directas a DB desde rutas
- identificar dependencias reales en `container.ts`

### Paso 4: mover sin romper

- mover lecturas a `queries`
- mover escrituras a `commands`
- mover acceso a datos a repositorios de infraestructura
- mantener las rutas existentes como fachada estable

### Paso 5: registrar en DI

- registrar repositorio
- registrar commands
- registrar queries
- mantener temporalmente dependencias legacy si la transicion lo requiere

### Paso 6: limpiar controladamente

- retirar `service` o `repo` legacy solo cuando ya no se usen
- actualizar imports
- dejar documentado el nuevo estado del modulo

## Convenciones de naming

### Queries

- `GetAll<Entidad>Query`
- `Get<Entidad>ByIdQuery`
- `Get<Entidad>By<Campo>Query`
- `Search<Entidad>Query`

### Commands

- `Create<Entidad>Command`
- `Update<Entidad>Command`
- `Delete<Entidad>Command`
- `<Accion><Entidad>Command` para operaciones de negocio especiales

### Repositorios

- interfaz: `I<Entidad>Repository.ts`
- implementacion: `<Entidad>Repository.ts`

## Reglas para no romper contratos

1. La ruta publica se mantiene igual.
2. El schema publico se mantiene compatible.
3. Los defaults visibles para cliente se mantienen.
4. Los errores visibles para cliente se mantienen.
5. Si el modulo usa Firebird, no alterar serializacion sin validacion.
6. Si el modulo usa bitacoras operativas, no tratarlas como simple logging.

## Checklist minimo por modulo

- [ ] endpoints inventariados
- [ ] reglas documentadas
- [ ] dependencias legacy identificadas
- [ ] estructura objetivo definida
- [ ] commands y queries identificados
- [ ] repositorio de dominio definido
- [ ] repositorio de infraestructura definido
- [ ] DI actualizado
- [ ] rutas compatibles
- [ ] Swagger compatible

## Semaforo de decision

### Migrable de inmediato

- el modulo tiene pocas rutas
- las reglas ya estan documentadas
- la dependencia de DB es simple
- no depende de procesos batch delicados

### Migrable con preparacion previa

- mezcla CQRS y legacy
- depende de bitacoras o estados operativos
- usa Firebird o MSSQL con reglas sensibles

### No migrar aun

- no hay reglas claras
- hay dependencias cruzadas no mapeadas
- el contrato visible aun no esta congelado

## Plantilla de evaluacion previa

```text
Modulo:
Estado actual: CQRS | Hibrido | Legacy
Endpoints congelados:
Reglas documentadas:
Dependencias de DB:
Archivos legacy detectados:
Commands a crear o consolidar:
Queries a crear o consolidar:
Repositorio objetivo:
Riesgo: Bajo | Medio | Alto
```

## Plantilla de cierre

```text
Modulo migrado:
Contrato publico verificado: Si | No
Service legacy retirado: Si | No
Repo legacy retirado: Si | No
DI actualizado: Si | No
Swagger verificado: Si | No
Reglas actualizadas: Si | No
Observaciones:
```

## Uso recomendado inmediato

Aplicar esta plantilla primero a:

1. `organica1`
2. `organica2`
3. `organica3`

Luego usar la misma base para:

1. `organica0`
2. `organicaCascade`
3. `personal`
4. `orgPersonal`

## Referencias

- `plans/migracion-por-fases-sin-cambiar-endpoints.md`
- `plans/checklist-migracion-por-modulo.md`
- `plans/inventario-inicial-modulos-fase-0.md`
- `docs/reglas/README.md`
