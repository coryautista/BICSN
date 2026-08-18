# Reglas de negocio de afiliado

## Tipo

Negocio

## Modulo

`src/modules/afiliado`

## Objetivo

Documentar las reglas sensibles del modulo `afiliado` para permitir migracion interna sin cambiar endpoints, contratos visibles ni comportamiento operativo ya existente.

## Alcance

Este documento cubre reglas detectadas en:

- CRUD y alta completa de afiliado
- validacion de `interno` contra Firebird
- calculo y registro de quincena de aplicacion
- aplicacion a BDIsspea
- carga de semanas extemporaneas
- actualizacion de bitacora de afectacion

## Regla 1: el modulo requiere autenticacion y varias operaciones requieren admin

### Descripcion

Las rutas del modulo usan `requireAuth` como proteccion base. Algunas operaciones administrativas usan ademas `requireRole('admin')`.

### Casos sensibles observados

- `POST /afiliado/reset`
- `POST /afiliado/carga-semanas-extemporaneas`

### Restricciones

- no remover autenticacion en migracion
- no quitar restricciones de admin sin aprobacion explicita

### Evidencia en codigo

- `src/modules/afiliado/afiliado.routes.ts:42-108`
- `src/modules/afiliado/afiliado.routes.ts:210-260`

## Regla 2: el `interno` debe existir en Firebird para ciertos flujos

### Descripcion

El modulo valida que el `interno` exista en las tablas `PERSONAL` y `ORG_PERSONAL` de Firebird para operaciones sensibles de afiliado.

### Entradas

- `interno`

### Salida esperada

- si el `interno` es invalido o no existe, la operacion debe fallar

### Restricciones

- no sustituir esta validacion por una verificacion solo local en MSSQL
- no cambiar el criterio de validacion dual `PERSONAL + ORG_PERSONAL`

### Evidencia en codigo

- `src/modules/afiliado/afiliado.service.ts:31-77`
- `src/modules/afiliado/domain/errors.ts:54-64`

## Regla 3: crear o actualizar afiliado valida `interno` antes de persistir

### Descripcion

Si el payload incluye `interno`, el modulo valida su existencia en Firebird antes de crear o actualizar el afiliado.

### Restricciones

- no omitir esta validacion en migracion

### Evidencia en codigo

- `src/modules/afiliado/afiliado.service.ts:125-156`
- `src/modules/afiliado/afiliado.service.ts:158-194`

## Regla 4: el alta completa calcula quincena y anio de aplicacion si no vienen informados

### Descripcion

En la creacion completa de afiliado, si `quincenaAplicacion` o `anioAplicacion` no llegan, el sistema los calcula a partir de la organica del afiliado antes de validar duplicados.

### Entradas

- `afiliadoOrg.claveOrganica0`
- `afiliadoOrg.claveOrganica1`
- `afiliadoOrg.claveOrganica2`
- `afiliadoOrg.claveOrganica3`

### Salida esperada

- el afiliado debe quedar asociado a una quincena y año de aplicacion operativos

### Restricciones

- no mover el calculo a una regla distinta sin revisar integracion con bitacora y Firebird

### Evidencia en codigo

- `src/modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.ts:44-67`

## Regla 5: no puede existir un afiliado activo con el mismo `interno` en la misma quincena y año

### Descripcion

Antes de insertar un alta completa, se valida que no exista ya un afiliado activo con el mismo `interno`, `quincenaAplicacion` y `anioAplicacion`.

### Entradas

- `interno`
- `quincenaAplicacion`
- `anioAplicacion`

### Salida esperada

- si ya existe, debe lanzarse error de duplicidad

### Restricciones

- no cambiar la llave funcional de duplicidad sin aprobacion

### Evidencia en codigo

- `src/modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.ts:69-94`
- `src/modules/afiliado/domain/errors.ts:18-22`

## Regla 6: si no se proporciona folio, el sistema autogenera el siguiente

### Descripcion

En el alta completa, si `folio` no viene o viene en `0`, se usa `MAX(folio) + 1`.

### Restricciones

- no cambiar esta estrategia durante la migracion sin revisar riesgo de concurrencia y consumers actuales

### Evidencia en codigo

- `src/modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.ts:102-111`

## Regla 7: la quincena de aplicacion por organica sigue la bitacora de afectacion y, si hace falta, consulta Firebird

### Descripcion

La logica para obtener quincena de aplicacion sigue este orden:

1. revisar la ultima entrada en `afec.BitacoraAfectacionOrg`
2. si no hay registro, consultar `AP_G_APLICADO_TIPO` en Firebird
3. si Firebird falla, usar fallback `quincena = 1` y `anio = año actual`
4. si la ultima accion fue `Completa`, avanzar a nueva quincena
5. si la ultima accion no fue `Completa`, usar la quincena existente

### Restricciones

- no cambiar el orden de prioridad de fuentes sin aprobacion
- no quitar el fallback actual sin una politica de error acordada

### Evidencia en codigo

- `src/modules/afiliado/afiliado.repo.ts:95-218`
- `src/modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.ts:434-586`

## Regla 8: cuando se necesita una nueva quincena, se evita duplicar una entrada `Aplicar`

### Descripcion

Antes de registrar una nueva quincena para una organica, el sistema valida si ya existe una entrada reciente con `Accion = 'Aplicar'` y `Entidad = 'AFILIADOS'`. Si existe, reutiliza esa quincena en lugar de crear otra.

### Restricciones

- no eliminar este control de duplicidad operacional
- no cambiar `Entidad = 'AFILIADOS'` sin revisar impacto funcional

### Evidencia en codigo

- `src/modules/afiliado/afiliado.repo.ts:219-260`
- `src/modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.ts:539-586`

## Regla 9: la aplicacion BDISSPEA en lote requiere organica configurada del usuario

### Descripcion

Para aplicar BDIsspea en lote, deben existir `org0` y `org1`. Si faltan, el flujo falla con `OrganicaNoConfiguradaError`.

### Restricciones

- no permitir la operacion sin organica base

### Evidencia en codigo

- `src/modules/afiliado/application/commands/AplicarBDIsspeaLoteCommand.ts:37-41`
- `src/modules/afiliado/domain/errors.ts:138-145`

## Regla 10: solo los afiliados en estados `2` o `3` son elegibles para aplicacion BDISSPEA en lote

### Descripcion

La aplicacion en lote filtra exclusivamente afiliados en estados `2` y `3`.

### Salida esperada

- si no hay afiliados elegibles, el proceso falla

### Restricciones

- no cambiar los estados elegibles sin aprobacion funcional

### Evidencia en codigo

- `src/modules/afiliado/application/commands/AplicarBDIsspeaLoteCommand.ts:44-57`
- `src/modules/afiliado/domain/errors.ts:147-155`

## Regla 11: la carga de semanas extemporaneas valida duplicados en el lote y en la BD

### Descripcion

Antes de insertar semanas extemporaneas en lote, el sistema:

1. detecta duplicados dentro del mismo lote por par `(interno, qnaAplica)`
2. detecta duplicados existentes en base de datos por el mismo par
3. solo inserta si no hay duplicados en ninguno de los dos niveles

### Restricciones

- no cambiar la llave funcional `(interno, qnaAplica)` sin aprobacion
- no convertir una validacion bloqueante en warning durante migracion

### Evidencia en codigo

- `src/modules/afiliado/application/commands/CargarSemanasExtemporaneasLoteCommand.ts:35-83`
- `src/modules/afiliado/application/commands/CargarSemanasExtemporaneasLoteCommand.ts:86-109`
- `src/modules/afiliado/domain/errors.ts:157-189`

## Regla 12: la carga de semanas extemporaneas tiene limites de contrato

### Descripcion

La ruta de carga en lote exige:

- body con `registros`
- minimo `1` registro
- maximo `500` registros
- cada registro debe incluir quincena, interno, organicas y montos requeridos

### Restricciones

- no alterar estos limites durante migracion sin acuerdo explicito

### Evidencia en codigo

- `src/modules/afiliado/afiliado.routes.ts:210-260`

## Regla 13: la consulta de semanas extemporaneas exige `org0`, `org1` y `periodo`

### Descripcion

La lectura de semanas extemporaneas solo es valida si:

- `org0` tiene 2 caracteres
- `org1` tiene 2 caracteres
- `periodo` es numero positivo

### Restricciones

- no flexibilizar estas validaciones en migracion

### Evidencia en codigo

- `src/modules/afiliado/afiliado.routes.ts:110-208`

## Regla 14: existe una operacion de reset administrativo del universo de afiliados

### Descripcion

`POST /afiliado/reset` ejecuta el stored procedure `[afi].[sp_ResetAfiliados]` y esta restringido a admin.

### Restricciones

- no mover esta operacion a un flujo no administrativo
- no eliminar la restriccion de rol

### Evidencia en codigo

- `src/modules/afiliado/afiliado.routes.ts:42-108`

## Regla 15: el modulo interactua con bitacora de afectacion como parte del flujo de afiliacion

### Descripcion

El modulo no solo gestiona afiliados. Tambien actualiza o consulta `BitacoraAfectacionOrg` para reflejar estados como `Aplicar` y `TERMINADO` ligados al proceso de afiliacion y a movimientos BDIsspea.

### Restricciones

- no separar esta interaccion sin mapear antes la dependencia funcional
- no asumir que es solo logging tecnico; tiene valor operativo de proceso

### Evidencia en codigo

- `src/modules/afiliado/afiliado.repo.ts:1247-1422`
- `src/modules/afiliado/afiliado.repo.ts:1663-1746`

## Regla 16: `afiliado` es modulo de riesgo alto

### Descripcion

Este modulo mezcla:

- MSSQL
- Firebird
- validaciones de identidad laboral
- altas completas con multiples tablas
- quincena operativa
- bitacora de afectacion
- lotes administrativos

Por eso debe tratarse como modulo sensible en cualquier migracion.

### Restricciones

- no cambiar endpoints
- no cambiar respuestas publicas
- no cambiar criterios de elegibilidad de lote
- no cambiar llave de duplicidad de semanas extemporaneas
- no cambiar fuente ni orden de calculo de quincena sin aprobacion

### Evidencia en codigo

- `src/modules/afiliado/afiliado.routes.ts`
- `src/modules/afiliado/afiliado.service.ts`
- `src/modules/afiliado/afiliado.repo.ts`
- `src/modules/afiliado/application/commands/*.ts`

## Riesgo de tocarlo

Alto

## Notas

- durante la migracion, cualquier regla nueva detectada debe agregarse aqui antes de cambiar comportamiento
- este documento debe usarse junto con `docs/reglas/negocio/afectacion-org.md` por el acoplamiento entre ambos modulos
- este documento no autoriza optimizaciones; solo congela y explicita reglas actuales
