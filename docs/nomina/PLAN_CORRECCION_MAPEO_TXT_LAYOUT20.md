# Plan: Correccion de Mapeo TXT Layout 20 (Firebird AP_D_ORIGEN_TODOS y SQL Nomina)

## Estado

COMPLETADO EN DESARROLLO. El endpoint conserva la recarga por borrado; queda pendiente el permiso Firebird `DELETE` para futuras recargas operativas.

## Problema

La carga TXT quincenal de BICSN guarda los montos en columnas incorrectas, tanto en Firebird (`AP_D_ORIGEN_TODOS`) como en SQL Server (`NominaAplicacionQnalStagingDetalle` / `NominaAplicacionQnalDetalle`).

Evidencia:

- Firebird QNA 1426: correcta; cargada por el sistema legacy (VMONTOYA, 2026-07-29), STATUS `A`, 169 filas. Es la referencia oficial.
- Firebird QNA 1526: incorrecta; cargada por BICSN (2026-08-29, CargaId=20, SincronizacionId=6), STATUS `P`, 167 filas.
- SQL Q14 (CargaId=12) y Q15 (CargaId=20): columnas mal etiquetadas; Q14 ademas con CAIR=0.

## Mapeo Oficial del TXT (verificado 169/169 filas contra Firebird Q14)

Posiciones despues de lote/tipo/noempleado/rfc/nombre, separadas por `@`:

| Token | Campo TXT | Columna Firebird | Coincidencia |
|---|---|---|---|
| t1 | ahorro empleado 4.5% quincenal | FPEA | 169/169 |
| t2 | ahorro entidad 5% quincenal | FAA | 169/169 |
| t3 | descuento prestamo corto plazo | PCP | 90/90 |
| t4 | descuento prestamo hipotecario | HIP | 32/32 |
| t5 | sueldo quincenal | SDOBCOT | 169/169 |
| t6 | quinquenio quincenal | AQBCOT | 64/64 |
| t7 | sueldo mensual | SUELDOMEN | 169/169 |
| t8 | sin fuente en muestras | 0 | - |
| t9 | quinquenio mensual | QUINQMEN | 64/64 |
| t10 | fecha movimiento | FECHAMOV | - |
| t11 | sin fuente en muestras | 0 / DESCTOS | - |
| t12 | CAIR | CAIR | 169/169 |

Columnas Firebird sin fuente del TXT (siempre 0 en la carga): FAE, EBIA, EBIE, VIV, EBI, CAIRVOL, AYUDBCOT, QUINQBCOT, DESCTOS, AYUDASMEN.

Nota: el quinquenio mensual (t9) es 2x el quincenal (t6); el TXT trae ambos explicitamente.

## Errores Actuales de Mapeo

| Token | Columna Firebird incorrecta usada por BICSN | Correcta |
|---|---|---|
| t1 | FAA | FPEA |
| t2 | FAE | FAA |
| t3 | EBIA | PCP |
| t4 | EBIE | HIP |
| t6 | QUINQBCOT | AQBCOT |
| t9 | HIP | QUINQMEN |

CAIR (t12) ya se mapea bien desde la Q15; en Q14 SQL se perdio (0).

## Decisiones Confirmadas por el Usuario

1. Firebird Q14 no se toca (correcta, legacy). Firebird Q15 se regenera.
2. Replicar defaults legacy en Firebird: `'.'` en direccionales (DOMICILIO, COLONIA, CIUDAD, CLAVE_EDO, CLAVE_MPIO, COD_POS, TELEFONO, SEXO, EDO_CIVIL), `FECHANAC = 2050-01-01` cuando venga vacio, CORG0-3 con padding a 2 digitos, MOVIMIENTO con espacios.
3. STATUS en mayuscula `P` (ya se hace).
4. Recarga de TXT: si el scope ya tiene filas en Firebird, se **borran** detalle + resumen y se recarga, **siempre que ninguna fila tenga STATUS `A`**. Si existe alguna `A` (quincena aplicada), se rechaza.
5. Regenerar tambien SQL Q14 (CargaId=12) desde `LineaOriginal`, sin tocar Firebird Q14.
6. `FMOV_ALT` guarda la fecha de generacion confirmada del resumen; para la reparacion historica Q15 se fija `2026-08-12 12:05:00`.
7. Los campos numericos sin fuente permanecen en cero, no en `NULL`.

## Fases

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Corregir `NominaAplicacionQnalTxtParser`: asignacion semantica t3=PCP, t4=HIP, t6=QuinquenioQuincenal, t9=QuinqueniosMensual; t1/t2 sin cambio semantico | COMPLETADO |
| 2 | Corregir `NominaLayout20FirebirdSyncService`: mapeo 1:1 a columnas oficiales + defaults legacy + regla de recarga (borrar salvo STATUS `A`) | COMPLETADO |
| 3 | Ajustar SQL staging/detalle al nuevo mapeo semantico | COMPLETADO |
| 4 | Script read-only de verificacion: cruce `LineaOriginal` vs `AP_D_ORIGEN_TODOS` | COMPLETADO |
| 5 | Regenerar Q15: Firebird y SQL (CargaId=20); por falta de DELETE, Firebird se corrigio con UPDATE transaccional autorizado | COMPLETADO |
| 6 | Regenerar SQL Q14 (CargaId=12) desde `LineaOriginal`; Firebird Q14 intacto | COMPLETADO |
| 7 | Validacion completa: suites parser/contracts, typecheck, build, cruce Q14/Q15 | COMPLETADO |
| 8 | Bitacora y documentacion actualizadas | COMPLETADO |

## Fuera de Alcance (documentado)

- `USER_ALT` por organica: plan en `docs/firebird/PLAN_USUARIO_FIREBIRD_POR_ORGANICA.md`.
- `FECHA_ACTUALIZAR` / `USER_ACTUALIZAR`: paso posterior del flujo legacy (13 min despues de la carga en Q14); no se replica en esta correccion.
- STATUS `A`: lo asigna `AP_DN_APLICAR` al aplicar la quincena. Q15 permanece `P` hasta aplicar.

## Bitacora

| Fecha | Fase | Estado | Evidencia | Siguiente paso |
|---|---|---|---|---|
| 2026-08-31 | Diagnostico | COMPLETADO | Cruce 169/169 filas Q14; mapping oficial probado; diffs Q15 Firebird/SQL identificados | Ejecutar fases 1-8 |
| 2026-09-01 | Parser, Firebird y SQL | COMPLETADO | Build y pruebas locales OK; integraciones SQL/Firebird con rollback OK; migraciones 22/23 aplicadas solo en `SII-ISSSSPEA-DES` | Regenerar datos |
| 2026-09-01 | Regeneracion SQL | COMPLETADO | CargaId 12: 169 filas; CargaId 20: 167 filas, actualizadas atomicamente desde `LineaOriginal` | Verificar columnas persistidas |
| 2026-09-01 | Regeneracion Firebird Q15 | BLOQUEADO | Rollback confirmado por `no permission for DELETE access to TABLE AP_D_ORIGEN_TODOS`; Q14 Firebird no fue tocada | Conceder DELETE efectivo a `DES`/`R_DESARROLLO` en detalle y resumen, reintentar Q15 |
| 2026-09-01 | Ajuste operativo Firebird Q15 | AUTORIZADO | El endpoint conserva borrado + recarga; para corregir los datos existentes se usara UPDATE transaccional de detalle y resumen sin tocar Q14 | Ejecutar reparacion en sitio y verificar 167/167 |
| 2026-09-01 | Ajuste operativo Firebird Q15 | COMPLETADO | UPDATE transaccional confirmado: 167 detalles `P`, 1 resumen; Q14 Firebird intacta | Ejecutar cruce final |
| 2026-09-01 | Validacion final | COMPLETADO | Q14 169/169 y Q15 167/167; `missing=0`, `sqlMismatchTotal=0`, `mismatchTotal=0`, `zeroDefaults=0`, `legacyDefaults=0`; build y suites nominales OK | Gestionar permiso DELETE antes de una futura recarga por endpoint |
| 2026-09-01 | Default FECHANAC | COMPLETADO | Se corrigio el desfase UTC y Q15 persiste `2050-01-01`, igual que la referencia Q14 | Sin acciones de datos pendientes |
| 2026-09-01 | Resumen Firebird Q15 | COMPLETADO | UPDATE transaccional: 1 fila `AN`, 167 detalles `P`, 0 `A`, 0 `NULL`, 20 campos no cero, 79 campos en cero y `FMOV_ALT=2026-08-12 12:05:00` | Futuras cargas asignan la fecha de generacion del resumen |

## Pendiente Operativo

El codigo del endpoint aplica la regla acordada de borrar detalle y resumen antes de recargar cuando no existe `STATUS='A'`. En Desarrollo, el usuario/rol efectivo no tiene `DELETE` sobre `AP_D_ORIGEN_TODOS`; tambien debe confirmarse `DELETE` sobre `AP_D_ORIGEN_RESUMEN`. Hasta conceder ambos permisos, una segunda carga del mismo scope fallara de forma atomica con `NOMINA_FIREBIRD_RECARGA_FALLIDA`.
