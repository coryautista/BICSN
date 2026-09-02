/* Verificacion read-only del indice de lectura aplicada fase 9. */
SET NOCOUNT ON;

IF DB_NAME() NOT IN(N'SII-ISSSSPEA-DES',N'SII-ISSSSPEA',N'SII-ISSSSPEA-PROD') THROW 51762,'QNA_PHASE9_VERIFICADOR_DESTINO_INVALIDO',1;
IF OBJECT_ID(N'liquidacion.QnaProcesoTransicion',N'U') IS NULL THROW 51760,'QNA_PHASE9_TRANSICIONES_FALTANTES',1;

DECLARE @IndexId INT=(SELECT index_id FROM sys.indexes WHERE object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion') AND name=N'IX_QnaProcesoTransicion_EstadoProcesoFecha');
IF @IndexId IS NULL THROW 51763,'QNA_PHASE9_INDICE_FALTANTE',1;
IF EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion') AND index_id=@IndexId AND (type<>2 OR is_unique<>0 OR is_disabled<>0 OR has_filter<>0 OR filter_definition IS NOT NULL))
  THROW 51764,'QNA_PHASE9_INDICE_ESTADO_INVALIDO',1;
IF 4<>(SELECT COUNT(*) FROM sys.index_columns WHERE object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion') AND index_id=@IndexId AND key_ordinal>0)
  THROW 51765,'QNA_PHASE9_INDICE_CLAVES_INVALIDAS',1;
IF EXISTS(
  SELECT key_ordinal,name,is_descending_key FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
  WHERE ic.object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion') AND ic.index_id=@IndexId AND ic.key_ordinal>0
  EXCEPT SELECT * FROM (VALUES(1,N'EstadoDestino',CONVERT(BIT,0)),(2,N'QnaProcesoId',CONVERT(BIT,0)),(3,N'FechaCreacion',CONVERT(BIT,1)),(4,N'QnaProcesoTransicionId',CONVERT(BIT,1)))e(key_ordinal,name,is_descending_key)
) OR EXISTS(
  SELECT * FROM (VALUES(1,N'EstadoDestino',CONVERT(BIT,0)),(2,N'QnaProcesoId',CONVERT(BIT,0)),(3,N'FechaCreacion',CONVERT(BIT,1)),(4,N'QnaProcesoTransicionId',CONVERT(BIT,1)))e(key_ordinal,name,is_descending_key)
  EXCEPT SELECT key_ordinal,name,is_descending_key FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
  WHERE ic.object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion') AND ic.index_id=@IndexId AND ic.key_ordinal>0
) THROW 51766,'QNA_PHASE9_INDICE_ORDEN_INVALIDO',1;
IF 1<>(SELECT COUNT(*) FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
  WHERE ic.object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion') AND ic.index_id=@IndexId AND ic.is_included_column=1 AND c.name=N'LiquidacionSnapshotId')
  OR 1<>(SELECT COUNT(*) FROM sys.index_columns WHERE object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion') AND index_id=@IndexId AND is_included_column=1)
  THROW 51767,'QNA_PHASE9_INDICE_INCLUDE_INVALIDO',1;

SELECT N'QNA_PHASE9_APPLIED_READ_INDEX_OK' Resultado,DB_NAME() BaseDatos,N'EstadoDestino ASC,QnaProcesoId ASC,FechaCreacion DESC,QnaProcesoTransicionId DESC' Claves,N'LiquidacionSnapshotId' Incluye,
  CONVERT(BIT,0) Filtrado,CONVERT(BIT,0) Deshabilitado;
