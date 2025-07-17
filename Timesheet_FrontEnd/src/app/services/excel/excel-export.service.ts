import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';
import { TimesheetInformations } from 'src/app/pages/projects/timesheet-table/timesheet-table.component';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class ExcelExportService {
  constructor(private http: HttpClient) {}

  exportToTemplate(data: any[], timesheetInfo: TimesheetInformations, fileName?: string): void {
    // Create a new workbook from scratch instead of using template
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    const worksheet: XLSX.WorkSheet = {};

    // Build the worksheet structure from scratch
    this.buildWorksheetFromScratch(worksheet, data, timesheetInfo);

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet');

    // Create final Excel file
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true
    });

    // Download the final Excel file with custom filename
    const finalFileName = fileName || 'exported-data';
    this.saveAsExcelFile(excelBuffer, finalFileName);
  }

  private buildWorksheetFromScratch(worksheet: XLSX.WorkSheet, data: any[], timesheetInfo: TimesheetInformations): void {
    let currentRow = 1;

    // Title - Row 1 with EY branding
    const titleStyle = {
      font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: '333333' } }, // EY Dark Gray
      border: {
        top: { style: 'medium', color: { rgb: 'FFE600' } },
        bottom: { style: 'medium', color: { rgb: 'FFE600' } },
        left: { style: 'medium', color: { rgb: 'FFE600' } },
        right: { style: 'medium', color: { rgb: 'FFE600' } },
      }
    };

    worksheet['A1'] = { v: 'FEUILLE DE TEMPS - EY', t: 's', s: titleStyle };
    worksheet['B1'] = { v: '', t: 's', s: titleStyle };
    worksheet['C1'] = { v: '', t: 's', s: titleStyle };
    worksheet['D1'] = { v: '', t: 's', s: titleStyle };
    worksheet['E1'] = { v: '', t: 's', s: titleStyle };
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]; // Merge A1:E1

    // Set row height for title
    worksheet['!rows'] = [{ hpt: 25 }]; // 25 point height for title row
    currentRow += 2;

    // Project Information - Starting from Row 3 with EY styling
    const projectInfoStyle = {
      font: { bold: true, color: { rgb: '333333' } },
      fill: { fgColor: { rgb: 'CCCCCC' } }, // Light gray background
      border: {
        top: { style: 'thin', color: { rgb: '999999' } },
        bottom: { style: 'thin', color: { rgb: '999999' } },
        left: { style: 'thin', color: { rgb: '999999' } },
        right: { style: 'thin', color: { rgb: '999999' } },
      }
    };

    // Apply style to all cells in each project info row
    worksheet[`A${currentRow}`] = { v: `N° de Projet / Nom: ${timesheetInfo.ProjectName}`, t: 's', s: projectInfoStyle };
    worksheet[`B${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`C${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`D${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`E${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    this.addMergedInfoRow(worksheet, currentRow);
    currentRow++;

    worksheet[`A${currentRow}`] = { v: `N° de contrat: ${timesheetInfo.ContractNumber}`, t: 's', s: projectInfoStyle };
    worksheet[`B${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`C${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`D${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`E${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    this.addMergedInfoRow(worksheet, currentRow);
    currentRow++;

    worksheet[`A${currentRow}`] = { v: `Nom de l'Expert/Bureau d'études: ${timesheetInfo.ExpertName}`, t: 's', s: projectInfoStyle };
    worksheet[`B${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`C${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`D${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`E${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    this.addMergedInfoRow(worksheet, currentRow);
    currentRow++;

    worksheet[`A${currentRow}`] = { v: `Fonction: ${timesheetInfo.function}`, t: 's', s: projectInfoStyle };
    worksheet[`B${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`C${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`D${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`E${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    this.addMergedInfoRow(worksheet, currentRow);
    currentRow++;

    worksheet[`A${currentRow}`] = { v: `Mois/Année: ${timesheetInfo.Month} ${timesheetInfo.Year}`, t: 's', s: projectInfoStyle };
    worksheet[`B${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`C${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`D${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    worksheet[`E${currentRow}`] = { v: '', t: 's', s: projectInfoStyle };
    this.addMergedInfoRow(worksheet, currentRow);
    currentRow += 3;

    // Note about work days - Row 9 with EY styling
    const noteStyle = {
      font: { italic: true, color: { rgb: '333333' } }, // EY dark gray text
      alignment: { horizontal: 'left', vertical: 'center' }
    };
    worksheet[`A${currentRow}`] = { v: 'seulement demi(0.5) et pleines(1.0) journées de travail', t: 's', s: noteStyle };
    currentRow += 2;

    // Headers - Row 11 with EY styling
    const headers = ['Jour', 'Date', 'Nombre de jours', 'Lieu de travail', 'Activités réalisées'];
    headers.forEach((header, index) => {
      const colLetter = String.fromCharCode(65 + index); // A, B, C, D, E
      worksheet[`${colLetter}${currentRow}`] = {
        v: header,
        t: 's',
        s: {
          font: { bold: true, color: { rgb: 'FFFFFF' } }, // White text
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thick', color: { rgb: 'FFE600' } }, // EY yellow borders
            bottom: { style: 'thick', color: { rgb: 'FFE600' } },
            left: { style: 'thick', color: { rgb: 'FFE600' } },
            right: { style: 'thick', color: { rgb: 'FFE600' } },
          },
          fill: { fgColor: { rgb: '333333' } } // EY dark gray background for headers
        }
      };
    });
    currentRow++;

    // Data rows with EY styling
    data.forEach((rowData, index) => {
      const day = rowData.Day || '';
      const date = rowData.Date || '';
      const nbDay = rowData.nbDay !== null && rowData.nbDay !== undefined ? rowData.nbDay : '';
      const workplace = rowData.workplace || '';
      const task = rowData.task || '';

      // Check if it's a weekend and apply EY styling
      const isWeekend = this.isWeekend(date);
      const isEvenRow = index % 2 === 0;

      let fillColor;
      if (isWeekend) {
        fillColor = { fill: { fgColor: { rgb: 'FFE600' } } }; // EY yellow for weekends
      } else if (isEvenRow) {
        fillColor = { fill: { fgColor: { rgb: 'FFFFFF' } } }; // White for even rows
      } else {
        fillColor = { fill: { fgColor: { rgb: 'F5F5F5' } } }; // Light gray for odd rows
      }

      // Insert data with EY styling
      worksheet[`A${currentRow}`] = { v: day, t: 's', s: { border: this.getEYBorder(), ...fillColor } };
      worksheet[`B${currentRow}`] = { v: date, t: 's', s: { border: this.getEYBorder(), ...fillColor } };
      worksheet[`C${currentRow}`] = {
        v: nbDay,
        t: nbDay === '' ? 's' : 'n',
        s: {
          border: this.getEYBorder(),
          alignment: { horizontal: 'center' },
          ...fillColor
        }
      };
      worksheet[`D${currentRow}`] = { v: workplace, t: 's', s: { border: this.getEYBorder(), ...fillColor } };
      worksheet[`E${currentRow}`] = { v: task, t: 's', s: { border: this.getEYBorder(), ...fillColor } };

      currentRow++;
    });

    // Total row with EY styling
    const totalNbDay = data.reduce((sum, row) => {
      const nbDay = row.nbDay;
      return sum + (typeof nbDay === 'number' ? nbDay : 0);
    }, 0);

    const totalRowStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } }, // White text
      border: {
        top: { style: 'thick', color: { rgb: 'FFE600' } }, // EY yellow borders
        bottom: { style: 'thick', color: { rgb: 'FFE600' } },
        left: { style: 'thick', color: { rgb: 'FFE600' } },
        right: { style: 'thick', color: { rgb: 'FFE600' } },
      },
      fill: { fgColor: { rgb: '333333' } } // EY dark gray background
    };

    worksheet[`A${currentRow}`] = { v: 'Total', t: 's', s: totalRowStyle };
    worksheet[`B${currentRow}`] = { v: '', t: 's', s: totalRowStyle };
    worksheet[`C${currentRow}`] = {
      v: totalNbDay,
      t: 'n',
      s: {
        ...totalRowStyle,
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    };
    worksheet[`D${currentRow}`] = { v: '', t: 's', s: totalRowStyle };
    worksheet[`E${currentRow}`] = { v: '', t: 's', s: totalRowStyle };    // Add EY footer branding
    currentRow += 3;
    const eyFooterStyle = {
      font: { bold: true, color: { rgb: 'FFE600' } }, // EY yellow text
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    worksheet[`A${currentRow}`] = { v: 'Ernst & Young - Building a better working world', t: 's', s: eyFooterStyle };
    worksheet[`B${currentRow}`] = { v: '', t: 's', s: eyFooterStyle };
    worksheet[`C${currentRow}`] = { v: '', t: 's', s: eyFooterStyle };
    worksheet[`D${currentRow}`] = { v: '', t: 's', s: eyFooterStyle };
    worksheet[`E${currentRow}`] = { v: '', t: 's', s: eyFooterStyle };

    if (!worksheet['!merges']) {
      worksheet['!merges'] = [];
    }
    worksheet['!merges'].push({
      s: { c: 0, r: currentRow - 1 },
      e: { c: 4, r: currentRow - 1 }
    });

    // Set worksheet range
    worksheet['!ref'] = `A1:E${currentRow}`;

    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 },   // A: Jour
      { wch: 12 },  // B: Date
      { wch: 15 },  // C: Nombre de jours
      { wch: 25 },  // D: Lieu de travail
      { wch: 35 }   // E: Activités réalisées
    ];

    // Set row heights for professional appearance
    worksheet['!rows'] = [
      { hpx: 30 }, // Row 1 - Title (increased height)
      { hpx: 20 }, // Row 2
      { hpx: 20 }, // Row 3 - Project info rows
      { hpx: 20 }, // Row 4
      { hpx: 20 }, // Row 5
      { hpx: 20 }, // Row 6
      { hpx: 20 }, // Row 7
      { hpx: 20 }, // Row 8
      { hpx: 20 }, // Row 9
      { hpx: 20 }, // Row 10
      { hpx: 25 }, // Row 11 - Headers (increased height)
    ];
  }

  // Helper method to merge information rows for professional formatting
  private addMergedInfoRow(worksheet: any, rowIndex: number): void {
    if (!worksheet['!merges']) {
      worksheet['!merges'] = [];
    }
    worksheet['!merges'].push({
      s: { c: 0, r: rowIndex - 1 },
      e: { c: 4, r: rowIndex - 1 } // Merge from A to E (columns 0-4)
    });
  }

  private getBorder() {
    return {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };
  }

  // EY branded border style
  private getEYBorder() {
    return {
      top: { style: 'thin', color: { rgb: '999999' } }, // EY medium gray
      bottom: { style: 'thin', color: { rgb: '999999' } },
      left: { style: 'thin', color: { rgb: '999999' } },
      right: { style: 'thin', color: { rgb: '999999' } },
    };
  }

  private isWeekend(dateString: string): boolean {
    if (!dateString) return false;

    const parts = dateString.split('/');
    if (parts.length !== 3) return false;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    // Use the provided filename directly without timestamp
    FileSaver.saveAs(data, `${fileName}.xlsx`);
  }
}
