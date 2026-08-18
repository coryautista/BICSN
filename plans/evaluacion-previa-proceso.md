# Evaluacion previa de migracion: proceso

## Objetivo

Evaluar el modulo `proceso` antes de su limpieza final, verificando si aun existe dependencia real de `service` o `repo` legacy y si la migracion puede ejecutarse sin cambiar endpoints.

## Referencias

- `plans/plantilla-modulo-objetivo.md`
- `plans/checklist-migracion-por-modulo.md`
- `plans/migracion-por-fases-sin-cambiar-endpoints.md`

## Estado actual

### Clasificacion

Hibrido en estructura, pero casi cerrado en operacion.

### Motivo

El modulo aun conserva archivos legacy:

- `proceso.service.ts`
- `proceso.repo.ts`

Pero el flujo real ya usa:

- `application/commands/`
- `application/queries/`
- `domain/`
- `infrastructure/persistence/ProcesoRepository.ts`

## Estructura actual detectada

```text
src/modules/proceso/
  application/
  domain/
  infrastructure/
  proceso.repo.ts
  proceso.routes.ts
  proceso.schemas.ts
  proceso.service.ts
```

## Contrato publico congelado

### Endpoints detectados

1. `GET /procesos`
2. `GET /procesos/:id`
3. `POST /procesos`
4. `PUT /procesos/:id`
5. `DELETE /procesos/:id`

### Reglas visibles del contrato

- `GET` requiere `requireAuth`
- `POST`, `PUT` y `DELETE` requieren `requireAuth` y `requireRole('admin')`
- el contrato visible usa `id`, `nombre`, `componente`, `idModulo`, `orden`, `tipo`
- `POST` responde `201`

### Restricciones de migracion

- no cambiar rutas
- no cambiar roles o protecciones
- no cambiar shape de respuesta
- no cambiar codigos HTTP

## Dependencias actuales

### Rutas

Las rutas ya resuelven desde DI:

- `getAllProcesosQuery`
- `getProcesoByIdQuery`
- `createProcesoCommand`
- `updateProcesoCommand`
- `deleteProcesoCommand`

### Repositorio moderno

`src/modules/proceso/infrastructure/persistence/ProcesoRepository.ts` ya implementa directamente:

- `findAll`
- `findById`
- `create`
- `update`
- `delete`

No depende del `repo` legacy.

### Service legacy

`proceso.service.ts` es solo un placeholder documental. No contiene logica operativa.

### Repo legacy

`proceso.repo.ts` duplica la logica que ya existe en `ProcesoRepository.ts`, pero no participa en el flujo actual del modulo.

## Hallazgos clave

1. `proceso` ya esta migrado funcionalmente a CQRS.
2. El `service` legacy no tiene valor operativo.
3. El `repo` legacy es redundante frente al repositorio moderno.
4. La siguiente implementacion no es una migracion funcional, sino una limpieza controlada.
5. El modulo usa MSSQL, no Firebird, por lo que el riesgo tecnico es mas bajo que en otros modulos sensibles.

## Riesgos de migracion

### Riesgo bajo

- rutas ya usan CQRS
- DI ya apunta a commands y queries correctos
- repositorio moderno ya opera directo sobre MSSQL

### Riesgo medio

- si existe alguna referencia externa al `repo` legacy fuera del modulo, debe detectarse antes de borrarlo

### Riesgo alto

- no se detecta riesgo alto en esta fase, siempre que se confirme ausencia de consumidores del legacy

## Alcance recomendado de la migracion

### Dentro de alcance

- confirmar que no hay referencias activas a `proceso.service.ts`
- confirmar que no hay referencias activas a `proceso.repo.ts`
- eliminar ambos archivos si estan huérfanos

### Fuera de alcance

- cambiar contratos HTTP
- optimizar consultas MSSQL
- cambiar nombres o reglas de validacion

## Propuesta de migracion puntual para proceso

### Paso 1

Confirmar por busqueda global que `proceso.service.ts` y `proceso.repo.ts` no tienen consumidores activos.

### Paso 2

Eliminar ambos archivos legacy.

### Paso 3

Validar compilacion con `npm run build`.

## Ventajas de esta migracion

### 1. Cierre rapido de deuda estructural

`proceso` puede salir del inventario de hibridos con un cambio pequeno y seguro.

### 2. Menor ruido en el dominio administrativo

Eliminar archivos redundantes facilita leer el dominio y reduce confusion entre codigo vigente y codigo muerto.

### 3. Mejor consistencia del roadmap

Permite avanzar el bloque administrativo con una victoria rapida antes de entrar a modulos mas delicados como `menu`, `modulo` o `usuarios`.

### 4. Menor costo de contexto para GPT-5.4

Menos duplicidad implica menos archivos irrelevantes al leer el modulo.

## Evaluacion previa resumida

```text
Modulo: proceso
Estado actual: Hibrido residual
Endpoints congelados: 5
Reglas documentadas: auth y admin en escritura
Dependencias de DB: MSSQL
Archivos legacy detectados: proceso.service.ts, proceso.repo.ts
Commands a consolidar: ya consolidados
Queries a consolidar: ya consolidadas
Repositorio objetivo: infrastructure/persistence/ProcesoRepository.ts
Riesgo: Bajo
```

## Recomendacion de ejecucion

`proceso` es buen candidato para implementacion inmediata.

No requiere rediseño. Requiere solo confirmar referencias y limpiar archivos legacy redundantes.

## Criterio para pasar a implementacion

Se puede pasar a implementacion cuando se acepte este alcance:

1. migracion solo interna
2. cero cambio de endpoints
3. eliminacion de archivos legacy huérfanos
