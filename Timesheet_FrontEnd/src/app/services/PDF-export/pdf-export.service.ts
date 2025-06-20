import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts'; // Use default fonts

// Define the TableLayout interface here
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
export class PdfExportService {
  constructor() {
    // No need to call setVfs here anymore
  }

  exportToPdf(data: any[], timesheetInfo: any): void {
    // Filter and combine data based on the project and unique days
    const filteredData = this.getFilteredAndCombinedData(data, timesheetInfo);

    // Define your PDF document structure
    const docDefinition = this.createPdfDocument(filteredData, timesheetInfo);

    // Generate filename
    const expertName = timesheetInfo.ExpertName.replace(/\s+/g, '_'); // Replace spaces with underscores
    const projectName = timesheetInfo.ProjectName;
    const monthYear = `${timesheetInfo.Month}_${timesheetInfo.Year}`;
    const filename = `Timesheet_${expertName}_${monthYear}_${projectName}.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
  }

  private createPdfDocument(data: any[], timesheetInfo: any): any {
    // Create table data based on filtered data and additional info
    const tableData = data.map(item => [
      item.Day || 0,
      this.formatDate(item.Date),
      item.nbDay,
      item.workplace,
      item.task
    ]);

    // Calculate totalNbDay by summing up valid nbDay values
  const totalNbDay = data.reduce((sum, row) => {
    const nbDay = parseFloat(row.nbDay);
    return !isNaN(nbDay) ? sum + nbDay : sum;
  }, 0);
    tableData.push(['Jours', '', totalNbDay, '', '']);

    // Define weekends and highlight them accurately
    const weekendStyle = (dateString: string) => {
      const parts = dateString.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) ? { fillColor: 'yellow' } : {};
    };

    // Map data with styles based on weekend detection
    const tableBody = tableData.map(row => [
      { text: row[0], fillColor: weekendStyle(row[1]).fillColor || 'white' },
      { text: row[1], fillColor: weekendStyle(row[1]).fillColor || 'white' },
      { text: row[2], fillColor: weekendStyle(row[1]).fillColor || 'white' },
      { text: row[3], fillColor: weekendStyle(row[1]).fillColor || 'white' },
      { text: row[4], fillColor: weekendStyle(row[1]).fillColor || 'white' }
    ]);

    // Create the document definition
    return {
      content: [
        {
          text: 'Fiche d\'activités pour experts de courte durée',
          style: 'title',
          alignment: 'center'
        },
        { text: '', margin: [0, 5] },
        {
          text: `Mois: ${timesheetInfo.Month}    Année: ${timesheetInfo.Year}`,
          style: 'subtitle',
          alignment: 'center'
        },
        { text: '', margin: [0, 5] },
        {
          table: {
            widths: ['15%', '*'], // First column narrower
            body: [
              [
                { text: 'N° de Projet / Nom', bold: true },
                { text: timesheetInfo.ProjectName, bold: true }
              ],
              [
                { text: 'N° de contrat', bold: true },
                { text: timesheetInfo.ContractNumber }
              ],
              [
                { text: 'Nom de l\'Expert', bold: true },
                { text: timesheetInfo.ExpertName }
              ],
              [
                { text: 'Fonction', bold: true },
                { text: timesheetInfo.function }
              ]
            ]
          },
          layout: this.createMetadataTableLayout(),
          margin: [0, 0, 0, 10]
        },
        { text: 'Seulement demi(0.5) et pleines(1.0) journées de travail', bold: true, margin: [0, 0, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['5%', '15%', '10%', '10%', '60%'], // column widths
            body: [
              [ 'Jour', 'Date', 'Nombre de Jours', 'Lieu de Travail', 'Tâche' ],
              ...tableBody
            ]
          },
          layout: {
            fillColor: '#CCCCCC', // Gray color for header
            hLineColor: () => 'black',
            vLineColor: () => 'black',
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 2,
            paddingBottom: () => 2
          }
        },
        {
          columns: [
            { text: 'Date, Signature de l\'Expert', bold: true, alignment: 'left' },
            { text: 'Date, Signature du Chef de Programme', bold: true, alignment: 'right' }
          ],
          margin: [0, 20, 0, 0]
        }
      ],
      styles: {
        title: {
          fontSize: 10, // font size for title
          bold: true,
          decoration: 'underline', // Underline for the title
          margin: [0, 0, 0, 10]
        },
        subtitle: {
          fontSize: 9, // font size for subtitle
          bold: true,
          margin: [0, 0, 0, 10]
        },
      },
      defaultStyle: {
        fontSize: 7 // default font size
      },
      pageSize: 'A4',
      pageMargins: [ 20, 40, 20, 40 ], // Decrease margins to fit more content
    };
  }

  private getFilteredAndCombinedData(data: any[], timesheetInfo: any): any[] {
    // Filter data for the specific project
    const filteredData = data.filter(item => item.project || item.ProjectName === timesheetInfo.ProjectName );

    // Combine entries for the same day
    const combinedData: { [key: string]: any } = {};

    filteredData.forEach(item => {
      const key = item.Date; // Unique key for each date
      if (!combinedData[key]) {
        combinedData[key] = { ...item, task: item.task};
      } else {
        if (item.nbDay !== null) {
          combinedData[key].nbDay = `${item.nbDay}`;
        }
        combinedData[key].workplace = `${item.workplace}`;
        combinedData[key].task = `${item.task}`;
      }
    });

    return Object.values(combinedData);
  }

  private createMetadataTableLayout(): TableLayout {
    return {
      hLineColor: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 'black' : 'white',
      vLineColor: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 'black' : 'white',
      hLineWidth: () => 1, // Thickness of outer border
      vLineWidth: () => 1,
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 2,
      paddingBottom: () => 2
    };
  }

  // Helper function to format the date as dd/mm/yyyy
  private formatDate(dateString: string): string {
    const parts = dateString.split('/');
    const day = parts[0].padStart(2, '0'); // Ensure day has 2 digits
    const month = parts[1].padStart(2, '0'); // Ensure month has 2 digits
    const year = parts[2];
    return `${day}/${month}/${year}`; // Return in dd/mm/yyyy format
  }
}
