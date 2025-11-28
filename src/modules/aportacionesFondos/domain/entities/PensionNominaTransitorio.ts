// Domain entity for pensión nómina transitorio
export interface PensionNominaTransitorio {
  fpension: number | null;
  interno: number | null;
  nombres: string | null;
  nonombre: string | null;
  rfc: string | null;
  norfc: string | null;
  org0: string | null;
  org1: string | null;
  org2: string | null;
  org3: string | null;
  sueldo: number | null;
  oprestaciones: number | null;
  quinquenios: number | null;
  sdo: number | null;
  oprest: number | null;
  quinq: number | null;
  tpension: number | null;
  transitorio: number | null;
  norg0: string | null;
  norg1: string | null;
  norg2: string | null;
  norg3: string | null;
  cconcepto: string | null;
  descripcion: string | null;
  importe: number | null;
  defuncion: Date | null;
  pcp: number | null;
  palimenticia: number | null;
  retroactivo: number | null;
  payudaecon: number | null;
  otrosp1: number | null;
  otrosp2: number | null;
  otrosp3: number | null;
  otrosp4: number | null;
  otrosp5: number | null;
  terreno: number | null;
  hipviv: number | null;
  prodental: number | null;
  otrod1: number | null;
  otrod2: number | null;
  otrod3: number | null;
  otrod4: number | null;
  otrod5: number | null;
  otrod6: number | null;
  tpercep: number | null;
  tdeduc: number | null;
  total: number | null;
  fin: Date | null;
  inicio: Date | null;
  anio: number | null;
  sihay: string | null;
  porcentaje: number | null;
  sdoporc: number | null;
  ayudporc: number | null;
  quinqporc: number | null;
  transorg0: string | null;
  transorg1: string | null;
  transnorg0: string | null;
  transnorg1: string | null;
}

// Response structure for pensión nómina transitorio endpoint
export interface PensionNominaTransitorioResponse {
  clave_organica_0: string;
  clave_organica_1: string;
  periodo: string;
  registros: PensionNominaTransitorio[];
}

