const database = await import('../dist/db/mssql.js');
const pool = await database.connectDatabase();
let temporaryAccessToken = null;

try {
  const identity = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
  if (String(identity.recordset[0]?.BaseDatos) !== 'SII-ISSSSPEA') {
    throw new Error('QNA_PHASE12_HTTP_DESTINATION_INVALID');
  }

  const admin = await pool.request()
    .input('role', 'admin')
    .query(`
      SELECT TOP 1 CAST(u.id AS NVARCHAR(50)) AS id
      FROM auth.[user] u
      JOIN auth.userRole ur ON ur.userId=u.id
      JOIN auth.role r ON r.id=ur.roleId
      WHERE LOWER(r.name)=@role
      ORDER BY u.createdAt;
    `);
  if (!admin.recordset[0]) throw new Error('QNA_PHASE12_ADMIN_FIXTURE_NOT_FOUND');

  const tokens = await import('../dist/modules/auth/infrastructure/security/jwt.js');
  temporaryAccessToken = { ...tokens.signAccessToken(String(admin.recordset[0].id), ['admin'], [false]), userId: String(admin.recordset[0].id) };
  const token = temporaryAccessToken.token;
  const base = 'http://127.0.0.1:8080/v1';
  const get = async (path) => {
    const response = await fetch(base+path, { headers: { authorization: `Bearer ${token}` } });
    return { status: response.status, body: await response.json() };
  };

  const listSmall = await get('/liquidaciones-qna/aplicadas?page=1&pageSize=1');
  const listLarge = await get('/liquidaciones-qna/aplicadas?page=1&pageSize=100');
  if (listSmall.status !== 200 || listLarge.status !== 200) {
    throw new Error(`QNA_PHASE12_LIST_HTTP_INVALID:${listSmall.status}:${listSmall.body?.error?.code ?? 'NO_CODE'}:${listLarge.status}:${listLarge.body?.error?.code ?? 'NO_CODE'}`);
  }
  const item = listSmall.body?.data?.items?.[0];
  if (!item) throw new Error('QNA_PHASE12_APPLIED_FIXTURE_NOT_FOUND');

  const query = new URLSearchParams({
    anio: String(item.anio),
    quincena: String(item.quincena),
    entidadId: String(item.entidadId),
    organica0: item.organica0,
    organica1: item.organica1,
    organica2: item.organica2,
    organica3: item.organica3,
  });
  const summary = await get(`/liquidaciones-qna/aplicada/resumen?${query}`);
  const detailSmall = await get(`/liquidaciones-qna/aplicada/detalles/AHORRO?${query}&page=1&pageSize=1`);
  const detailLarge = await get(`/liquidaciones-qna/aplicada/detalles/AHORRO?${query}&page=1&pageSize=100`);
  if ([summary,detailSmall,detailLarge].some((result) => result.status !== 200)) {
    throw new Error(`QNA_PHASE12_READ_HTTP_INVALID:${summary.status}:${summary.body?.error?.code ?? 'NO_CODE'}:${detailSmall.status}:${detailSmall.body?.error?.code ?? 'NO_CODE'}:${detailLarge.status}:${detailLarge.body?.error?.code ?? 'NO_CODE'}`);
  }

  const allowedSources = ['SNAPSHOT_OFICIAL','SNAPSHOT_OFICIAL_RECONSTRUIDO','HISTORICO_LEGACY'];
  if (!allowedSources.includes(item.fuente)
      || summary.body.data.fuente !== item.fuente
      || detailSmall.body.data.fuente !== item.fuente) {
    throw new Error('QNA_PHASE12_SOURCE_DISCRIMINATOR_INVALID');
  }
  if (item.fuentes.length !== 10 || summary.body.data.fuentes.length !== 10) {
    throw new Error('QNA_PHASE12_TEN_DOMAINS_INCOMPLETE');
  }
  if (listSmall.body.data.total !== listLarge.body.data.total
      || detailSmall.body.data.total !== detailLarge.body.data.total) {
    throw new Error('QNA_PHASE12_PAGINATION_TOTAL_CHANGED');
  }

  console.log(JSON.stringify({
    environment: 'CALIDAD',
    authenticated: true,
    tokenPrinted: false,
    list: {
      status: listSmall.status,
      total: listSmall.body.data.total,
      sources: [...new Set(listLarge.body.data.items.map((row) => row.fuente))],
    },
    fixture: {
      periodo: item.periodo,
      fuente: item.fuente,
      domains: item.fuentes.length,
      warnings: item.advertencias.length,
    },
    summary: {
      status: summary.status,
      records: summary.body.data.totales.registros,
      warnings: summary.body.data.advertencias.length,
    },
    detail: {
      status: detailSmall.status,
      total: detailSmall.body.data.total,
      pageSizes: [detailSmall.body.data.pageSize,detailLarge.body.data.pageSize],
      totalStable: true,
    },
  }, null, 2));
  console.log('QNA_PHASE12_CALIDAD_HTTP_READONLY_OK');
} finally {
  try {
    if (temporaryAccessToken) {
      const { denylistAccessToken } = await import('../dist/modules/auth/infrastructure/security/AuthTokenService.js');
      await denylistAccessToken(temporaryAccessToken.jti, temporaryAccessToken.userId, temporaryAccessToken.exp);
    }
  } finally {
    await database.closeDatabaseConnection();
  }
}
