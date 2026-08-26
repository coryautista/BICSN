# Seguimiento: Historial de la QNA Aplicada desde Snapshot Oficial

## Proposito

Este documento es el tablero ejecutivo del trabajo pendiente para conservar y consultar la evidencia oficial de `/dependencia/aportaciones-proceso`.

El detalle tecnico, las decisiones y los criterios obligatorios permanecen en:

```text
docs/aplicacionQuincenal/PLAN_BACK_HISTORIAL_SNAPSHOT_OFICIAL.md
```

Este tablero no sustituye el plan tecnico ni autoriza migraciones, reprocesos, cambios en periodos cerrados o despliegues.

## Estado General

```text
FASE_1_COMPLETADA
FASE_2_COMPLETADA
```

Ultima actualizacion: 2026-08-25.

## Resultado Esperado

Para cada QNA nueva aplicada, reproducir sin fuentes vivas los diez dominios congelados al confirmar `Aplicar`, comprobando que el snapshot consultado sea el que alcanzo `TERMINADO`.

## Prerrequisitos Completados

- Desarrollo alineado con Produccion en 91 tablas y esquema QNA V3.
- Calidad alineada con Produccion y FK de `QnaSnapshot` corregida.
- Formula monetaria V3 activa.
- Calidad y Produccion publicadas y saludables el 2026-08-21.
- Scripts protegidos de migracion y verificacion versionados en `3f51713`.
- Plan backend y entrega frontend versionados en `3f51713`.

## Ruta Critica Backend

| Fase | Entregable verificable | Estado | Dependencia |
|---:|---|---|---|
| 0 | Decisiones, ADR, tablero y linea base documental | COMPLETADA | Prerrequisitos completados |
| 1 | Politica central de autorizacion y ambito | COMPLETADA | Fase 0 |
| 2 | Invariantes transaccionales de promocion | COMPLETADA | Fase 1 |
| 3 | Precedencia correcta de quinquenio | COMPLETADA | Fase 2 |
| 4 | Migracion idempotente de proyecciones y restricciones | PENDIENTE | Fase 3 |
| 5 | Captura unica en memoria de diez dominios | PENDIENTE | Fase 4 |
| 6 | Detalles, payloads, hashes y totales persistidos | PENDIENTE | Fase 5 |
| 7 | Retenciones V3 completas por identidad y hash | PENDIENTE | Fase 6 |
| 8 | Dual-write y conciliacion automatizada | PENDIENTE | Fase 7 |
| 9 | Endpoints oficiales de periodos, resumen y detalle | PENDIENTE | Fase 8 |
| 10 | Fuentes discriminadas y fallback legacy | PENDIENTE | Fase 9 |
| 11 | Saga, recuperacion e idempotencia verificadas | PENDIENTE | Fase 10 |
| 12 | Evidencia integral en Calidad y contrato frontend | PENDIENTE | Fase 11 |
| 13 | Retiro autorizado de escritura legacy para QNA nuevas | PENDIENTE | Fase 12 y aprobacion operativa |
| 14 | Migracion y liberacion controlada en Produccion | PENDIENTE | Fase 13 |

## Fase Actual: 4

Objetivo: crear y validar la migracion idempotente de proyecciones y restricciones del Snapshot oficial.

## Evidencia de la Fase 3

- [x] Priorizar `quinquenios_aplicado_d6` sin confundir cero con ausencia.
- [x] Transformar `quinquenios_d6` mensual mediante la regla quincenal estandar y precision D6.
- [x] Usar `BaseCotizacionQuinquenios` solo desde el `nominaCargaId` congelado cuando faltan los niveles anteriores.
- [x] Persistir `null` cuando el valor no puede verificarse.
- [x] Probar los cuatro niveles, redondeo D6 y cero real.
- [x] Aprobar build, calculo oficial, contratos de Liquidacion QNA y suite previa de Snapshot V2.
- [x] Registrar el commit funcional `3641588`.

## Evidencia de la Fase 2

### Alcance Confirmado

- [x] Mapear creacion, aprobacion y promocion actuales.
- [x] Confirmar que las diez fuentes y la decision se revalidan dentro de la transaccion.
- [x] Detectar que carga, formula y Snapshot V2 no se revalidan durante la promocion.
- [x] Detectar ausencia de `QNA_NOMINA_CARGA_DESACTUALIZADA`.
- [x] Detectar ausencia de un application lock comun por ambito.
- [x] Adquirir `sp_getapplock` transaccional por periodo y organicas.
- [x] Comparar periodo, ambito y ambiente entre snapshots.
- [x] Exigir la misma carga nominal y formula.
- [x] Exigir carga `TXT`, `APLICADA` y `EsVigente = 1`.
- [x] Revalidar conteos, hashes y totales persistidos.
- [x] Emitir `QNA_NOMINA_CARGA_DESACTUALIZADA` ante sustitucion.
- [x] Probar exclusión transaccional entre promociones y sustituciones.

La prueba transaccional read-only `npm run test:liquidacion-qna:scope-lock` fue ejecutada correctamente en Desarrollo el 2026-08-25 y termino con `QNA_SCOPE_LOCK_INTEGRATION_DESARROLLO_OK`.

## Fases Cerradas

### Fase 1: Autorizacion y Ambito

- [x] Politica central `OrganicaScopePolicy`.
- [x] Clasificacion de entidad independiente del orden de roles.
- [x] Organicas de entidad obtenidas exclusivamente del token.
- [x] Ambito externo restringido al rol `admin`.
- [x] Liquidacion QNA protegida por la politica central.
- [x] Ocho consultas operativas de aportaciones protegidas por la politica central.
- [x] Errores `401` y `403` comprobados.
- [x] Build y contratos de aportaciones y liquidacion aprobados.
- [x] Commit funcional `08bfae1`.

### Fase 0: Linea Base Documental

Objetivo: establecer una linea base documental y operativa revisable antes de modificar el flujo financiero.

### Lista de Cierre

- [x] Confirmar alcance de diez dominios.
- [x] Confirmar congelacion al seleccionar `Aplicar`.
- [x] Confirmar que `TERMINADO` prueba la aplicacion oficial.
- [x] Confirmar dual-write temporal y fallback `HISTORICO_LEGACY`.
- [x] Alinear Desarrollo y Calidad con el esquema QNA V3 de Produccion.
- [x] Versionar los ejecutores protegidos de migracion y verificacion.
- [x] Crear el ADR `DECISION_HISTORIAL_SNAPSHOT_OFICIAL.md`.
- [x] Crear este tablero ejecutivo.
- [x] Clasificar los cambios locales ajenos a la fase.
- [x] Revisar el diff documental final.
- [x] Crear un commit exclusivo de fase 0 con referencia en las bitacoras.

### Politica sobre Scripts Operativos

Los siguientes archivos se conservan versionados como herramientas permanentes de diagnostico y recuperacion controlada:

```text
scripts/migrate-qna-v3-desarrollo.ts
scripts/verify-qna-v3-desarrollo.ts
scripts/migrate-qna-snapshot-fk-calidad.ts
scripts/verify-qna-v3-calidad.ts
```

Reglas:

- Los scripts de migracion deben exigir ambiente y confirmacion explicita.
- Los verificadores deben ser read-only.
- No se agregan a un flujo automatico de despliegue salvo decision posterior.
- No se reutilizan contra otro ambiente cambiando nombres manualmente.
- Toda operacion cruzada comienza con `npm run verify:database:environments`.

### Cambios Locales Fuera de Alcance

Al iniciar la fase 0 existen modificaciones independientes en:

```text
.env.example
.gitignore
Dockerfile
deploy_bicsn.template.sh
```

No deben incluirse, revertirse ni ajustarse como parte de esta fase. Requieren una revision y entrega separadas de configuracion/despliegue.

## Evidencia de la Fase 0

- Fase 0 marcada `COMPLETADA` en este tablero y en el plan principal.
- ADR aceptado y versionado.
- Diff de fase 0 sin cambios ajenos.
- Commit de fase 0 registrado en ambas bitacoras.
- No existen decisiones abiertas sobre alcance, fuente oficial o evidencia `TERMINADO`.

## Puerta para Desbloquear Frontend

- Migracion de proyecciones aplicada en Calidad.
- `QnaSnapshotDetalle` poblado.
- Payloads auxiliares completos y versionados.
- Los tres endpoints oficiales disponibles.
- Swagger estable.
- Totales, paginacion y union discriminada documentados.
- Una QNA de Calidad consultable sin fuentes vivas.
- Pruebas backend obligatorias aprobadas.

## Riesgos Activos

| Riesgo | Control requerido | Estado |
|---|---|---|
| Lecturas repetidas producen evidencias distintas | Captura unica de diez dominios | ABIERTO |
| SQL Server y Firebird no comparten transaccion | Saga recuperable e idempotente | ABIERTO |
| Acceso cruzado entre dependencias | Politica central de ambito | CONTROLADO |
| Campos historicos no verificables | `null`, advertencias y fuente discriminada | ABIERTO |
| Diferencias entre snapshot oficial y legacy | Dual-write y conciliacion | ABIERTO |
| Cambios locales ajenos mezclados con la fase | Commit selectivo y revision de diff | CONTROLADO |

## Registro de Avance

| Fecha | Fase | Estado | Evidencia | Siguiente paso |
|---|---:|---|---|---|
| 2026-08-21 | Prerrequisito | COMPLETADO | Desarrollo y Calidad alineados; publicaciones saludables | Establecer fase 0 |
| 2026-08-21 | Linea base | COMPLETADO | Commit `3f51713` | Crear ADR y tablero |
| 2026-08-25 | 0 | COMPLETADA | Commit `e7a3327`; ADR y tablero creados; scripts clasificados; `git diff --check` aprobado | Iniciar fase 1 |
| 2026-08-25 | 1 | COMPLETADA | Commit `08bfae1`; `ORGANICA_SCOPE_POLICY_TESTS_OK`; build y contratos aprobados | Iniciar fase 2 |
| 2026-08-25 | 2 | EN_PROGRESO | Flujo de promocion e invariantes auditados | Implementar validacion final y lock transaccional |
| 2026-08-25 | 2 | EN_PROGRESO | Commit `837a691`; build y pruebas puras aprobados; prueba SQL bloqueada por conectividad | Ejecutar `test:liquidacion-qna:scope-lock` en Desarrollo |
| 2026-08-25 | 2 | COMPLETADA | `QNA_SCOPE_LOCK_INTEGRATION_DESARROLLO_OK`; build y seis suites afectadas OK | Iniciar fase 3 |
| 2026-08-25 | 3 | EN_PROGRESO | `SNAPSHOT_QUINQUENIO_PRECEDENCE_TESTS_OK`; build, calculo oficial, Liquidacion QNA y Snapshot V2 OK | Registrar commit exclusivo de cierre |
| 2026-08-25 | 3 | COMPLETADA | Commit `3641588`; precedencia, D6, cero real y ausencia verificadas | Iniciar fase 4 |

## Regla de Actualizacion

Después de cada fase:

1. Registrar pruebas y evidencia.
2. Actualizar el estado en este tablero.
3. Actualizar el plan tecnico.
4. Registrar el commit correspondiente.
5. Actualizar la referencia de modelo o Swagger cuando aplique.
6. No iniciar la fase siguiente si existe una puerta de salida incumplida.
