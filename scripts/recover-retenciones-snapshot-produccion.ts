import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-production=SII-ISSSSPEA-PROD');
const backupReference = (
  process.argv.find((argument) => argument.startsWith('--backup-reference='))?.split('=', 2)[1]
  ?? process.argv.slice(2).find((argument) => !argument.startsWith('--'))
)?.trim();
const production = DATABASE_ENVIRONMENTS.PRODUCCION;
const periodo = process.argv.find((argument) => argument.startsWith('--periodo='))?.split('=', 2)[1] ?? '1626';
const targets = {
  '1526': { snapshotId: 1, quincena: 15, expectedPcp: 89, expectedPmp: 22, expectedHip: 12 },
  '1626': { snapshotId: 2, quincena: 16, expectedPcp: 97, expectedPmp: 21, expectedHip: 12 },
} as const;
const target = targets[periodo as keyof typeof targets];

if (!target) throw new Error('PERIODO_NO_AUTORIZADO: use 1526 o 1626');

if (execute && !confirmed) throw new Error('CONFIRMACION_REQUERIDA:--confirm-production=SII-ISSSSPEA-PROD');
if (execute && !backupReference) throw new Error('RESPALDO_REQUERIDO: proporcione la referencia verificable como argumento final');

process.env.SQLSERVER_DB = production.sqlDatabase;
process.env.FIREBIRD_DATABASE = production.firebirdDatabase;
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const actualDatabase = String((await pool.request().query('SELECT DB_NAME() AS BaseDatos')).recordset[0]?.BaseDatos ?? '');
  if (actualDatabase !== production.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${actualDatabase}`);

  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const request = new sql.Request(transaction)
      .input('SnapshotId', sql.BigInt, target.snapshotId)
      .input('Org0', sql.Char(2), '04')
      .input('Org1', sql.Char(2), '24')
      .input('Org2', sql.Char(2), '01')
      .input('Org3', sql.Char(2), '01')
      .input('Anio', sql.SmallInt, 2026)
      .input('Quincena', sql.TinyInt, target.quincena)
      .input('Periodo', sql.Char(4), periodo)
      .input('ExpectedPcp', sql.Int, target.expectedPcp)
      .input('ExpectedPmp', sql.Int, target.expectedPmp)
      .input('ExpectedHip', sql.Int, target.expectedHip)
      .input('LockResource', sql.NVarChar(255), `BICSN_PRODUCCION_RECOVER_RETENCIONES_${periodo}_SNAPSHOT${target.snapshotId}`);

    const result = await request.query(`
      SET NOCOUNT ON;
      DECLARE @LockResult INT;
      EXEC @LockResult=sys.sp_getapplock
        @Resource=@LockResource,
        @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=0;
      IF @LockResult<0 THROW 51901,'RECOVERY_RETENCIONES_LOCK_UNAVAILABLE',1;

      IF NOT EXISTS(
        SELECT 1
        FROM liquidacion.QnaSnapshot s
        WHERE s.LiquidacionSnapshotId=@SnapshotId AND s.VersionEsquema=4
          AND s.Estado=N'COMPLETO' AND s.Ambiente=N'PRODUCCION'
          AND s.Organica0=@Org0 AND s.Organica1=@Org1
          AND s.Organica2=@Org2 AND s.Organica3=@Org3
          AND s.Anio=@Anio AND s.Quincena=@Quincena AND s.Periodo=@Periodo
      ) THROW 51902,'RECOVERY_RETENCIONES_SNAPSHOT_INVALIDO',1;

      IF NOT EXISTS(
        SELECT 1 FROM liquidacion.QnaProcesoTransicion
        WHERE LiquidacionSnapshotId=@SnapshotId AND EstadoDestino=N'TERMINADO'
      ) THROW 51903,'RECOVERY_RETENCIONES_SNAPSHOT_NO_TERMINADO',1;

      IF EXISTS(SELECT 1 FROM retenciones.PrestamosCortoPlazoHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Quincena)
        OR EXISTS(SELECT 1 FROM retenciones.PrestamosMedianoPlazoHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Quincena)
        OR EXISTS(SELECT 1 FROM retenciones.PrestamosHipotecariosHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Quincena)
        THROW 51904,'RECOVERY_RETENCIONES_DESTINO_NO_VACIO',1;

      IF (SELECT COUNT(*) FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@SnapshotId)<>@ExpectedPcp
        OR (SELECT COUNT(*) FROM retenciones.RetencionPMPHistoricoV3 WHERE LiquidacionSnapshotId=@SnapshotId)<>@ExpectedPmp
        OR (SELECT COUNT(*) FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=@SnapshotId)<>@ExpectedHip
        THROW 51905,'RECOVERY_RETENCIONES_FUENTE_CANONICA_INVALIDA',1;

      IF EXISTS(
        SELECT 1
        FROM liquidacion.QnaSnapshotFuenteDetalle d
        WHERE d.LiquidacionSnapshotId=@SnapshotId AND d.Dominio IN('PCP','PMP','HIP')
          AND (TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno')) IS NULL
            OR NULLIF(LTRIM(RTRIM(JSON_VALUE(d.PayloadCanonico,'$.rfc'))),'') IS NULL)
      ) THROW 51906,'RECOVERY_RETENCIONES_PAYLOAD_IDENTIDAD_INCOMPLETA',1;

      IF (SELECT COUNT(*) FROM retenciones.RetencionPCPHistoricoV3 c JOIN liquidacion.QnaSnapshotFuenteDetalle d ON d.LiquidacionSnapshotId=c.LiquidacionSnapshotId AND d.Dominio='PCP' AND d.Orden=c.Orden WHERE c.LiquidacionSnapshotId=@SnapshotId)<>@ExpectedPcp
        OR (SELECT COUNT(*) FROM retenciones.RetencionPMPHistoricoV3 c JOIN liquidacion.QnaSnapshotFuenteDetalle d ON d.LiquidacionSnapshotId=c.LiquidacionSnapshotId AND d.Dominio='PMP' AND d.Orden=c.Orden WHERE c.LiquidacionSnapshotId=@SnapshotId)<>@ExpectedPmp
        OR (SELECT COUNT(*) FROM retenciones.RetencionHIPHistoricoV3 c JOIN liquidacion.QnaSnapshotFuenteDetalle d ON d.LiquidacionSnapshotId=c.LiquidacionSnapshotId AND d.Dominio='HIP' AND d.Orden=c.Orden WHERE c.LiquidacionSnapshotId=@SnapshotId)<>@ExpectedHip
        THROW 51907,'RECOVERY_RETENCIONES_ORDEN_NO_COINCIDE',1;

      INSERT retenciones.PrestamosCortoPlazoHistorico(
        clave_organica_0,clave_organica_1,quincena,anio,periodo,interno,rfc,nombre,
        prestamo,letra,plazo,capital,interes,monto,moratorios,total,
        org0,org1,org2,org3,usuario_id,QnaLiquidacionSnapshotId,QnaSourceOrden
      )
      SELECT @Org0,@Org1,@Quincena,@Anio,@Periodo,
        TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno')),
        JSON_VALUE(d.PayloadCanonico,'$.rfc'),n.Nombre,
        c.Prestamo,c.Letra,c.Plazo,
        CONVERT(DECIMAL(18,2),ROUND(c.CapitalD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.InteresD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.MontoD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.MoratoriosD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.TotalD6,2,1)),
        @Org0,@Org1,@Org2,@Org3,c.UsuarioId,@SnapshotId,c.Orden
      FROM retenciones.RetencionPCPHistoricoV3 c
      JOIN liquidacion.QnaSnapshotFuenteDetalle d ON d.LiquidacionSnapshotId=c.LiquidacionSnapshotId AND d.Dominio='PCP' AND d.Orden=c.Orden
      OUTER APPLY(
        SELECT TOP(1) a.nombre Nombre
        FROM aportaciones.IndividualesAhorroHistorico a
        WHERE a.clave_organica_0=@Org0 AND a.clave_organica_1=@Org1
          AND a.anio=@Anio AND a.quincena=@Quincena
          AND a.interno=TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno'))
        ORDER BY a.id
      ) n
      WHERE c.LiquidacionSnapshotId=@SnapshotId;

      INSERT retenciones.PrestamosMedianoPlazoHistorico(
        clave_organica_0,clave_organica_1,quincena,anio,periodo,interno,rfc,nombre,
        prestamo,letra,plazo,capital,moratorios,interes,seguro,total,noemple,folio,
        org0,org1,org2,org3,usuario_id,QnaLiquidacionSnapshotId,QnaSourceOrden
      )
      SELECT @Org0,@Org1,@Quincena,@Anio,@Periodo,
        TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno')),
        JSON_VALUE(d.PayloadCanonico,'$.rfc'),n.Nombre,
        c.Prestamo,c.Letra,c.Plazo,
        CONVERT(DECIMAL(18,2),ROUND(c.CapitalD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.MoratoriosD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.InteresD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.SeguroD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.TotalD6,2,1)),
        JSON_VALUE(d.PayloadCanonico,'$.interno'),TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.folio')),
        @Org0,@Org1,@Org2,@Org3,c.UsuarioId,@SnapshotId,c.Orden
      FROM retenciones.RetencionPMPHistoricoV3 c
      JOIN liquidacion.QnaSnapshotFuenteDetalle d ON d.LiquidacionSnapshotId=c.LiquidacionSnapshotId AND d.Dominio='PMP' AND d.Orden=c.Orden
      OUTER APPLY(
        SELECT TOP(1) a.nombre Nombre
        FROM aportaciones.IndividualesAhorroHistorico a
        WHERE a.clave_organica_0=@Org0 AND a.clave_organica_1=@Org1
          AND a.anio=@Anio AND a.quincena=@Quincena
          AND a.interno=TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno'))
        ORDER BY a.id
      ) n
      WHERE c.LiquidacionSnapshotId=@SnapshotId;

      INSERT retenciones.PrestamosHipotecariosHistorico(
        clave_organica_0,clave_organica_1,quincena,anio,periodo,computadora_antigua,
        interno,nombre,noempleado,rfc,cantidad,pno_solicitud,pano,descto,plazo,
        capital_pagar,interes_pagar,interes_diferido_pagar,seguro_pagar,moratorio_pagar,
        org0,org1,org2,org3,usuario_id,QnaLiquidacionSnapshotId,QnaSourceOrden
      )
      SELECT @Org0,@Org1,@Quincena,@Anio,@Periodo,
        CASE WHEN f.IdentificadorFuente LIKE 'FIREBIRD:AP_S_COMP_QNA:%' THEN 1 ELSE 0 END,
        TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno')),n.Nombre,
        JSON_VALUE(d.PayloadCanonico,'$.interno'),JSON_VALUE(d.PayloadCanonico,'$.rfc'),
        CONVERT(DECIMAL(18,2),ROUND(c.CantidadD6,2,1)),c.Solicitud,c.AnioPrestamo,
        CONVERT(DECIMAL(18,2),ROUND(c.DescuentoD6,2,1)),c.Plazo,
        CONVERT(DECIMAL(18,2),ROUND(c.CapitalD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.InteresD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.InteresDiferidoD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.SeguroD6,2,1)),
        CONVERT(DECIMAL(18,2),ROUND(c.MoratorioD6,2,1)),
        @Org0,@Org1,@Org2,@Org3,c.UsuarioId,@SnapshotId,c.Orden
      FROM retenciones.RetencionHIPHistoricoV3 c
      JOIN liquidacion.QnaSnapshotFuenteDetalle d ON d.LiquidacionSnapshotId=c.LiquidacionSnapshotId AND d.Dominio='HIP' AND d.Orden=c.Orden
      JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=c.LiquidacionSnapshotId AND f.Dominio='HIP'
      OUTER APPLY(
        SELECT TOP(1) a.nombre Nombre
        FROM aportaciones.IndividualesAhorroHistorico a
        WHERE a.clave_organica_0=@Org0 AND a.clave_organica_1=@Org1
          AND a.anio=@Anio AND a.quincena=@Quincena
          AND a.interno=TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno'))
        ORDER BY a.id
      ) n
      WHERE c.LiquidacionSnapshotId=@SnapshotId;

      IF (SELECT COUNT(*) FROM retenciones.PrestamosCortoPlazoHistorico WHERE QnaLiquidacionSnapshotId=@SnapshotId)<>@ExpectedPcp
        OR (SELECT COUNT(*) FROM retenciones.PrestamosMedianoPlazoHistorico WHERE QnaLiquidacionSnapshotId=@SnapshotId)<>@ExpectedPmp
        OR (SELECT COUNT(*) FROM retenciones.PrestamosHipotecariosHistorico WHERE QnaLiquidacionSnapshotId=@SnapshotId)<>@ExpectedHip
        THROW 51908,'RECOVERY_RETENCIONES_CONTEO_POST_INVALIDO',1;

      IF (SELECT COALESCE(SUM(total),0) FROM retenciones.PrestamosCortoPlazoHistorico WHERE QnaLiquidacionSnapshotId=@SnapshotId)
          <>(SELECT SUM(CONVERT(DECIMAL(18,2),ROUND(TotalD6,2,1))) FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@SnapshotId)
        OR (SELECT COALESCE(SUM(total),0) FROM retenciones.PrestamosMedianoPlazoHistorico WHERE QnaLiquidacionSnapshotId=@SnapshotId)
          <>(SELECT SUM(CONVERT(DECIMAL(18,2),ROUND(TotalD6,2,1))) FROM retenciones.RetencionPMPHistoricoV3 WHERE LiquidacionSnapshotId=@SnapshotId)
        OR (SELECT COALESCE(SUM(cantidad),0) FROM retenciones.PrestamosHipotecariosHistorico WHERE QnaLiquidacionSnapshotId=@SnapshotId)
          <>(SELECT SUM(CONVERT(DECIMAL(18,2),ROUND(CantidadD6,2,1))) FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=@SnapshotId)
        THROW 51909,'RECOVERY_RETENCIONES_TOTAL_POST_INVALIDO',1;

      SELECT 'PCP' Tipo,COUNT(*) Registros,CONVERT(VARCHAR(50),CAST(SUM(total) AS DECIMAL(38,2))) Total
      FROM retenciones.PrestamosCortoPlazoHistorico WHERE QnaLiquidacionSnapshotId=@SnapshotId
      UNION ALL SELECT 'PMP',COUNT(*),CONVERT(VARCHAR(50),CAST(SUM(total) AS DECIMAL(38,2)))
      FROM retenciones.PrestamosMedianoPlazoHistorico WHERE QnaLiquidacionSnapshotId=@SnapshotId
      UNION ALL SELECT 'HIP',COUNT(*),CONVERT(VARCHAR(50),CAST(SUM(cantidad) AS DECIMAL(38,2)))
      FROM retenciones.PrestamosHipotecariosHistorico WHERE QnaLiquidacionSnapshotId=@SnapshotId;
    `);

    const evidence = {
      check: 'RECOVER_RETENCIONES_SNAPSHOT_PRODUCCION',
      environment: 'PRODUCCION',
      sqlDatabase: production.sqlDatabase,
      firebirdModified: false,
      execute,
      backupReference: backupReference ?? null,
      snapshotId: String(target.snapshotId),
      scope: '04/24/01/01',
      periodo,
      retenciones: result.recordset,
    };

    if (execute) {
      await transaction.commit();
      console.log(JSON.stringify(evidence, null, 2));
      console.log('RECOVER_RETENCIONES_SNAPSHOT_PRODUCCION_OK');
    } else {
      await transaction.rollback();
      console.log(JSON.stringify(evidence, null, 2));
      console.log('RECOVER_RETENCIONES_SNAPSHOT_PRODUCCION_DRY_RUN_OK');
    }
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
} finally {
  await closeDatabaseConnection();
}
