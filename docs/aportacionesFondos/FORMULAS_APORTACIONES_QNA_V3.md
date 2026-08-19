# Formulas de aportaciones QNA V3

## Estado y alcance

Este documento es la referencia normativa para el calculo de aportaciones bajo la politica:

```text
MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3
```

Aplica a la formula `APORTACIONES-NOMINA` para las quincenas cubiertas por una version activa en `aportaciones.FormulaCalculoVersion`.

Documenta exclusivamente la politica V3. Los documentos de politicas V1/V2, planes de migracion y reglas anteriores se conservan como antecedentes, pero no deben usarse para reconstruir el calculo vigente. En caso de contradiccion, prevalecen, en este orden:

1. La version activa en `aportaciones.FormulaCalculoVersion` y sus parametros de dias.
2. Las tasas vigentes del periodo en `aportaciones.CatalogoPorcentajeFondo`.
3. `AportacionesMonetaryKernel.ts` y `AportacionFondoCalculator.ts`.
4. Este documento.

No modificar formulas, tasas, bases ni reglas de redondeo directamente en reportes, frontend o procedimientos historicos.

## Resumen ejecutivo

Para 2026, las formulas vigentes son:

```text
S = redondearBase2(SUELDO_MENSUAL * dias_laborados / 30)
O = redondearBase2(OTRAS_PRESTACIONES_MENSUALES * 15 / 30)
Q = redondearBase2(QUINQUENIOS_MENSUALES * 15 / 30)

CAIR = redondear2(S * 2.00%)

FRA = AFPA = redondear2(S * 4.50%)
FRE = AFPE = redondear2(
  S * 22.25%
  + O * 26.75%
  + Q * 26.75%
)

FH  = redondear2(S * 0.35%)
FV  = redondear2(S * 1.40%)

FAA = redondear2(S * 5.00%)
FAE = redondear2(S * 2.50%)
```

Los componentes se redondean individualmente a centavos. Los totales de afiliado y de fondo se forman sumando esos importes de centavos; no se recalcula un porcentaje sobre un total agregado.

## Fuentes de datos

| Dato | Fuente operativa | Uso |
|---|---|---|
| Poblacion e identificador `INTERNO` | Firebird `ORG_PERSONAL`/`PERSONAL` | Universo de afiliados |
| `SUELDO` | Firebird `ORG_PERSONAL` | Sueldo mensual |
| `OTRAS_PRESTACIONES` | Firebird `ORG_PERSONAL` | Otras prestaciones mensuales |
| `QUINQUENIOS` | Firebird `ORG_PERSONAL` | Quinquenios mensuales |
| `DiasLaborados` | `dbo.NominaAplicacionQnalDetalle` | Dias del periodo con TXT vigente |
| `BaseCotizacionSueldo` | `dbo.NominaAplicacionQnalDetalle` | Sustituye la base proporcional de sueldo cuando hay TXT vigente |
| `BaseCotizacionQuinquenios` | `dbo.NominaAplicacionQnalDetalle` | Sustituye la base quincenal de quinquenios cuando hay TXT vigente |
| Parametros de dias | `aportaciones.FormulaCalculoVersion` y `aportaciones.FormulaCalculoParametro` | Divisor, valor predeterminado y rango |
| Tasas | `aportaciones.CatalogoPorcentajeFondo` | Porcentajes por fondo y vigencia |
| Formula y redondeo | Backend | Orden de operaciones y precision |
| `FAI` | Firebird `AP_S_FONDOS` | Valor externo incorporado al Snapshot |

`AP_S_FONDOS` no es fuente de tasas ni de las formulas de `CAIR`, `FRA`, `FRE`, `FH`, `FV`, `FAA` o `FAE`. Se usa para conciliacion y, especificamente, para incorporar `FAI` al Snapshot. No debe utilizarse para reemplazar los componentes calculados por el backend.

La carga TXT se selecciona por ano, quincena y ambito organico. El detalle se cruza por el `CargaId` seleccionado y el RFC normalizado. Con TXT vigente, sus bases de cotizacion prevalecen; sin TXT, se conservan las bases derivadas de `ORG_PERSONAL`. `OTRAS_PRESTACIONES` siempre procede de Firebird.

## Simbolos

| Simbolo | Descripcion |
|---|---|
| `d` | Dias laborados resueltos para el RFC |
| `SM` | Sueldo mensual de Firebird |
| `OM` | Otras prestaciones mensuales de Firebird |
| `QM` | Quinquenios mensuales de Firebird |
| `ST` | Base de cotizacion de sueldo del TXT vigente |
| `QT` | Base de cotizacion de quinquenios del TXT vigente |
| `S` | Sueldo proporcional con base cerrada a dos decimales |
| `O` | Otras prestaciones quincenales con base cerrada a dos decimales |
| `Q` | Quinquenios quincenales con base cerrada a dos decimales |
| `R2(x)` | Redondeo del componente `x` a dos decimales |

## Resolucion de dias laborados

Parametros 2026:

| Parametro | Valor | Significado |
|---|---:|---|
| `DIAS_MES` | `30` | Divisor mensual |
| `DIAS_DEFAULT_SIN_TXT` | `15` | Dias usados sin TXT o sin movimiento coincidente |
| `DIAS_MIN` | `0` | Limite inferior aceptado |
| `DIAS_MAX` | `15` | Limite superior aceptado |

Reglas:

1. Si hay TXT y el RFC coincide, se usa `DiasLaborados` del TXT.
2. Si hay TXT pero el RFC no coincide, el calculo se rechaza con error de integridad de nomina.
3. Si la fuente es movimiento y el RFC coincide, se usan sus dias.
4. Sin TXT o sin movimiento coincidente, se usan `15` dias.
5. Un valor fuera de `[0, 15]` detiene el calculo.

Sin TXT, los dias reales afectan solamente la base de sueldo `S`. Otras prestaciones conservan la proporcion quincenal fija `15/30`.

## Bases de calculo

### Sueldo proporcional

```text
con TXT: S = redondearBase2(ST)
sin TXT: S = redondearBase2(SM * d / 30)
```

`redondearBase2` conserva el comportamiento historico implementado con `Number(...).toFixed(2)`. El valor queda cerrado a centavos antes de aplicar cualquier tasa y se representa como D6 agregando cuatro ceros.

Ejemplo:

```text
SM = 10,000.00
d  = 15
S  = 5,000.00
representacion D6 = 5000.000000
```

### Otras prestaciones

```text
O = redondearBase2(OM * 15 / 30)
```

Para la configuracion 2026 equivale a:

```text
O = redondearBase2(OM / 2)
```

### Quinquenios

```text
con TXT: Q = redondearBase2(QT)
sin TXT: Q = redondearBase2(QM * 15 / 30)
```

Para la configuracion 2026 equivale a:

```text
Q = redondearBase2(QM / 2)
```

Los valores nulos de `BaseCotizacionSueldo` o `BaseCotizacionQuinquenios` en un RFC perteneciente al TXT vigente detienen el calculo. El valor monetario `0.00` es valido.

La base informativa mostrada como `sueldo_base_d6` es:

```text
BASE_INFORMATIVA = S + O + Q
```

Esta suma no debe multiplicarse por una tasa general. Cada componente usa las bases especificadas a continuacion.

## Tasas 2026

| Fondo | Catalogo | Tasa derivada | Componente |
|---|---:|---:|---|
| CAIR patron | `2.00%` | `2.00%` | `CAIR` |
| Prestaciones afiliado | `4.50%` | `4.50%` sobre sueldo | `FRA` / `AFPA` |
| Prestaciones patron | `22.25%` | `22.25%` sobre sueldo | Parte de `FRE` / `AFPE` |
| Prestaciones combinada | `22.25% + 4.50%` | `26.75%` sobre otras y quinquenios | Parte de `FRE` / `AFPE` |
| Vivienda patron | `1.75%` | `20%` del fondo = `0.35%` | `FH` |
| Vivienda patron | `1.75%` | `80%` del fondo = `1.40%` | `FV` |
| Ahorro afiliado | `5.00%` | `5.00%` | `FAA` |
| Ahorro patron | `2.50%` | `2.50%` | `FAE` |

Las tasas se reconstruyen para el periodo desde `CatalogoPorcentajeFondo`; no deben duplicarse como constantes en otra capa.

## Formulas por componente

### CAIR

```text
CAIR = R2(S * 0.0200)
```

Solo usa sueldo proporcional. El cierre del fondo es:

```text
CAIR_FONDO = CAIR
```

### Prestaciones economicas

Componente del afiliado:

```text
FRA = AFPA = R2(S * 0.0450)
```

`FRA/AFPA` no incluye otras prestaciones ni quinquenios.

Componente patronal:

```text
FRE = AFPE = R2(
  S * 0.2225
  + O * 0.2675
  + Q * 0.2675
)
```

Regla critica: en `FRE/AFPE` se suman los tres productos a precision interna y se redondea una sola vez por afiliado. Es incorrecto redondear cada producto por separado antes de sumarlos.

Total por afiliado y cierre del fondo:

```text
PRESTACIONES_AFILIADO = FRA + FRE
PRESTACIONES_FONDO = TOTAL_FRA + TOTAL_FRE
```

### Vivienda

```text
FH = R2(S * 0.0035)
FV = R2(S * 0.0140)
VIVIENDA_AFILIADO = FH + FV
VIVIENDA_FONDO = TOTAL_FH + TOTAL_FV
```

`FH` y `FV` se redondean individualmente antes de sumarse.

### Ahorro

```text
FAA = R2(S * 0.0500)
FAE = R2(S * 0.0250)
FAT_AFILIADO = FAA + FAE
FAT_FONDO = TOTAL_FAA + TOTAL_FAE
```

`FAA` corresponde al afiliado y `FAE` al patron.

### FAI

`FAI` no se calcula mediante las tasas anteriores. El Snapshot V3 lo incorpora desde el resultado de Firebird `AP_S_FONDOS` y valida que exista un registro para cada `INTERNO` del universo congelado.

No derivar `FAI` de `FAT`, `FAA` o `FAE` sin una nueva regla aprobada y versionada.

## Politica de precision

La politica V3 trabaja internamente hasta nueve decimales, pero sus bases y hojas monetarias oficiales quedan cerradas a centavos.

Reglas obligatorias:

1. `S`, `O` y `Q` se cierran a dos decimales antes de aplicar tasas.
2. Cada componente por afiliado se redondea a dos decimales.
3. El redondeo de componentes usa mitad alejandose de cero.
4. Los valores se exponen como D6, por ejemplo `125.000000`, para conservar contratos exactos.
5. D6 no significa que el componente tenga fracciones oficiales menores a un centavo en V3.
6. Los componentes de fondo se obtienen sumando las hojas individuales ya cerradas a centavos.
7. Los cierres de fondo se obtienen sumando componentes A2 exactos.
8. No usar `number`, `parseFloat`, `Math.round` ni sumas de coma flotante para reconstruir totales oficiales fuera del kernel.

Identidades obligatorias:

```text
CAIR_FONDO = CAIR
PRESTACIONES = FRA + FRE
VIVIENDA = FH + FV
FAT = FAA + FAE
```

## Ejemplo completo por afiliado

Entradas:

```text
SM = 10,000.00
OM =  2,000.00
QM =    600.00
d  =         15
```

Bases:

```text
S = R2(10,000.00 * 15 / 30) = 5,000.00
O = R2( 2,000.00 * 15 / 30) = 1,000.00
Q = R2(   600.00 * 15 / 30) =   300.00
```

Componentes:

```text
CAIR = R2(5,000.00 * 0.0200) = 100.00

FRA  = R2(5,000.00 * 0.0450) = 225.00
FRE  = R2(
         5,000.00 * 0.2225
       + 1,000.00 * 0.2675
       +   300.00 * 0.2675
       )
     = R2(1,112.50 + 267.50 + 80.25)
     = 1,460.25

FH   = R2(5,000.00 * 0.0035) =  17.50
FV   = R2(5,000.00 * 0.0140) =  70.00

FAA  = R2(5,000.00 * 0.0500) = 250.00
FAE  = R2(5,000.00 * 0.0250) = 125.00
```

Totales del afiliado:

```text
CAIR          =   100.00
PRESTACIONES  =   225.00 + 1,460.25 = 1,685.25
VIVIENDA      =    17.50 +    70.00 =    87.50
FAT / AHORRO  =   250.00 +   125.00 =   375.00
```

## Agregacion y Liquidacion QNA

Para cada componente, el Snapshot suma las hojas individuales A2:

```text
TOTAL_FRA = suma(FRA de cada afiliado)
TOTAL_FRE = suma(FRE de cada afiliado)
TOTAL_FH  = suma(FH de cada afiliado)
TOTAL_FV  = suma(FV de cada afiliado)
TOTAL_FAA = suma(FAA de cada afiliado)
TOTAL_FAE = suma(FAE de cada afiliado)
```

Despues forma los fondos:

```text
TOTAL_PRESTACIONES = TOTAL_FRA + TOTAL_FRE
TOTAL_VIVIENDA = TOTAL_FH + TOTAL_FV
TOTAL_AHORRO = TOTAL_FAA + TOTAL_FAE
```

La Liquidacion QNA agrega a esos fondos las fuentes que no pertenecen a esta formula:

```text
TOTAL_APORTACIONES =
  TOTAL_AHORRO
  + TOTAL_VIVIENDA
  + TOTAL_PRESTACIONES
  + TOTAL_CAIR
  + GUARDERIAS
  + TRANSITORIO
  + AGUINALDO

TOTAL_RETENCIONES = PCP + PMP + HIP
TOTAL_GENERAL = TOTAL_APORTACIONES + TOTAL_RETENCIONES
```

Guarderias, transitorio, aguinaldo y retenciones se incorporan desde sus fuentes operativas con sus propias reglas de precision. No deben recibir las tasas de aportaciones descritas en este documento.

## Nombres equivalentes

| Concepto normativo | Campo backend/API | Significado |
|---|---|---|
| `FRA` | `afpa`, `afpa_d6` | Prestaciones, afiliado |
| `FRE` | `afpe`, `afpe_d6` | Prestaciones, patron |
| `FH` | `fh_d6` | Vivienda, 20% del porcentaje patronal |
| `FV` | `fv_d6` | Vivienda, 80% del porcentaje patronal |
| Vivienda total | `afe`, `afe_d6`, `total_d6` | `FH + FV` |
| `FAA` | `afaa`, `afaa_d6` | Ahorro, afiliado |
| `FAE` | `afae`, `afae_d6` | Ahorro, patron |
| `FAT` | `total`, `total_d6` en ahorro | `FAA + FAE` |
| `CAIR` | `afe`, `afe_d6`, `total_d6` en CAIR | CAIR patronal |

Los nombres `AFPA` y `AFPE` de la API corresponden respectivamente a `FRA` y `FRE` en el Snapshot. No intercambiar afiliado y patron.

## Validaciones del Snapshot V3

Antes de utilizar un Snapshot para aplicar una QNA se debe comprobar:

- Misma poblacion de `INTERNO` en ahorro, vivienda, prestaciones, CAIR y FAI.
- Sin `INTERNO` duplicados.
- Dias dentro del rango versionado.
- Formula activa correspondiente al anio y quincena.
- Cuatro fondos vigentes en `CatalogoPorcentajeFondo`.
- Politica `MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3`.
- Version de esquema `3`.
- Identidades de cierre de componentes y fondos.
- Hash de contenido inmutable.
- Aprobacion atribuida al usuario que confirma `Aplicar quincena`.

## Procedimiento para cambiar una formula

Una formula vigente no debe editarse en sitio ni cambiarse solamente en TypeScript.

Para introducir una regla nueva:

1. Documentar la justificacion y ejemplos esperados.
2. Crear una nueva version en `aportaciones.FormulaCalculoVersion`.
3. Versionar sus parametros y vigencia por anio/quincena.
4. Actualizar el kernel o la calculadora si cambia el orden de operaciones.
5. Definir una nueva `PrecisionPolicy` si cambia cualquier regla de base, redondeo o agregacion.
6. Agregar pruebas por afiliado, fondo, Snapshot y Liquidacion.
7. Conciliar contra un periodo dorado sin modificar sus datos para forzar coincidencias.
8. Actualizar este documento en la misma entrega.

No reutilizar el identificador V3 para una formula con comportamiento diferente.

## Fuentes de verdad en el repositorio

| Archivo | Responsabilidad |
|---|---|
| `src/modules/aportacionesFondos/domain/entities/FormulaCalculo.ts` | Identificador de politica y parametros requeridos |
| `src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.ts` | Resolucion de version, dias y tasas del catalogo |
| `src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.ts` | Bases, formulas y redondeo exacto |
| `src/modules/aportacionesFondos/domain/services/AportacionFondoCalculator.ts` | Mapeo de componentes por fondo |
| `src/modules/aportacionesFondos/domain/services/NominaDiasLaboradosResolver.ts` | Resolucion de dias y origen |
| `src/modules/aportacionesFondos/domain/services/SnapshotCalculoV2Factory.ts` | Agregacion A2 e invariantes del Snapshot |
| `src/modules/liquidacionQna/application/commands/CreateAndPromoteQnaCandidateCommand.ts` | Composicion de la Liquidacion QNA |
| `database/migrations/20260818_06_add_official_fund_totals.sql` | Creacion de la formula SQL oficial V3 |

## Consulta de diagnostico

Antes de investigar una diferencia, identificar la version exacta usada por el periodo:

```sql
SELECT
  f.FormulaCalculoVersionId,
  f.ClaveFormula,
  f.AnioVigencia,
  f.NumeroVersion,
  f.QuincenaDesde,
  f.QuincenaHasta,
  f.PrecisionPolicy,
  f.Estado,
  p.ClaveParametro,
  p.Valor,
  p.Unidad,
  p.Fuente
FROM aportaciones.FormulaCalculoVersion AS f
INNER JOIN aportaciones.FormulaCalculoParametro AS p
  ON p.FormulaCalculoVersionId = f.FormulaCalculoVersionId
WHERE f.ClaveFormula = 'APORTACIONES-NOMINA'
  AND f.AnioVigencia = @Anio
  AND @Quincena BETWEEN f.QuincenaDesde AND f.QuincenaHasta
ORDER BY f.NumeroVersion DESC, p.ClaveParametro;
```

Verificar por separado las tasas anuales:

```sql
SELECT
  CatalogoPorcentajeFondoId,
  TipoFondo,
  AnioVigencia,
  PorcentajePatron,
  PorcentajeAfiliado,
  Vigente
FROM aportaciones.CatalogoPorcentajeFondo
WHERE AnioVigencia = @Anio
ORDER BY TipoFondo;
```

Estas consultas son de diagnostico. La aplicacion debe seguir resolviendo la formula mediante `FormulaCalculoRepository`.
