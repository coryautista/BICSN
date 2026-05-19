import { decodeFirebirdObject, executeSerializedQuery } from '../../../../db/firebird.js';
import { InvalidAfiliadoDataError } from '../../domain/errors.js';
import { normalizeClaveOrganica } from '../../../../utils/organica.js';

export interface GetHistorialMovimientosQuincenaFirebirdInput {
  org0?: string | number | null;
  org1?: string | number | null;
  periodo?: string | null;
  buscar?: string | null;
  page?: number | null;
  pageSize?: number | null;
}

interface HistorialFirebirdRow {
  interno: number;
  consecutivo: number;
  cveMovimiento: string;
  nomMovimiento: string;
  nombre: string;
  noEmpleado: string;
  rfc: string;
  sA: number;
  opA: number;
  qA: number;
  sN: number;
  opN: number;
  qN: number;
  retroactivas: number;
  sR: number;
  opR: number;
  qR: number;
  org0: string;
  org1: string;
  org2: string;
  org3: string;
  nOrg0: string;
  nOrg1: string;
  nOrg2: string;
  nOrg3: string;
  usuario: string;
  fRealm: string;
}

type PersonaFirebird = Record<string, any> | null;
type OrgPersonalFirebird = Record<string, any> | null;

export class GetHistorialMovimientosQuincenaFirebirdQuery {
  async execute(input: GetHistorialMovimientosQuincenaFirebirdInput) {
    const org0 = normalizeClaveOrganica(input.org0);
    const org1 = normalizeClaveOrganica(input.org1);
    const periodo = input.periodo?.trim();
    if (!org0 || !org1) {
      throw new InvalidAfiliadoDataError('organica', 'org0 y org1 son requeridos');
    }
    if (!periodo || !/^\d{4}$/.test(periodo)) {
      throw new InvalidAfiliadoDataError('periodo', 'Periodo debe tener formato QQAA, por ejemplo 0526');
    }

    const page = Math.max(1, Number(input.page || 1));
    const pageSize = Math.min(500, Math.max(1, Number(input.pageSize || 100)));
    const buscar = input.buscar?.trim().toUpperCase() || null;

    const historial = await this.getHistorial(periodo, org0, org1);
    const filtered = buscar
      ? historial.filter((item) => [
          item.interno,
          item.nombre,
          item.noEmpleado,
          item.rfc,
          item.cveMovimiento,
          item.nomMovimiento
        ].some((value) => String(value ?? '').toUpperCase().includes(buscar)))
      : historial;

    const total = filtered.length;
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
    const personas = await this.getPersonas(paged.map((item) => item.interno));
    const orgPersonales = await this.getOrgPersonales(paged);

    const items = paged.map((historialItem) => ({
      persona: personas.get(historialItem.interno) || null,
      orgPersonal: orgPersonales.get(this.orgPersonalKey(historialItem)) || null,
      historial: historialItem
    }));

    return {
      items,
      meta: {
        source: 'firebird',
        procedure: 'HISTORIAL_MOVIMIENTOS_QUIN_IND',
        org0,
        org1,
        periodo,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  private async getHistorial(periodo: string, org0: string, org1: string): Promise<HistorialFirebirdRow[]> {
    const query = `
      SELECT
        p.INTERNO, p.CONSECUTIVO, p.CVE_MOVIMIENTO, p.NOM_MOVIMIENTO, p.NOMBRE,
        p.NOEMPLEADO, p.RFC, p.S_A, p.OP_A, p.Q_A, p.S_N, p.OP_N, p.Q_N,
        p.RETROACTIVAS, p.S_R, p.OP_R, p.Q_R, p.ORG0, p.ORG1, p.ORG2, p.ORG3,
        p.NORG0, p.NORG1, p.NORG2, p.NORG3, p.USUARIO, p.FREALM
      FROM HISTORIAL_MOVIMIENTOS_QUIN_IND(?, ?, ?) p
    `;

    const rows = await this.runFirebirdQuery(query, [periodo, org0, org1]);
    return rows.map((row: any) => ({
      interno: Number(row.INTERNO || 0),
      consecutivo: Number(row.CONSECUTIVO || 0),
      cveMovimiento: String(row.CVE_MOVIMIENTO || ''),
      nomMovimiento: String(row.NOM_MOVIMIENTO || ''),
      nombre: String(row.NOMBRE || ''),
      noEmpleado: String(row.NOEMPLEADO || ''),
      rfc: String(row.RFC || ''),
      sA: Number(row.S_A || 0),
      opA: Number(row.OP_A || 0),
      qA: Number(row.Q_A || 0),
      sN: Number(row.S_N || 0),
      opN: Number(row.OP_N || 0),
      qN: Number(row.Q_N || 0),
      retroactivas: Number(row.RETROACTIVAS || 0),
      sR: Number(row.S_R || 0),
      opR: Number(row.OP_R || 0),
      qR: Number(row.Q_R || 0),
      org0: String(row.ORG0 || ''),
      org1: String(row.ORG1 || ''),
      org2: String(row.ORG2 || ''),
      org3: String(row.ORG3 || ''),
      nOrg0: String(row.NORG0 || ''),
      nOrg1: String(row.NORG1 || ''),
      nOrg2: String(row.NORG2 || ''),
      nOrg3: String(row.NORG3 || ''),
      usuario: String(row.USUARIO || ''),
      fRealm: row.FREALM instanceof Date ? row.FREALM.toISOString() : String(row.FREALM || '')
    }));
  }

  private async getPersonas(internos: number[]): Promise<Map<number, PersonaFirebird>> {
    const unique = [...new Set(internos.filter((interno) => interno > 0))];
    const map = new Map<number, PersonaFirebird>();
    if (unique.length === 0) return map;

    for (let i = 0; i < unique.length; i += 100) {
      const batch = unique.slice(i, i + 100);
      const placeholders = batch.map(() => '?').join(', ');
      const rows = await this.runFirebirdQuery(`
        SELECT INTERNO, CURP, RFC, NOEMPLEADO, NOMBRE, APELLIDO_PATERNO, APELLIDO_MATERNO,
               FECHA_NACIMIENTO, SEGURO_SOCIAL, SEXO, ESTADO_CIVIL, FECHA_ALTA, EMAIL,
               CELULAR, EXPEDIENTE, FULLNAME
        FROM PERSONAL
        WHERE INTERNO IN (${placeholders})
      `, batch);
      for (const row of rows) {
        map.set(Number(row.INTERNO), {
          interno: Number(row.INTERNO || 0),
          curp: row.CURP || null,
          rfc: row.RFC || null,
          noempleado: row.NOEMPLEADO || null,
          nombre: row.NOMBRE || null,
          apellidoPaterno: row.APELLIDO_PATERNO || null,
          apellidoMaterno: row.APELLIDO_MATERNO || null,
          fechaNacimiento: this.toIsoDate(row.FECHA_NACIMIENTO),
          seguroSocial: row.SEGURO_SOCIAL || null,
          sexo: row.SEXO || null,
          estadoCivil: row.ESTADO_CIVIL || null,
          fechaAlta: this.toIsoDate(row.FECHA_ALTA),
          email: row.EMAIL || null,
          celular: row.CELULAR || null,
          expediente: row.EXPEDIENTE || null,
          fullname: row.FULLNAME || null
        });
      }
    }
    return map;
  }

  private async getOrgPersonales(historial: HistorialFirebirdRow[]): Promise<Map<string, OrgPersonalFirebird>> {
    const map = new Map<string, OrgPersonalFirebird>();
    for (const item of historial) {
      const key = this.orgPersonalKey(item);
      if (map.has(key)) continue;
      const rows = await this.runFirebirdQuery(`
        SELECT FIRST 1 INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
               SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,
               ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS,
               APLICAR, BC, PORCENTAJE
        FROM ORG_PERSONAL
        WHERE INTERNO = ?
          AND CLAVE_ORGANICA_0 = ?
          AND CLAVE_ORGANICA_1 = ?
          AND CLAVE_ORGANICA_2 = ?
          AND CLAVE_ORGANICA_3 = ?
        ORDER BY FECHA_MOV_ALT DESC, ORGS DESC
      `, [item.interno, item.org0, item.org1, item.org2, item.org3]);
      const row = rows[0];
      map.set(key, row ? {
        interno: Number(row.INTERNO || 0),
        claveOrganica0: row.CLAVE_ORGANICA_0 || null,
        claveOrganica1: row.CLAVE_ORGANICA_1 || null,
        claveOrganica2: row.CLAVE_ORGANICA_2 || null,
        claveOrganica3: row.CLAVE_ORGANICA_3 || null,
        sueldo: row.SUELDO != null ? Number(row.SUELDO) : null,
        otrasPrestaciones: row.OTRAS_PRESTACIONES != null ? Number(row.OTRAS_PRESTACIONES) : null,
        quinquenios: row.QUINQUENIOS != null ? Number(row.QUINQUENIOS) : null,
        activo: row.ACTIVO || null,
        fechaMovAlt: this.toIsoDate(row.FECHA_MOV_ALT),
        orgs1: row.ORGS1 || null,
        orgs2: row.ORGS2 || null,
        orgs3: row.ORGS3 || null,
        orgs: row.ORGS || null,
        dSueldo: row.DSUELDO || null,
        dOtrasPrestaciones: row.DOTRAS_PRESTACIONES || null,
        dQuinquenios: row.DQUINQUENIOS || null,
        aplicar: row.APLICAR || null,
        bc: row.BC || null,
        porcentaje: row.PORCENTAJE != null ? Number(row.PORCENTAJE) : null
      } : null);
    }
    return map;
  }

  private runFirebirdQuery(query: string, params: any[]): Promise<any[]> {
    return executeSerializedQuery((db) => new Promise<any[]>((resolve, reject) => {
      if (!db || typeof db.query !== 'function') {
        reject(new Error('Conexión Firebird no disponible'));
        return;
      }
      db.query(query, params, (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((result || []).map((row: any) => decodeFirebirdObject(row)));
      });
    }));
  }

  private orgPersonalKey(item: HistorialFirebirdRow) {
    return `${item.interno}|${item.org0}|${item.org1}|${item.org2}|${item.org3}`;
  }

  private toIsoDate(value: any): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString().split('T')[0];
  }
}
