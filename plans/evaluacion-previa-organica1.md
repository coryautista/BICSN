# Evaluacion previa de migracion: organica1

## Objetivo

Evaluar el modulo `organica1` antes de iniciar migracion estructural, usando la plantilla objetivo del proyecto y manteniendo congelado el contrato publico.

## Referencias

- `plans/plantilla-modulo-objetivo.md`
- `plans/checklist-migracion-por-modulo.md`
- `plans/migracion-por-fases-sin-cambiar-endpoints.md`

## Estado actual

### Clasificacion

Hibrido.

### Motivo

El modulo ya tiene:

- `application/commands/`
- `application/queries/`
- `domain/`
- `infrastructure/`

Pero aun conserva:

- `organica1.service.ts`
- `organica1.repo.ts`

## Estructura actual detectada

```text
src/modules/organica1/
  application/
  domain/
  infrastructure/
  organica1.repo.ts
  organica1.routes.ts
  organica1.schemas.ts
  organica1.service.ts
```

## Contrato publico congelado

### Endpoints detectados

1. `GET /organica1`
2. `GET /organica1/:claveOrganica0/:claveOrganica1`
3. `POST /organica1`
4. `PUT /organica1/:claveOrganica0/:claveOrganica1`
5. `DELETE /organica1/:claveOrganica0/:claveOrganica1`
6. `POST /organica1/query`

### Reglas de contrato visibles

- todas las rutas usan `requireAuth`
- `GET /organica1` exige `org0`
- la clave primaria funcional es compuesta: `claveOrganica0 + claveOrganica1`
- `POST /organica1` responde `201`
- `POST /organica1/query` expone filtros dinamicos, ordenamiento y paginacion

### Restricciones de migracion

- no cambiar ninguna ruta
- no cambiar nombres de parametros
- no cambiar codigos HTTP
- no cambiar shape de respuesta
- no cambiar tags Swagger ni caracterizacion `firebird`

## Dependencias actuales

### Rutas

Las rutas ya resuelven varias dependencias CQRS desde DI:

- `getOrganica1ByIdQuery`
- `getOrganica1ByClaveOrganica0Query`
- `createOrganica1Command`
- `updateOrganica1Command`
- `deleteOrganica1Command`

### Dependencia legacy aun visible

La ruta `POST /organica1/query` sigue resolviendo `organica1Service` directamente.

### DI detectado

En `src/di/container.ts` existen registros para:

- `organica1Repo`
- `getOrganica1ByIdQuery`
- `getOrganica1ByClaveOrganica0Query`
- `createOrganica1Command`
- `updateOrganica1Command`
- `deleteOrganica1Command`
- `organica1Service`

## Responsabilidades actuales del legacy

### `organica1.service.ts`

Actualmente concentra:

- validacion de existencia previa
- coordinacion de create, update y delete
- audit logging mediante `logAudit`
- query dinamica a traves de `queryOrganica1Dynamic`

### `organica1.repo.ts`

Actualmente concentra:

- consultas Firebird directas
- mapeo de columnas Firebird a shape del modulo
- `findById`
- `findAll`
- `create`
- `update`
- `delete`
- `dynamicQuery`

## Hallazgos clave

1. `organica1` no necesita rediseño de contrato, solo cierre de migracion.
2. El modulo ya esta cerca de la estructura objetivo.
3. El principal residuo legacy es que la logica sigue repartida entre `service` y `repo` de raiz.
4. La ruta mas delicada para migrar es `POST /organica1/query`, porque sigue dependiendo del servicio legacy.
5. El modulo usa Firebird directamente, por lo que cualquier cambio debe respetar serializacion y mapeo actual.
6. El modulo ya cuenta con `errorHandler` maduro y no conviene tocar su contrato visible en esta fase.

## Riesgos de migracion

### Riesgo bajo

- CRUD principal ya esta orientado a `commands` y `queries`
- errores de dominio y `errorHandler` ya existen
- DI ya esta parcialmente preparado

### Riesgo medio

- `organica1Service` aun hace auditoria y query dinamica
- `organica1.repo.ts` concentra todo el acceso legacy a Firebird
- hay que evitar duplicar reglas entre servicio, query y command

### Riesgo alto

- si se mueve mal el mapeo Firebird, puede cambiar el shape real de fechas o campos
- si se rompe la query dinamica, el modulo puede perder una capacidad usada desde cliente aunque el CRUD principal siga funcionando

## Alcance recomendado de la migracion

### Dentro de alcance

- mover la interfaz del repositorio a `domain/repositories`
- mover implementacion concreta a `infrastructure/persistence/Organica1Repository.ts`
- dejar commands y queries consumiendo el repositorio nuevo
- reemplazar `organica1Service` por casos de uso CQRS donde aplique
- aislar auditoria donde corresponda sin cambiar comportamiento

### Fuera de alcance

- cambiar endpoints
- restringir o rediseñar la query dinamica
- optimizar consultas Firebird
- cambiar nombres de campos expuestos
- cambiar reglas de auditoria

## Propuesta de migracion puntual para organica1

### Paso 1

Congelar contrato y tomar `organica1.routes.ts` como fachada intocable.

### Paso 2

Crear o confirmar interfaz de dominio para `organica1` en `domain/repositories`.

### Paso 3

Mover implementacion actual de `organica1.repo.ts` a `infrastructure/persistence/Organica1Repository.ts`.

### Paso 4

Actualizar `commands` y `queries` para depender solo de la interfaz del repositorio.

### Paso 5

Reducir `organica1.service.ts` hasta dejarlo sin uso o eliminarlo, empezando por la ruta `POST /organica1/query`.

### Paso 6

Retirar `organica1.repo.ts` legacy solo cuando ya no tenga consumidores.

## Ventajas de esta migracion

### 1. Menor riesgo operativo en cambios futuros

Al sacar `service` y `repo` legacy de la raiz, el modulo queda mas predecible y sera mas dificil tocar la capa equivocada.

### 2. Mantenimiento mas simple

Con repositorio en `infrastructure/persistence` y casos de uso en `application`, el modulo sera mas facil de leer, depurar y extender.

### 3. Mejor consistencia con el resto del roadmap

`organica1` quedara alineado con la plantilla objetivo y servira como patron repetible para `organica2` y `organica3`.

### 4. Menor costo de contexto para GPT-5.4

Un modulo mas limpio reduce lectura innecesaria, facilita prompts mas cortos y baja el riesgo de cambios equivocados.

### 5. Mejor trazabilidad de reglas y responsabilidades

La auditoria, el acceso a datos y la capa HTTP quedaran mejor separadas, sin cambiar el comportamiento externo.

### 6. Preparacion para modularizar DI sin trauma

Si `organica1` queda bien delimitado, luego sera mas facil particionar `container.ts` y mantener registros por modulo.

## Evaluacion previa resumida

```text
Modulo: organica1
Estado actual: Hibrido
Endpoints congelados: 6
Reglas documentadas: Parcialmente implicitas, pero de bajo riesgo comparado con afiliado/afectacionOrg
Dependencias de DB: Firebird
Archivos legacy detectados: organica1.service.ts, organica1.repo.ts
Commands a consolidar: CreateOrganica1Command, UpdateOrganica1Command, DeleteOrganica1Command
Queries a consolidar: GetOrganica1ByIdQuery, GetOrganica1ByClaveOrganica0Query, query dinamica
Repositorio objetivo: domain/repositories + infrastructure/persistence/Organica1Repository.ts
Riesgo: Medio
```

## Recomendacion de ejecucion

`organica1` si es buen candidato para iniciar la migracion real.

Razones:

- ya tiene gran parte de la estructura moderna
- no mezcla la complejidad funcional alta de `afectacionOrg` o `afiliado`
- puede servir como modulo piloto para la familia `organica*`

## Criterio para pasar a implementacion

Se puede pasar a implementacion cuando se acepte este alcance:

1. migracion solo interna
2. cero cambio de endpoints
3. cero optimizacion funcional
4. retiro progresivo de `service` y `repo` legacy

## Estado posterior a implementacion

Implementado.

### Resultado

- `organica1.service.ts` eliminado
- `organica1.repo.ts` eliminado
- `POST /organica1/query` migrado a `GetOrganica1DynamicQuery`
- repositorio moderno consolidado en `infrastructure/persistence/Organica1Repository.ts`
- sin cambios de endpoint
- compilacion validada con `npm run build`
