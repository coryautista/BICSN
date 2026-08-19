import { createHash } from 'node:crypto';
import type { SnapshotCalculoV2Input } from '../entities/SnapshotCalculoV2.js';

export function calcularSnapshotCalculoV2Hash(input: SnapshotCalculoV2Input): string {
  const canonical = {
    entidadId: input.entidadId,
    anio: input.anio,
    quincena: input.quincena,
    organicas: [input.organica0, input.organica1, input.organica2, input.organica3],
    ambiente: input.ambiente,
    fuente: input.fuente,
    estado: input.estado,
    formulaCalculoVersionId: input.formulaCalculoVersionId,
    nominaCargaId: input.nominaCargaId,
    precisionPolicy: input.precisionPolicy,
    versionEsquema: input.versionEsquema,
    totalesA2: input.totalesA2,
    detalles: [...input.detalles]
      .sort((left, right) => left.orden - right.orden || left.empleadoClaveHash.localeCompare(right.empleadoClaveHash))
      .map((detalle) => ({
        orden: detalle.orden,
        empleadoClaveHash: detalle.empleadoClaveHash,
        diasLaborados: detalle.diasLaborados,
        diasOrigen: detalle.diasOrigen,
        sueldoMensualD6: detalle.sueldoMensualD6,
        otrasPrestacionesMensualesD6: detalle.otrasPrestacionesMensualesD6,
        quinqueniosMensualD6: detalle.quinqueniosMensualD6,
        baseCotizacionQuinqueniosD6: detalle.baseCotizacionQuinqueniosD6,
        cairD6: detalle.cairD6,
        cairFondoD6: detalle.cairFondoD6,
        fraD6: detalle.fraD6,
        freD6: detalle.freD6,
        prestacionesD6: detalle.prestacionesD6,
        fhD6: detalle.fhD6,
        fvD6: detalle.fvD6,
        viviendaD6: detalle.viviendaD6,
        faaD6: detalle.faaD6,
        faeD6: detalle.faeD6,
        fatD6: detalle.fatD6,
        faiD6: detalle.faiD6
      }))
  };

  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex').toUpperCase();
}
