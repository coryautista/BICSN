# Lógica de conceptos REVISA

## Propósito

Este documento registra la fuente y la regla de cálculo de cada concepto que genera una fila en `conciliacion.Revision`.

Cada concepto activo debe producir los siguientes importes:

```text
CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI
```

`FAI` es el nombre técnico utilizado en SQL Server, Firebird, tipos TypeScript, respuestas JSON y trazabilidad SFTP. El frontend debe presentar ese mismo valor con la etiqueta visual `FAR`; este cambio visual no modifica contratos ni cálculos del backend.

La identificación de la fila es:

```text
Organica0 + Organica1 + Organica2 + Organica3 + Periodo + IdCatalogoRevision
```

Si una fila vigente cambia, su valor anterior se guarda primero en `conciliacion.RevisionHistorico`. Si no existen cambios, no se genera histórico.

## Concepto 1: Saldo anterior

Estado de implementación: **implementado**.

### Fuente

```text
conciliacion.Revision
```

### Regla

El concepto 1 del período solicitado copia los nueve fondos del concepto 12, Saldo actual, del período inmediatamente anterior y de la misma orgánica.

Ejemplos de período anterior:

```text
1526 -> 1426
0126 -> 2425
```

No se consulta `conciliacion.RevisionHistorico` para calcular el saldo anterior.

### Comportamiento sin antecedente

La primera QNA requiere un saldo actual base registrado manualmente para el período anterior. Para `04-24-01-01` existen saldos base del concepto 12 en `1326` y `1426`.

Excepción de recuperación: para el período `1426`, si no existe concepto 12 de `1326`, el concepto 1 se genera con los nueve fondos en `0.00`. Otros períodos sin antecedente conservan el error `SALDO_ANTERIOR_NO_ENCONTRADO`. Esta excepción ya no aplica a `04-24-01-01/1426` porque el saldo base `1326` fue incorporado posteriormente y el concepto 1 fue actualizado.

## Concepto 2: Aplicación quincenal

Estado de implementación: **implementado**.

### Fuente confirmada

El worker consulta exclusivamente el snapshot SQL Server:

```text
conciliacion.RevisionAplicacionHistorico
```

El snapshot se captura antes de aplicar la QNA en Firebird usando:

```sql
SELECT *
FROM AP_S_FONDOS('04', '24', '1526');
```

Firma declarada:

| Posición | Parámetro | Tipo Firebird |
| ---: | --- | --- |
| 1 | `PORG0` | `VARCHAR(2)` |
| 2 | `PORG1` | `VARCHAR(2)` |
| 3 | `PERIODO` | `VARCHAR(4)` |

Después del `COMMIT`, el concepto 2 no vuelve a consultar Firebird. Esta separación evita leer una QNA que ya cambió por efecto de la aplicación.

### Estructura capturada desde `AP_S_FONDOS`

Datos de identificación y sueldo:

```text
INTERNO, NOMBRE, SUELDOM, OTRAS_PRESTACIONES, QUINQUENIOS, SUELDOQ, OPQ, QQ,
ORG0, ORG1, RFC, ORG2, ORG3, NORG0, NORG1, NORG2, NORG3
```

Importes directos de la aplicación:

```text
SARE, FRA, FRE, FHE, FVE, FAA, FAE, FAT, FAI
```

Saldos anteriores informados por el SP:

```text
SSARE, SFRA, SFRE, SFHE, SFVE, SFAA, SFAE, SFAT, SFAI
```

Totales informados por el SP:

```text
TSARE, TFRA, TFRE, TFHE, TFVE, TFAA, TFAE, TFAT, TFAI
```

Los importes monetarios están declarados en Firebird como enteros escalados a dos decimales.

### Regla de cálculo confirmada

Se suman únicamente los importes directos de todas las filas:

| Fondo destino | Cálculo |
| --- | --- |
| `CAIR` | `SUM(SARE)` |
| `FRA` | `SUM(FRA)` |
| `FRE` | `SUM(FRE)` |
| `FH` | `SUM(FHE)` |
| `FV` | `SUM(FVE)` |
| `FAA` | `SUM(FAA)` |
| `FAE` | `SUM(FAE)` |
| `FAT` | `SUM(FAT)` |
| `FAI` | `SUM(FAI)` |

No se usan los grupos `SSARE...SFAI` ni `TSARE...TFAI` para el concepto 2.

Si el snapshot no existe, REVISA falla con `APLICACION_QUINCENAL_HISTORICO_NO_ENCONTRADO`; no guarda una fila en cero ni reconstruye períodos aplicados desde Firebird.

### Validación realizada para `1526`

Parámetros:

```text
Orgánica: 04-24
Período: 1526
Registros devueltos: 169
```

Sumatorias observadas:

| Fondo | Importe |
| --- | ---: |
| `CAIR` | `27,536.45` |
| `FRA` | `61,956.55` |
| `FRE` | `318,153.05` |
| `FH` | `4,818.87` |
| `FV` | `19,275.28` |
| `FAA` | `68,840.85` |
| `FAE` | `34,420.17` |
| `FAT` | `103,261.02` |
| `FAI` | `0.00` |

Estos valores son evidencia de la consulta realizada y no deben codificarse como constantes. Para nuevas QNA se persistirán en `RevisionAplicacionHistorico` antes de aplicar Firebird.

## Pendiente: `AP_S_MINIMOS`

### Diferencia con la especificación recibida

La especificación inicial indicó:

```text
AP_S_MINIMOS(org0, org1, periodo)
```

La firma real consultada en Firebird es:

```sql
SELECT *
FROM AP_S_MINIMOS(org0, org1);
```

| Posición | Parámetro | Tipo Firebird |
| ---: | --- | --- |
| 1 | `PORG0` | `VARCHAR(2)` |
| 2 | `PORG1` | `VARCHAR(2)` |

El procedimiento obtiene internamente la QNA vigente mediante `AP_D_SELECCION_QNA_SISTEMA(NULL)`.

### Función observada

`AP_S_MINIMOS` identifica trabajadores activos cuyo sueldo mensual está por debajo del salario mínimo configurado y calcula la diferencia quincenal:

```text
SAA = (salario mínimo mensual / 2) - (sueldo mensual / 2)
```

Después calcula fondos mediante `FONDOS_ACT_CALC` y devuelve:

```text
INTERNO, NOMBRE, SAA, SARE, FRA, FRE, FHE, FVE, FAA, FAE, FAT
```

No devuelve `FAI`.

La prueba para `04-24` devolvió cero registros.

### Decisión vigente

`AP_S_MINIMOS` no se utilizará por el momento porque:

- No recibe el período indicado en la especificación original.
- Depende de la QNA vigente interna de Firebird.
- No está definida su participación en el concepto 2 ni en otro concepto.
- No devuelve todos los fondos requeridos por `conciliacion.Revision`.

Debe conservarse como pendiente hasta recibir y validar su regla funcional.

## Conceptos 3, 4 y 5: Altas y bajas

Estado de implementación: **implementados y activos**.

### Fuente confirmada

Los tres conceptos usan el procedimiento seleccionable de Firebird:

```sql
SELECT *
FROM AP_G_FONDOS_ALTBAJ(org0, org1, periodo);
```

Firma declarada:

| Posición | Parámetro | Tipo Firebird |
| ---: | --- | --- |
| 1 | `ORG0` | `VARCHAR(2)` |
| 2 | `ORG1` | `VARCHAR(2)` |
| 3 | `PERIODO` | `VARCHAR(4)` |

### Campos relevantes

Clasificación del movimiento:

```text
CVE_MOVIMIENTO
```

Importes:

```text
SARE, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI
```

Otros campos devueltos por el SP:

```text
INTERNO, RFC, NOMBRES, NOEMPLEADO, SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS,
CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
DESCRIPCION, USUARIO, NORG0, NORG1, NORG2, NORG3,
RECUPERADO, REND_CAIR, VOLUNTARIO, VOLUNTARIO_REND
```

Los datos personales no se guardarán en el reporte JSON de trazabilidad SFTP.

### Clasificación por concepto

| Número | Concepto | Condición |
| ---: | --- | --- |
| 3 | Alta o reingreso | `CVE_MOVIMIENTO = 'AL'` |
| 4 | Baja | `CVE_MOVIMIENTO = 'BA'` |
| 5 | Suspensión y baja | `CVE_MOVIMIENTO = 'LB'` |

Solo se suman los registros que cumplan la condición del concepto correspondiente.

### Mapeo de importes

| Fondo destino | Cálculo por condición |
| --- | --- |
| `CAIR` | `SUM(SARE)` |
| `FRA` | `SUM(FRA)` |
| `FRE` | `SUM(FRE)` |
| `FH` | `SUM(FH)` |
| `FV` | `SUM(FV)` |
| `FAA` | `SUM(FAA)` |
| `FAE` | `SUM(FAE)` |
| `FAT` | `SUM(FAT)` |
| `FAI` | `SUM(FAI)` |

Los importes se guardarán exactamente como los devuelve Firebird. No se multiplicarán por `-1` para Baja ni para Suspensión y baja.

La clasificación contable como entrada o salida se aplicará posteriormente al calcular totales o el saldo actual. `conciliacion.Revision` conservará los valores originales para mantener trazabilidad con la fuente.

Si una condición no devuelve registros, se generará la fila del concepto con los nueve fondos en `0.00`.

### Validación realizada para `1526`

Consulta realizada para la orgánica `04-24`, período `1526`:

```text
AL: 0 registros
BA: 0 registros
LB: 0 registros
```

Esta validación confirma que la consulta y los filtros son aceptados por Firebird, pero no permite comparar importes distintos de cero para esa QNA.

## Concepto 6: Traspaso

Estado de implementación: **implementado y activo**.

### Fuente confirmada

Procedimiento seleccionable de Firebird:

```sql
SELECT *
FROM AP_G_FONDOS_REINGRESO_ORD(periodo);
```

Firma declarada:

| Posición | Parámetro | Tipo Firebird |
| ---: | --- | --- |
| 1 | `PERIODO` | `VARCHAR(4)` |

### Regla de selección

Se consideran únicamente los registros que cumplan:

```sql
TRIM(TIPO_T_R_B) = 'TRASPASO'
AND HORG0 = org0
AND HORG1 = org1
AND HORG2 = '01'
AND HORG3 = '01'
```

La orgánica utilizada es la histórica o de origen, representada por `HORG0`, `HORG1`, `HORG2` y `HORG3`. Las tareas REVISA se programan actualmente con `org2 = '01'` y `org3 = '01'`.

### Mapeo de importes

| Fondo destino | Cálculo |
| --- | --- |
| `CAIR` | `SUM(SARE)` |
| `FRA` | `SUM(FRA)` |
| `FRE` | `SUM(FRE)` |
| `FH` | `SUM(FHE)` |
| `FV` | `SUM(FVE)` |
| `FAA` | `SUM(FAA)` |
| `FAE` | `SUM(FAE)` |
| `FAT` | `SUM(FAT)` |
| `FAI` | `SUM(FAI)` |

Los importes se guardan exactamente como los devuelve Firebird. Si no hay registros para la orgánica y el período, se guarda el concepto 6 con los nueve fondos en `0.00`.

### Regla de período

El procedimiento debe ejecutarse con una QNA par. El período REVISA tiene formato `QQAA`; si `QQ` es impar, se reemplaza por la QNA par inmediata siguiente conservando el año. Si `QQ` ya es par, se utiliza el período original.

Ejemplos:

```text
0126 -> 0226
0326 -> 0426
1526 -> 1626
1626 -> 1626
```

Esta normalización se aplica únicamente al parámetro enviado a `AP_G_FONDOS_REINGRESO_ORD`; el resultado se guarda en el concepto 6 del período REVISA originalmente solicitado.

### Validación para `1526`

La consulta general confirmó registros `TRASPASO` distribuidos por diferentes orgánicas de origen y destino. Para cada tarea REVISA solo se suman los que coincidan con su orgánica `HORG0/HORG1/01/01`; no se guardan datos personales en el reporte SFTP.

## Concepto 7: Capital Constitutivo

Estado: **activo**.

El nombre de catálogo cambió de `Aportación extemporánea` a `Capital Constitutivo`. La descripción en BD conserva la referencia a importes registrados como aportaciones extemporáneas. Este cambio es de presentación; la fuente y la regla de cálculo permanecen sin cambios.

Fuente Firebird: `FONDOS_INICIALES_IND`.

```sql
ORG0 = org0
AND ORG1 = org1
AND PERIODO = periodo
AND TIPO_FONDO = 'AED'
```

| Fondo destino | Cálculo |
| --- | --- |
| `CAIR` | `SUM(CAIR)` |
| `FRA` | `SUM(FRA)` |
| `FRE` | `SUM(FRE)` |
| `FH` | `SUM(FH)` |
| `FV` | `SUM(FV)` |
| `FAA` | `SUM(FAA)` |
| `FAE` | `SUM(FAE)` |
| `FAT` | `SUM(FAA) + SUM(FAE)` |
| `FAI` | `SUM(FAI)` |

`FONDOS_INICIALES_IND` no contiene una columna `FAT`; para este concepto se deriva como `FAA + FAE` conforme a la regla funcional confirmada.

Validación histórica `01-07/2420`: un registro `AED` produjo `FRA=6,459.07`, `FRE=40,651.28`, `FH=565.17`, `FV=2,260.68`, `FAA=8,073.84`, `FAE=4,036.92` y `FAT=12,110.76`.

## Conceptos 8 a 11: Rendimientos anuales

Fuente Firebird: `RENDIMIENTOS_ANUALES`. Los cuatro conceptos filtran por `ORG0` y `ORG1`. `ANO` se obtiene restando uno al año del período REVISA.

```text
1526 -> ANO = '2025'
0127 -> ANO = '2026'
```

Claves funcionales confirmadas:

```text
B = bonificado o capitalizado
E = entregado o devolución
A = activo
L = licencia
```

El resultado se guarda en `FAI = SUM(RENDIMIENTO)` y los otros ocho fondos permanecen en `0.00`.

## Concepto 8: Devolución de intereses a activos

Estado: **activo**.

Periodicidad: se calcula únicamente cuando la quincena del período es `01`. En períodos `02` a `24`, el worker no consulta `RENDIMIENTOS_ANUALES` y guarda los nueve fondos en `0.00` con cero registros de origen.

```sql
TIPO_MOVIMIENTO = 'B'
AND ANO = año del período REVISA - 1
AND STATUS_ORG_PERS = 'A'
AND ORG0 = org0
AND ORG1 = org1
```

## Concepto 9: Devolución de intereses a licencias

Estado: **activo**.

```sql
TIPO_MOVIMIENTO = 'B'
AND ANO = año del período REVISA - 1
AND STATUS_ORG_PERS = 'L'
AND ORG0 = org0
AND ORG1 = org1
```

## Concepto 10: Capitalización de intereses a licencias

Estado: **activo**.

```sql
TIPO_MOVIMIENTO = 'E'
AND ANO = año del período REVISA - 1
AND STATUS_ORG_PERS = 'L'
AND ORG0 = org0
AND ORG1 = org1
```

## Concepto 11: Capitalización de intereses a activos

Estado: **activo**.

Periodicidad: se calcula únicamente cuando la quincena del período es `01`. En períodos `02` a `24`, el worker no consulta `RENDIMIENTOS_ANUALES` y guarda los nueve fondos en `0.00` con cero registros de origen.

```sql
TIPO_MOVIMIENTO = 'E'
AND ANO = año del período REVISA - 1
AND STATUS_ORG_PERS = 'A'
AND ORG0 = org0
AND ORG1 = org1
```

### Evidencia histórica previa a la regla anual

| Concepto | Registros | `FAI` |
| ---: | ---: | ---: |
| 7 | 0 | `0.00` |
| 8 | 72 | `74,326.00` |
| 9 | 0 | `0.00` |
| 10 | 0 | `0.00` |
| 11 | 87 | `141,208.00` |

La metadata de Firebird confirmó que `RENDIMIENTOS_ANUALES` contiene los campos `ORG0` y `ORG1`; ambos filtros forman parte de los conceptos 8 a 11.

Los valores de 8 y 11 observados en `1526` corresponden a una ejecución anterior a la restricción anual y ya no representan el comportamiento vigente. Los conceptos 9 y 10 mantienen su ejecución actual en cualquier quincena.

## Concepto 12: Saldo actual

Estado de implementación: **implementado y activo**.

### Fuente confirmada

Procedimiento seleccionable de Firebird:

```sql
SELECT *
FROM AP_G_SALDO_FONDO(org0, org1, periodo);
```

Firma declarada:

| Posición | Parámetro | Tipo Firebird |
| ---: | --- | --- |
| 1 | `ORG0` | `VARCHAR(2)` |
| 2 | `ORG1` | `VARCHAR(2)` |
| 3 | `PERIODO` | `VARCHAR(4)` |

### Mapeo de importes

El registro del concepto 12 se obtiene sumando los campos de todas las filas devueltas:

| Fondo destino | Cálculo |
| --- | --- |
| `CAIR` | `SUM(SSARE)` |
| `FRA` | `SUM(SFRA)` |
| `FRE` | `SUM(SFRE)` |
| `FH` | `SUM(SFHE)` |
| `FV` | `SUM(SFVE)` |
| `FAA` | `SUM(SFAA)` |
| `FAE` | `SUM(SFAE)` |
| `FAT` | `SUM(SFAT)` |
| `FAI` | `SUM(SFAI)` |

Si el procedimiento no devuelve registros, se guardará el concepto 12 con los nueve fondos en `0.00`.

## Conceptos 13, 15 y 16: Liberaciones con fondo de Ahorro

Estado de implementación: **implementados y activos**.

### Fuente confirmada

```text
FONDOS_INICIALES_IND
```

### Regla de selección

```sql
ORG0 = org0
AND ORG1 = org1
AND PERIODO = periodo
AND TIPO_FONDO = tipo correspondiente al concepto
```

| Concepto | Nombre de catálogo | `TIPO_FONDO` |
| ---: | --- | --- |
| 13 | Liberación de PCP con fondo de Ahorro | `LFA` |
| 15 | Liberación de PMP con fondo de Ahorro | `LFM` |
| 16 | Liberación de HIP con fondo de Ahorro | `LFP` |

No se aplican filtros por `ORG2`, `ORG3` ni `STATUS`.

### Mapeo de importes

| Fondo destino | Cálculo |
| --- | --- |
| `FAA` | `SUM(FAA)` |
| `FAE` | `SUM(FAE)` |
| `FAT` | `SUM(FAA) + SUM(FAE)` |
| `FAI` | `SUM(FAI)` |
| `CAIR`, `FRA`, `FRE`, `FH`, `FV` | `0.00` |

En esta tabla, y únicamente para esta regla funcional, `FAI` representa `FAR`, Fondo de Ahorro Rendimientos o Intereses. `FAT` se deriva como `FAA + FAE`. Si no existen registros se guarda el concepto correspondiente con los nueve fondos en `0.00`.

### Validación para `1526`

Para la orgánica `04-24`, período `1526`, los tipos `LFA`, `LFM` y `LFP` devuelven cero registros. Las ejecuciones nuevas guardan tres filas independientes; los períodos históricos se migran mediante el reproceso dirigido de conceptos PCP.

## Concepto 14: Ajustes

Estado: **administrativo y opcional**.

El worker REVISA reconoce el concepto 14, pero no lo calcula ni consulta fuentes de Firebird para obtenerlo. El proyecto Administrador calcula el ajuste requerido para movimientos ocurridos fuera del proceso normal y envía directamente los nueve importes consolidados al backend.

La captura se realiza mediante:

```http
PUT /v1/reportes/revision/ajustes
```

Reglas:

- Solo un usuario con rol `admin` puede registrar Ajustes.
- El reporte REVISA de la orgánica y período debe existir y estar `COMPLETADA`.
- La primera captura inserta la fila del concepto 14.
- Una captura posterior conserva el valor anterior en `conciliacion.RevisionHistorico` antes de actualizarlo.
- Si los importes y el usuario no cambian, la operación es `SIN_CAMBIOS`.
- Si nunca se captura un ajuste, no existe una fila del concepto 14 y no aparece en el reporte.
- Los importes se conservan con el signo recibido.
- Ajustes no modifica el concepto 12 ni reprocesa los conceptos automáticos 1 a 13, 15 y 16.
- El cuadre que utiliza Ajustes es únicamente visual y se realiza en el proyecto Administrador.
- Administrador muestra Ajustes después de sus filas derivadas `Total` y `Diferencia`, aunque su número de concepto sea 14.
- `Diferencia` se calcula visualmente por fondo como `Total - Saldo actual`; BICSN no persiste esa fila.
- Los valores de Ajustes son libres y pueden ser positivos, negativos o cero. Guardarlos no modifica automáticamente la Diferencia.
