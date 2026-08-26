/* Fase 9: acceso determinista a la ultima evidencia TERMINADO por proceso. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;
  IF OBJECT_ID(N'liquidacion.QnaProcesoTransicion',N'U') IS NULL
    THROW 51760,'QNA_PHASE9_TRANSICIONES_FALTANTES',1;

  IF EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion') AND name=N'IX_QnaProcesoTransicion_EstadoProcesoFecha')
    AND NOT EXISTS(
      SELECT 1 FROM sys.indexes i
      WHERE i.object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion') AND i.name=N'IX_QnaProcesoTransicion_EstadoProcesoFecha'
        AND i.type=2 AND i.is_unique=0 AND i.is_disabled=0 AND i.has_filter=0
        AND 4=(SELECT COUNT(*) FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)
        AND EXISTS(SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal=1 AND c.name=N'EstadoDestino' AND ic.is_descending_key=0)
        AND EXISTS(SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal=2 AND c.name=N'QnaProcesoId' AND ic.is_descending_key=0)
        AND EXISTS(SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal=3 AND c.name=N'FechaCreacion' AND ic.is_descending_key=1)
        AND EXISTS(SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal=4 AND c.name=N'QnaProcesoTransicionId' AND ic.is_descending_key=1)
        AND 1=(SELECT COUNT(*) FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=1 AND c.name=N'LiquidacionSnapshotId')
        AND 1=(SELECT COUNT(*) FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=1)
    ) THROW 51761,'QNA_PHASE9_INDICE_MISMO_NOMBRE_INCOMPATIBLE',1;

  IF NOT EXISTS(
    SELECT 1 FROM sys.indexes
    WHERE object_id=OBJECT_ID(N'liquidacion.QnaProcesoTransicion')
      AND name=N'IX_QnaProcesoTransicion_EstadoProcesoFecha'
  )
    CREATE INDEX IX_QnaProcesoTransicion_EstadoProcesoFecha
      ON liquidacion.QnaProcesoTransicion(EstadoDestino,QnaProcesoId,FechaCreacion DESC,QnaProcesoTransicionId DESC)
      INCLUDE(LiquidacionSnapshotId);
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
