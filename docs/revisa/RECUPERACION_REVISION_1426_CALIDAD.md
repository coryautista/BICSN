# Recuperación REVISA 1426 en Calidad

## Objetivo

Generar el reporte REVISA de la orgánica `04-24-01-01`, período `1426`, después de que la QNA y la Línea de Captura ya fueron aplicadas.

Este procedimiento está restringido a Calidad:

```text
SQL Server: SII-ISSSSPEA
Firebird: /db/db/dbQna1426.fdb
```

No debe ejecutarse contra Producción.

## Reglas Excepcionales

- Concepto 1 de `1426`: nueve fondos en `0.00` cuando no exista concepto 12 de `1326`.
- Esta excepción no aplica a ningún otro período.
- Concepto 2: snapshot recuperado desde `AP_S_FONDOS('04','24','1426')` de la copia Firebird de Calidad.
- Concepto 12: se recalcula mediante `AP_G_SALDO_FONDO('04','24','1426')`.
- Concepto 14: inactivo y fuera del reporte.

## Valores Esperados Del Concepto 2

| Fondo | Importe |
| --- | ---: |
| CAIR | `27,536.45` |
| FRA | `61,956.55` |
| FRE | `318,153.05` |
| FH | `4,818.87` |
| FV | `19,275.28` |
| FAA | `68,840.85` |
| FAE | `34,420.17` |
| FAT | `103,261.02` |
| FAI | `16,930.00` |
| Registros | `169` |

El script aborta si Firebird devuelve un valor diferente.

## Script

Archivo:

```text
scripts/recover-revision-1426-calidad.ts
```

Comando npm:

```text
npm run recover:revision:calidad
```

## Procedimiento

### 1. Compilar

```bash
npm run build
```

### 2. Publicar El Backend Actualizado En Calidad

El worker publicado debe incluir:

- Excepción del concepto 1 para `1426`.
- Concepto 2 desde `RevisionAplicacionHistorico`.
- Conceptos activos obtenidos desde el catálogo.
- Concepto 14 fuera del worker.

No se debe encolar la tarea antes de publicar este código.

### 3. Simular

```bash
npm run recover:revision:calidad
```

El modo predeterminado es `dry-run`. Debe mostrar:

- Base SQL Server `SII-ISSSSPEA`.
- Base Firebird `/db/db/dbQna1426.fdb`.
- Los nueve valores esperados.
- Línea de Captura existente.
- Estado actual del snapshot y la tarea.

No realiza escrituras.

### 4. Ejecutar

```bash
npx tsx scripts/recover-revision-1426-calidad.ts --execute
```

La ejecución:

1. Aplica idempotentemente la tabla `conciliacion.RevisionAplicacionHistorico`.
2. Inserta el snapshot si no existe.
3. Rechaza un snapshot existente con importes diferentes.
4. Crea o reactiva `conciliacion.RevisionTarea`.
5. Conserva la misma tarea si ya está pendiente o procesando.
6. Deja el cálculo al worker REVISA.

### 5. Validar

Consultar:

```http
GET /v1/reportes/revision?periodo=1426&org0=04&org1=24&org2=01&org3=01
```

Resultado esperado:

- Estado `COMPLETADA`.
- Conceptos activos 1 a 13.
- Concepto 1 con nueve fondos en cero.
- Concepto 2 igual al snapshot validado.
- Concepto 12 calculado por `AP_G_SALDO_FONDO`.
- Concepto 14 ausente.
- Archivo de trazabilidad REVISA en SFTP de Calidad.

## Reejecución

El script es idempotente:

- No duplica el snapshot.
- No duplica la tarea.
- Reactiva una tarea `ERROR` o `COMPLETADA` desde cero.
- Aborta si el snapshot almacenado no coincide con la fuente validada.

Antes de repetir `--execute`, revisar el estado del endpoint y el error de la tarea anterior.

## Ejecución Real

La recuperación de `04-24-01-01/1426` se ejecutó correctamente:

```text
Snapshot: 2
Tarea REVISA: 2
Estatus: COMPLETADA
Intentos: 1
Conceptos generados: 1 a 13
Concepto 14: inactivo y sin fila
```

Trazabilidad SFTP:

```text
/Autodeterminacion/Calidad/REVISA/1426/REVISA_2_I1_04240101_1426_20260811_054922_1786427362940_OK.json
```

El concepto 1 quedó en cero. El concepto 2 coincidió con los valores esperados y el concepto 12 se reemplazó con el resultado de `AP_G_SALDO_FONDO`.

## Nota posterior: separación de liberaciones

Esta sección conserva el resultado histórico original. Posteriormente, la regla de liberaciones se dividió en concepto 13 para `LFA`, concepto 15 para `LFM` y concepto 16 para `LFP`. La actualización del período `1426` debe realizarse mediante el reproceso histórico dirigido, sin recalcular los conceptos 1 a 12 ni el Ajuste 14.

El reproceso dirigido de `04-24-01-01/1426` se ejecutó correctamente contra `SII-ISSSSPEA` y `/db/db/dbQna1426.fdb`:

```text
Concepto 13 / LFA: SIN_CAMBIOS, IdRevision 13
Concepto 15 / LFM: INSERT, IdRevision 14
Concepto 16 / LFP: INSERT, IdRevision 15
Registros Firebird LFA/LFM/LFP: 0
Importes de los tres conceptos: 0.00
Históricos nuevos del concepto 13: 0
```

Una previsualización posterior devolvió `SIN_CAMBIOS` para 13, 15 y 16, confirmando que el reproceso es idempotente.

## Nota posterior: saldo final 1326

Se incorporó manualmente el saldo final de la semana `1326` como concepto 12 para `04-24-01-01` y se propagó al concepto 1 de `1426`:

| Fondo técnico | Etiqueta visual | Importe |
| --- | --- | ---: |
| `CAIR` | CAIR | `3,342,051.64` |
| `FRA` | FRA | `6,880,480.89` |
| `FRE` | FRE | `38,807,600.94` |
| `FH` | FH | `582,809.84` |
| `FV` | FV | `2,331,234.67` |
| `FAA` | FAA | `3,413,456.51` |
| `FAE` | FAE | `1,706,376.95` |
| `FAT` | FAT | `5,119,833.46` |
| `FAI` | FAR | `90,879.00` |

Resultado de la transacción:

```text
1326 / concepto 12: INSERT, IdRevision 16
1426 / concepto 1: UPDATE, IdRevision 1
Histórico del concepto 1 anterior en ceros: IdRevisionHistorico 1
Usuario de auditoría: 1601433E-F36B-1410-80A7-00A5CBF95890
```

El script `scripts/recover-revision-saldo-1326.ts` valida el destino, opera de forma transaccional y usa previsualización por defecto. Una previsualización posterior devolvió `SIN_CAMBIOS` para ambos registros.

## Nota posterior: corrección histórica del concepto 13

La fuente Firebird de `04-24-01-01/1426` no conservaba seis movimientos `LFA` aplicados durante el proceso original. Como este reporte no volverá a ejecutarse, se corrigió únicamente la fila vigente del concepto 13 en `conciliacion.Revision`, sin modificar Firebird, tareas REVISA ni otros conceptos.

Agregados de los seis movimientos omitidos:

| Fondo técnico | Etiqueta visual | Importe |
| --- | --- | ---: |
| `FAA` | FAA | `-42,889.69` |
| `FAE` | FAE | `-12,577.02` |
| `FAT` | FAT | `-55,466.71` |
| `FAI` | FAR | `-1,448.00` |
| `CAIR`, `FRA`, `FRE`, `FH`, `FV` | Mismo nombre | `0.00` |

Resultado:

```text
IdRevision: 13
Operación: UPDATE
IdRevisionHistorico: 2
Valor histórico anterior: nueve fondos en 0.00
Registros de origen documentados: 6
```

El script `scripts/recover-revision-concepto13-1426.ts` valida base, orgánica, período, número de concepto e importes previos. Una previsualización posterior devolvió `SIN_CAMBIOS`, confirmando idempotencia.

Corrección posterior: se incorporó `FAT = FAA + FAE`. La fila vigente quedó con `FAT = -55,466.71` y la versión previa con FAT en cero se conservó como `IdRevisionHistorico = 3`.

## Nota posterior: periodicidad anual de conceptos 8 y 11

Se estableció que los conceptos 8 y 11 solo se calculan en períodos `01AA`. Como `1426` no aplica, sus filas se corrigieron a nueve fondos en `0.00` sin consultar ni modificar Firebird:

```text
Concepto 8: UPDATE, IdRevision 8, IdRevisionHistorico 4, FAI anterior 74,326.00
Concepto 11: UPDATE, IdRevision 11, IdRevisionHistorico 5, FAI anterior 141,208.00
```

El script `scripts/recover-revision-anuales-1426.ts` opera en preview por defecto y actualiza ambas filas en una sola transacción. Los conceptos 9 y 10 no fueron modificados.
