# Reporte de Cotejo XLSX vs TXT

## Archivos revisados

- Archivo de layout/regla: `Formato Archivo TXT de longitud Fija para Aplicacion Qnal(OBSERVACIONES EQUIPO DESARROLLO) (1).xlsx`
- Archivo TXT generado: `Aplicacion IAPEMI periodo 07.txt`

## Objetivo

Validar si el archivo TXT generado contiene la informacion definida en el layout del XLSX para el archivo de aplicacion quincenal.

## Resumen ejecutivo

El XLSX define la estructura esperada del archivo TXT para `APORTACION QNAL`.

El TXT actual contiene un encabezado y registros individuales, pero los registros de detalle no cumplen completamente con el layout esperado.

- El TXT tiene 32 lineas.
- La primera linea corresponde al encabezado, con tipo de registro `1`.
- Las lineas 2 a 32 corresponden al detalle, con tipo de registro `2`.
- El separador usado en el TXT es `@`.
- El encabezado tiene 17 campos y coincide en estructura general con el XLSX.
- Cada registro detalle tiene 20 campos.
- El XLSX espera 35 campos por cada registro detalle.
- Por lo tanto, faltan 15 campos por cada registro detalle.

## Encabezado

El encabezado del TXT contiene los campos principales esperados por el XLSX.

| Campo XLSX | Valor en TXT | Estatus |
|---|---:|---|
| Lote | `0126007` | Existe |
| Tipo registro | `1` | Existe |
| Organica I | `01` | Existe |
| Organica II | `00` | Existe |
| Fecha inicial | `20260401` | Existe |
| Fecha final | `20260415` | Existe |
| Base cotizacion sueldo | `000310490.24` | Existe |
| Base cotizacion quinquenios | `0000907.32` | Existe |
| Aportacion afiliado fondo ahorro | `0013972.05` | Existe |
| Aportacion entidad fondo ahorro | `0015524.53` | Existe |
| Aportacion EBI afiliado | `0018264.23` | Existe |
| Aportacion EBI entidad | `0015769.72` | Existe |
| Prestamo corto plazo | espacios/vacio | Existe vacio |
| Prestamo hipotecario | `0006209.88` | Existe |
| Prestamo vivienda / mediano plazo | `0000000.00` | Existe |
| CAIR | `0000000.00` | Existe |
| CAIR voluntario | `0000000.00` | Existe |

Los totales principales del encabezado cuadran contra la suma de los registros detalle.

## Registro detalle esperado segun XLSX

El XLSX espera 35 campos por cada registro tipo `2`.

| # | Campo esperado XLSX | Existe en TXT actual | Observacion |
|---:|---|---|---|
| 1 | Lote | Si | Ejemplo: `0126007` |
| 2 | Tipo de registro | Si | Valor `2` |
| 3 | Organica I | No | Falta |
| 4 | Organica II | No | Falta |
| 5 | Organica III | No | Falta |
| 6 | RFC | Si | Esta en campo 4 del TXT |
| 7 | Clave de personal | Si | Esta en campo 3 del TXT |
| 8 | Nombre del afiliado | Si | Esta en campo 5 del TXT |
| 9 | Movimiento | No | Falta `AL`, `BA` o blanco |
| 10 | Fecha movimiento | Si | Esta en campo 15 del TXT |
| 11 | Sueldo mensual | No claro | No aparece en posicion esperada |
| 12 | Ayudas mensuales | No claro | No aparece en posicion esperada |
| 13 | Quinquenios mensual | No claro | No aparece en posicion esperada |
| 14 | Base cotizacion sueldo | Si | Existe como importe en detalle |
| 15 | Base cotizacion quinquenios | Si | Existe como importe en detalle |
| 16 | Aportacion afiliado fondo ahorro | Si | Existe como importe en detalle |
| 17 | Aportacion entidad fondo ahorro | Si | Existe como importe en detalle |
| 18 | Aportacion afiliado EBI | Si | Existe como importe en detalle |
| 19 | Aportacion entidad EBI | Si | Existe como importe en detalle |
| 20 | Descuento prestamos PCP | Si | Existe como importe en detalle |
| 21 | Descuento prestamo hipotecario | Si | Existe como importe en detalle |
| 22 | Descuento prestamos PMP | Si | Existe como importe en detalle |
| 23 | Descuentos otros | Si | Existe como importe en detalle |
| 24 | Calle | No | Falta |
| 25 | Colonia | No | Falta |
| 26 | Ciudad | No | Falta |
| 27 | Estado | No | Falta |
| 28 | Municipio | No | Falta |
| 29 | Codigo postal | No | Falta |
| 30 | Telefono | No | Falta |
| 31 | Fecha nacimiento | No | Falta |
| 32 | Sexo | No | Falta |
| 33 | Estado civil | No | Falta |
| 34 | CAIR | Si | Existe como importe |
| 35 | CAIR voluntario | Si | Existe como importe |

## Campos que contiene el TXT actual en el detalle

Cada registro detalle actual contiene 20 campos.

| # TXT | Campo identificado | Ejemplo |
|---:|---|---|
| 1 | Lote | `0126007` |
| 2 | Tipo registro | `2` |
| 3 | Clave empleado / clave personal | `6800048531` |
| 4 | RFC | `EAJL731213763` |
| 5 | Nombre | `ESCALANTE/JIMENEZ/LUCIA` |
| 6 | Importe aportacion afiliado FA | `0000924.92` |
| 7 | Importe aportacion entidad FA | `0001027.69` |
| 8 | Importe EBI afiliado | `0000360.58` |
| 9 | Importe EBI entidad | `0003613.69` |
| 10 | Base cotizacion sueldo | `0020553.81` |
| 11 | Base cotizacion quinquenios | `0000000.00` |
| 12 | Importe base/sueldo relacionado | `0041107.63` |
| 13 | Importe descuento | `0000000.00` |
| 14 | Importe descuento | `0000000.00` |
| 15 | Fecha movimiento / fecha fin quincena | `20260415` |
| 16 | Importe CAIR/otro | `000000.00` |
| 17 | Importe CAIR/otro | `0000411.08` |
| 18 | Importe final | `0000000.00` |
| 19 | Importe final | `0000000.00` |
| 20 | Importe final | `0000000.00` |

## Campos faltantes claros

Estos campos del XLSX no estan presentes en el TXT actual:

| Campo faltante | Comentario |
|---|---|
| Organica I | Debe venir antes del RFC |
| Organica II | Debe venir antes del RFC |
| Organica III | Debe venir antes del RFC |
| Movimiento | Debe contener `AL`, `BA` o blanco |
| Calle | Domicilio del afiliado |
| Colonia | Domicilio del afiliado |
| Ciudad | Domicilio del afiliado |
| Estado | Clave INEGI de estado |
| Municipio | Clave INEGI de municipio |
| Codigo postal | 5 digitos |
| Telefono | 10 caracteres |
| Fecha nacimiento | Formato `AAAAMMDD` |
| Sexo | `F` o `M` |
| Estado civil | `S`, `C`, `V`, `D`, `O` |

## Campos con duda de mapeo

Estos campos existen como importes en el TXT, pero no estan en el orden esperado por el XLSX o requieren confirmacion funcional:

| Campo XLSX | Observacion |
|---|---|
| Sueldo mensual | No se identifica claramente en el TXT actual |
| Ayudas mensuales | No se identifica claramente en el TXT actual |
| Quinquenios mensual | No se identifica claramente en el TXT actual |
| Base cotizacion sueldo | Existe, pero no en la posicion esperada |
| Base cotizacion quinquenios | Existe, pero no en la posicion esperada |
| PCP / Hipotecario / PMP / Otros | Hay importes, pero se debe confirmar que campo TXT corresponde a cada concepto |

## Cotejo de totales principales

Los siguientes importes del encabezado coinciden con sumas calculadas desde el detalle:

| Concepto | Encabezado | Suma detalle | Estatus |
|---|---:|---:|---|
| Base cotizacion sueldo | `310490.24` | `310490.24` | Cuadra |
| Base cotizacion quinquenios | `907.32` | `907.32` | Cuadra |
| FA afiliado | `13972.05` | `13972.05` | Cuadra |
| FA entidad | `15524.53` | `15524.53` | Cuadra |
| EBI afiliado | `18264.23` | `18264.23` | Cuadra |
| EBI entidad | `15769.72` | `15769.72` | Cuadra |
| Importe CAIR / relacionado | `6209.88` | `6209.88` | Cuadra |

## Conclusion

El TXT actual contiene informacion util y sus totales principales cuadran internamente contra los registros de detalle.

Sin embargo, el TXT no cumple completamente con el layout definido en el XLSX para el registro individual tipo `2`, ya que:

- El XLSX espera 35 campos por registro detalle.
- El TXT actual solo trae 20 campos por registro detalle.
- Faltan principalmente campos de organica, movimiento, domicilio y datos personales del afiliado.
- Algunos importes existen, pero no estan en el orden documentado por el XLSX.

Para cumplir el layout, el generador del TXT debe emitir cada registro tipo `2` con los 35 campos definidos por el XLSX, respetando el orden esperado y agregando los campos faltantes.
