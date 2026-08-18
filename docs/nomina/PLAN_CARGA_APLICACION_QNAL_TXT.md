# Plan de Carga de Aplicacion Quincenal TXT

## Objetivo

Implementar la lectura, validacion y almacenamiento en SQL Server de archivos TXT de aplicacion quincenal, iniciando con archivos de 20 campos y dejando la estructura preparada para el layout esperado de 35 campos.

## Alcance

- Recibir archivo TXT desde un endpoint.
- Recibir como parametros `anio`, `quincena` y organicas `0` a `3`.
- Validar que el archivo corresponda a la quincena actual de la entidad.
- Guardar registros vigentes en SQL Server.
- Reemplazar registros si se carga un nuevo archivo valido para la misma entidad, periodo y organicas.
- Conservar historial de los registros reemplazados.
- Registrar errores de carga cuando el archivo sea rechazado.

## Fuera De Alcance Inicial

- Generar el TXT.
- Modificar el endpoint existente de quincena actual.
- Definir reglas finales de todos los 35 campos cuando aun no vengan en el TXT.
- Procesar archivos diferentes al formato de aplicacion quincenal.

## Archivo Actual Analizado

Archivo base:

`docs/nomina/07 OC Y FG 2026.txt`

Hallazgos:

- Total de lineas: 163.
- Encabezado: 1 linea tipo `1`.
- Detalle: 162 lineas tipo `2`.
- Separador: `@`.
- Encabezado: 17 campos.
- Detalle actual: 20 campos.
- Layout esperado a futuro: 35 campos.
- Totales principales del encabezado cuadran contra el detalle.

## Endpoint Existente Para Quincena Actual

Ya existe un endpoint relacionado:

`GET /afectacion-org/quincena-alta-afectacion`

Ubicacion:

`src/modules/afectacionOrg/afectacionOrg.routes.ts`

Flujo interno:

- Usa `GetQuincenaAltaAfectacionQuery`.
- Consulta `QuincenaRepository`.
- Lee informacion desde `afec.EstadoAfectacionOrg`.

Tambien existe consulta directa a Firebird:

`AfectacionOrgService.getQuincenaFromFirebird(org0, org1, org2, org3)`

Esta usa el SP:

`AP_G_APLICADO_TIPO`

Para el nuevo endpoint se debe reutilizar `AfectacionOrgService.getQuincenaFromFirebird`, que consulta el SP Firebird `AP_G_APLICADO_TIPO`. No se debe usar el fallback de SQL Server de `afec.EstadoAfectacionOrg` para validar este archivo TXT.

## Endpoint Nuevo Propuesto

Ruta propuesta:

`POST /nomina/aplicacion-qnal-txt/cargar`

Formato:

`multipart/form-data`

Parametros:

| Parametro | Tipo | Requerido | Comentario |
|---|---|---:|---|
| archivo | file | Si | TXT a procesar |
| anio | number | Si | Año del periodo |
| quincena | number | Si | Quincena del periodo, 1 a 24 |
| organica0 | string | Si | Organica nivel 0 |
| organica1 | string | Si | Organica nivel 1 |
| organica2 | string | Si | Organica nivel 2 |
| organica3 | string | Si | Organica nivel 3 |

Ejemplo:

```text
archivo = 07 OC Y FG 2026.txt
anio = 2026
quincena = 7
organica0 = 01
organica1 = 00
organica2 = 01
organica3 = 01
```

## Endpoint De Consulta Propuesto

Ruta propuesta:

`GET /nomina/aplicacion-qnal-txt/registros`

Objetivo:

Consultar los registros vigentes cargados desde el TXT por entidad, año, quincena y organicas.

Parametros query:

| Parametro | Tipo | Requerido | Comentario |
|---|---|---:|---|
| entidadId | number | Si | Identificador de la entidad |
| anio | number | Si | Año del periodo |
| quincena | number | Si | Quincena del periodo, 1 a 24 |
| organica0 | string | Si | Organica nivel 0 |
| organica1 | string | No | Organica nivel 1 |
| organica2 | string | No | Organica nivel 2 |
| organica3 | string | No | Organica nivel 3 |
| page | number | No | Pagina, default `1` |
| pageSize | number | No | Registros por pagina, default `50`, maximo sugerido `500` |
| buscar | string | No | Filtro opcional por RFC, clave personal o nombre |

Ejemplo:

```text
GET /nomina/aplicacion-qnal-txt/registros?entidadId=1&anio=2026&quincena=7&organica0=01&organica1=00&organica2=01&organica3=01&page=1&pageSize=50
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": {
    "periodo": {
      "entidadId": 1,
      "anio": 2026,
      "quincena": 7,
      "organica0": "01",
      "organica1": "00",
      "organica2": "01",
      "organica3": "01"
    },
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 162,
      "totalPages": 4
    },
    "carga": {
      "cargaId": 123,
      "archivoNombre": "07 OC Y FG 2026.txt",
      "fechaRegistro": "2026-05-15T03:53:00Z",
      "estatus": "APLICADA"
    },
    "registros": [
      {
        "id": 1,
        "lineaNumero": 2,
        "lote": "0126007",
        "clavePersonal": "3100011328",
        "rfc": "SOLJ620804NT3",
        "nombreAfiliado": "SOTO/LOPEZ/JESUS",
        "fechaMovimiento": "2026-04-15",
        "sueldoMensual": 31079.15,
        "baseCotizacionSueldo": 15539.58,
        "baseCotizacionQuinquenios": 0.00,
        "diasLaborados": 15.00,
        "aportacionAfiliadoFondoAhorro": 699.28,
        "aportacionEntidadFondoAhorro": 776.98,
        "aportacionAfiliadoEBI": 2568.77,
        "aportacionEntidadEBI": 0.00,
        "descuentoPrestamoCortoPlazo": 0.00,
        "descuentoPrestamoHipotecario": 0.00,
        "descuentoPrestamoMedianoPlazo": 0.00,
        "descuentosOtros": 310.79,
        "cair": 0.00,
        "cairVoluntario": 0.00
      }
    ]
  }
}
```

Reglas de consulta:

- Solo consulta registros vigentes en `NominaAplicacionQnalDetalle`.
- No consulta historial, salvo que se cree un endpoint separado para auditoria.
- Debe filtrar por `EntidadId`, `Anio`, `Quincena` y `Organica0`.
- Si vienen `Organica1`, `Organica2` u `Organica3`, tambien deben aplicarse al filtro.
- Debe regresar datos de la carga aplicada mas reciente asociada a esos registros.
- Debe soportar paginacion para evitar respuestas grandes.
- El filtro `buscar` debe aplicar sobre `RFC`, `ClavePersonal` y `NombreAfiliado`.

Consulta SQL base sugerida:

```sql
SELECT
    d.Id,
    d.CargaId,
    c.ArchivoNombre,
    c.FechaRegistro AS FechaCarga,
    d.LineaNumero,
    d.Lote,
    d.ClavePersonal,
    d.RFC,
    d.NombreAfiliado,
    d.FechaMovimiento,
    d.SueldoMensual,
    d.BaseCotizacionSueldo,
    d.BaseCotizacionQuinquenios,
    d.DiasLaborados,
    d.AportacionAfiliadoFondoAhorro,
    d.AportacionEntidadFondoAhorro,
    d.AportacionAfiliadoEBI,
    d.AportacionEntidadEBI,
    d.DescuentoPrestamoCortoPlazo,
    d.DescuentoPrestamoHipotecario,
    d.DescuentoPrestamoMedianoPlazo,
    d.DescuentosOtros,
    d.CAIR,
    d.CAIRVoluntario
FROM dbo.NominaAplicacionQnalDetalle d
JOIN dbo.NominaAplicacionQnalCarga c ON c.Id = d.CargaId
WHERE d.EntidadId = @EntidadId
  AND d.Anio = @Anio
  AND d.Quincena = @Quincena
  AND d.Organica0 = @Organica0
  AND (@Organica1 IS NULL OR d.Organica1 = @Organica1)
  AND (@Organica2 IS NULL OR d.Organica2 = @Organica2)
  AND (@Organica3 IS NULL OR d.Organica3 = @Organica3)
  AND (
      @Buscar IS NULL
      OR d.RFC LIKE '%' + @Buscar + '%'
      OR d.ClavePersonal LIKE '%' + @Buscar + '%'
      OR d.NombreAfiliado LIKE '%' + @Buscar + '%'
  )
ORDER BY d.LineaNumero
OFFSET (@Page - 1) * @PageSize ROWS
FETCH NEXT @PageSize ROWS ONLY;
```

Consulta SQL para total:

```sql
SELECT COUNT(1) AS Total
FROM dbo.NominaAplicacionQnalDetalle d
WHERE d.EntidadId = @EntidadId
  AND d.Anio = @Anio
  AND d.Quincena = @Quincena
  AND d.Organica0 = @Organica0
  AND (@Organica1 IS NULL OR d.Organica1 = @Organica1)
  AND (@Organica2 IS NULL OR d.Organica2 = @Organica2)
  AND (@Organica3 IS NULL OR d.Organica3 = @Organica3)
  AND (
      @Buscar IS NULL
      OR d.RFC LIKE '%' + @Buscar + '%'
      OR d.ClavePersonal LIKE '%' + @Buscar + '%'
      OR d.NombreAfiliado LIKE '%' + @Buscar + '%'
  );
```

## Validaciones

### 1. Validacion De Parametros

- `anio` debe ser requerido.
- `quincena` debe ser requerida.
- `quincena` debe estar entre `1` y `24`.
- `organica0`, `organica1`, `organica2` y `organica3` deben venir en el request.
- El archivo debe existir y tener contenido.

### 2. Validacion Del Nombre Del Archivo

Para un archivo como:

`07 OC Y FG 2026.txt`

Se debe extraer:

- `quincenaArchivo = 7`
- `anioArchivo = 2026`

Regla:

- `quincenaArchivo` debe coincidir con el parametro `quincena`.
- `anioArchivo` debe coincidir con el parametro `anio`.

Si no coincide, la carga se rechaza.

### 3. Validacion Contra Quincena Actual De La Entidad

Consultar la quincena actual usando la logica existente:

`GetQuincenaAltaAfectacionQuery.execute({ entidad, org0, org1, org2, org3 })`

Regla:

- `quincena` del request debe coincidir con la quincena actual.
- `anio` del request debe coincidir con el año actual devuelto por la consulta.

Si no coincide, la carga se rechaza.

### 4. Validacion Del Encabezado

- Debe existir una linea de encabezado.
- Debe tener tipo de registro `1`.
- Debe tener 17 campos.
- Deben validarse fechas inicial y final.
- Deben validarse importes numericos.

### 5. Validacion Del Detalle

- Cada linea de detalle debe tener tipo de registro `2`.
- Se aceptan dos formatos:
  - 20 campos: formato actual.
  - 35 campos: formato esperado futuro.
- Cualquier otro numero de campos debe rechazarse.

### 6. Validacion De Totales

Los totales del encabezado deben cuadrar contra las sumas del detalle.

Conceptos iniciales a validar:

- Base cotizacion sueldo.
- Base cotizacion quinquenios.
- Aportacion afiliado fondo ahorro.
- Aportacion entidad fondo ahorro.
- Aportacion afiliado EBI.
- Aportacion entidad EBI.
- CAIR o importe relacionado si aplica.

## Regla Propuesta Para Dias Laborados

Con el TXT actual, se propone calcular los dias laborados por regla de tres usando:

- `BaseCotizacionSueldo`: campo 10 del TXT actual.
- `SueldoMensual`: campo 12 del TXT actual.

Formula:

```text
DiasLaborados = ROUND((BaseCotizacionSueldo / SueldoMensual) * 30, 2)
```

Restricciones:

- Si `SueldoMensual` es `NULL` o `0`, `DiasLaborados` sera `NULL`.
- Si el resultado es menor a `0`, se guarda `0`.
- Si el resultado es mayor a `15`, se guarda `15`.

Cuando el TXT ya venga con 35 campos, se debe usar el campo esperado de sueldo mensual si viene informado.

## Mapeo Inicial De 20 Campos

| Campo TXT | Campo destino | Comentario |
|---:|---|---|
| 1 | Lote | Campo directo |
| 2 | TipoRegistro | Debe ser `2` |
| 3 | ClavePersonal | Campo directo |
| 4 | RFC | Campo directo |
| 5 | NombreAfiliado | Campo directo |
| 6 | AportacionAfiliadoFondoAhorro | Campo directo |
| 7 | AportacionEntidadFondoAhorro | Campo directo |
| 8 | AportacionAfiliadoEBI | Campo directo |
| 9 | AportacionEntidadEBI | Campo directo |
| 10 | BaseCotizacionSueldo | Campo directo |
| 11 | BaseCotizacionQuinquenios | Campo directo |
| 12 | SueldoMensual | Usado para calcular dias laborados |
| 13 | DescuentoPrestamoCortoPlazo | Pendiente de confirmar funcionalmente |
| 14 | DescuentoPrestamoHipotecario | Pendiente de confirmar funcionalmente |
| 15 | FechaMovimiento | Formato `AAAAMMDD` |
| 16 | DescuentoPrestamoMedianoPlazo | Pendiente de confirmar funcionalmente |
| 17 | DescuentosOtros | Pendiente de confirmar funcionalmente |
| 18 | CAIR | Pendiente de confirmar funcionalmente |
| 19 | CAIRVoluntario | Pendiente de confirmar funcionalmente |
| 20 | Reservado | No se guarda en columna duplicada por ahora |

## Tablas A Crear

### NominaAplicacionQnalCarga

Proposito:

- Registrar cada intento de carga.
- Guardar estatus, periodo, organicas, archivo y validacion de quincena actual.

Campos clave:

- `Id`
- `EntidadId`
- `Anio`
- `Quincena`
- `QuincenaActualEntidad`
- `AnioActualEntidad`
- `FuenteQuincenaActual`
- `Organica0` a `Organica3`
- `ArchivoNombre`
- `ArchivoHash`
- `TotalLineas`
- `TotalDetalles`
- `Estatus`
- `MotivoRechazo`
- `FechaRegistro`
- `UsuarioRegistro`
- `CargaReemplazadaId`

### NominaAplicacionQnalDetalle

Proposito:

- Guardar los registros vigentes de la carga aplicada.
- Contener los 35 campos esperados del layout.
- Guardar `DiasLaborados` calculado.
- Guardar `LineaOriginal` para auditoria.

### NominaAplicacionQnalDetalleHistorial

Proposito:

- Guardar los registros anteriores cuando una carga valida reemplaza otra.
- Mantener auditoria de cambios.

### NominaAplicacionQnalCargaError

Proposito:

- Guardar errores de validacion por carga y por linea.
- Permitir diagnostico sin afectar registros vigentes.

## Flujo De Carga Valida

1. Recibir request con archivo, `anio`, `quincena` y organicas.
2. Crear registro de carga con estatus `RECIBIDA`.
3. Validar nombre del archivo contra parametros.
4. Consultar quincena actual de la entidad.
5. Validar que `anio` y `quincena` correspondan a la quincena actual.
6. Leer TXT.
7. Validar encabezado.
8. Validar detalle.
9. Validar totales.
10. Abrir transaccion SQL.
11. Buscar carga vigente anterior para misma entidad, periodo y organicas.
12. Copiar detalle vigente a historial.
13. Borrar detalle vigente.
14. Insertar nuevo detalle.
15. Marcar carga como `APLICADA`.
16. Confirmar transaccion.

## Flujo De Carga Rechazada

1. Crear registro de carga con estatus `RECIBIDA`.
2. Ejecutar validaciones.
3. Si falla una validacion, marcar carga como `RECHAZADA`.
4. Guardar `MotivoRechazo`.
5. Guardar errores en `NominaAplicacionQnalCargaError`.
6. No borrar ni modificar registros vigentes.

## Reglas De Reemplazo

Una nueva carga valida reemplaza registros cuando coincide:

```text
EntidadId + Anio + Quincena + Organica0 + Organica1 + Organica2 + Organica3
```

Antes de borrar registros vigentes:

- Copiar a `NominaAplicacionQnalDetalleHistorial`.
- Guardar referencia a la carga nueva que reemplazo la anterior.

## Respuestas Del Endpoint

### Carga Aplicada

```json
{
  "ok": true,
  "data": {
    "cargaId": 123,
    "archivo": "07 OC Y FG 2026.txt",
    "anio": 2026,
    "quincena": 7,
    "totalLineas": 163,
    "totalDetalles": 162,
    "estatus": "APLICADA"
  }
}
```

### Carga Rechazada

```json
{
  "ok": false,
  "error": {
    "code": "QUINCENA_NO_CORRESPONDE",
    "message": "El archivo corresponde a quincena 7/2026, pero la quincena actual de la entidad es 8/2026."
  }
}
```

## SQL De Creacion Manual

Este SQL esta pensado para ejecutarse manualmente en SQL Server antes de implementar el endpoint. Los nombres estan en esquema `dbo`; si se decide usar otro esquema, ajustar los prefijos antes de ejecutar.

### Tabla De Cargas

```sql
CREATE TABLE dbo.NominaAplicacionQnalCarga (
    Id BIGINT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_NominaAplicacionQnalCarga PRIMARY KEY,

    EntidadId INT NOT NULL,

    Anio SMALLINT NOT NULL,
    Quincena TINYINT NOT NULL,

    QuincenaActualEntidad TINYINT NULL,
    AnioActualEntidad SMALLINT NULL,
    FuenteQuincenaActual VARCHAR(80) NULL,

    Organica0 VARCHAR(10) NOT NULL,
    Organica1 VARCHAR(10) NULL,
    Organica2 VARCHAR(10) NULL,
    Organica3 VARCHAR(10) NULL,

    ArchivoNombre NVARCHAR(255) NOT NULL,
    ArchivoHash VARBINARY(32) NULL,

    TotalLineas INT NOT NULL,
    TotalDetalles INT NOT NULL,

    Estatus VARCHAR(20) NOT NULL,
    MotivoRechazo NVARCHAR(1000) NULL,

    FechaRegistro DATETIME2(0) NOT NULL
        CONSTRAINT DF_NominaAplicacionQnalCarga_FechaRegistro DEFAULT SYSUTCDATETIME(),

    UsuarioRegistro NVARCHAR(100) NULL,
    CargaReemplazadaId BIGINT NULL,

    CONSTRAINT CK_NominaAplicacionQnalCarga_Estatus
        CHECK (Estatus IN ('RECIBIDA', 'VALIDADA', 'APLICADA', 'RECHAZADA')),

    CONSTRAINT CK_NominaAplicacionQnalCarga_Quincena
        CHECK (Quincena BETWEEN 1 AND 24),

    CONSTRAINT FK_NominaAplicacionQnalCarga_CargaReemplazada
        FOREIGN KEY (CargaReemplazadaId)
        REFERENCES dbo.NominaAplicacionQnalCarga(Id)
);
```

### Tabla De Detalle Vigente

```sql
CREATE TABLE dbo.NominaAplicacionQnalDetalle (
    Id BIGINT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_NominaAplicacionQnalDetalle PRIMARY KEY,

    CargaId BIGINT NOT NULL,

    EntidadId INT NOT NULL,
    Anio SMALLINT NOT NULL,
    Quincena TINYINT NOT NULL,

    Organica0 VARCHAR(10) NOT NULL,
    Organica1 VARCHAR(10) NULL,
    Organica2 VARCHAR(10) NULL,
    Organica3 VARCHAR(10) NULL,

    LineaNumero INT NOT NULL,
    LineaOriginal NVARCHAR(MAX) NOT NULL,

    Lote VARCHAR(20) NOT NULL,
    TipoRegistro CHAR(1) NOT NULL,

    OrganicaI VARCHAR(10) NULL,
    OrganicaII VARCHAR(10) NULL,
    OrganicaIII VARCHAR(10) NULL,

    RFC VARCHAR(13) NULL,
    ClavePersonal VARCHAR(20) NULL,
    NombreAfiliado NVARCHAR(150) NULL,

    Movimiento VARCHAR(2) NULL,
    FechaMovimiento DATE NULL,

    SueldoMensual DECIMAL(18,2) NULL,
    AyudasMensuales DECIMAL(18,2) NULL,
    QuinqueniosMensual DECIMAL(18,2) NULL,

    BaseCotizacionSueldo DECIMAL(18,2) NULL,
    BaseCotizacionQuinquenios DECIMAL(18,2) NULL,

    DiasLaborados DECIMAL(5,2) NULL,

    AportacionAfiliadoFondoAhorro DECIMAL(18,2) NULL,
    AportacionEntidadFondoAhorro DECIMAL(18,2) NULL,
    AportacionAfiliadoEBI DECIMAL(18,2) NULL,
    AportacionEntidadEBI DECIMAL(18,2) NULL,

    DescuentoPrestamoCortoPlazo DECIMAL(18,2) NULL,
    DescuentoPrestamoHipotecario DECIMAL(18,2) NULL,
    DescuentoPrestamoMedianoPlazo DECIMAL(18,2) NULL,
    DescuentosOtros DECIMAL(18,2) NULL,

    Calle NVARCHAR(150) NULL,
    Colonia NVARCHAR(150) NULL,
    Ciudad NVARCHAR(100) NULL,
    Estado VARCHAR(10) NULL,
    Municipio VARCHAR(10) NULL,
    CodigoPostal VARCHAR(5) NULL,
    Telefono VARCHAR(10) NULL,

    FechaNacimiento DATE NULL,
    Sexo CHAR(1) NULL,
    EstadoCivil CHAR(1) NULL,

    CAIR DECIMAL(18,2) NULL,
    CAIRVoluntario DECIMAL(18,2) NULL,

    FechaRegistro DATETIME2(0) NOT NULL
        CONSTRAINT DF_NominaAplicacionQnalDetalle_FechaRegistro DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_NominaAplicacionQnalDetalle_Carga
        FOREIGN KEY (CargaId)
        REFERENCES dbo.NominaAplicacionQnalCarga(Id),

    CONSTRAINT CK_NominaAplicacionQnalDetalle_TipoRegistro
        CHECK (TipoRegistro = '2'),

    CONSTRAINT CK_NominaAplicacionQnalDetalle_DiasLaborados
        CHECK (DiasLaborados IS NULL OR (DiasLaborados >= 0 AND DiasLaborados <= 15)),

    CONSTRAINT CK_NominaAplicacionQnalDetalle_Sexo
        CHECK (Sexo IS NULL OR Sexo IN ('F', 'M')),

    CONSTRAINT CK_NominaAplicacionQnalDetalle_EstadoCivil
        CHECK (EstadoCivil IS NULL OR EstadoCivil IN ('S', 'C', 'V', 'D', 'O'))
);
```

### Tabla De Historial De Detalle

```sql
CREATE TABLE dbo.NominaAplicacionQnalDetalleHistorial (
    HistorialId BIGINT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_NominaAplicacionQnalDetalleHistorial PRIMARY KEY,

    DetalleIdOriginal BIGINT NULL,
    CargaId BIGINT NOT NULL,
    CargaReemplazoId BIGINT NOT NULL,

    EntidadId INT NOT NULL,
    Anio SMALLINT NOT NULL,
    Quincena TINYINT NOT NULL,

    Organica0 VARCHAR(10) NOT NULL,
    Organica1 VARCHAR(10) NULL,
    Organica2 VARCHAR(10) NULL,
    Organica3 VARCHAR(10) NULL,

    LineaNumero INT NOT NULL,
    LineaOriginal NVARCHAR(MAX) NOT NULL,

    Lote VARCHAR(20) NOT NULL,
    TipoRegistro CHAR(1) NOT NULL,

    OrganicaI VARCHAR(10) NULL,
    OrganicaII VARCHAR(10) NULL,
    OrganicaIII VARCHAR(10) NULL,

    RFC VARCHAR(13) NULL,
    ClavePersonal VARCHAR(20) NULL,
    NombreAfiliado NVARCHAR(150) NULL,

    Movimiento VARCHAR(2) NULL,
    FechaMovimiento DATE NULL,

    SueldoMensual DECIMAL(18,2) NULL,
    AyudasMensuales DECIMAL(18,2) NULL,
    QuinqueniosMensual DECIMAL(18,2) NULL,

    BaseCotizacionSueldo DECIMAL(18,2) NULL,
    BaseCotizacionQuinquenios DECIMAL(18,2) NULL,

    DiasLaborados DECIMAL(5,2) NULL,

    AportacionAfiliadoFondoAhorro DECIMAL(18,2) NULL,
    AportacionEntidadFondoAhorro DECIMAL(18,2) NULL,
    AportacionAfiliadoEBI DECIMAL(18,2) NULL,
    AportacionEntidadEBI DECIMAL(18,2) NULL,

    DescuentoPrestamoCortoPlazo DECIMAL(18,2) NULL,
    DescuentoPrestamoHipotecario DECIMAL(18,2) NULL,
    DescuentoPrestamoMedianoPlazo DECIMAL(18,2) NULL,
    DescuentosOtros DECIMAL(18,2) NULL,

    Calle NVARCHAR(150) NULL,
    Colonia NVARCHAR(150) NULL,
    Ciudad NVARCHAR(100) NULL,
    Estado VARCHAR(10) NULL,
    Municipio VARCHAR(10) NULL,
    CodigoPostal VARCHAR(5) NULL,
    Telefono VARCHAR(10) NULL,

    FechaNacimiento DATE NULL,
    Sexo CHAR(1) NULL,
    EstadoCivil CHAR(1) NULL,

    CAIR DECIMAL(18,2) NULL,
    CAIRVoluntario DECIMAL(18,2) NULL,

    FechaRegistroOriginal DATETIME2(0) NULL,

    FechaArchivado DATETIME2(0) NOT NULL
        CONSTRAINT DF_NominaAplicacionQnalDetalleHistorial_FechaArchivado DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_NominaAplicacionQnalDetalleHistorial_Carga
        FOREIGN KEY (CargaId)
        REFERENCES dbo.NominaAplicacionQnalCarga(Id),

    CONSTRAINT FK_NominaAplicacionQnalDetalleHistorial_CargaReemplazo
        FOREIGN KEY (CargaReemplazoId)
        REFERENCES dbo.NominaAplicacionQnalCarga(Id)
);
```

### Tabla De Errores De Carga

```sql
CREATE TABLE dbo.NominaAplicacionQnalCargaError (
    Id BIGINT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_NominaAplicacionQnalCargaError PRIMARY KEY,

    CargaId BIGINT NOT NULL,

    LineaNumero INT NULL,
    LineaOriginal NVARCHAR(MAX) NULL,

    CodigoError VARCHAR(50) NOT NULL,
    Mensaje NVARCHAR(1000) NOT NULL,

    FechaRegistro DATETIME2(0) NOT NULL
        CONSTRAINT DF_NominaAplicacionQnalCargaError_FechaRegistro DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_NominaAplicacionQnalCargaError_Carga
        FOREIGN KEY (CargaId)
        REFERENCES dbo.NominaAplicacionQnalCarga(Id)
);
```

### Indices Recomendados

```sql
CREATE INDEX IX_NominaAplicacionQnalCarga_PeriodoEntidad
ON dbo.NominaAplicacionQnalCarga (
    EntidadId,
    Anio,
    Quincena,
    Organica0,
    Organica1,
    Organica2,
    Organica3
);

CREATE INDEX IX_NominaAplicacionQnalCarga_Estatus
ON dbo.NominaAplicacionQnalCarga (Estatus, FechaRegistro);

CREATE INDEX IX_NominaAplicacionQnalDetalle_PeriodoEntidad
ON dbo.NominaAplicacionQnalDetalle (
    EntidadId,
    Anio,
    Quincena,
    Organica0,
    Organica1,
    Organica2,
    Organica3
);

CREATE INDEX IX_NominaAplicacionQnalDetalle_Carga
ON dbo.NominaAplicacionQnalDetalle (CargaId);

CREATE INDEX IX_NominaAplicacionQnalDetalle_ClavePersonal
ON dbo.NominaAplicacionQnalDetalle (ClavePersonal);

CREATE INDEX IX_NominaAplicacionQnalDetalle_RFC
ON dbo.NominaAplicacionQnalDetalle (RFC);

CREATE INDEX IX_NominaAplicacionQnalDetalleHistorial_PeriodoEntidad
ON dbo.NominaAplicacionQnalDetalleHistorial (
    EntidadId,
    Anio,
    Quincena,
    Organica0,
    Organica1,
    Organica2,
    Organica3
);

CREATE INDEX IX_NominaAplicacionQnalCargaError_Carga
ON dbo.NominaAplicacionQnalCargaError (CargaId);
```

### Consulta Para Verificar Creacion

```sql
SELECT
    s.name AS SchemaName,
    t.name AS TableName
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE t.name IN (
    'NominaAplicacionQnalCarga',
    'NominaAplicacionQnalDetalle',
    'NominaAplicacionQnalDetalleHistorial',
    'NominaAplicacionQnalCargaError'
)
ORDER BY t.name;
```

## Tareas Pendientes

- Ejecutar manualmente el SQL de creacion de tablas e indices.
- Confirmar `EntidadId` y de donde se obtiene en el endpoint.
- Confirmar si `organica0-3` siempre son requeridas.
- Confirmar mapeo funcional de campos 13 a 19 del TXT actual.
- Implementado: modulo/ruta del endpoint en `src/modules/nomina`.
- Implementado: endpoint de consulta de registros vigentes por entidad, año, quincena y organicas.
- Implementado: parser de TXT de 20 y 35 campos.
- Implementar validacion de totales.
- Implementado: transaccion de reemplazo e historial.
- Agregar pruebas de parser y validaciones.

## Estado De Implementacion Backend

Fecha: 2026-05-18.

Implementado:

- `POST /v1/nomina/aplicacion-qnal-txt/cargar`.
- `GET /v1/nomina/aplicacion-qnal-txt/registros`.
- Modulo `src/modules/nomina` con rutas, schemas, command, query, parser, repositorio e interfaz de repositorio.
- Registro en `src/app/routeRegistrar.ts`.
- Registro en `src/di/container.ts`.
- Validacion contra Firebird usando `AfectacionOrgService.getQuincenaFromFirebird` y el SP `AP_G_APLICADO_TIPO`.
- `UsuarioRegistro` se obtiene desde `request.user.sub` y se guarda en `NominaAplicacionQnalCarga`.
- Usuarios entidad toman `organica0-3` desde token/usuario autenticado; usuarios no entidad las envian en request.
- Rechazo con registro en `NominaAplicacionQnalCarga` y `NominaAplicacionQnalCargaError` cuando hay errores.
- Reemplazo transaccional con respaldo previo en `NominaAplicacionQnalDetalleHistorial` cuando la carga es valida.
- Calculo de `DiasLaborados` con la regla documentada.

Verificacion ejecutada:

```bash
npm run build
```

Resultado: compilacion TypeScript correcta.

Pendiente funcional:

- Ejecutar SQL manual antes de usar endpoints.
- Confirmar origen definitivo de `EntidadId`.
- Confirmar mapeo de campos 13 a 19.
- Agregar validacion de totales del encabezado contra detalle.
- Agregar pruebas automatizadas de parser/carga.
