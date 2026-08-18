# Politica De Precision Monetaria Detail6 Agg2 Trunc V1

## 1. Control Del Documento

| Campo | Valor |
|---|---|
| Identificador | `MXN-DETAIL6-AGG2-TRUNC-v1` |
| Estado | Propuesto |
| Fecha de propuesta | 2026-08-09 |
| Moneda | MXN |
| Dominio inicial | Aplicacion quincenal de entidad |
| Primer rollout | Ahorro, Vivienda y CAIR |
| Sustituye | `MXN-TRUNC2-LEAF-v1`, propuesta nunca activada |
| Propietario funcional | Pendiente de asignar |
| Propietario tecnico | Pendiente de asignar |
| Fecha efectiva | Pendiente de aprobacion |

La existencia de este documento no activa la politica. La politica solo se considera vigente cuando se cumplen los gates de rollout, se registran las aprobaciones y se activa para una liquidacion completa.

No se permite mezclar politicas de precision dentro de la misma combinacion de entidad, organica y periodo.

## 2. Objetivo

Definir una unica regla para calcular, transportar, persistir, mostrar y exportar importes monetarios de la aplicacion quincenal:

- Todo componente monetario perteneciente a una fila individual conserva seis decimales.
- El total de una fila individual tambien conserva seis decimales.
- Todo importe que engloba varias filas o grupos se finaliza a dos decimales mediante truncamiento hacia cero.
- Todo agregado padre se obtiene sumando exclusivamente sus agregados hijos ya finalizados a dos decimales.
- Los datos legados con dos decimales se conservan y se presentan como detalle de seis decimales completando ceros.
- Los contratos externos actualmente certificados a dos decimales mantienen su escala y longitud hasta una aprobacion especifica.

El objetivo operativo es que filas, encabezados, tarjetas, historicos, exportaciones y linea de captura concilien conforme al mismo grafo de agregacion.

## 3. Alcance

Incluye:

- Calculo activo de aportaciones.
- Totales por fila, fondo, tipo, grupo y gran total.
- Contratos API entre BICSN y Entidad.
- Persistencia y lectura de snapshots historicos.
- Presentacion en Entidad.
- CSV, Excel y PDF internos.
- TXT y layouts externos como fronteras contractuales.
- Linea de captura.
- Pruebas, modo sombra, activacion y rollback.

El documento cubre todos los modulos monetarios conocidos, pero el primer rollout se limita a Ahorro, Vivienda y CAIR.

Quedan condicionados:

- Prestaciones, hasta corregir y aprobar la formula AFPE.
- Retenciones, hasta reconciliar detalle, resumen y layouts externos.
- Guarderias, hasta definir un importe oficial unico.
- Transitorio, hasta alinear contratos Firebird, TypeScript y SQL Server.
- Aguinaldo, hasta unificar escritura y lectura historica.
- Estado de cuenta y extemporaneas, hasta una migracion de dominio separada.

## 4. Terminologia

| Termino | Definicion |
|---|---|
| `Detail6` o D6 | Componente o total de una fila individual, representado con exactamente seis decimales. |
| `Aggregate2` o A2 | Importe que engloba varias filas o grupos, representado con exactamente dos decimales. |
| `T6` | Truncamiento hacia cero a seis decimales. |
| `T2` | Truncamiento hacia cero a dos decimales. |
| Total de fila | Suma de los componentes D6 pertenecientes a un trabajador, prestamo, recibo o registro individual. Es D6. |
| Total de fondo o tipo | Suma de los totales de fila D6 del fondo o tipo, finalizada con `T2`. Es A2. |
| Total padre | Suma exacta de agregados hijos A2. Es A2. |
| Gran total | Suma exacta de los padres A2 definidos por el flujo. Es A2. |
| Fuente D2 legacy | Fuente que solo conserva dos decimales y cuya precision original no debe reinterpretarse. |
| Snapshot | Resultado inmutable de una liquidacion, con fuente, formula, tasas y politica identificadas. |
| Liquidacion completa | Liquidacion cuyas fuentes requeridas se encuentran en estado `COMPLETE` o `NOT_APPLICABLE` aprobado. |

## 5. Decision Normativa

### 5.1 Truncamiento Hacia Cero

Las dos operaciones normativas son:

```text
T6(x) = sign(x) * floor(abs(x) * 1_000_000) / 1_000_000
T2(x) = sign(x) * floor(abs(x) * 100) / 100
```

El calculo debe ejecutarse con aritmetica decimal exacta o fixed-point. La formula matematica no autoriza implementar la multiplicacion con JavaScript `number` cuando el resultado decide un importe oficial.

No se permite producir ni serializar `-0.000000` o `-0.00`.

| Entrada | `T6` | `T2` |
|---:|---:|---:|
| `1.1234569` | `1.123456` | `1.12` |
| `-1.1234569` | `-1.123456` | `-1.12` |
| `0.0099999` | `0.009999` | `0.00` |
| `-0.0099999` | `-0.009999` | `0.00` |
| `2221.3966139` | `2221.396613` | `2221.39` |

### 5.2 Componentes Y Total De Fila

Cada resultado monetario de formula se finaliza con `T6`:

```text
ComponentD6 = T6(formula_decimal_exacta)
```

El total de fila es la suma exacta de sus componentes D6:

```text
RowTotalD6 = sum(ComponentD6)
```

Como todos los componentes tienen escala seis, la suma conserva escala seis. No se aplica `T2` al total de fila.

### 5.3 Agregado De Fondo O Tipo

Un fondo o tipo suma sus filas D6 y finaliza una sola vez con `T2`:

```text
GroupTotalA2 = T2(sum(RowTotalD6))
```

No se permite truncar cada fila a dos antes de calcular el fondo.

### 5.4 Agregados Padre

Un padre suma exclusivamente sus hijos A2:

```text
ParentTotalA2 = sum(ChildTotalA2)
GrandTotalA2 = sum(ParentTotalA2)
```

No se permite reconstruir un padre desde todos los detalles D6 cuando ya existen hijos A2 oficiales. Esta regla garantiza que tarjetas, encabezados y gran total visibles concilien exactamente.

### 5.5 Ejemplo Jerarquico

```text
Fondo A:
  fila 1 = 1.999999 D6
  fila 2 = 1.999999 D6
  total fondo A = T2(3.999998) = 3.99 A2

Fondo B:
  fila 1 = 2.009999 D6
  total fondo B = T2(2.009999) = 2.00 A2

Total aportaciones = 3.99 + 2.00 = 5.99 A2
```

Calcular `T2(1.999999 + 1.999999 + 2.009999)` produciria `6.00` y esta prohibido para el padre porque no conciliaria con los fondos visibles.

### 5.6 Fuentes Legacy D2

Una fuente que solo conserva dos decimales mantiene su valor original:

```text
125.40 D2 legacy -> "125.400000" D6 de presentacion
```

Completar ceros no crea precision historica. El contrato debe identificar `source_scale = 2` y la politica original cuando sea conocida.

No se reescriben historicos solo para agregar ceros de escala.

## 6. Grafo De Agregacion Canonico

| Nivel | Entradas | Operacion | Salida |
|---|---|---|---|
| Componente | Fuente y formula decimal exacta | `T6(formula)` | D6 |
| Total de fila | Componentes D6 | Suma exacta | D6 |
| Fondo o modalidad | Totales de fila D6 | `T2(suma)` | A2 |
| Aportaciones | Fondos A2 | Suma exacta | A2 |
| Retenciones | Modalidades A2 | Suma exacta | A2 |
| Gran total | Aportaciones A2 y Retenciones A2 | Suma exacta | A2 |
| Linea de captura | Padres A2 requeridos por el periodo | Suma exacta en centavos | A2 |

Los filtros y la paginacion pueden presentar subtotales de vista, pero no deben sustituir ni recalcular el agregado oficial completo.

## 7. Matriz Por Dominio

| Dominio | Detalle D6 | Agregado A2 | Estado de rollout |
|---|---|---|---|
| Ahorro | Sueldo proporcional, AFAE, AFAA y total de trabajador | Total Ahorro | Primer rollout |
| Vivienda | Sueldo proporcional, AFE y total de trabajador | Total Vivienda | Primer rollout |
| CAIR | Sueldo proporcional, AFE y total de trabajador | Total CAIR | Primer rollout |
| Prestaciones | Bases, AFPE, AFPA y total de trabajador | Total Prestaciones | Bloqueado por formula AFPE |
| PCP | Capital, interes, seguros, moratorios y total de prestamo | Total PCP | Condicionado |
| PMP | Capital, interes, seguros, moratorios y total de prestamo | Total PMP | Condicionado |
| Hipotecario | Capital, interes, seguros, moratorios y total de prestamo | Total Hipotecario | Condicionado |
| Guarderias | Componentes y total individual por definir | Total Guarderias | Bloqueado por regla de negocio |
| Transitorio | Componentes y total individual | Total Transitorio | Bloqueado por contrato |
| Aguinaldo | Componentes y total individual | Total Aguinaldo | Bloqueado por persistencia |
| Nomina | Importes individuales de fuente | Encabezado de layout segun contrato | Fuente D2 inicial |
| Linea de captura | No aplica como detalle | Importe pagable | A2 contractual |

## 8. Formulas Del Primer Rollout

### 8.1 Ahorro

```text
SP   = T6(sueldo_mensual / 30 * dias_trabajados)
AFAE = T6(SP * porcentaje_patron)
AFAA = T6(SP * porcentaje_afiliado)
TotalFilaD6 = AFAE + AFAA
TotalAhorroA2 = T2(sum(TotalFilaD6))
```

### 8.2 Vivienda

```text
SP  = T6(sueldo_mensual / 30 * dias_trabajados)
AFE = T6(SP * porcentaje_patron)
TotalFilaD6 = AFE
TotalViviendaA2 = T2(sum(TotalFilaD6))
```

### 8.3 CAIR

```text
SP  = T6(sueldo_mensual / 30 * dias_trabajados)
AFE = T6(SP * porcentaje_patron_vigente_cair)
TotalFilaD6 = AFE
TotalCairA2 = T2(sum(TotalFilaD6))
```

El porcentaje de CAIR procede del servicio de porcentajes vigente respaldado por `aportaciones.CatalogoPorcentajeFondo`. No se fija en codigo, tooltips, etiquetas ni exportaciones.

Se usan los dias laborados de nomina para el periodo cuando estan disponibles. Quince dias es exclusivamente el fallback documentado.

CAIR usa el salario proporcional; no usa `sueldo_base` cuando este incluye prestaciones o quinquenios ajenos a su base.

### 8.4 Total De Aportaciones

Durante el primer rollout:

```text
TotalAportacionesA2 = TotalAhorroA2 + TotalViviendaA2 + TotalCairA2
```

Cuando Prestaciones se incorpore, se agrega su total A2 como un hijo adicional. No se recalcula el padre desde filas D6 de todos los fondos.

## 9. Contrato API

### 9.1 Estrategia Aditiva

Los campos monetarios `number` existentes no se sustituyen en sitio durante la ventana de compatibilidad.

Se agregan strings decimales con sufijo de escala:

- `*_d6` para componentes y total de fila.
- `*_a2` para fondos, modalidades, padres y gran total.
- `*_cents` cuando un contrato externo requiere centavos enteros exactos.

Ejemplo:

```json
{
  "currency": "MXN",
  "precision_policy": "MXN-DETAIL6-AGG2-TRUNC-v1",
  "formula_version": "ahorro-v1",
  "source_scale": 2,
  "afae_d6": "123.456789",
  "afaa_d6": "45.670000",
  "total_fila_d6": "169.126789",
  "total_ahorro_a2": "169.12",
  "total_ahorro_cents": "16912"
}
```

Reglas:

- D6 siempre contiene exactamente seis decimales.
- A2 siempre contiene exactamente dos decimales.
- Los centavos se transportan como string hasta documentar y validar el rango seguro.
- No se aceptan separadores de miles ni notacion exponencial.
- Entidad no vuelve a decidir precision ni reconstruye agregados oficiales.
- Los campos `number` quedan marcados como compatibilidad y se retiran solo en una version mayor aprobada.

## 10. Persistencia Y SQL

Antes de crear migraciones se debe extraer y versionar el DDL productivo de tablas, TVP y procedimientos almacenados activos.

El archivo `database/migrations/create_aportaciones_historico_tables.sql` no representa el esquema productivo y no debe ejecutarse como migracion de precision.

Reglas objetivo:

- Detalles y totales de fila: `decimal(19,6)` o rango certificado equivalente.
- Agregados oficiales: semantica A2 y, cuando se cree una columna nueva, `decimal(19,2)` o centavos enteros.
- TVP de detalle: D6.
- TVP de encabezado: A2.
- Ninguna conversion implicita de SQL Server define el truncamiento de negocio.
- La aplicacion calcula `T6` y `T2` antes de enviar el valor al driver.
- Los contratos SQL modificados se versionan como TVP y procedimientos `_V3`; no se altera un TVP activo en sitio.

Cada snapshot nuevo debe conservar:

- `precision_policy`.
- `formula_version`.
- Porcentaje e identificador de catalogo aplicados.
- Escala y version de la fuente.
- Hash o identidad verificable de la fuente.
- Estado de completitud.
- Revision y fecha de finalizacion.

## 11. Historicos

- Un periodo cerrado devuelve el snapshot persistido.
- No se recalcula con tasas, dias de nomina, salarios o formulas actuales.
- Un historico D2 se presenta como D6 agregando ceros, sin cambiar su valor persistido.
- Los totales oficiales se leen del snapshot completo; no se reconstruyen desde una pagina filtrada.
- Un error de fuente no se convierte en cero.
- No se ejecuta `REPLACE` con arreglos vacios producidos por errores.
- Las correcciones posteriores se registran como una nueva revision o ajuste, sin sobrescribir la evidencia original.

## 12. Entidad

Entidad debe centralizar las siguientes capacidades:

```text
parseMoneyD6(value)
truncateMoneyD6(value)
formatMoneyD6(value)
formatMoneyA2(value)
sumAggregateChildrenA2(values)
```

Reglas visuales:

- Filas, componentes, totales de fila y modales individuales muestran seis decimales.
- Encabezados, tarjetas, fondos, grupos y gran total muestran dos decimales.
- Los importes usan numeros tabulares.
- No se suman textos formateados ni valores obtenidos del DOM.
- No se usa `Intl.NumberFormat`, `toFixed` o `Math.round` para decidir el importe; solo se formatea un string oficial ya normalizado.
- El ancho adicional de D6 se valida en mobile y desktop con scroll horizontal controlado cuando sea necesario.

## 13. Layouts Y Salidas Externas

| Salida | Politica inicial | Gate para cambiar |
|---|---|---|
| Pantallas de detalle | D6 | Pruebas visuales y contrato API exacto |
| Tarjetas y encabezados | A2 | Conciliacion jerarquica |
| CSV interno de detalle | D6 | Validacion funcional |
| CSV interno de resumen | A2 | Validacion funcional |
| Excel interno | D6 en detalle y A2 en resumen | Prueba de valor y escala |
| PDF interno | D6 en detalle y A2 en resumen | Comparacion con snapshot |
| TXT fijo de retenciones | Mantener D2 y ancho actual | Certificacion del receptor y golden file |
| TXT de nomina de 20/35 campos | Mantener contrato actual D2 | Certificacion de Nomina y receptor |
| Linea de captura | A2 en centavos exactos | Aprobacion de Finanzas/Tesoreria |
| Estado de cuenta | Mantener contrato D2 actual | Migracion de dominio separada |
| Extemporaneas | Mantener contrato D2 actual | Migracion de dominio separada |

Un layout externo D2 se alimenta desde el agregado A2 oficial. Nunca recorta por su cuenta un detalle D6 ni recibe seis decimales sin una nueva version contractual.

## 14. Bloqueadores Fuera De Precision

| Id | Bloqueador | Accion requerida |
|---|---|---|
| B-01 | AFPE activo no coincide con la formula documentada. | Corregir y aprobar Prestaciones en una entrega independiente. |
| B-02 | Guarderias usa distintas definiciones de total. | Negocio debe seleccionar un importe oficial. |
| B-03 | Transitorio mezcla contratos Firebird, TypeScript y TVP incompatibles. | Alinear contratos antes de migrar precision. |
| B-04 | Aguinaldo guarda y consulta tablas de detalle distintas. | Unificar persistencia e historicos. |
| B-05 | Linea de captura puede omitir retenciones o preferir resumenes incompletos. | Reconciliar fuentes y bloquear pagos parciales. |
| B-06 | Errores Firebird pueden terminar como snapshot vacio con `REPLACE`. | Implementar completitud y prohibir reemplazo tras error. |
| B-07 | Historicos se recalculan con datos vigentes. | Hacer inmutables los snapshots cerrados. |
| B-08 | Nomina procesa layouts de 20 y 35 campos con mapeos no certificados. | Validar encabezado, detalle y totales antes de cambiar precision. |
| B-09 | Valores nulos se convierten en cero en varios repositorios. | Distinguir ausencia, error y cero real. |

Estos defectos no se corrigen de forma silenciosa dentro de un cambio de precision. Cada uno requiere evidencia y pruebas independientes.

## 15. Plan De Implementacion

### Fase 0: Ratificacion E Inventario

1. Aprobar este documento y asignar propietarios.
2. Registrar el documento sustituido y su diferencia normativa.
3. Extraer DDL real de tablas, TVP `_V2` y procedimientos activos.
4. Inventariar escalas declaradas por las fuentes Firebird.
5. Clasificar periodos historicos por politica y escala de fuente.
6. Congelar reescrituras de historicos y referencias emitidas.

### Fase 1: Kernel Monetario Exacto

1. Implementar decimal exacto o fixed-point para D6 y A2.
2. Implementar `T6`, `T2`, suma D6, suma A2 y conversion exacta a centavos.
3. Rechazar `NaN`, infinito, notacion exponencial, escalas invalidas y overflow.
4. Crear vectores compartidos para backend, SQL y frontend.
5. Agregar una suite automatizada versionada; los scripts manuales actuales no son evidencia suficiente.

### Fase 2: Contratos Aditivos

1. Agregar strings `*_d6`, `*_a2` y metadata de politica.
2. Mantener temporalmente los campos `number` existentes.
3. Actualizar schemas backend, entidades frontend y pruebas de contrato.
4. Verificar que el driver `mssql` conserve exactamente los strings decimales.
5. Prohibir que Entidad reconstruya un agregado oficial.

### Fase 3: Primer Rollout De Calculo

1. Migrar Ahorro a componentes y total de fila D6, con fondo A2.
2. Migrar Vivienda con la misma jerarquia.
3. Migrar CAIR con tasa vigente y salario proporcional verificable.
4. Calcular Aportaciones sumando exclusivamente fondos A2 habilitados.
5. Ejecutar legado y candidato en modo sombra, sin persistencia oficial ni emision de pago.

### Fase 4: Persistencia V3 E Historicos

1. Crear contratos SQL versionados cuando el DDL certificado lo requiera.
2. Persistir detalle D6, encabezado A2 y metadata de snapshot.
3. Rechazar encabezados enviados que no concilien con el detalle recibido.
4. Eliminar recalculo monetario de periodos cerrados.
5. Presentar D2 legacy como D6 sin reescritura.

### Fase 5: Entidad Y Exportaciones Internas

1. Centralizar parseo y formato monetario.
2. Migrar Aportaciones, Verificacion y vistas combinadas.
3. Mostrar detalle D6 y agregados A2.
4. Migrar CSV, Excel y PDF internos al snapshot oficial.
5. Validar 320, 375, 768, 1024 y 1440 px.

### Fase 6: Activacion Del Primer Rollout

1. Completar sombra para periodos representativos y de alto volumen.
2. Clasificar cada diferencia como precision, formula, fuente, contrato o incompletitud.
3. Obtener aprobacion funcional, tecnica y de DBA.
4. Activar Ahorro, Vivienda y CAIR para una liquidacion completa.
5. Mantener Prestaciones fuera hasta cerrar B-01.

### Fase 7: Prestaciones

1. Aprobar la formula AFPE mediante una entrega independiente.
2. Congelar vectores de formula antes de aplicar precision.
3. Aplicar D6 por fila y A2 por fondo.
4. Agregar Prestaciones A2 como hijo de Aportaciones.

### Fase 8: Retenciones Y Linea De Captura

1. Migrar componentes y total de prestamo a D6.
2. Finalizar PCP, PMP e Hipotecario como A2.
3. Calcular Retenciones sumando modalidades A2.
4. Calcular el importe pagable sumando padres A2 en centavos exactos.
5. Mantener layouts fijos D2.
6. Bloquear emision cuando una fuente requerida este incompleta.

### Fase 9: Dominios Condicionados

1. Incorporar Guarderias despues de cerrar B-02.
2. Incorporar Transitorio despues de cerrar B-03.
3. Incorporar Aguinaldo despues de cerrar B-04.
4. Evaluar Nomina, Estado de cuenta y Extemporaneas como migraciones contractuales separadas.

## 16. Vectores De Prueba Compartidos

| Caso | Entrada | Resultado esperado |
|---|---|---|
| T6 positivo | `1.1234569` | `1.123456` |
| T6 negativo | `-1.1234569` | `-1.123456` |
| T2 positivo | `1.239999` | `1.23` |
| T2 negativo | `-1.239999` | `-1.23` |
| Cero negativo D6 | `-0.0000009` | `0.000000` |
| Cero negativo A2 | `-0.009999` | `0.00` |
| Legacy D2 | `125.40` | `125.400000` como detalle |
| Fondo | `1.999999 + 1.999999` | `3.99` A2 |
| Jerarquia | hijos `3.99` y `2.00` | padre `5.99` A2 |

Se deben agregar casos de montos maximos, overflow, nulos, formato invalido, mas de 500 filas y combinaciones positivas y negativas.

## 17. Pruebas Obligatorias

### 17.1 Unitarias

- `T6` y `T2` hacia cero.
- Idempotencia de D6 y A2.
- Ausencia de cero negativo.
- Parseo y serializacion fixed6/fixed2.
- Suma exacta de millonesimas y centavos.
- Rechazo de entradas invalidas y overflow.

### 17.2 Integracion

- Contrato API aditivo backend/frontend.
- Insercion y lectura exacta mediante TVP y procedimientos productivos versionados.
- Rechazo de encabezado que no concilia.
- Error Firebird no ejecuta `REPLACE` vacio.
- Cambio de tasa no altera un snapshot cerrado.
- Filtros y paginacion no alteran el total oficial.

### 17.3 Conciliacion

- Componentes D6 suman el total de fila D6.
- Filas D6 producen el fondo A2 mediante `T2` una sola vez.
- Los fondos A2 suman el padre A2.
- Los padres A2 suman el gran total A2.
- Pantalla, API, historico y exportacion interna muestran el mismo snapshot.
- Linea de captura coincide en centavos con sus padres A2.

### 17.4 Layouts Y UI

- Golden files byte a byte para TXT de nomina y retenciones.
- Importes D2 externos mantienen ancho y escala.
- Excel conserva valor y cantidad de decimales.
- PDF coincide con el snapshot.
- Tablas D6 no desbordan tarjetas ni ocultan acciones en mobile.

## 18. Estrategia De Sombra

El modo sombra calcula politica vigente y candidata con la misma fuente, sin escribir historicos oficiales ni emitir linea de captura.

Cada diferencia debe registrar:

- Entidad, organica, periodo y tipo.
- Identificador de fila sin exponer datos personales innecesarios.
- Valor legado y candidato.
- Diferencia D6 y diferencia A2.
- Politica y formula de ambos calculos.
- Estado de fuente.
- Clasificacion: `PRECISION_EXPECTED`, `FORMULA`, `SOURCE`, `CONTRACT` o `INCOMPLETE`.

No se activa una liquidacion con diferencias sin clasificar.

## 19. Gates De Rollout

| Gate | Condicion |
|---|---|
| G0 | Politica, jerarquia y primer rollout aprobados. |
| G1 | DDL productivo, TVP, SP y escalas Firebird inventariados. |
| G2 | Kernel y vectores pasan en backend, SQL y frontend. |
| G3 | Contrato API aditivo certificado. |
| G4 | Sombra sin diferencias no clasificadas. |
| G5 | UI y exportaciones internas conciliadas y responsive. |
| G6 | Layouts externos conservan contrato o tienen nueva version aprobada. |
| G7 | Piloto aprobado para una liquidacion completa. |
| G8 | Finanzas/Tesoreria autoriza cualquier linea de captura candidata. |

## 20. Rollback

### Antes De Finalizar

- Desactivar la politica candidata para toda la liquidacion.
- Recalcular desde la misma fuente versionada con la politica anterior.
- Eliminar escrituras candidatas no finalizadas conforme al procedimiento aprobado.
- No conservar una mezcla de detalles o encabezados entre politicas.

### Despues De Finalizar

- No reescribir el snapshot original.
- Crear una nueva revision o ajuste con trazabilidad explicita.
- Conservar politica, formula, fuente y tasas originales.

### Despues De Emitir Linea De Captura

- No regenerar silenciosamente la referencia ni el importe.
- Bloquear el periodo afectado.
- Coordinar la correccion con Finanzas/Tesoreria.
- Emitir un ajuste conforme al proceso autorizado.

## 21. Observabilidad Y Auditoria

Cada liquidacion candidata o activa debe permitir consultar:

- Politica de precision.
- Version de formula.
- Tasa e identificador de catalogo.
- Hash o version de fuente.
- Estado de completitud por fuente.
- Conteo de filas.
- Totales D6 de control y agregados A2 oficiales.
- Diferencias de sombra clasificadas.
- Revision y fecha de finalizacion.

Los logs no deben contener datos personales completos ni secretos.

## 22. Aprobaciones

| Rol | Responsable | Decision | Fecha | Evidencia |
|---|---|---|---|---|
| Negocio | Pendiente | Pendiente | Pendiente | Pendiente |
| Finanzas/Tesoreria | Pendiente | Pendiente | Pendiente | Pendiente |
| Nomina | Pendiente | Pendiente | Pendiente | Pendiente |
| DBA SQL Server | Pendiente | Pendiente | Pendiente | Pendiente |
| Responsable Firebird | Pendiente | Pendiente | Pendiente | Pendiente |
| Backend BICSN | Pendiente | Pendiente | Pendiente | Pendiente |
| Frontend Entidad | Pendiente | Pendiente | Pendiente | Pendiente |
| QA | Pendiente | Pendiente | Pendiente | Pendiente |

## 23. Diferencia Con La Propuesta Sustituida

| Aspecto | `MXN-TRUNC2-LEAF-v1` | `MXN-DETAIL6-AGG2-TRUNC-v1` |
|---|---|---|
| Componente individual | Se finalizaba a D2 | Se trunca y conserva D6 |
| Total de fila | Sumaba componentes D2 | Suma componentes D6 y permanece D6 |
| Fondo o tipo | Sumaba filas D2 | Suma filas D6 y aplica `T2` |
| Padre | Sumaba fondos finalizados | Suma fondos A2; se mantiene la conciliacion jerarquica |
| Presentacion de detalle | D2 | D6 |
| Fuente legacy D2 | D2 | D6 de presentacion completando ceros |
| Primer rollout | Incluia Prestaciones | Ahorro, Vivienda y CAIR; Prestaciones queda bloqueado |

El documento sustituido se conserva en `PLAN_AJUSTE_PRECISION_MONETARIA.md` exclusivamente para trazabilidad.

## 24. Evidencia Tecnica Principal

- Calculo activo: `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts`.
- Persistencia y TVP: `src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts`.
- Recalculo historico: `src/modules/historicosQuincenales/infrastructure/persistence/HistoricosQuincenalesRepository.ts`.
- Linea de captura: `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/LineaCapturaPeriodoRepository.ts`.
- Servicio de referencia: `src/modules/reportes/aplicacionesQNA/domain/services/LineaCapturaService.ts`.
- Contratos de aplicacion: `src/modules/aplicacionQuincenal/aplicacionQuincenal.schemas.ts`.
- Migracion local no productiva: `database/migrations/create_aportaciones_historico_tables.sql`.
- Regla de Prestaciones: `REGLA_QUINQUENIOS_PRESTACIONES_NOMINA.md`.
- Propuesta sustituida: `PLAN_AJUSTE_PRECISION_MONETARIA.md`.
- Entidad: `D:/Proyectos/Isssspea_v2.0/front/Entidad/ISS-F-Entidad`.

## 25. Historial De Versiones

| Version | Fecha | Estado | Cambio |
|---|---|---|---|
| 1.0-propuesta | 2026-08-09 | Propuesto | Define D6 en detalle, A2 jerarquico, truncamiento hacia cero, contratos aditivos y rollout inicial de Ahorro, Vivienda y CAIR. |
