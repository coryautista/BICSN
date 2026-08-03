import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { EstadoCuentaAhorro, FONDOS_ESTADO_CUENTA } from '../../domain/entities/EstadoCuentaAhorro.js';

export class EstadoCuentaAhorroExportador {
  async generarExcel(estado: EstadoCuentaAhorro): Promise<Buffer> {
    const libro = new ExcelJS.Workbook();
    libro.creator = 'BICSN';
    libro.created = new Date();

    const hoja = libro.addWorksheet('Estado de cuenta');
    hoja.mergeCells('A1:K1');
    hoja.getCell('A1').value = 'REVISION DEL ESTADO DE CUENTA DE AHORRO';
    hoja.getCell('A1').font = { bold: true, size: 14 };
    hoja.getCell('A1').alignment = { horizontal: 'center' };
    hoja.mergeCells('A2:K2');
    hoja.getCell('A2').value = `Periodo ${estado.periodo} | Organica ${estado.parametros.org0}-${estado.parametros.org1}-${estado.parametros.org2}-${estado.parametros.org3} | Estatus ${estado.estatus}`;
    hoja.getCell('A2').alignment = { horizontal: 'center' };

    const encabezados = ['Concepto', ...FONDOS_ESTADO_CUENTA, 'Total'];
    hoja.addRow(encabezados);
    const encabezado = hoja.getRow(3);
    encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    encabezado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };

    for (const concepto of estado.conceptos) {
      const fila = hoja.addRow([
        concepto.concepto,
        ...FONDOS_ESTADO_CUENTA.map((fondo) => concepto.importes[fondo]),
        concepto.importes.total
      ]);
      if (concepto.clave === 'TOTAL' || concepto.clave === 'SALDO_ACTUAL') fila.font = { bold: true };
    }

    hoja.columns = [{ width: 42 }, ...FONDOS_ESTADO_CUENTA.map(() => ({ width: 14 })), { width: 14 }];
    for (let fila = 4; fila <= hoja.rowCount; fila += 1) {
      for (let columna = 2; columna <= 11; columna += 1) {
        hoja.getCell(fila, columna).numFmt = '#,##0.00;[Red]-#,##0.00';
      }
    }

    const incidencias = libro.addWorksheet('Incidencias');
    incidencias.addRow(['Severidad', 'Codigo', 'Procedimiento', 'Mensaje']);
    incidencias.getRow(1).font = { bold: true };
    for (const incidencia of estado.incidencias) {
      incidencias.addRow([incidencia.severidad, incidencia.codigo, incidencia.procedimientoOrigen || '', incidencia.mensaje]);
    }
    incidencias.columns = [{ width: 16 }, { width: 42 }, { width: 36 }, { width: 120 }];

    return Buffer.from(await libro.xlsx.writeBuffer());
  }

  generarPdf(estado: EstadoCuentaAhorro): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const documento = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 28 });
      const partes: Buffer[] = [];
      documento.on('data', (parte: Buffer) => partes.push(parte));
      documento.on('end', () => resolve(Buffer.concat(partes)));
      documento.on('error', reject);

      documento.fontSize(13).font('Helvetica-Bold').text('REVISION DEL ESTADO DE CUENTA DE AHORRO', { align: 'center' });
      documento.fontSize(8).font('Helvetica').text(
        `Periodo ${estado.periodo} | Fecha corte ${estado.fechaCorte} | Organica ${estado.parametros.org0}-${estado.parametros.org1}-${estado.parametros.org2}-${estado.parametros.org3} | ${estado.estatus}`,
        { align: 'center' }
      );
      documento.moveDown(1);

      const inicioX = documento.page.margins.left;
      const anchoConcepto = 180;
      const anchoImporte = 56;
      const encabezados = ['Concepto', ...FONDOS_ESTADO_CUENTA, 'Total'];
      const imprimirFila = (valores: string[], negritas = false) => {
        if (documento.y > documento.page.height - documento.page.margins.bottom - 20) documento.addPage();
        let x = inicioX;
        valores.forEach((valor, indice) => {
          const ancho = indice === 0 ? anchoConcepto : anchoImporte;
          documento.font(negritas ? 'Helvetica-Bold' : 'Helvetica').fontSize(indice === 0 ? 6.5 : 6).text(valor, x, documento.y, { width: ancho - 3, align: indice === 0 ? 'left' : 'right', lineBreak: false });
          x += ancho;
        });
        documento.moveDown(0.85);
      };

      imprimirFila(encabezados, true);
      for (const concepto of estado.conceptos) {
        imprimirFila([
          concepto.concepto,
          ...FONDOS_ESTADO_CUENTA.map((fondo) => this.formatearImporte(concepto.importes[fondo])),
          this.formatearImporte(concepto.importes.total)
        ], concepto.clave === 'TOTAL' || concepto.clave === 'SALDO_ACTUAL');
      }

      documento.moveDown(1);
      documento.font('Helvetica-Bold').fontSize(8).text('Incidencias');
      documento.font('Helvetica').fontSize(7);
      for (const incidencia of estado.incidencias) {
        documento.text(`[${incidencia.severidad}] ${incidencia.codigo}: ${incidencia.mensaje}`);
      }
      documento.end();
    });
  }

  private formatearImporte(importe: number) {
    return importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
