import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Interface for facture information
export interface FactureInformation {
  Month: string;
  Year: string;
  ProjectName: string;
  ContractNumber: number;
  ExpertName: string;
  function: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
}

// Define the TableLayout interface
interface TableLayout {
  hLineColor?: (i: number, node: any) => string;
  vLineColor?: (i: number, node: any) => string;
  hLineWidth?: (i: number, node: any) => number;
  vLineWidth?: (i: number, node: any) => number;
  paddingLeft?: (i: number, node: any) => number;
  paddingRight?: (i: number, node: any) => number;
  paddingTop?: (i: number, node: any) => number;
  paddingBottom?: (i: number, node: any) => number;
}

// Properly set up the virtual file system for pdfMake
(pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;

@Injectable({
  providedIn: 'root',
})
export class FacturePdfExportService {
  constructor() {}

  exportFactureToPdf(factureInfo: FactureInformation): void {
    // Define the PDF document structure for the facture
    const docDefinition = this.createFacturePdfDocument(factureInfo);

    // Generate filename for the facture
    const expertName = factureInfo.ExpertName.replace(/\s+/g, '_');
    const monthYear = `${factureInfo.Month}_${factureInfo.Year}`;
    const filename = `Facture_${expertName}_${monthYear}_${factureInfo.ProjectName}.pdf`;

    pdfMake.createPdf(docDefinition).download(filename);
  }

  private createFacturePdfDocument(factureInfo: FactureInformation): any {
    return {
      content: [
        // Header
        {
          text: 'FACTURE',
          style: 'mainTitle',
          alignment: 'center'
        },
        { text: '', margin: [0, 10] },        // Period Section - Separated Month and Year
        {
          columns: [
            { width: '*', text: '' }, // Left spacer
            {
              width: 'auto',
              stack: [
                {
                  text: `Mois : ${factureInfo.Month}`,
                  style: 'periodText',
                  alignment: 'left'
                },
                {
                  text: `Année : ${factureInfo.Year}`,
                  style: 'periodText',
                  alignment: 'left',
                  margin: [0, 3, 0, 0]
                }
              ]
            },
          ],
          margin: [0, 0, 0, 15]
        },

        // Project and Expert Information
        {
          table: {
            widths: ['25%', '*'],
            body: [
              [
                { text: 'N° de Projet / Nom', style: 'labelText' },
                { text: factureInfo.ProjectName, style: 'valueText' }
              ],
              [
                { text: 'N° de contrat', style: 'labelText' },
                { text: factureInfo.ContractNumber.toString(), style: 'valueText' }
              ],
              [
                { text: 'Nom de l\'Expert', style: 'labelText' },
                { text: factureInfo.ExpertName, style: 'valueText' }
              ],
              [
                { text: 'Fonction', style: 'labelText' },
                { text: factureInfo.function, style: 'valueText' }
              ]
            ]
          },
          layout: this.createInfoTableLayout(),
          margin: [0, 0, 0, 20]
        },

        // Calculation Section
        {
          text: 'DÉTAIL DE LA FACTURATION',
          style: 'sectionTitle',
          alignment: 'center',
          margin: [0, 10, 0, 15]
        },

        // Calculation Table
        {
          table: {
            widths: ['50%', '25%', '25%'],
            body: [
              [
                { text: 'Description', style: 'tableHeader' },
                { text: 'Quantité', style: 'tableHeader' },
                { text: 'Montant (TND)', style: 'tableHeader' }
              ],              [
                { text: `Prestation de services - ${factureInfo.Month} ${factureInfo.Year}`, style: 'tableCell' },
                { text: `${factureInfo.totalDays} jour${factureInfo.totalDays > 1 ? 's' : ''}`, style: 'tableCell', alignment: 'center' },
                { text: `${factureInfo.dailyRate.toFixed(2)}`, style: 'tableCell', alignment: 'right' }
              ],

              [
                { text: 'TOTAL', style: 'totalLabel' },
                { text: '', style: 'tableCell' },
                { text: `${factureInfo.totalAmount.toFixed(2)} TND`, style: 'totalAmount', alignment: 'right' }
              ]
            ]
          },
          layout: {
            hLineColor: (i: number, node: any) => {
              if (i === 0 || i === node.table.body.length) return 'black';
              if (i === node.table.body.length - 1) return 'black'; // Line before total
              return '#dddddd';
            },
            vLineColor: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 'black' : '#dddddd',
            hLineWidth: (i: number, node: any) => {
              if (i === node.table.body.length - 1) return 2; // Thicker line before total
              return 1;
            },
            vLineWidth: () => 1,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return '#f0f0f0'; // Header
              if (rowIndex === 3) return '#e6f3ff'; // Total row
              return null;
            }
          },
          margin: [0, 0, 0, 30]
        },

        // Payment Information
        {
          text: 'INFORMATIONS DE PAIEMENT',
          style: 'sectionTitle',
          alignment: 'left',
          margin: [0, 20, 0, 10]
        },
        {
          text: 'Montant total à payer: ' + factureInfo.totalAmount.toFixed(2) + ' TND',
          style: 'paymentInfo',
          margin: [0, 0, 0, 5]
        },
        {
          text: 'Devise: Dinar Tunisien (TND)',
          style: 'paymentInfo',
          margin: [0, 0, 0, 20]
        },

        // Signatures Section
        {
          columns: [
            {
              width: '48%',
              stack: [
                { text: 'Signature de l\'Expert', style: 'signatureLabel', alignment: 'left' },
                { text: '', margin: [0, 30] },
                { text: 'Date: ____________________', style: 'signatureDate' },
                { text: 'Signature: ____________________', style: 'signatureDate' }
              ]
            },
            { width: '4%', text: '' }, // Spacer
            {
              width: '48%',
              stack: [
                { text: 'Signature du Responsable', style: 'signatureLabel', alignment: 'right' },
                { text: '', margin: [0, 30] },
                { text: 'Date: ____________________', style: 'signatureDate', alignment: 'right' },
                { text: 'Signature: ____________________', style: 'signatureDate', alignment: 'right' }
              ]
            }
          ],
          margin: [0, 40, 0, 0]
        }
      ],
      styles: {
        mainTitle: {
          fontSize: 18,
          bold: true,
          decoration: 'underline',
          margin: [0, 0, 0, 10]
        },        subtitle: {
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        periodText: {
          fontSize: 11,
          bold: true,
          color: '#333333'
        },
        sectionTitle: {
          fontSize: 12,
          bold: true,
          decoration: 'underline',
          margin: [0, 15, 0, 10]
        },
        labelText: {
          fontSize: 9,
          bold: true
        },
        valueText: {
          fontSize: 9
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          fillColor: '#f0f0f0'
        },
        tableCell: {
          fontSize: 9
        },
        totalLabel: {
          fontSize: 10,
          bold: true
        },
        totalAmount: {
          fontSize: 11,
          bold: true,
          color: '#0066cc'
        },
        paymentInfo: {
          fontSize: 9,
          italics: true
        },
        signatureLabel: {
          fontSize: 10,
          bold: true
        },
        signatureDate: {
          fontSize: 9
        }
      },
      defaultStyle: {
        fontSize: 9
      },
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
    };
  }
  private createInfoTableLayout(): TableLayout {
    return {
      hLineColor: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 'black' : '#dddddd',
      vLineColor: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 'black' : '#dddddd',
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 4,
      paddingBottom: () => 4
    };
  }
}
