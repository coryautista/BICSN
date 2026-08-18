# Evaluacion previa de migracion: organica0

## Objetivo

Evaluar el modulo `organica0` antes de iniciar su migracion estructural, manteniendo congelado el contrato publico y reutilizando la plantilla objetivo del proyecto.

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

- `organica0.service.ts`
- `organica0.repo.ts`

## Estructura actual detectada

```text
src/modules/organica0/
  application/
  domain/
  infrastructure/
  organica0.repo.ts
  organica0.routes.ts
  organica0.schemas.ts
  organica0.service.ts
```

## Contrato publico congelado

### Endpoints detectados

1. `GET /organica0`
2. `GET /organica0/:claveOrganica`
3. `POST /organica0`
4. `PUT /organica0/:claveOrganica`
5. `DELETE /organica0/:claveOrganica`

### Reglas visibles del contrato

- todas las rutas usan `requireAuth`
- `GET /organica0` acepta `limit` y `offset`
- `GET /organica0` puede devolver `pagination`
- `POST /organica0` responde `201`
- la clave funcional del modulo es `claveOrganica`

### Restricciones de migracion

- no cambiar rutas
- no cambiar nombres de parametros
- no cambiar shape de `pagination`
- no cambiar codigos HTTP
- no cambiar tags Swagger ni caracterizacion `firebird`

## Dependencias actuales

### Rutas en CQRS

Las rutas ya resuelven desde DI:

- `getOrganica0ByIdQuery`
- `createOrganica0Command`
- `updateOrganica0Command`
- `deleteOrganica0Command`

### Residuo legacy activo

La ruta `GET /organica0` sigue importando dinamicamente `./organica0.service.js` para resolver:

- listado con paginacion opcional
- armado de metadata `pagination`

### DI detectado

En `src/di/container.ts` existen registros para:

- `organica0Repo`
- `getAllOrganica0Query`
- `getOrganica0ByIdQuery`
- `createOrganica0Command`
- `updateOrganica0Command`
- `deleteOrganica0Command`

No existe hoy una query dedicada para paginacion o conteo.

## Responsabilidades actuales del legacy

### `organica0.service.ts`

Actualmente concentra:

- wrapper de listado con `limit` y `offset`
- conteo de registros
- create, update y delete legacy auxiliares
- logs operativos del listado

### `organica0.repo.ts`

Actualmente concentra:

- consultas Firebird directas
- paginacion con sintaxis `ROWS`
- funcion de conteo `countOrganica0`
- CRUD legacy paralelo al repositorio moderno

## Hallazgos clave

1. `organica0` ya esta muy cerca de cierre estructural.
2. El CRUD principal ya no depende del servicio legacy.
3. El principal residuo legacy es el endpoint `GET /organica0`.
4. La diferencia mas importante respecto a `organica1/2/3` es que aqui existe contrato visible de `pagination`.
5. El repositorio moderno `Organica0Repository` ya existe, pero su interfaz actual no contempla paginacion ni conteo.
6. El modulo tiene una condicion funcional importante en `isInUse`: revisa dependencias en `ORGANICA_1`, `ORGANICA_2`, `ORGANICA_3` y `ORG_PERSONAL`.

## Riesgos de migracion

### Riesgo bajo

- `GET /organica0/:claveOrganica`, `POST`, `PUT` y `DELETE` ya usan CQRS
- el repositorio moderno ya esta implementado
- el dominio y error handler ya existen

### Riesgo medio

- hay que conservar exactamente la forma de `pagination`
- la ruta actual tiene logs y advertencias para admin sin paginacion
- el conteo real no esta expuesto en la interfaz moderna

### Riesgo alto

- si se mueve mal el listado paginado, puede cambiar el comportamiento visible del endpoint principal del modulo
- si se pierde el conteo o cambia `hasMore`, puede afectar clientes que dependan de esa metadata

## Alcance recomendado de la migracion

### Dentro de alcance

- extender la interfaz del repositorio para soportar listado paginado y conteo
- agregar una query dedicada para listado paginado de `organica0`
- hacer que `GET /organica0` deje de importar `organica0.service.js`
- retirar `organica0.service.ts` y `organica0.repo.ts` cuando queden sin consumidores

### Fuera de alcance

- cambiar la forma de `pagination`
- optimizar el listado
- cambiar logging operativo por otra politica
- cambiar reglas de borrado o dependencias de `isInUse`

## Propuesta de migracion puntual para organica0

### Paso 1

Congelar `GET /organica0` como contrato visible y documentar su forma exacta de respuesta.

### Paso 2

Extender `IOrganica0Repository` con:

- listado paginado
- conteo total

### Paso 3

Agregar una query como `GetOrganica0PaginatedQuery` para encapsular:

- `limit`
- `offset`
- `total`
- `hasMore`

### Paso 4

Actualizar `organica0.routes.ts` para que `GET /organica0` use esa query en vez de import dinamico del servicio.

### Paso 5

Retirar `organica0.service.ts` y `organica0.repo.ts` si ya no quedan consumidores.

## Ventajas de esta migracion

### 1. Cierra la familia organizacional base

`organica0` completa el frente principal de `organica0/1/2/3`, dejando una base mas consistente para seguir con `organicaCascade`.

### 2. Elimina el ultimo import dinamico legacy visible en una ruta critica

Eso reduce comportamiento especial en runtime y hace mas predecible el endpoint principal del modulo.

### 3. Mejora consistencia de CQRS

El modulo quedara alineado con el mismo patron usado ya en `organica1`, `organica2` y `organica3`.

### 4. Menor costo de contexto para trabajo futuro

Sin `service` ni `repo` de raiz, sera mas facil revisar el modulo, operar con GPT-5.4 y evitar lecturas innecesarias.

### 5. Mejor base para modularizar DI y mantener el repositorio

Con `organica0` cerrado, la familia organizacional queda lista para una futura modularizacion de DI con menos ruido legacy.

### 6. Reduce duplicidad tecnica

Actualmente existen dos caminos para listar y contar. Migrar evita mantener logica repetida entre repositorio moderno y repo legacy.

## Evaluacion previa resumida

```text
Modulo: organica0
Estado actual: Hibrido
Endpoints congelados: 5
Reglas documentadas: implicitas, de riesgo medio por paginacion visible
Dependencias de DB: Firebird
Archivos legacy detectados: organica0.service.ts, organica0.repo.ts
Commands a consolidar: CreateOrganica0Command, UpdateOrganica0Command, DeleteOrganica0Command
Queries a consolidar: GetAllOrganica0Query, GetOrganica0ByIdQuery, listado paginado
Repositorio objetivo: domain/repositories + infrastructure/persistence/Organica0Repository.ts
Riesgo: Medio
```

## Recomendacion de ejecucion

`organica0` es el siguiente mejor candidato para implementar.

Razones:

- el alcance pendiente es pequeno y claro
- la mayor parte del modulo ya esta migrada
- sirve para cerrar el bloque organizacional base

## Criterio para pasar a implementacion

Se puede pasar a implementacion cuando se acepte este alcance:

1. migracion solo interna
2. cero cambio de endpoints
3. cero cambio del shape de `pagination`
4. retiro progresivo de `service` y `repo` legacy
