import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { FORMULA_PARAMETRO_CLAVES, type FormulaCalculoParametros } from '../src/modules/aportacionesFondos/domain/entities/FormulaCalculo.js';
import { AportacionesMonetaryKernel } from '../src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.js';

interface FixtureCase {
  caseId: string;
  origin: string;
  diasLaborados: string;
  sueldoMensualFirebird?: string;
  otrasPrestacionesFirebird?: string;
  baseCotizacionQuinqueniosTxt?: string;
  legacyFirebird?: Record<string, string>;
}

interface Fixture {
  fixtureId: string;
  source: Record<string, unknown>;
  formula: {
    formulaCalculoVersionId: number;
    precisionPolicy: string;
    parameters: Record<string, { value: string }>;
  };
  cases: FixtureCase[];
}

async function main(): Promise<void> {
  const fixtureUrl = new URL('./fixtures/aportaciones/periodo-1126.golden.json', import.meta.url);
  const fixture = JSON.parse(await readFile(fixtureUrl, 'utf8')) as Fixture;
  const parameters = Object.fromEntries(FORMULA_PARAMETRO_CLAVES.map((key) => [
    key,
    fixture.formula.parameters[key].value
  ])) as FormulaCalculoParametros;
  const kernel = new AportacionesMonetaryKernel();

  const cases = fixture.cases.map((item) => {
    if (!item.sueldoMensualFirebird) {
      return {
        caseId: item.caseId,
        origin: item.origin,
        status: 'SKIPPED_NO_FIREBIRD_BASE'
      };
    }

    const candidate = kernel.calcularProporcionales({
      diasLaborados: item.diasLaborados,
      sueldoMensual: item.sueldoMensualFirebird,
      otrasPrestacionesMensuales: item.otrasPrestacionesFirebird ?? '0',
      baseCotizacionQuinquenios: item.baseCotizacionQuinqueniosTxt ?? '0',
      parametros: parameters
    });
    const candidateFunds = {
      cair: candidate.cairD6,
      fra: candidate.fraD6,
      fre: candidate.freD6,
      fh: candidate.fhD6,
      fv: candidate.fvD6,
      faa: candidate.faaD6,
      fae: candidate.faeD6,
      fat: candidate.fatD6
    };
    const differences = item.legacyFirebird
      ? Object.fromEntries(Object.entries(candidateFunds).map(([fund, value]) => [
          fund,
          kernel.restarD6(value, item.legacyFirebird![fund])
        ]))
      : null;

    return {
      caseId: item.caseId,
      origin: item.origin,
      status: 'CALCULATED',
      diasLaborados: item.diasLaborados,
      bases: {
        sueldoD6: candidate.sueldoProporcionalD6,
        otrasPrestacionesD6: candidate.otrasPrestacionesProporcionalD6,
        quinqueniosD6: candidate.baseCotizacionQuinqueniosD6
      },
      candidateD6: candidateFunds,
      legacyFirebirdA2: item.legacyFirebird ?? null,
      differenceCandidateMinusLegacyD6: differences
    };
  });

  const payload = {
    schemaVersion: 1,
    reportId: `${fixture.fixtureId}-SHADOW-D6-A2`,
    source: fixture.source,
    formulaCalculoVersionId: fixture.formula.formulaCalculoVersionId,
    precisionPolicy: fixture.formula.precisionPolicy,
    comparisonNotice: 'Legacy Firebird may include external adjustments; differences are diagnostic, not corrections.',
    summary: {
      totalCases: cases.length,
      calculated: cases.filter((item) => item.status === 'CALCULATED').length,
      skippedNoFirebirdBase: cases.filter((item) => item.status === 'SKIPPED_NO_FIREBIRD_BASE').length
    },
    cases
  };

  if (payload.summary.totalCases !== 13 || payload.summary.calculated !== 12 || payload.summary.skippedNoFirebirdBase !== 1) {
    throw new Error('SHADOW_CASE_COVERAGE_FAILED');
  }
  const firstPartial = cases.find((item) => item.caseId === 'PARTIAL_001');
  if (!firstPartial || firstPartial.status !== 'CALCULATED' || !('candidateD6' in firstPartial)) {
    throw new Error('SHADOW_GOLDEN_CASE_MISSING:PARTIAL_001');
  }
  const expectedFirstPartial = {
    cair: '93.760880',
    fra: '210.961980',
    fre: '1043.089790',
    fh: '16.408154',
    fv: '65.632616',
    faa: '234.402200',
    fae: '117.201100',
    fat: '351.603300'
  };
  if (JSON.stringify(firstPartial.candidateD6) !== JSON.stringify(expectedFirstPartial)) {
    throw new Error('SHADOW_GOLDEN_EXPECTATION_FAILED:PARTIAL_001');
  }
  for (const item of cases) {
    if (item.status !== 'CALCULATED' || !('candidateD6' in item)) continue;
    if (kernel.restarD6(item.candidateD6.fat, item.candidateD6.faa) !== item.candidateD6.fae) {
      throw new Error(`SHADOW_FAT_INVARIANT_FAILED:${item.caseId}`);
    }
    if (item.origin === 'NOMINA_SIN_COINCIDENCIA'
        && Object.values(item.candidateD6).some((value) => value !== '0.000000')) {
      throw new Error(`SHADOW_MISSING_PAYROLL_NOT_ZERO:${item.caseId}`);
    }
  }

  const output = new URL('./fixtures/aportaciones/periodo-1126.shadow.json', import.meta.url);
  await writeFile(fileURLToPath(output), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(payload.summary));
  console.log(`APORTACIONES_1126_SHADOW_OK ${fileURLToPath(output)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
