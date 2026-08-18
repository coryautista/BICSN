# Catalogo de porcentajes por fondo de aportacion

## Objetivo

Administrar los porcentajes usados para calcular los fondos de aportacion por anio de vigencia.

El calculo de aportaciones usa siempre el ultimo registro vigente del fondo:

```sql
TOP 1 WHERE TipoFondo = @tipoFondo AND Vigente = 1
ORDER BY AnioVigencia DESC, CatalogoPorcentajeFondoId DESC
```

## SQL manual

No ejecutar automaticamente desde el backend. Crear manualmente en SQL Server:

```sql
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'aportaciones')
BEGIN
  EXEC('CREATE SCHEMA aportaciones');
END;
GO

CREATE TABLE aportaciones.CatalogoPorcentajeFondo (
  CatalogoPorcentajeFondoId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  TipoFondo VARCHAR(30) NOT NULL,
  AnioVigencia SMALLINT NOT NULL,
  PorcentajePatron DECIMAL(9,6) NOT NULL,
  PorcentajeAfiliado DECIMAL(9,6) NULL,
  Vigente BIT NOT NULL CONSTRAINT DF_CatalogoPorcentajeFondo_Vigente DEFAULT 1,
  Observaciones NVARCHAR(500) NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CatalogoPorcentajeFondo_CreatedAt DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,
  CreatedBy NVARCHAR(100) NULL,
  UpdatedBy NVARCHAR(100) NULL,
  CONSTRAINT CK_CatalogoPorcentajeFondo_TipoFondo
    CHECK (TipoFondo IN ('ahorro', 'vivienda', 'prestaciones', 'cair')),
  CONSTRAINT CK_CatalogoPorcentajeFondo_PorcentajePatron
    CHECK (PorcentajePatron >= 0 AND PorcentajePatron <= 1),
  CONSTRAINT CK_CatalogoPorcentajeFondo_PorcentajeAfiliado
    CHECK (PorcentajeAfiliado IS NULL OR (PorcentajeAfiliado >= 0 AND PorcentajeAfiliado <= 1)),
  CONSTRAINT UQ_CatalogoPorcentajeFondo_TipoFondo_Anio
    UNIQUE (TipoFondo, AnioVigencia)
);
GO

CREATE INDEX IX_CatalogoPorcentajeFondo_UltimoVigente
ON aportaciones.CatalogoPorcentajeFondo (TipoFondo, Vigente, AnioVigencia DESC, CatalogoPorcentajeFondoId DESC);
GO
```

## Semilla 2026

Estos valores conservan las formulas actuales del backend.

```sql
INSERT INTO aportaciones.CatalogoPorcentajeFondo
  (TipoFondo, AnioVigencia, PorcentajePatron, PorcentajeAfiliado, Vigente, Observaciones)
VALUES
  ('ahorro', 2026, 0.025000, 0.050000, 1, 'Valores actuales hardcodeados'),
  ('vivienda', 2026, 0.017500, NULL, 1, 'Valores actuales hardcodeados'),
  ('prestaciones', 2026, 0.222500, 0.045000, 1, 'Valores actuales hardcodeados'),
  ('cair', 2026, 0.020000, NULL, 1, 'Valores actuales hardcodeados');
```

## Reglas de negocio

- `TipoFondo` permite: `ahorro`, `vivienda`, `prestaciones`, `cair`.
- Los porcentajes se capturan como decimal: `0.025` equivale a `2.5%`.
- No hay borrado fisico. `DELETE` desactiva el registro con `Vigente = 0`.
- Si se crea o actualiza un registro con `vigente=true`, el backend desactiva los demas vigentes del mismo fondo.
- Solo debe existir un vigente por fondo para el calculo operativo.
- El historico se conserva por `AnioVigencia`.

## Endpoints

Todos requieren Bearer token.

### Listar porcentajes

```http
GET /v1/catalogo-porcentaje-fondo
```

Query params opcionales:

| Parametro | Tipo | Descripcion |
|---|---|---|
| `tipoFondo` | string | `ahorro`, `vivienda`, `prestaciones`, `cair` |
| `anioVigencia` | number | Anio del registro |
| `vigente` | boolean | Filtra registros vigentes o historicos |

Ejemplo:

```http
GET /v1/catalogo-porcentaje-fondo?tipoFondo=ahorro&vigente=true
```

### Obtener por id

```http
GET /v1/catalogo-porcentaje-fondo/1
```

### Obtener ultimo vigente

```http
GET /v1/catalogo-porcentaje-fondo/ahorro/ultimo-vigente
```

Respuesta:

```json
{
  "ok": true,
  "data": {
    "catalogoPorcentajeFondoId": 1,
    "tipoFondo": "ahorro",
    "anioVigencia": 2026,
    "porcentajePatron": 0.025,
    "porcentajeAfiliado": 0.05,
    "vigente": true,
    "observaciones": "Valores actuales hardcodeados",
    "createdAt": "2026-05-25T00:00:00.000Z",
    "updatedAt": null,
    "createdBy": null,
    "updatedBy": null
  }
}
```

### Crear porcentaje

```http
POST /v1/catalogo-porcentaje-fondo
Content-Type: application/json
```

Body:

```json
{
  "tipoFondo": "ahorro",
  "anioVigencia": 2027,
  "porcentajePatron": 0.026,
  "porcentajeAfiliado": 0.051,
  "vigente": true,
  "observaciones": "Vigencia 2027"
}
```

Si `vigente=true`, se desactivan otros registros vigentes del mismo fondo.

### Actualizar porcentaje

```http
PUT /v1/catalogo-porcentaje-fondo/1
Content-Type: application/json
```

Body parcial:

```json
{
  "porcentajePatron": 0.026,
  "porcentajeAfiliado": 0.051,
  "vigente": true,
  "observaciones": "Actualizacion autorizada"
}
```

### Desactivar porcentaje

```http
DELETE /v1/catalogo-porcentaje-fondo/1
```

No borra fisicamente; marca `vigente=false`.

## Uso en calculo de aportaciones

Los endpoints existentes de aportaciones usan el ultimo porcentaje vigente del catalogo:

- `GET /v1/aportacionesFondos/individuales/ahorro`
- `GET /v1/aportacionesFondos/individuales/vivienda`
- `GET /v1/aportacionesFondos/individuales/prestaciones`
- `GET /v1/aportacionesFondos/individuales/cair`
- `GET /v1/aportacionesFondos/completas`

Mapeo de porcentajes:

| Fondo | Patron | Afiliado |
|---|---:|---:|
| `ahorro` | `PorcentajePatron` para `afae` | `PorcentajeAfiliado` para `afaa` |
| `vivienda` | `PorcentajePatron` para `afe` | no aplica |
| `prestaciones` | `PorcentajePatron` para `afpe` | `PorcentajeAfiliado` para `afpa` |
| `cair` | `PorcentajePatron` para `afe` | no aplica |

Si no existe porcentaje vigente para un fondo, el calculo devuelve error porque no hay regla operativa configurada.
