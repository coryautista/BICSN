# Integración frontend del reporte REVISA

## Objetivo

Implementar en el frontend de Entidad una pantalla para consultar y presentar el reporte REVISA de una orgánica y una QNA.

El reporte se muestra como una matriz: cada fila corresponde a un concepto y cada columna a uno de los nueve fondos calculados por el backend.

## Estado de la integración

El backend ya calcula los conceptos REVISA en segundo plano y almacena el resultado en `conciliacion.Revision`.

El endpoint de consulta está disponible en `GET /v1/reportes/revision`.

El frontend no debe consultar SQL Server, Firebird ni el archivo de trazabilidad SFTP directamente.

## Ubicación sugerida

```text
Reportes
└── Revisión
```

Ruta sugerida del frontend:

```text
/reportes/revision
```

## Filtros

La pantalla debe solicitar:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `quincena` | Número | Obligatorio, entre 1 y 24. |
| `anio` | Número | Obligatorio, cuatro dígitos. |
| `org0` | Texto | Usar la orgánica del usuario autenticado. |
| `org1` | Texto | Usar la orgánica del usuario autenticado. |
| `org2` | Texto | Valor fijo `01`; no debe mostrarse como selector. |
| `org3` | Texto | Valor fijo `01`; no debe mostrarse como selector. |

El período enviado al backend tiene formato `QQAA`:

```text
Quincena 15, año 2026 -> 1526
Quincena 1, año 2027  -> 0127
```

Cada componente de la orgánica debe enviarse normalizado a dos dígitos.

Los usuarios de Entidad no deben poder consultar una orgánica diferente de la contenida en su sesión. Si existen perfiles administrativos con acceso a varias orgánicas, el backend debe autorizar la selección; no basta con habilitarla en la interfaz.

## Contrato backend

### Consultar reporte

```http
GET /v1/reportes/revision?periodo=1526&org0=04&org1=24&org2=01&org3=01
Authorization: Bearer <token>
```

`org0` y `org1` pueden omitirse cuando el backend pueda resolverlos desde el token. `org2` y `org3` siempre son `01`; valores distintos deben ser rechazados.

### Respuesta disponible

```json
{
  "ok": true,
  "data": {
    "organica": {
      "org0": "04",
      "org1": "24",
      "org2": "01",
      "org3": "01",
      "clave": "04-24-01-01"
    },
    "periodo": "1526",
    "quincena": 15,
    "anio": 2026,
    "estatusProceso": "COMPLETADA",
    "fechaActualizacion": "2026-08-09T18:30:00.000Z",
    "conceptos": [
      {
        "idRevision": 101,
        "numeroConcepto": 1,
        "concepto": "Saldo anterior",
        "cair": 3360944.75,
        "fra": 6923970.00,
        "fre": 39029597.06,
        "fh": 586116.07,
        "fv": 2930575.60,
        "faa": 3434527.57,
        "fae": 1716908.51,
        "fat": 5151436.12,
        "fai": 106237.00,
        "estatus": "A"
      }
    ]
  }
}
```

El backend debe devolver los conceptos ordenados por `numeroConcepto` y únicamente los conceptos activos del catálogo.

### Proceso pendiente

REVISA se ejecuta en segundo plano después de generar la Línea de Pago. Si la tarea todavía no termina, el endpoint debe responder:

```http
HTTP 202 Accepted
```

```json
{
  "ok": true,
  "data": {
    "organica": {
      "org0": "04",
      "org1": "24",
      "org2": "01",
      "org3": "01",
      "clave": "04-24-01-01"
    },
    "periodo": "1526",
    "estatusProceso": "PENDIENTE",
    "intentos": 0,
    "conceptos": []
  }
}
```

Los valores posibles de `estatusProceso` son:

| Estatus | Comportamiento del frontend |
| --- | --- |
| `PENDIENTE` | Mostrar que el reporte está en espera y volver a consultar. |
| `PROCESANDO` | Mostrar indicador de procesamiento y volver a consultar. |
| `COMPLETADA` | Presentar el reporte. |
| `ERROR` | Mostrar el mensaje controlado y permitir reintentar la consulta. |

Mientras el estado sea `PENDIENTE` o `PROCESANDO`, el frontend puede consultar nuevamente cada cinco segundos. Debe detener el sondeo al salir de la pantalla, al recibir `COMPLETADA` o `ERROR`, o después del límite de espera definido por la aplicación.

### Reporte inexistente

Cuando no exista una tarea ni información REVISA para la orgánica y período:

```http
HTTP 404 Not Found
```

```json
{
  "ok": false,
  "error": {
    "code": "REVISION_NO_ENCONTRADA",
    "message": "No existe un reporte REVISA para la orgánica y el período solicitados."
  }
}
```

### Error de procesamiento

```json
{
  "ok": false,
  "error": {
    "code": "REVISION_PROCESO_ERROR",
    "message": "No fue posible completar el cálculo REVISA."
  },
  "data": {
    "estatusProceso": "ERROR",
    "intentos": 3
  }
}
```

No se debe enviar al navegador información de conexión, consultas SQL, rutas SFTP ni mensajes técnicos de Firebird o SQL Server.

## Modelo TypeScript sugerido

```ts
export type EstatusProcesoRevision =
  | 'PENDIENTE'
  | 'PROCESANDO'
  | 'COMPLETADA'
  | 'ERROR';

export interface ConceptoRevision {
  idRevision: number;
  numeroConcepto: number;
  concepto: string;
  cair: number;
  fra: number;
  fre: number;
  fh: number;
  fv: number;
  faa: number;
  fae: number;
  fat: number;
  fai: number;
  estatus: 'A' | 'I';
}

export interface ReporteRevision {
  organica: {
    org0: string;
    org1: string;
    org2: string;
    org3: string;
    clave: string;
  };
  periodo: string;
  quincena: number;
  anio: number;
  estatusProceso: EstatusProcesoRevision;
  intentos?: number;
  fechaActualizacion?: string;
  conceptos: ConceptoRevision[];
}
```

El contrato técnico conserva la propiedad `fai`. El frontend no debe renombrarla en el modelo ni esperar una propiedad `far` en la respuesta. Únicamente la etiqueta visible correspondiente a `fai` debe mostrarse como `FAR`.

## Presentación del reporte

### Encabezado

Mostrar:

- Título `Reporte de Revisión`.
- Orgánica completa `ORG0-ORG1-ORG2-ORG3`.
- QNA y año.
- Estado del proceso.
- Fecha de última actualización.

### Tabla

Columnas requeridas:

| Columna | Alineación |
| --- | --- |
| Número | Centrada |
| Concepto | Izquierda |
| CAIR | Derecha |
| FRA | Derecha |
| FRE | Derecha |
| FH | Derecha |
| FV | Derecha |
| FAA | Derecha |
| FAE | Derecha |
| FAT | Derecha |
| FAR | Derecha |

La columna visual `FAR` usa el valor recibido en la propiedad técnica `fai`. Esta misma etiqueta debe aplicarse en las filas de conceptos, Total, Diferencia y Ajustes.

Orden esperado de los conceptos activos:

| Número | Concepto |
| ---: | --- |
| 1 | Saldo anterior |
| 2 | Aplicación quincenal |
| 3 | Alta o reingreso |
| 4 | Baja |
| 5 | Suspensión y baja |
| 6 | Traspaso |
| 7 | Capital Constitutivo |
| 8 | Devolución de intereses a activos |
| 9 | Devolución de intereses a licencias |
| 10 | Capitalización de intereses a licencias |
| 11 | Capitalización de intereses a activos |
| 12 | Saldo actual |
| 13 | Liberación de PCP con fondo de Ahorro |
| 14 | Ajustes |
| 15 | Liberación de PMP con fondo de Ahorro |
| 16 | Liberación de HIP con fondo de Ahorro |

El concepto 14 es administrativo y opcional. Solo aparece cuando el proyecto Administrador ha registrado una fila de Ajustes para la orgánica y el período. El frontend de Entidad no debe asumir una cantidad fija de conceptos.

Los conceptos 8 y 11 son anuales: solo se calculan en el período `01AA`. En períodos `02AA` a `24AA` permanecen visibles con los nueve fondos en `0.00`; este cero significa que el concepto no aplica y que el backend no consultó su fuente Firebird.

El proyecto Administrador realiza visualmente el cuadre que incorpora Ajustes. El backend entrega los importes capturados sin recalcular saldos ni alterar los conceptos automáticos.

### Orden especial en el proyecto Administrador

La tabla de Administrador debe presentar las filas en este orden:

1. Conceptos automáticos 1 a 13, 15 y 16.
2. `Total`, calculado visualmente por Administrador conforme a sus reglas de cuadre.
3. `Diferencia`, calculada por cada fondo como `Total - Saldo actual`.
4. `Ajustes`, concepto 14 capturado manualmente.

Aunque Ajustes tenga el número de concepto 14, debe colocarse después de Diferencia. Total y Diferencia son filas derivadas de presentación: BICSN no las persiste ni las devuelve como conceptos REVISA.

Ajustes es libre para el usuario administrador. Cada fondo admite valores positivos, negativos o cero. La captura de Ajustes no recalcula ni modifica automáticamente Total, Diferencia, Saldo actual o los conceptos automáticos; Administrador decide cómo utilizar esos importes en su cuadre visual.

### Formato de importes

Usar formato monetario mexicano con dos decimales, separador de miles y signo visible para valores negativos:

```ts
const formatoImporte = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
```

El frontend debe mostrar los importes exactamente con el signo recibido. No debe convertir negativos a positivos ni recalcular el concepto 12.

El frontend de Entidad no debe agregar una suma general indiscriminada. El proyecto Administrador sí puede mostrar Total y Diferencia con sus reglas funcionales de cuadre, sin persistir esas filas ni presentarlas como conceptos calculados por BICSN.

## Estados visuales

La pantalla debe contemplar:

| Estado | Presentación |
| --- | --- |
| Inicial | Formulario de filtros sin resultados. |
| Cargando | Esqueleto o indicador dentro del área del reporte. |
| Pendiente | Mensaje `El reporte está pendiente de procesamiento`. |
| Procesando | Mensaje `El reporte se está generando`. |
| Disponible | Encabezado y tabla completos. |
| Sin reporte | Mensaje del `404`, sin tabla vacía engañosa. |
| Error | Mensaje controlado y acción `Volver a consultar`. |

No se debe interpretar una fila con importes en cero como error. Cero es un resultado válido para un concepto procesado.

## Exportación

La primera versión puede exportar la tabla disponible a Excel desde el frontend, siempre que conserve:

- Orgánica.
- Período.
- Fecha de actualización.
- Número y nombre del concepto.
- Los nueve fondos con dos decimales.
- Signos originales de los importes.
- Encabezado visual `FAR` para los valores provenientes de la propiedad `fai`.

Nombre sugerido:

```text
revision_04240101_1526.xlsx
```

Si se requiere PDF oficial o una exportación idéntica entre clientes, debe implementarse posteriormente en backend:

```http
GET /v1/reportes/revision/exportar.xlsx?periodo=1526&org0=04&org1=24&org2=01&org3=01
GET /v1/reportes/revision/exportar.pdf?periodo=1526&org0=04&org1=24&org2=01&org3=01
```

Estas rutas son propuestas y no existen actualmente.

## Flujo de la pantalla

1. Cargar la orgánica desde la sesión del usuario.
2. Solicitar quincena y año.
3. Construir el período `QQAA`.
4. Consultar `GET /v1/reportes/revision`.
5. Si el backend responde `202`, mostrar el estado y activar sondeo cada cinco segundos.
6. Si responde `200`, ordenar por `numeroConcepto` y presentar la tabla.
7. Si responde `404`, indicar que el período no tiene reporte REVISA.
8. Si responde error de proceso, mostrar un mensaje controlado sin detalles internos.
9. Habilitar exportación únicamente cuando el estado sea `COMPLETADA`.

## Criterios de aceptación

- La pantalla solo consulta información de la orgánica autorizada.
- El período se envía siempre en formato `QQAA`.
- Los conceptos se muestran en orden numérico.
- Se presentan los nueve fondos con dos decimales.
- Los valores negativos conservan su signo.
- Los conceptos con todos sus importes en cero permanecen visibles.
- Los conceptos 7 y 10 aparecen porque están activos.
- El concepto 13 aparece y el concepto 14 solo aparece cuando existen Ajustes capturados.
- La pantalla distingue entre reporte inexistente, procesamiento pendiente y error.
- El sondeo se detiene correctamente.
- La exportación usa los mismos datos presentados en pantalla.
- El frontend no recalcula ni modifica los importes entregados por backend.

## Dependencia pendiente

La consulta y autorización del reporte están implementadas. Solo queda definir si la exportación oficial se genera en frontend o mediante los endpoints de exportación propuestos.
