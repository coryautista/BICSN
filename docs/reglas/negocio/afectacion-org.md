# Reglas de negocio de afectacionOrg

## Tipo

Negocio

## Modulo

`src/modules/afectacionOrg`

## Objetivo

Documentar las reglas sensibles del modulo `afectacionOrg` para permitir migracion estructural sin cambiar comportamiento, endpoints ni contratos visibles.

## Alcance

Este documento cubre las reglas observadas en:

- registro de afectacion
- consulta de estados
- progreso de usuario
- bitacora
- tablero
- ultima afectacion
- calculo de quincena por fecha
- regla de quincena de alta afectacion

## Regla 1: el registro requiere autenticacion

### Descripcion

Todas las rutas principales del modulo requieren `requireAuth`.

### Entradas

- JWT valido

### Salida esperada

- sin autenticacion no debe ejecutarse el flujo del modulo

### Restricciones

- no remover `requireAuth` durante migracion

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts`

## Regla 2: `org0` y `org1` son obligatorios para registrar afectacion

### Descripcion

En `POST /afectacion-org/register`, el sistema intenta obtener `org0` y `org1` desde el token si no vienen en el body. Si al final no existen, el registro falla con `400`.

### Entradas

- `body.org0`, `body.org1`
- o `user.idOrganica0`, `user.idOrganica1`

### Salida esperada

- el registro solo continua cuando `org0` y `org1` quedan disponibles

### Restricciones

- no relajar el requisito de `org0` y `org1`
- no cambiar la prioridad actual token/body sin aprobacion

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:118-140`
- `src/modules/afectacionOrg/afectacionOrg.service.ts:504-507`

## Regla 3: `org2` y `org3` caen a `01` por defecto en el registro

### Descripcion

Cuando `org2` o `org3` no llegan o vienen vacios, el flujo los normaliza a `01` antes de consultar Firebird y antes de validar el schema final.

### Entradas

- `body.org2`
- `body.org3`

### Salida esperada

- si faltan, deben convertirse a `01`

### Restricciones

- no cambiar este default en migracion

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:142-156`
- `src/modules/afectacionOrg/afectacionOrg.service.ts:500-503`

## Regla 4: todas las claves organicas deben quedar normalizadas a 2 caracteres

### Descripcion

Las claves `org0`, `org1`, `org2` y `org3` se normalizan a dos caracteres con padding antes de validarse y usarse.

### Entradas

- body o query params del modulo

### Salida esperada

- claves organicas con longitud 2

### Restricciones

- no quitar padding ni truncado actual sin validar impacto Firebird y consultas relacionadas

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:195-212`
- `src/modules/afectacionOrg/afectacionOrg.schemas.ts:12-15`
- `src/modules/afectacionOrg/afectacionOrg.service.ts:111-129`

## Regla 5: la quincena y el anio del registro se obtienen desde Firebird

### Descripcion

Aunque el body permite `anio` y `quincena`, el flujo de registro consulta `AP_G_APLICADO_TIPO` y sobreescribe esos valores con el resultado operativo devuelto por Firebird.

### Entradas

- `org0`, `org1`, `org2`, `org3`

### Salida esperada

- `anio` y `quincena` finales salen del resultado de Firebird

### Restricciones

- no sustituir esta fuente por calculo local en migracion
- no cambiar el procedimiento `AP_G_APLICADO_TIPO` como fuente de verdad del registro

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:146-156`
- `src/modules/afectacionOrg/afectacionOrg.service.ts:495-588`

## Regla 6: valores por defecto del registro

### Descripcion

Si no se proporcionan, el flujo usa estos valores:

- `entidad = AFILIADOS`
- `accion = APLICAR`
- `resultado = OK`
- `appName = BICSN-API`
- `ip = req.ip` o `127.0.0.1`
- `usuario = user.sub` si no viene en body

### Entradas

- body parcial
- token JWT
- request HTTP

### Salida esperada

- el registro se completa con defaults consistentes

### Restricciones

- no cambiar defaults sin analizar integraciones y bitacora historica

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:158-180`

## Regla 7: `orgNivel` se deriva de la profundidad organizacional disponible

### Descripcion

Si `orgNivel` no viene, se calcula segun el nivel mas profundo disponible:

- si existe `org3`, entonces `orgNivel = 3`
- si no existe `org3` pero si `org2`, entonces `orgNivel = 2`
- si no existe `org2` pero si `org1`, entonces `orgNivel = 1`
- en otro caso, `orgNivel = 0`

### Entradas

- `org1`, `org2`, `org3`

### Salida esperada

- `orgNivel` coherente con la jerarquia recibida

### Restricciones

- no cambiar esta derivacion sin revisar consumers y validaciones del schema

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:182-193`

## Regla 8: la jerarquia organizacional debe ser consistente con `orgNivel`

### Descripcion

El modulo valida que:

- `org0` siempre exista y tenga 2 caracteres
- si `orgNivel >= 1`, `org1` debe existir
- si `orgNivel >= 2`, `org2` debe existir
- si `orgNivel >= 3`, `org3` debe existir

Adicionalmente, el schema de registro exige combinaciones consistentes entre `orgNivel` y los campos `org1-org3`.

### Entradas

- `orgNivel`
- `org0`
- `org1`
- `org2`
- `org3`

### Salida esperada

- si la jerarquia es inconsistente, el registro debe fallar

### Restricciones

- no flexibilizar esta validacion sin acuerdo funcional

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.service.ts:60-77`
- `src/modules/afectacionOrg/afectacionOrg.service.ts:103-130`
- `src/modules/afectacionOrg/afectacionOrg.schemas.ts:22-36`

## Regla 9: rangos validos para periodo y nivel organizacional

### Descripcion

El modulo considera validos solo estos rangos:

- `quincena`: 1 a 24
- `anio`: 2000 a 2100
- `orgNivel`: 0 a 3

### Entradas

- datos de registro o parametros validados

### Salida esperada

- fuera de rango, debe lanzar error de validacion

### Restricciones

- no cambiar rangos sin aprobacion funcional y tecnica

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.service.ts:60-74`
- `src/modules/afectacionOrg/domain/errors.ts:25-40`

## Regla 10: consultas del modulo aceptan filtros, pero no deben reinterpretar el contrato

### Descripcion

Las rutas `states`, `progress`, `logs`, `dashboard` y `last` usan filtros por entidad, anio, nivel organizacional y organicas. En `logs` tambien hay filtros por `quincena`, `usuario`, `accion`, `resultado`, `limit` y `offset`.

### Entradas

- query params

### Salida esperada

- las consultas devuelven informacion filtrada sin alterar los nombres de campos expuestos actualmente

### Restricciones

- no cambiar nombres de filtros ni forma de consulta durante la migracion

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:233-719`
- `src/modules/afectacionOrg/afectacionOrg.schemas.ts:39-60`

## Regla 11: la ruta `last` completa `org0` y `org1` desde el token cuando faltan

### Descripcion

En `GET /afectacion-org/last`, si `org0` y `org1` no llegan en query params, se completan desde el token y luego se normalizan.

### Entradas

- `query.org0`, `query.org1`
- `user.idOrganica0`, `user.idOrganica1`

### Salida esperada

- la consulta puede ejecutarse con organicas derivadas del token

### Restricciones

- no quitar esta conveniencia sin revisar callers actuales

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:687-707`

## Regla 12: existe una ruta alternativa de estados por parametros de path

### Descripcion

Ademas de `GET /afectacion-org/states`, el modulo publica `GET /afectacion-org/states/:entidad/:anio/:orgNivel/:org0/:org1/:org2/:org3`.

### Entradas

- parametros de ruta

### Salida esperada

- la consulta de estados debe mantenerse compatible tanto por query como por path params

### Restricciones

- no eliminar ni fusionar esta ruta en la migracion

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:721-811`

## Regla 13: calculo local de quincena por fecha

### Descripcion

La ruta `GET /afectacion-org/calculate-quincena` calcula quincena localmente con esta regla:

- dias `1-14` pertenecen a la primera quincena del mes
- dias `15+` pertenecen a la segunda quincena del mes
- el numero anual de quincena va de `1` a `24`

La fecha se parsea con cuidado para evitar errores por zona horaria cuando llega como ISO.

### Entradas

- `fecha`

### Salida esperada

- `{ anio, mes, dia, quincena, quincenaEnMes, descripcion }`

### Restricciones

- no sustituir esta regla local por otra formula sin validacion funcional

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:813-888`
- `src/modules/afectacionOrg/afectacionOrg.service.ts:379-472`

## Regla 14: la quincena de alta afectacion usa entidad fija `AFECTACION_ORG`

### Descripcion

La ruta `GET /afectacion-org/quincena-alta-afectacion` arma la consulta con `entidad = AFECTACION_ORG` y toma las organicas desde el JWT.

### Entradas

- `user.idOrganica0`
- `user.idOrganica1`
- `user.idOrganica2`
- `user.idOrganica3`

### Salida esperada

- devuelve la quincena actual segun la regla especifica de alta afectacion

### Restricciones

- no cambiar la entidad fija ni el origen de organicas durante migracion

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts:890-945`
- `src/modules/afectacionOrg/afectacionOrg.service.ts:475-492`

## Regla 15: este modulo es contrato sensible

### Descripcion

`afectacionOrg` mezcla:

- reglas de negocio
- jerarquia organizacional
- consulta a Firebird
- bitacora operativa
- endpoints de consulta y calculo

Por eso debe tratarse como modulo sensible dentro del roadmap de migracion.

### Restricciones

- no cambiar endpoints
- no cambiar shape de respuesta
- no cambiar defaults de registro
- no cambiar la fuente de quincena de Firebird para el registro
- no cambiar filtros visibles en consultas

### Evidencia en codigo

- `src/modules/afectacionOrg/afectacionOrg.routes.ts`
- `src/modules/afectacionOrg/afectacionOrg.service.ts`
- `src/modules/afectacionOrg/afectacionOrg.schemas.ts`

## Riesgo de tocarlo

Alto

## Notas

- durante la migracion, separar estructura interna no significa cambiar defaults ni reglas historicas
- si aparece una regla nueva no documentada, debe agregarse aqui antes de modificar comportamiento
- este documento debe consultarse junto con `plans/checklist-migracion-por-modulo.md`
