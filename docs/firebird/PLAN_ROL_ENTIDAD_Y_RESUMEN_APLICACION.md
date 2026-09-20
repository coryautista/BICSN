# Plan: Rol Firebird por Contexto de Usuario y Resumen al Aplicar Quincena

## Estado

EN EJECUCION. Documento de seguimiento por ambiente. Marcar cada casilla al completar y registrar evidencia en la bitacora.

## Objetivo

1. **Rol por contexto**: los usuarios entidad operan Firebird con rol `R_DETERMINA`; el resto con el rol operativo del catalogo (`RolFirebird`, hoy `R_DESARROLLO`). Mismo usuario Firebird por organica (`DT_04_24`).
2. **Resumen**: el resumen se calcula en la carga (no al aplicar). La investigacion demostro que aplicar la quincena NO reescribe `AP_D_ORIGEN_RESUMEN`; solo `AP_DN_APLICAR` cambia `STATUS` a `A` y estampa `USER_ACTUALIZAR`/`FECHA_ACTUALIZAR` en `AP_D_ORIGEN_TODOS`.

## Decisiones Confirmadas

1. Un solo `UsuarioFirebird` por organica; el rol varia por contexto (Opcion A: columnas `RolFirebird` + `RolFirebirdEntidad`).
2. Contexto `ENTIDAD` aplica a **todas** las operaciones disparadas por un usuario entidad (consultas y aplicacion).
3. Flujos sin usuario HTTP (saga QNA, sync TXT programada) usan contexto `ENTIDAD`.
4. Sin fallback: contexto entidad sin `RolFirebirdEntidad` configurado se rechaza con error explicito.
5. **`FO_FRE` se mantiene en 313,708.76** (`22.25% x FO_SDOB + 26.75% x FO_OPB`), formula certificada en Firebird (`FONDOS_ACT_CALC`) e identica a Produccion en 1426 y 1526. El 301,896.95 del bloque DETERMINA no corresponde a lo que el legacy grabo en Produccion.
6. **No se completa el resumen al aplicar** (paso D5 descartado y revertido). Evidencia: Produccion (legacy) 1526 `AP_D_ORIGEN_RESUMEN` es identico al de Desarrollo; el trigger `AP_D_ORIGEN_RESUMEN_BI0` solo pone `FMOV_ALT='NOW'` y normaliza ciertos nulos, y `AP_DN_APLICAR` no escribe el resumen.
7. **`FECHAMOV` debe ser 15/08/2026** (igual que Produccion/Calidad), no 14/08.
8. **Normalizar** `ORGANICA`/`MOVIMIENTO` a un espacio `" "` y dejar `NULL` en `FR_AFIL`, `PCP_N_NUEVOS`, `PCP_N_ALTAS`, `PCP_N_BAJAS`, `PCP_N_CANCELADO`, `PCP_N_DIRECTOS`, como Produccion.

## Auditoria por trigger vs procedimiento

- **Alta** `AP_D_ORIGEN_TODOS`: trigger `AP_D_ORIGEN_TODOS_BI0` fuerza `status='N'`, `user_alt=USER`, `fecha_alt='NOW'`.
- **Actualizacion (aplicar)**: `AP_DN_APLICAR` hace `status='A'`, `user_actualizar=USER`, `fecha_actualizar=NOW` (no hay trigger de update).
- **`AP_D_ORIGEN_RESUMEN`**: sin columnas de usuario; solo `FMOV_ALT`, fijado por `AP_D_ORIGEN_RESUMEN_BI0` en el alta.

---

## DESARROLLO

### Fase D1 - Migracion de catalogo y tooling

- [x] Migracion 26: `ALTER TABLE config.FirebirdOrganicaCredential ADD RolFirebirdEntidad VARCHAR(64) NULL` + verificador de firma.
- [x] CLI `firebird-credential-encrypt.ts` acepta `--role-entidad-env` y persiste ambos roles.
- [x] Verificador `verify-firebird-organica-credentials.ts` muestra ambos roles y su descifrabilidad.
- [x] Migracion aplicada en `SII-ISSSSPEA-DES` (executor guardado).

### Fase D2 - Runtime de credenciales y conexion

- [x] `firebirdCatalog.ts`: lease por contexto; cache `org0|org1|contexto`; error `FIREBIRD_CREDENCIAL_ROL_ENTIDAD_NO_CONFIGURADO`.
- [x] `firebird.ts`: `FirebirdScope.rolContexto?: 'ENTIDAD' | 'OPERATIVO'`; `scopeKey` incluye contexto; attachments separados por rol.
- [x] `npx tsc --noEmit` y `npm run build` aprobados.

Evidencia D2: `CURRENT_ROLE=R_DETERMINA` con contexto ENTIDAD y `R_DESARROLLO` con OPERATIVO, mismo `CURRENT_USER=DT_04_24` (Desarrollo).

### Fase D3 - Threading del contexto

- [x] Mecanismo central: `AsyncLocalStorage` (`src/db/firebirdRolContexto.ts`) + plugin Fastify `onRoute` que envuelve cada handler (`src/plugins/firebirdRolContexto.ts`); el contexto se deriva del claim `entidades` del token (mismo criterio que `OrganicaScopePolicy.ts:53`).
- [x] `firebird.ts` resuelve el contexto efectivo: scope explicito → almacen asincrono de la peticion → `OPERATIVO` por defecto (solo diagnostico).
- [x] Validacion end-to-end: handler con token entidad corre en `ENTIDAD`; admin en `OPERATIVO`; sin token `OPERATIVO` y `requireAuth` rechaza.
- [x] Flujos batch: no existen workers Firebird en background actualmente (RevisionWorker solo SQL); `runWithFirebirdRolContexto('ENTIDAD', ...)` disponible para futuros workers.
- [x] Grep final: el envoltorio central cubre todas las rutas registradas (sin llamadas de negocio fuera del contexto).

### Fase D4 - Operativa DBA Desarrollo

- [x] `UPDATE` fila `04/24`: `RolFirebirdEntidad='R_DETERMINA'` (rol operativo sin cambios).
- [x] Los 5 escritores del resumen (`AP_DN_TODOS`, `AP_DN_COMP_ORG`, `AP_DN_HIP_ORG`, `AP_DN_PMP_ORG`, `AP_DN_FONDOS_INIC`) **obsoletos** con la revertida D5; sin grants requeridos.
- [x] Confirmado `SELECT` de `R_DETERMINA` en lectura (`PERSONAL`/`ORG_PERSONAL` S,I,U; `AP_D_ORIGEN_*` S,I,U,D) y `EXECUTE` en apliers, agregados y consultas (verificado por inventario).
- [ ] `GRANT EXECUTE ON PROCEDURE AP_S_VIV TO R_DETERMINA;` — único permiso faltante (prestamos mediano plazo/PMP en aportaciones).

### Fase D5 - Resumen al aplicar (DESCARTADA)

- [x] Investigacion: `AP_DN_TODOS` recibe los totales por parametro (todos de entrada); llamarlo sin totales dejaria el resumen en cero.
- [x] Evidencia contra Produccion: el resumen de 1526 aplicado por el legacy es identico al de Desarrollo; aplicar no reescribe el resumen.
- [x] **Revertido**: eliminado el paso `actualizacionResumen` de la saga, el `ejecutarActualizacionResumen` del servicio y sus aserciones de prueba.

### Fase D6 - Normalizacion de datos 1526 y validacion

- [x] `FECHAMOV` corregido a 15/08/2026 (parseo en hora local, sin desfase UTC).
- [x] `ORGANICA`/`MOVIMIENTO` normalizados a `" "`; `FR_AFIL` y `PCP_N_*` a `NULL`.
- [x] Correccion in-situ de las filas 1526 en `dbRestaura.fdb` (sin `DELETE`).
- [x] Paridad por columna 167/167 vs Produccion; unica diferencia (`INTERNO` de `TORN71052064A`) **aceptada** por depender del orden de carga y actualizarse con respaldo.
- [x] Integracion `CURRENT_ROLE`: contexto entidad → `R_DETERMINA`; operativo → `R_DESARROLLO`.
- [x] Extender `test-organica-scope-policy.ts`.
- [x] Suites nominales + build aprobados.
- [x] Formula `FO_FRE` confirmada: se mantiene 313,708.76 (igual a Produccion).
- [ ] Aplicar 1526 en Desarrollo por flujo normal (`P -> A` + auditoria); estado SQL listo (snapshot `COMPLETO`, bitacora `APLICAR` OK).

---

## CALIDAD

### Fase C0 - Prerrequisitos (deuda previa)

- [ ] Rotar credencial `04/24` del catalogo: sustituir `DES` por cuenta propia (o la que el DBA defina para Calidad) — el codigo nuevo rechaza la cuenta tecnica.
- [ ] Deploy del codigo con contexto de rol (sin paso de resumen al aplicar).

### Fase C1 - Catalogo y permisos

- [ ] Migracion 26 aplicada en `SII-ISSSSPEA`.
- [ ] Fila `04/24` con `RolFirebirdEntidad` configurado.
- [ ] Grants `R_DETERMINA` (o equivalente de Calidad) sobre aplicadores (`AP_DN_APLICAR`, `AP_P_APLICAR`, `EBI2_RECIBOS_AP`), agregados (`AP_DN_*`) y `AP_S_*` incluido `AP_S_VIV`; tablas de lectura/escritura.

### Fase C2 - Validacion

- [ ] `verify:firebird:catalog:calidad` con ambos roles legibles.
- [ ] Prueba funcional transitorio/aportaciones con usuario entidad (rol entidad efectivo).
- [ ] Retomar Fase 12 QNA cuando exista V5 real `TERMINADO`.

---

## PRODUCCION

### Fase P0 - Prerrequisitos (deuda previa)

- [ ] Rollout de catalogo Firebird por organica: migraciones 24/25/26, master key, fila `04/24` con cuenta propia y ambos roles.
- [ ] Deploy del codigo acumulado (scope por organica + contexto de rol + recuperador Q15/Q16).

### Fase P1 - Permisos

- [ ] Grants del rol entidad y operativo sobre aplicadores (`AP_DN_APLICAR`, `AP_P_APLICAR`, `EBI2_RECIBOS_AP`), agregados (`AP_DN_*`), `AP_S_*` incluido `AP_S_VIV`, y tablas AP_D_ORIGEN en Firebird de Produccion.

### Fase P2 - Validacion

- [ ] Integracion `CURRENT_USER`/`CURRENT_ROLE` por contexto en Produccion.
- [ ] Aplicacion de la siguiente quincena (1726) por flujo normal; verificar que los historicos legados (`retenciones`, `historicos-quincenales`) no requieran recuperacion posterior (cierra la causa raiz de Q15/Q16).

---

## Riesgos y Controles

| Riesgo | Control |
|---|---|
| Contexto olvidado en alguna ruta | Helper central + grep final + tipado del scope |
| Rol entidad sin grants de lectura | Validacion DBA Fase D4 antes de habilitar |
| `FO_FRE` distinto al legacy | Se mantiene 313,708.76 validado contra Produccion (1426 y 1526) |
| `FECHAMOV` con desfase de zona horaria | Parseo en hora local + correccion in-situ verificada contra Produccion |
| `INTERNO` distinto en Desarrollo | Aceptado: depende del orden de carga; se normaliza al restaurar respaldo |
| Mezcla con matriz de ambientes | `npm run verify:database:environments` antes de cada paso cruzado |

## Bitacora

| Fecha | Ambiente | Fase | Estado | Evidencia | Siguiente paso |
|---|---|---|---|---|---|
| 2026-09-13 | Todos | PLAN | GUARDADO | Decisiones 1-6 confirmadas por el usuario; pregunta FO_FRE abierta | Iniciar Fase D1 |
| 2026-09-13 | Desarrollo | D1 | COMPLETADO | Migraciones 26/27 aplicadas (`FIREBIRD_ORGANICA_CATALOG_MIGRATION_OK`); fila 04/24 con `RolFirebird=R_DESARROLLO` + `RolFirebirdEntidad=R_DETERMINA`; verificador OK | Iniciar Fase D2 |
| 2026-09-13 | Desarrollo | D2 | COMPLETADO | `CURRENT_ROLE=R_DETERMINA` (ENTIDAD) / `R_DESARROLLO` (OPERATIVO) con mismo `CURRENT_USER=DT_04_24`; build OK | Iniciar Fase D3 |
| 2026-09-13 | Desarrollo | D3 | COMPLETADO | ALS + plugin `onRoute` envolviendo handlers; probe `inject`: ENTIDAD/OPERATIVO/sin-token correctos; suites y build OK | Iniciar Fase D5 (escritores resumen) y grants D4 restantes |
| 2026-09-13 | Desarrollo | D5 | DESCARTADA | `AP_DN_TODOS` recibe totales por parametro; Produccion demuestra que aplicar no reescribe el resumen. Paso revertido en saga, servicio y prueba | Continuar D6 |
| 2026-09-14 | Todos | Decisiones | COMPLETADO | Mantener `FO_FRE=313,708.76`; no completar resumen al aplicar (revertido); `FECHAMOV`=15/08; normalizar espacios y `NULL` | Ejecutar D6 |
| 2026-09-14 | Desarrollo | D6 | COMPLETADO | Parser con fecha local; sync normaliza `ORGANICA`/`MOVIMIENTO=" "` y omite `FR_AFIL`/`PCP_N_*` (NULL); correccion in-situ 1526 (`CORRECT_NOMINA_LAYOUT20_1526_DESARROLLO_OK`); suites (`FAKE`, `REPLACEMENT`, `ORGANICA_SCOPE`, regresiones 8-11) y build OK | Aplicar 1526 por flujo normal |
| 2026-09-14 | Desarrollo | D6 | PARIDAD | Firma por columna 167/167 vs Produccion: identicas salvo `INTERNO` del RFC `TORN71052064A` (Desarrollo=88117; Produccion y Calidad=88177) | Diferencia ACEPTADA: depende del orden de carga; se normaliza al restaurar respaldo |

| 2026-09-14 | Todos | Permisos | ACTUALIZADO | Inventario de grants: `R_DETERMINA` cubre apliers, agregados y consultas; obsoletos los 5 escritores de D5; unico faltante `AP_S_VIV` (X) para prestamos mediano plazo | DBA otorga `AP_S_VIV` a `R_DETERMINA` en Desarrollo |

## Hallazgos de datos (1526)

- **Paridad 167/167** entre Desarrollo y Produccion en las 51 columnas restantes.
- **Diferencia aceptada (solo Desarrollo)**: `TORN71052064A` (NOEMPLEADO `3100079591`) — `PERSONAL`/`ORG_PERSONAL` de Desarrollo tienen `INTERNO=88117`; Produccion y Calidad tienen `88177`. Decision del usuario: **aceptar la diferencia**; el `INTERNO` se asigna segun el orden de carga en la BD, y puede cambiar cuando se actualice Desarrollo con un respaldo de Produccion.
- **Resumen**: identico a Produccion (`FO_FRE=313,708.76`); `FR_AFIL` y `PCP_N_*` quedan `NULL` tras la normalizacion.
