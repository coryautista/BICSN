# Reporte Revisa - Especificacion Frontend

## Objetivo

Construir la pantalla frontend del nuevo reporte **Revisa**. Reemplaza la presentacion del reporte anterior y consume exclusivamente los historicos generados por el backend de estado de cuenta de ahorro.

El frontend no calcula importes, no reclasifica movimientos y no vuelve a consultar Firebird o SQL Server. Solo solicita la generacion, presenta el resultado y descarga las exportaciones preparadas por el backend.

## Regla de QNA

| Modo | Fuente de periodo | Comportamiento |
| --- | --- | --- |
| QNA actual | Firebird, mediante `AP_G_APLICADO_TIPO` para la organica | Devuelve el periodo vigente. El frontend busca el historico y aplica solo si no existe. |
| QNA anterior | SQL Server, con quincena y anio seleccionados | Busca exclusivamente el historico. Si no existe, no puede generarse. |

El frontend nunca debe intentar inferir la QNA actual usando la fecha local del navegador.

## Referencia visual

La imagen del reporte anterior debe usarse como referencia de identidad visual cuando este disponible. Mientras se adjunta, conservar una apariencia institucional, limpia y orientada a datos:

- Titulo visible: `REVISA`.
- Subtitulo: `REVISION DEL ESTADO DE CUENTA DE AHORRO`.
- Grid compacto, legible y sin tarjetas por cada concepto.
- Encabezado fijo de columnas al desplazarse verticalmente.
- Importes alineados a la derecha y con dos decimales.
- Filas `TOTAL` y `SALDO ACTUAL` con mayor peso visual.
- No ocultar advertencias ni incidencias del historico.

## Flujo de usuario

1. `org0` y `org1` se precargan con los valores disponibles en el token. Los usuarios autorizados pueden modificarlos.
2. `org2` y `org3` se precargan desde el token o con `01`.
3. Al cargar la consulta o cambiar organicas, el frontend obtiene la QNA vigente en Firebird mediante `ultima-version`.
4. Con el periodo recibido, consulta el historico SQL Server mediante `/historico`.
5. Si existe una version para esa QNA vigente, el grid la muestra con sus conceptos, saldos e incidencias.
6. Si no existe una version para la QNA vigente, el frontend llama `POST /aplicar` con el periodo recibido; el backend lo valida nuevamente contra Firebird, genera y guarda el historico.
7. Si el usuario requiere recalcular la QNA vigente, ejecuta `Aplicar revision` nuevamente con ese mismo periodo, creando otra version.
8. Si el usuario selecciona una QNA anterior, el frontend consulta solamente el historico SQL Server.
9. Si la QNA anterior no tiene historico, se muestra el estado vacio y no se permite aplicarla.
10. Las acciones `Exportar Excel` y `Exportar PDF` descargan el mismo `idHistorico` mostrado en pantalla.

## Contrato backend

### Generar reporte

```text
POST /v1/reportes/estado-cuenta-ahorro/aplicar?periodo=1426&org0=04&org1=24
```

El backend valida que `periodo` coincida con la QNA vigente de Firebird para la organica indicada. Si no coincide, responde `409 PERIODO_NO_VIGENTE`. La respuesta exitosa devuelve `data.idHistorico`, que el frontend debe conservar como la version activa.

### Consultar ultima version

```text
GET /v1/reportes/estado-cuenta-ahorro/ultima-version?org0=04&org1=24
```

Esta es la primera consulta que debe realizar la pantalla al cargar o cambiar organicas. Solo obtiene la QNA vigente desde Firebird; no consulta SQL Server, no genera importes y no guarda historico.

- Respuesta `200`: guardar `data.periodo`, `data.quincena` y `data.anio` como la QNA vigente de la pantalla.
- La siguiente llamada obligatoria es `GET /historico` con la QNA recibida.

Respuesta esperada:

```json
{
  "ok": true,
  "data": {
    "quincena": 14,
    "anio": 2026,
    "periodo": "1426",
    "fecha": "2026-07-31",
    "org0": "04",
    "org1": "24",
    "org2": "01",
    "org3": "01"
  }
}
```

Los valores del ejemplo son contractuales, no importes reales.

### Consultar historico

```text
GET /v1/reportes/estado-cuenta-ahorro/historico/:idHistorico
```

Usar esta ruta para abrir una version ya generada sin recalcular las fuentes.

### Consultar QNA anterior

```text
GET /v1/reportes/estado-cuenta-ahorro/historico?quincena=13&anio=2026&org0=04&org1=24
```

Usar esta ruta exclusivamente cuando el usuario solicite una QNA anterior.

- Consulta solo SQL Server y devuelve la ultima version disponible para ese periodo y organica.
- No consulta Firebird, no recalcula importes y no crea historicos.
- Si no existe el snapshot, responde `404` con `HISTORICO_NO_ENCONTRADO` y el mensaje: `La QNA anterior no tiene histórico disponible y no puede regenerarse desde Firebird.`
- El frontend debe mostrar el estado vacio y ocultar `Aplicar revision` para ese resultado.

### Exportaciones

```text
GET /v1/reportes/estado-cuenta-ahorro/historico/:idHistorico/exportar.xlsx
GET /v1/reportes/estado-cuenta-ahorro/historico/:idHistorico/exportar.pdf
```

Las descargas deben abrirse como archivo binario. No generar Excel ni PDF en el navegador.

## Plan de implementacion frontend

### 1. Cliente de API y tipos

- Crear tipos para `EstadoCuentaAhorro`, `ConceptoEstadoCuentaAhorro` e `IncidenciaEstadoCuentaAhorro` a partir de la respuesta backend.
- Crear el tipo `QnaVigenteEstadoCuentaAhorro` para la respuesta de `ultima-version`.
- Crear funciones separadas para aplicar, consultar ultima version, consultar una version por `idHistorico` y descargar Excel/PDF.
- Centralizar el manejo de respuestas `400`, `401`, `403`, `404` y `500`.

### 2. Filtros y carga inicial

- Precargar organicas desde la sesion del usuario.
- Mantener `org2` y `org3` con valor inicial `01` cuando no existan en la sesion.
- Al cargar o modificar organicas, llamar a `ultima-version` y despues a `/historico` con el periodo recibido.
- En modo `QNA actual`, no solicitar quincena ni anio: el backend los determina desde Firebird.
- En modo `Consultar historico`, habilitar quincena y anio para buscar una QNA anterior mediante `/historico`.

### 3. Generacion explicita

- Mostrar `Aplicar revision` solamente a usuarios autorizados.
- Ejecutar `POST /aplicar` tras confirmacion del usuario, enviando el periodo devuelto por `ultima-version`.
- Al recibir respuesta exitosa, reemplazar el grid con el resultado y actualizar `idHistorico`, `version`, `estatus` y `estadoConciliacion`.
- No mostrar esta accion en modo `Consultar historico`.

### 4. Grid REVISA e incidencias

- Renderizar las 14 filas optimizadas en el orden que entrega backend.
- Aplicar formatos visuales sin modificar importes ni signos.
- Presentar incidencias en un panel expandible y visible cuando existan advertencias o errores.
- Mantener version, periodo, fecha de corte y organica visibles junto al grid.

### 5. Exportacion y consulta historica

- Habilitar exportaciones solo cuando exista `idHistorico` activo.
- Descargar Excel/PDF desde las rutas backend, sin transformar datos en el navegador.
- Permitir abrir una version por `idHistorico` cuando se integre la navegacion de historicos.

## Estructura de pantalla

```text
REVISA
REVISION DEL ESTADO DE CUENTA DE AHORRO

[ QNA actual | Consultar historico ] [ Quincena ] [ Anio ] [ Org0 ] [ Org1 ] [ Org2 ] [ Org3 ] [ Generar revision ]

Periodo: 1426 | Fecha de corte: 2026-07-31 | Version: 3 | Estatus: INCOMPLETO
Organica: 04-24-01-01

[ Exportar Excel ] [ Exportar PDF ]

| Concepto | CAIR | FRA | FRE | FH | FV | FAA | FAE | FAT | FAI | Total |
| ...      | ...  | ... | ... | .. | .. | ... | ... | ... | ... | ...   |

Incidencias (N)
| Severidad | Codigo | Procedimiento | Mensaje |
```

## Grid principal

La nueva estructura usa las filas optimizadas ya definidas. Deben renderizarse siempre en este orden, incluso si todos sus importes son cero:

| Orden | Clave backend | Etiqueta visible | Tratamiento visual |
| ---: | --- | --- | --- |
| 1 | `SALDO_ANTERIOR` | Saldo anterior | Fila informativa. |
| 2 | `APLICACION_QUINCENAL` | Aplicacion quincenal | Movimiento de entrada. |
| 3 | `ALTA_REINGRESO` | Alta o reingreso | Movimiento de entrada. |
| 4 | `BAJA` | Baja | Movimiento de salida. |
| 5 | `SUSPENSION_BAJA` | Suspension y baja | Movimiento de salida. |
| 6 | `TRASPASO_SALIDA` | Traspaso salida | Movimiento de salida. |
| 7 | `TRASPASO_ENTRADA` | Traspaso entrada | Movimiento de entrada. |
| 8 | `APORTACION_EXTEMPORANEA` | Aportacion extemporanea | Movimiento de entrada. |
| 9 | `DEVOLUCION_INTERESES_ACTIVOS` | Devolucion intereses activos | Movimiento de salida. |
| 10 | `DEVOLUCION_INTERESES_LICENCIAS` | Devolucion intereses licencias | Movimiento de salida. |
| 11 | `CAPITALIZACION_INTERESES_LICENCIAS` | Capitalizacion intereses licencias | Movimiento de entrada. |
| 12 | `CAPITALIZACION_INTERESES_ACTIVOS` | Capitalizacion intereses activos | Movimiento de entrada. |
| 13 | `TOTAL` | Total | Fondo destacado, negritas y borde superior doble. |
| 14 | `SALDO_ACTUAL` | Saldo actual | Fondo principal destacado, negritas y borde superior doble. |

Columnas obligatorias:

```text
Concepto | CAIR | FRA | FRE | FH | FV | FAA | FAE | FAT | FAI | Total
```

Reglas de formato:

- Usar `es-MX` con dos decimales: `1,234.56`.
- Mostrar negativos con signo menos y color de salida, sin cambiar el importe recibido.
- Los ceros se muestran como `0.00`.
- Usar el campo `concepto.tieneAdvertencia` para marcar la etiqueta de la fila con un indicador discreto.
- La columna `Total` se calcula y entrega desde backend; el frontend no la recalcula.
- En movil, mantener la columna `Concepto` fija y permitir desplazamiento horizontal para los fondos.

## Estados y mensajes

| Estado backend | Presentacion requerida |
| --- | --- |
| `GENERADO` | Etiqueta positiva. Mostrar reporte sin bloquear exportaciones. |
| `INCOMPLETO` | Etiqueta de advertencia. Mostrar grid y panel de incidencias. No ocultar valores. |
| `ERROR` | Etiqueta de error. Mostrar el mensaje disponible y permitir corregir filtros para volver a generar. |
| `CONCILIADO` | Indicador de conciliacion correcta. |
| `CON_DIFERENCIA` | Indicador visible de diferencia y montos entregados por backend. |
| `NO_VERIFICABLE` | Indicador de advertencia con texto: `Conciliacion pendiente de fuentes validadas`. |

Estados de interfaz:

- Cargando QNA actual: mostrar progreso mientras el backend obtiene la QNA vigente y despues consulta su snapshot historico.
- QNA actual sin historico: habilitar `Aplicar revision` con el periodo vigente recibido desde Firebird.
- Aplicando QNA actual: deshabilitar el boton y mostrar progreso; el `POST /aplicar` valida el periodo y crea una nueva version.
- QNA anterior sin historico: informar que no existe snapshot y que no puede regenerarse desde Firebird; ocultar el boton de generacion.
- Error HTTP: mostrar el mensaje de `error.message` sin exponer detalles tecnicos.
- Error de descarga: mantener el reporte visible y ofrecer reintentar.

## Panel de incidencias

El panel es obligatorio cuando `incidencias.length > 0`.

- Mostrar contador en el titulo: `Incidencias (N)`.
- Columnas: severidad, codigo, procedimiento y mensaje.
- `ERROR`: rojo institucional.
- `ADVERTENCIA`: amarillo o ambar.
- `INFO`: neutro.
- No bloquear la lectura ni la exportacion de un reporte `INCOMPLETO`.

## Criterios de aceptacion frontend

1. La pantalla se identifica como `REVISA` y presenta la estructura optimizada de 14 filas.
2. Al cargar organicas, la pantalla consulta `ultima-version`, que solo determina la QNA vigente desde Firebird.
3. La pantalla consulta `/historico` usando el periodo de la QNA vigente; si no hay snapshot, habilita `Aplicar revision`.
4. `Aplicar revision` envía el periodo vigente a `POST /aplicar`; el backend rechaza periodos que ya no sean vigentes.
5. Una QNA anterior se consulta solo mediante `/historico`; si no existe snapshot se muestra un estado vacio sin accion de aplicacion.
6. La version activa se obtiene desde `data.idHistorico` y se muestra junto con periodo, fecha de corte, organica, estatus y conciliacion.
7. Los importes se muestran exactamente como los entrega el backend, sin recalculo cliente.
8. Excel y PDF descargan el mismo historico visible en el grid.
9. El grid funciona en escritorio y movil, manteniendo legible la columna de concepto.
10. Las incidencias de backend se muestran al usuario autorizado.
11. La interfaz no consume Firebird ni SQL Server de forma directa.

## Pendiente visual

Adjuntar la imagen del reporte anterior para definir los valores exactos de colores, tipografias, alturas, espaciados, logotipos y disposicion institucional final. Esta especificacion no autoriza iniciar la implementacion frontend hasta recibir `CONTINUAR CON EL FRONTEND`.
