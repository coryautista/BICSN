# Plan De Ajuste De Precision Monetaria

> [!WARNING]
> **Estado documental:** DEPRECADO COMO PROPUESTA; NUNCA ACTIVADO EN PRODUCCION.
>
> **Sustituido por:** [POLITICA_PRECISION_MONETARIA_DETAIL6_AGG2_TRUNC_V1.md](./POLITICA_PRECISION_MONETARIA_DETAIL6_AGG2_TRUNC_V1.md)
>
> **Motivo:** esta propuesta finalizaba cada hoja monetaria a dos decimales antes de agregar (`LEAF2`). La politica sucesora conserva detalle y total de fila a seis decimales y finaliza los agregados a dos (`DETAIL6-AGG2-TRUNC`).
>
> Este archivo se conserva integro para trazabilidad. Su deprecacion no afirma que haya sido implementado ni aprobado.

## Estado

Propuesto. No se debe aplicar ninguna conversion de precision sin aprobar la politica, completar las pruebas de sombra y cerrar los bloqueadores documentados en este plan.

## Objetivo

Eliminar las diferencias entre detalle, encabezados, totales globales, historicos, exportaciones y linea de captura causadas por calcular a seis decimales y presentar o persistir importes a dos decimales con reglas distintas.

El primer corte funcional cubre Ahorro, Vivienda, Prestaciones y CAIR. Los demas dominios se incorporan solo despues de resolver sus reglas de negocio y contratos propios.

## Alcance

Incluye:

- Calculo de aportaciones activas.
- Resumenes por registro, fondo, aportaciones, retenciones y gran total.
- Persistencia y lectura de historicos.
- Contratos API entre BICSN y Entidad.
- CSV, TXT, PDF y linea de captura.
- Pruebas y despliegue gradual.

Excluye del primer corte:

- Guarderias, hasta definir su importe oficial.
- Transitorio, hasta corregir su contrato Firebird, TypeScript y SQL Server.
- Aguinaldo, hasta unificar su tabla de detalle de escritura y lectura.
- Retenciones y linea de captura, hasta corregir sus fuentes incompletas y agregados inconsistentes.
- Reescritura de historicos ya finalizados.

## Politica Normativa

Identificador de politica: `MXN-TRUNC2-LEAF-v1`.

### Escalas

| Concepto | Escala | Uso |
|---|---:|---|
| `CalcMoney6` | 6 | Valores intermedios de formulas y bases de calculo. |
| `FinalMoney2` | 2 | Importe pagable, persistido, exportado y mostrado como oficial. |
| `FinalCents` | Entero | Representacion aritmetica del importe final a dos decimales. |
| Porcentajes | 6 | Tasas vigentes de catalogo. |
| Dias trabajados | 2 | Dato de nomina usado para bases proporcionales. |

### Orden Obligatorio

```text
fuentes exactas
-> bases CalcMoney6
-> formula CalcMoney6
-> truncar cada hoja monetaria a FinalMoney2
-> convertir cada hoja a FinalCents
-> total de fila = suma de centavos de hojas
-> total de fondo = suma de centavos de filas
-> total general = suma de centavos de fondos
```

La operacion prohibida es truncar un agregado de valores a seis decimales despues de sumarlos:

```text
Incorrecto: truncar2(AFPE6 + AFPA6)
Correcto:   truncar2(AFPE6) + truncar2(AFPA6)
```

### Truncamiento Hacia Cero

La regla final es truncar, no redondear:

```text
T2(x) = signo(x) * floor(abs(x) * 100) / 100
```

| CalcMoney6 | FinalMoney2 |
|---:|---:|
| `1.239999` | `1.23` |
| `1.230000` | `1.23` |
| `0.009999` | `0.00` |
| `-1.239999` | `-1.23` |
| `-0.009999` | `0.00` |
| `2221.396613` | `2221.39` |

No se permite producir ni serializar `-0.00`.

### Restricciones De Implementacion

- No usar `float`, `number`, `Number.EPSILON`, `Math.round`, `toFixed`, ni recorte de cadenas para decidir importes oficiales.
- No usar conversion implicita de SQL Server o del driver `mssql` como regla de negocio.
- No recalcular importes historicos usando porcentajes o datos de nomina actuales.
- No mezclar dos politicas de precision en una misma liquidacion.
- No convertir errores o fuentes no disponibles en importes cero.

## Situacion Actual Confirmada

### Calculo Activo

`src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts` usa `MONEY_SCALE = 1_000_000`, `Math.round` y valores JavaScript `number` para calcular y sumar a seis decimales.

Los importes individuales se calculan a seis decimales y los encabezados suman esos importes antes de que Entidad los pinte a dos. Esto permite que una suma manual de filas visibles no coincida con el total oficial.

### Persistencia

La base productiva inspeccionada usa `decimal(19,6)` para los detalles, encabezados y TVP `_V2` de Ahorro, Vivienda, Prestaciones y CAIR.

El archivo local `database/migrations/create_aportaciones_historico_tables.sql` no representa la base productiva: define varias columnas como `decimal(18,2)`, usa una base distinta y no contiene los TVP ni procedimientos activos. No debe ejecutarse como migracion de precision.

### Entidad Y Exportaciones

Entidad muestra moneda a dos decimales, pero recibe y agrega datos a seis en varios flujos. CSV/TXT/PDF alternan entre `Intl.NumberFormat` y `toFixed(2)`, por lo que un mismo valor puede diferir un centavo entre pantalla y archivo.

### Historicos

El endpoint de aplicacion quincenal devuelve importes almacenados. Otro endpoint historico recalcula importes con porcentajes, dias de nomina y datos actuales. Ambos no pueden ser fuentes oficiales del mismo historico.

## Bloqueadores Separados

Los siguientes puntos son defectos o decisiones independientes. No deben ocultarse dentro del cambio de precision.

| Id | Bloqueador | Accion requerida |
|---|---|---|
| B-01 | AFPE activo no coincide con la formula documentada de prestaciones. | Corregir en una entrega separada antes de activar la nueva politica para Prestaciones. |
| B-02 | Guarderias usa `recibo_total`, `titular_monto` y `titular + entidad` segun el flujo. | Negocio debe definir una unica hoja monetaria oficial. |
| B-03 | Transitorio interpreta campos Firebird con tipos incompatibles. | Corregir contratos antes de aplicar una politica monetaria. |
| B-04 | Aguinaldo guarda y consulta tablas de detalle diferentes. | Unificar escritura, lectura y linea de captura. |
| B-05 | Linea de captura puede omitir retenciones cuando hay resumen sin detalle. | Reconciliar fuentes antes de generar pagos. |
| B-06 | Fuentes Firebird fallidas pueden terminar en snapshots vacios con `REPLACE`. | Implementar estados de completitud y bloquear reemplazos incompletos. |
| B-07 | El porcentaje vigente no se resuelve por periodo ni se guarda como snapshot. | Versionar tasa, catalogo y formula por liquidacion. |

## Formulas Del Primer Corte

### Ahorro

```text
SP = Q6(sueldo / 30 * dias)
AFAE = T2(Q6(SP * porcentaje_patron))
AFAA = T2(Q6(SP * porcentaje_afiliado))
TotalFila = AFAE + AFAA
```

### Vivienda

```text
SP = Q6(sueldo / 30 * dias)
AFE = T2(Q6(SP * porcentaje_patron))
TotalFila = AFE
```

### CAIR

```text
SP = Q6(sueldo / 30 * dias)
AFE = T2(Q6(SP * porcentaje_patron_vigente))
TotalFila = AFE
```

El porcentaje se obtiene del servicio de catalogo para CAIR. No se fija en frontend, exportaciones, historicos ni formulas.

### Prestaciones

La precision se implementa solo despues de corregir B-01. La formula documentada es:

```text
SP = Q6(sueldo / 30 * dias)
OP = Q6(otras_prestaciones / 30 * dias)
Q = BaseCotizacionQuinquenios ?? quinquenios / 2
SB = Q6(SP + OP + Q)

AFPE = T2(Q6(SB * porcentaje_patron))
AFPA = T2(Q6(SP * porcentaje_afiliado))
TotalFila = AFPE + AFPA
```

## Contrato De Datos Objetivo

### Backend

Implementar un modulo unico de dinero exacto para BICSN. Debe aceptar strings decimales o un tipo decimal, normalizar a seis decimales y devolver centavos finales sin utilizar JavaScript `number` para decisiones monetarias.

El modulo debe exponer, como minimo:

```text
quantizeCalc6(value)
truncateToFinal2(value)
toCents(finalMoney)
fromCents(cents)
sumCents(values)
formatFixed2(cents)
```

La regla de desempate de `quantizeCalc6` debe documentarse y probarse antes de implementarse. No es parte de la decision de truncamiento final.

### API

Las nuevas respuestas no deben cambiar campos `number` existentes en sitio. Deben agregarse contratos versionados o campos aditivos:

```json
{
  "currency": "MXN",
  "precisionPolicy": "MXN-TRUNC2-LEAF-v1",
  "calculationAmount6": "2221.396613",
  "amount": "2221.39",
  "amountCents": "222139"
}
```

Reglas de serializacion:

- `amount` siempre contiene exactamente dos decimales.
- `calculationAmount6` siempre contiene exactamente seis decimales.
- `amountCents` se serializa como string salvo que se documente un limite seguro de entero JavaScript.
- No se aceptan separadores de miles, notacion exponencial ni escalas fuera de contrato.

### Persistencia

Para liquidaciones nuevas, conservar cuando sea necesario:

- Valor de calculo a seis decimales.
- Valor final a dos decimales o centavos enteros.
- Politica de precision.
- Version de formula.
- Identificador y valor de porcentaje aplicado.
- Identidad y hash de la fuente.
- Estado de completitud.
- Revision de liquidacion y fecha de finalizacion.

Los importes historicos existentes se marcan como `legacy-v1` y permanecen inmutables.

## Invariantes De Conciliacion

Para cada liquidacion nueva:

1. Cada hoja monetaria final tiene exactamente dos decimales.
2. El total de fila es la suma de los centavos de sus componentes finales.
3. El total de fondo es la suma de los centavos de sus filas.
4. El total de aportaciones y el de retenciones son suma de tipos finalizados.
5. El gran total es la suma de ambos grupos en centavos.
6. Pantalla, CSV, TXT, PDF, historico y linea de captura usan el mismo snapshot final.
7. Las paginas y filtros distinguen subtotal visible, subtotal filtrado y total oficial completo.
8. Una liquidacion incompleta no genera historico final ni linea de captura.

## Plan De Implementacion

### Fase 0: Congelamiento E Inventario

1. No modificar historicos ni lineas de captura existentes.
2. Registrar conteos, importes y hashes por entidad, organica, periodo y tipo.
3. Extraer y versionar el DDL real de tablas, TVP `_V2` y procedimientos almacenados desde SQL Server.
4. Crear una cuenta de lectura para auditorias; la cuenta actual permite escritura y no debe usarse para investigacion.
5. Clasificar cada historico existente como legado y conservar su importe emitido.

### Fase 1: Corregir Bloqueadores Previos

1. Corregir B-01 de Prestaciones con pruebas independientes.
2. Resolver la definicion oficial de Guarderias.
3. Corregir contratos de Transitorio y Aguinaldo.
4. Corregir la fuente de retenciones y la seleccion de pago de linea de captura.
5. Implementar estados `COMPLETE`, `EMPTY`, `NOT_APPLICABLE` y `ERROR` para todas las fuentes.

### Fase 2: Kernel Monetario Exacto

1. Agregar una dependencia decimal o una implementacion fixed-point que cubra el rango de negocio.
2. Centralizar `CalcMoney6`, truncamiento hacia cero y centavos.
3. Eliminar decisiones oficiales basadas en `Math.round`, `Number.EPSILON`, `toFixed` y conversiones implicitas.
4. Definir vectores compartidos para backend, SQL y frontend.

### Fase 3: Ahorro, Vivienda Y CAIR

1. Calcular bases a seis decimales.
2. Truncar hojas monetarias a dos decimales antes de calcular totales.
3. Persistir y devolver importes finales coherentes.
4. Crear snapshot inmutable del periodo con tasa y politica aplicadas.
5. Migrar Entidad para consumir importes finales y no volver a decidir precision.
6. Unificar todos los exportadores con el serializador final de dos decimales.

### Fase 4: Prestaciones

1. Ejecutar solo despues de aprobar y publicar la correccion B-01.
2. Aplicar el mismo kernel y orden de finalizacion.
3. Validar quinquenios de nomina, tasa patron y tasa afiliado por periodo.

### Fase 5: Historicos Y Linea De Captura

1. Hacer que historicos cerrados devuelvan valores persistidos, sin recalculo.
2. Generar linea de captura desde el snapshot oficial completo.
3. Eliminar o convertir `importe` de frontend en una asercion de centavos esperados.
4. Prohibir lineas de pago cuando falte una fuente o haya diferencias no certificadas.

### Fase 6: Dominios Restantes

1. Incorporar Guarderias despues de la decision B-02.
2. Incorporar Transitorio y Aguinaldo despues de sus correcciones contractuales.
3. Incorporar retenciones despues de reconciliar resumenes y detalles.

## Estrategia De Despliegue

1. Ejecutar calculo legado y candidato en modo sombra para periodos representativos.
2. Registrar diferencias por fila, fondo, entidad, organica y periodo.
3. Separar diferencias esperadas por truncamiento de diferencias de formula o fuente.
4. Obtener aprobacion de negocio antes de emitir una linea de captura candidata.
5. Activar la politica solo para una liquidacion completa de entidad/organica/periodo.
6. No mezclar politicas dentro de un mismo periodo.
7. Mantener contratos API previos durante la ventana de compatibilidad.

## Rollback

### Antes De Finalizar

- Desactivar la politica candidata para toda la liquidacion.
- Recalcular desde la misma fuente versionada usando la politica anterior.
- No mezclar detalles de ambas politicas.

### Despues De Finalizar O Emitir Linea De Captura

- No reescribir importes, resumenes ni referencias emitidas.
- Bloquear la liquidacion y crear una correccion o ajuste con revision explicita.
- Conservar la politica y formula originales para auditoria.

## Pruebas Obligatorias

### Aritmetica

- `1.239999 -> 1.23`.
- `-1.239999 -> -1.23`.
- `0.009999 -> 0.00`.
- `-0.009999 -> 0.00`.
- No generar `-0.00`.
- Truncamiento idempotente.
- Valores maximos, overflow, `NaN`, infinito y formato invalido rechazados.

### Conciliacion

- Componentes finales igualan total de fila.
- Filas finalizadas igualan total de encabezado.
- Encabezados finalizados igualan total global.
- Pantalla, CSV, TXT, PDF e historico coinciden exactamente en centavos.
- Paginacion de mas de 500 filas no altera el total oficial.
- Filtros no se confunden con total completo.

### Integracion

- Cambio de porcentaje no altera periodos cerrados.
- Error de Firebird no ejecuta `REPLACE` con datos vacios.
- Linea de captura usa solo snapshot completo.
- Historicos previos conservan importes y referencias existentes.
- Casos positivos, negativos y mixtos cumplen truncamiento hacia cero.

## Evidencia Principal

- Calculo activo: `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts`.
- Historicos y TVP: `src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts`.
- Recalculo historico: `src/modules/historicosQuincenales/infrastructure/persistence/HistoricosQuincenalesRepository.ts`.
- Linea de captura: `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/LineaCapturaPeriodoRepository.ts`.
- Contratos de aplicacion quincenal: `src/modules/aplicacionQuincenal/aplicacionQuincenal.schemas.ts`.
- Regla actual de prestaciones: `docs/aplicacionQuincenal/REGLA_QUINQUENIOS_PRESTACIONES_NOMINA.md`.
- Regla frontend de fondos: `D:/Proyectos/Isssspea_v2.0/front/Entidad/ISS-F-Entidad/.opencode/skills/aportaciones-fondos/SKILL.md`.
