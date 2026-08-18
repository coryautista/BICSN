# EventoCalendario: tipo REPORTES

Se agrego `REPORTES` como tipo valido para eventos de calendario en el backend.

## Endpoints afectados

- `GET /v1/eventos-calendario`
- `GET /v1/eventos-calendario/rango?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD&tipo=REPORTES`
- `GET /v1/eventos-calendario/:id`
- `POST /v1/eventos-calendario`
- `PUT /v1/eventos-calendario/:id`

## SQL Server

Si `dbo.EventoCalendario.tipo` tiene un `CHECK` constraint, actualizarlo manualmente para incluir `REPORTES`.

Ejemplo para localizar el constraint actual:

```sql
SELECT cc.name, cc.definition
FROM sys.check_constraints cc
JOIN sys.tables t ON t.object_id = cc.parent_object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = 'dbo'
  AND t.name = 'EventoCalendario'
  AND cc.definition LIKE '%tipo%';
```

Ejemplo de reemplazo, ajustando el nombre real del constraint:

```sql
ALTER TABLE dbo.EventoCalendario DROP CONSTRAINT CK_EventoCalendario_Tipo;

ALTER TABLE dbo.EventoCalendario ADD CONSTRAINT CK_EventoCalendario_Tipo
CHECK (tipo IN (
  'ARCHIVO_APLICACION',
  'ASUETO',
  'ALTA_BAJA_CAMBIO',
  'PAGO',
  'HIPOTECARIO',
  'INTERESES_MORATORIOS',
  'REPORTES'
));
```

No ejecutar DDL desde el backend.
