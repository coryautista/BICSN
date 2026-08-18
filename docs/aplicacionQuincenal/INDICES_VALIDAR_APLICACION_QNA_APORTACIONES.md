# Indices recomendados: validacion QNA aportaciones

## Objetivo

Optimizar el endpoint:

```http
GET /v1/aplicacion-quincenal/validar-aplicacion-qna-aportaciones?periodo=1026
```

El endpoint valida primero `afec.BitacoraAfectacionOrg` y, si la quincena esta `TERMINADO`, consulta historicos del schema `aportaciones` por:

- `clave_organica_0`
- `clave_organica_1`
- `quincena`
- `anio`
- orden por `id`

## SQL recomendado

> Ejecutar manualmente en SQL Server. No se ejecuta desde el backend.

```sql
CREATE INDEX IX_BitacoraAfectacionOrg_AplicacionQna
ON afec.BitacoraAfectacionOrg (Entidad, Org0, Org1, Quincena, Anio, Accion)
INCLUDE (AfectacionId, Resultado, Mensaje, Usuario, UserId, AppName, Ip, UserAgent, CreatedAt, ModifiedAt);
```

```sql
CREATE INDEX IX_IndividualesAhorroHistorico_QnaEntidad
ON aportaciones.IndividualesAhorroHistorico (clave_organica_0, clave_organica_1, quincena, anio, id);
```

```sql
CREATE INDEX IX_IndividualesViviendaHistorico_QnaEntidad
ON aportaciones.IndividualesViviendaHistorico (clave_organica_0, clave_organica_1, quincena, anio, id);
```

```sql
CREATE INDEX IX_IndividualesPrestacionesHistorico_QnaEntidad
ON aportaciones.IndividualesPrestacionesHistorico (clave_organica_0, clave_organica_1, quincena, anio, id);
```

```sql
CREATE INDEX IX_IndividualesCairHistorico_QnaEntidad
ON aportaciones.IndividualesCairHistorico (clave_organica_0, clave_organica_1, quincena, anio, id);
```

```sql
CREATE INDEX IX_PensionNominaTransitorioHistorico_QnaEntidad
ON aportaciones.PensionNominaTransitorioHistorico (clave_organica_0, clave_organica_1, quincena, anio, id);
```

```sql
CREATE INDEX IX_GuarderiasHistorico_QnaEntidad
ON aportaciones.GuarderiasHistorico (clave_organica_0, clave_organica_1, quincena, anio, id);
```

```sql
CREATE INDEX IX_AguinaldoHistorico_QnaEntidad
ON aportaciones.AguinaldoHistorico (clave_organica_0, clave_organica_1, quincena, anio, id);
```

```sql
CREATE INDEX IX_DetalleHistoricoAguinaldo_QnaEntidad
ON aportaciones.DetalleHistoricoAguinaldo (clave_organica_0, clave_organica_1, quincena, anio, id);
```

```sql
CREATE INDEX IX_ResumenHistorico_QnaEntidad
ON aportaciones.ResumenHistorico (clave_organica_0, clave_organica_1, quincena, anio, id);
```

## Validacion previa opcional

Antes de crear un indice, se puede verificar si ya existe:

```sql
SELECT s.name AS schema_name, t.name AS table_name, i.name AS index_name
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name IN ('afec', 'aportaciones')
  AND i.name IN (
    'IX_BitacoraAfectacionOrg_AplicacionQna',
    'IX_IndividualesAhorroHistorico_QnaEntidad',
    'IX_IndividualesViviendaHistorico_QnaEntidad',
    'IX_IndividualesPrestacionesHistorico_QnaEntidad',
    'IX_IndividualesCairHistorico_QnaEntidad',
    'IX_PensionNominaTransitorioHistorico_QnaEntidad',
    'IX_GuarderiasHistorico_QnaEntidad',
    'IX_AguinaldoHistorico_QnaEntidad',
    'IX_DetalleHistoricoAguinaldo_QnaEntidad',
    'IX_ResumenHistorico_QnaEntidad'
  );
```

## Notas

- Los TVP `aportaciones.TVP_*` existentes ayudan al guardado masivo, no a la lectura de historicos.
- Para mas optimizacion futura, crear un stored procedure consolidado que devuelva los nueve resultsets en una sola llamada.
- Si alguna tabla no tiene columna `id`, ajustar el indice y el `ORDER BY` del endpoint para esa tabla antes de crear el indice.
