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
FASE_0_EN_PROGRESO
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
| 0 | Decisiones, ADR, tablero y linea base documental | EN_PROGRESO | Prerrequisitos completados |
| 1 | Politica central de autorizacion y ambito | PENDIENTE | Fase 0 |
| 2 | Invariantes transaccionales de promocion | PENDIENTE | Fase 1 |
| 3 | Precedencia correcta de quinquenio | PENDIENTE | Fase 2 |
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

## Fase Actual: 0

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
- [ ] Crear un commit exclusivo de fase 0 con referencia en las bitacoras.

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

## Puerta para Iniciar la Fase 1

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
| Acceso cruzado entre dependencias | Politica central de ambito | ABIERTO |
| Campos historicos no verificables | `null`, advertencias y fuente discriminada | ABIERTO |
| Diferencias entre snapshot oficial y legacy | Dual-write y conciliacion | ABIERTO |
| Cambios locales ajenos mezclados con la fase | Commit selectivo y revision de diff | CONTROLADO |

## Registro de Avance

| Fecha | Fase | Estado | Evidencia | Siguiente paso |
|---|---:|---|---|---|
| 2026-08-21 | Prerrequisito | COMPLETADO | Desarrollo y Calidad alineados; publicaciones saludables | Establecer fase 0 |
| 2026-08-21 | Linea base | COMPLETADO | Commit `3f51713` | Crear ADR y tablero |
| 2026-08-25 | 0 | EN_PROGRESO | ADR y tablero creados; scripts clasificados; `git diff --check` aprobado | Versionar fase 0 |

## Regla de Actualizacion

Después de cada fase:

1. Registrar pruebas y evidencia.
2. Actualizar el estado en este tablero.
3. Actualizar el plan tecnico.
4. Registrar el commit correspondiente.
5. Actualizar la referencia de modelo o Swagger cuando aplique.
6. No iniciar la fase siguiente si existe una puerta de salida incumplida.
