# Plan de correccion de conceptos de movimientos despues de QNA

## Estado

**EJECUTADO EN DESARROLLO EL 2026-09-19.**

Este documento registra la evidencia encontrada en Desarrollo y define el orden seguro para:

1. impedir que la aplicacion QNA vuelva a calcular los conceptos asociados a movimientos;
2. restaurar los importes del concepto 3 de `1526` al estado anterior a la aplicacion QNA;
3. conservar trazabilidad completa antes y despues del ajuste.

La ejecución quedó limitada al alcance documentado. No autoriza reprocesos adicionales.

## Alcance

Ambiente y alcance analizados:

| Dato | Valor |
|---|---|
| Ambiente | Desarrollo |
| SQL Server | `SII-ISSSSPEA-DES` |
| Firebird | `/db/db/dbRestaura.fdb` |
| Entidad | `1` |
| Periodo | `1526` |
| Organica | `04/24/01/01` |
| Snapshot QNA | `120482` |
| Tarea REVISA posterior a QNA | `1` |

Quedan fuera de este plan:

- revertir la aplicacion Firebird de `1526`;
- modificar la linea de pago de `1526`;
- modificar los conceptos 2 y 6 a 16;
- modificar la bitacora abierta para `1626`;
- reprocesar otros periodos u organicas.

## Regla funcional confirmada

Los conceptos `1`, `3`, `4` y `5` pertenecen al cierre de la aplicacion de movimientos. Deben calcularse cuando finaliza ese flujo, despues de autorizar y aplicar los movimientos correspondientes, incluida la finalizacion valida sin movimientos pendientes.

La aplicacion QNA no debe volver a calcular ni actualizar esos cuatro conceptos. El worker posterior a QNA debe completar los demas conceptos automaticos sin alterar la evidencia producida por el flujo de movimientos.

## Causa identificada

`GenerarRevisionMovimientosService` genera correctamente los conceptos `1`, `3`, `4` y `5` durante la finalizacion de movimientos.

Sin embargo, `RevisionWorker` incluye nuevamente esos conceptos entre sus definiciones automaticas. La tarea programada despues de aplicar QNA los calcula y los entrega otra vez a `RevisionRepository.guardarRevisiones`. La persistencia actual considera también el vínculo con el snapshot para decidir si existe un cambio, por lo que puede actualizar una fila aunque sus importes sean iguales.

La tarea `RevisionTarea=1`, asociada al snapshot `120482`, se ejecuto el 19 de septiembre de 2026 entre `06:15:17Z` y `06:15:24Z` y actualizo los cuatro registros.

## Evidencia de `1526`

### Comparacion funcional

| Concepto | IdRevision | Historico previo | Importes cambiaron | Resultado |
|---|---:|---:|---|---|
| 1 - Saldo anterior | 6 | 2 | No | Conservar |
| 3 - Alta o reingreso | 7 | 3 | **Si** | Candidato a restauracion |
| 4 - Baja | 8 | 4 | No | Conservar |
| 5 - Suspension y baja | 9 | 5 | No | Conservar |

Los conceptos 1, 4 y 5 cambiaron sus metadatos de actualizacion y quedaron vinculados al snapshot `120482`, pero sus once importes funcionales no cambiaron. Este plan no propone restaurarlos porque el criterio acordado es corregir solo conceptos cuyos importes fueron alterados.

### Concepto 3 antes de QNA

Fuente: `conciliacion.RevisionHistorico.IdRevisionHistorico=3`.

| Fondo | Importe anterior |
|---|---:|
| CAIR | 0.00 |
| FRA | 0.00 |
| FRE | 0.00 |
| PRESTACIONES | 0.00 |
| FH | 0.00 |
| FV | 0.00 |
| VIVIENDA | 0.00 |
| FAA | 0.00 |
| FAE | 0.00 |
| FAT | 0.00 |
| FAI | 0.00 |

El registro anterior no estaba vinculado a un snapshot de liquidacion.

### Concepto 3 despues de QNA

Fuente: `conciliacion.Revision.IdRevision=7`.

| Fondo | Importe actual |
|---|---:|
| CAIR | 83.69 |
| FRA | 188.31 |
| FRE | 931.09 |
| PRESTACIONES | 0.00 |
| FH | 14.65 |
| FV | 58.59 |
| VIVIENDA | 0.00 |
| FAA | 209.23 |
| FAE | 104.62 |
| FAT | 313.85 |
| FAI | 0.00 |

La fila actual esta vinculada al snapshot `120482` y fue actualizada por el worker posterior a QNA.

## Estrategia de correccion

La correccion debe ejecutarse en dos fases y en este orden obligatorio.

### Fase 1: impedir nuevas sobrescrituras

1. Retirar los conceptos `1`, `3`, `4` y `5` de las definiciones calculadas por `RevisionWorker`.
2. Mantener su generacion en `GenerarRevisionMovimientosService`.
3. No eliminar las filas existentes del reporte: las consultas de REVISA deben seguir leyendolas junto con los conceptos generados por QNA.
4. Confirmar que el worker posterior a QNA continue calculando los conceptos `2`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `13`, `15` y `16` cuando esten activos.
5. Mantener el concepto `14` como captura administrativa, fuera del calculo automatico.

### Fase 2: restaurar el concepto 3 de `1526`

Crear un script dirigido con modo de previsualizacion predeterminado y ejecucion explicita mediante `--execute`.

El script debe:

1. ejecutar `npm run verify:database:environments` antes de cualquier operacion;
2. rechazar cualquier base distinta de `SII-ISSSSPEA-DES`;
3. fijar y validar exactamente periodo `1526`, organica `04/24/01/01`, concepto `3`, `IdRevision=7` e historico fuente `3`;
4. comprobar que la tarea `1` esta `COMPLETADA` y que no existe otra tarea REVISA activa para el mismo alcance;
5. comprobar que los importes actuales coinciden exactamente con los valores posteriores a QNA documentados arriba;
6. comprobar que el historico fuente contiene exactamente los once importes anteriores en cero;
7. adquirir un bloqueo transaccional para el alcance antes de modificar datos;
8. insertar en `conciliacion.RevisionHistorico` una copia completa del estado actual del concepto 3;
9. restaurar en `conciliacion.Revision` los once importes desde el historico `3`;
10. restaurar `LiquidacionSnapshotId` al valor anterior, `NULL`, para eliminar el vinculo introducido por el reproceso QNA;
11. conservar `IdRevision=7`, `FechaAlta`, organica, periodo, catalogo y estatus;
12. establecer `FechaActualizacion` con la fecha de la correccion y registrar un usuario operativo identificable;
13. confirmar que ninguna otra fila de `conciliacion.Revision` fue modificada;
14. hacer rollback ante cualquier diferencia de precondiciones.

No se debe reutilizar directamente `RevisionRepository.guardarRevisiones` para la restauracion porque su regla `COALESCE(@liquidacionSnapshotId, LiquidacionSnapshotId)` no permite devolver el vínculo del snapshot a `NULL`.

## Pruebas requeridas

### Contratos y unidad

- El worker QNA no invoca calculadores de conceptos `1`, `3`, `4` o `5`.
- El worker QNA no entrega esos conceptos a `guardarRevisiones`.
- La finalizacion de movimientos sigue generando exactamente `[1, 3, 4, 5]`.
- Las ramas con cero movimientos y sin aprobados pendientes mantienen esa generacion.
- El reporte completo sigue incluyendo las filas preexistentes `1`, `3`, `4` y `5`.

### Integracion en Desarrollo

- Previsualizacion del script devuelve una sola operacion prevista: `UPDATE` de `IdRevision=7`.
- La ejecucion crea exactamente un nuevo historico para `IdRevision=7`.
- Los once importes vigentes del concepto 3 quedan en `0.00`.
- `LiquidacionSnapshotId` del concepto 3 queda `NULL`.
- Los conceptos 1, 4 y 5 conservan sus importes e identificadores.
- Los conceptos 2 y 6 a 16 no cambian.
- La tarea REVISA `1`, la aplicacion QNA `1526`, su linea de pago y la bitacora `1626` no cambian.
- Una segunda ejecucion del script devuelve `SIN_CAMBIOS`.

### Regresion funcional futura

En una QNA controlada posterior:

1. autorizar y finalizar movimientos;
2. capturar los valores resultantes de conceptos `1`, `3`, `4` y `5`;
3. aplicar QNA y esperar la finalizacion del worker REVISA;
4. comprobar que esos cuatro registros conservan importes, metadatos y vinculo de snapshot;
5. comprobar que el resto del reporte automatico fue generado normalmente.

## Orden de ejecucion propuesto

1. Aprobar este alcance funcional y la restauracion exclusiva del concepto 3.
2. Implementar el cambio de `RevisionWorker` y sus pruebas.
3. Ejecutar build y regresiones REVISA/QNA.
4. Desplegar o activar el cambio en Desarrollo.
5. Crear el script dirigido de restauracion.
6. Ejecutar el script en modo previsualizacion y guardar la evidencia.
7. Revisar y aprobar la previsualizacion.
8. Ejecutar con `--execute`.
9. ejecutar las verificaciones posteriores y guardar la evidencia.
10. Documentar el resultado real en este archivo sin reemplazar la evidencia previa.

## Criterios de no ejecucion

La restauracion debe detenerse si ocurre cualquiera de estas condiciones:

- el ambiente no es Desarrollo;
- la matriz SQL Server/Firebird no coincide;
- `IdRevision=7` ya no representa el concepto 3 del alcance esperado;
- los importes actuales o historicos no coinciden exactamente con este documento;
- existe una tarea REVISA activa para `1526`;
- aparece un historico posterior no evaluado;
- el cambio de `RevisionWorker` no ha sido validado;
- la transaccion no puede adquirir el bloqueo requerido.

## Resultado esperado

Al terminar ambas fases:

- el concepto 3 de `1526` tendra los importes anteriores a QNA;
- el ajuste conservara evidencia antes y despues en `RevisionHistorico`;
- futuras aplicaciones QNA no modificaran los conceptos `1`, `3`, `4` y `5`;
- esos conceptos solo se generaran durante la finalizacion del flujo de movimientos autorizados.

## Resultado ejecutado

### Cambio de codigo

- `RevisionWorker` ya no contiene calculadores para los conceptos `1`, `3`, `4` y `5`.
- Esos conceptos se reconocen como gestionados por movimientos para que la validacion del catalogo activo no falle.
- `GenerarRevisionMovimientosService` conserva la generacion exclusiva de `[1, 3, 4, 5]`.
- La prueba `test:revision:movimientos` valida ambas condiciones.

### Restauracion de datos

Se agregó `scripts/restore-revision-concepto3-1526-desarrollo.ts` con previsualizacion predeterminada, confirmacion explicita, bloqueo transaccional y validaciones de ambiente, alcance, tarea, importes y snapshot.

Resultado de la ejecución:

| Dato | Resultado |
|---|---|
| Base | `SII-ISSSSPEA-DES` |
| IdRevision restaurado | `7` |
| Concepto | `3` |
| Histórico fuente | `3` |
| Nuevo histórico del estado sustituido | `6` |
| Importes vigentes | once importes en `0.00` |
| LiquidacionSnapshotId vigente | `NULL` |
| Usuario de operación | `CORRECCION_REVISA_QNA_1526` |

El histórico `6` conserva los importes que había escrito QNA y su vínculo al snapshot `120482`. Los conceptos 1, 4 y 5 conservaron sus importes e identificadores. Una previsualizacion posterior devolvio `SIN_CAMBIOS`, confirmando idempotencia.

### Comandos

```text
npm run preview:revision:concepto3-1526:desarrollo
npm run restore:revision:concepto3-1526:desarrollo
```
