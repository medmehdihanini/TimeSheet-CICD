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

  exportToTemplate(data: any[], timesheetInfo: TimesheetInformations): void {
    // Load the Excel template file from URL
    this.http
      .get('assets/template/template.xlsx', { responseType: 'arraybuffer' })
      .subscribe((templateBuffer: ArrayBuffer | undefined) => {
        if (!templateBuffer) {
          console.error('Failed to load the template.');
          return;
        }

        const workbook: XLSX.WorkBook = XLSX.read(templateBuffer, { type: 'array' });

        // Get the first sheet of the template
        const worksheetName: string = workbook.SheetNames[0];
        const worksheet: XLSX.WorkSheet = workbook.Sheets[worksheetName];

        // Insert metadata into specific cells in the template
        this.insertMetadataIntoTemplate(worksheet, timesheetInfo);

        // Adjust column widths
        this.adjustColumnWidths(worksheet);

        // Insert rows to maintain spacing
        this.insertRowsToMaintainSpacing(worksheet, 17, data.length, data.length);

        // Insert data into the template starting from row 17
        this.insertDataIntoTemplate(worksheet, data, 17);

        // Insert the "Total" row
        this.insertTotalRow(worksheet, data, 17);

        // Apply styling based on weekend days
        this.applyWeekendStyling(worksheet, data, 17);

        // Center headers in the 16th row
        this.centerHeaderRow(worksheet);

        // Apply additional styling: bold title, bold row 3, rectangle frame, thicker table borders
        this.applyAdditionalStyling(worksheet);

        // Create final Excel file
        const excelBuffer: any = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        });

        // Download the final Excel file
        this.saveAsExcelFile(excelBuffer, 'exported-data');
      });
  }

  private insertMetadataIntoTemplate(worksheet: XLSX.WorkSheet, timesheetInfo: TimesheetInformations): void {
    const metadataMappings = [
      { attribute: 'Month', row: 3, column: 'C' },
      { attribute: 'Year', row: 3, column: 'E' },
      { attribute: 'ProjectName', row: 6, column: 'B' },
      { attribute: 'ContractNumber', row: 7, column: 'B' },
      { attribute: 'ExpertName', row: 8, column: 'B' },
      { attribute: 'function', row: 9, column: 'B' },
    ];

    metadataMappings.forEach(mapping => {
      const value = timesheetInfo[mapping.attribute as keyof TimesheetInformations];
      if (value !== undefined) {
        const cellAddress = `${mapping.column}${mapping.row}`;
        worksheet[cellAddress] = { v: value, t: 's', s: { font: { bold: true } } }; // Apply bold font to metadata cells
      }
    });
  }

  private insertRowsToMaintainSpacing(worksheet: XLSX.WorkSheet, startRow: number, numberOfRows: number, dataLength: number): void {
    const newRow51 = startRow + dataLength + 4;
    const rangeString = worksheet['!ref'];
    const range = rangeString ? XLSX.utils.decode_range(rangeString) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };

    for (let rowIndex = range.e.r; rowIndex >= 51 - 1; rowIndex--) {
      for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
        const sourceCell = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        const targetCell = XLSX.utils.encode_cell({ r: rowIndex + (newRow51 - 51), c: colIndex });
        worksheet[targetCell] = worksheet[sourceCell];
        delete worksheet[sourceCell];
      }
    }
    range.e.r += (newRow51 - 51);
    worksheet['!ref'] = XLSX.utils.encode_range(range.s, range.e);
  }

  private insertDataIntoTemplate(worksheet: XLSX.WorkSheet, data: any[], startRow: number): void {
    data.forEach((elementData, index) => {
      const { Day, Date, nbDay, workplace, task } = elementData;
      const rowIndex = startRow + index;
      XLSX.utils.sheet_add_json(
        worksheet,
        [{ Day, Date, nbDay, workplace, task }],
        {
          header: ['Day', 'Date', 'nbDay', 'workplace', 'task'],
          skipHeader: true,
          origin: `A${rowIndex}`,
        }
      );
    });
  }

  private insertTotalRow(worksheet: XLSX.WorkSheet, data: any[], startRow: number): void {
    const totalRowIndex = startRow + data.length;
    const totalNbDay = data.reduce((sum, row) => sum + row.nbDay, 0);

    XLSX.utils.sheet_add_json(
      worksheet,
      [{ Day: 'Total' }],
      {
        header: ['Day'],
        skipHeader: true,
        origin: `A${totalRowIndex}`,
      }
    );

    XLSX.utils.sheet_add_json(
      worksheet,
      [{ nbDay: totalNbDay }],
      {
        header: ['nbDay'],
        skipHeader: true,
        origin: `C${totalRowIndex}`,
      }
    );
  }

  private applyWeekendStyling(worksheet: XLSX.WorkSheet, data: any[], startRow: number): void {
    const rangeString = worksheet['!ref'];
    if (rangeString !== undefined) {
      const decodedRange = XLSX.utils.decode_range(rangeString);
      data.forEach((elementData, index) => {
        const dateString: string = elementData.Date;
        if (this.isWeekend(dateString)) {
          const rowIndex = startRow + index;
          for (let col = decodedRange.s.c; col <= decodedRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
            const cell = worksheet[cellAddress];
            if (cell) {
              if (!cell.s) cell.s = {};
              cell.s.fill = {
                fgColor: { rgb: 'FFFF00' }, // Yellow fill
              };
            }
          }
        }
      });
    } else {
      console.error('Worksheet range (!ref) is undefined. Unable to apply weekend styling.');
    }
  }

  private isWeekend(dateString: string): boolean {
    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
  }

  private adjustColumnWidths(worksheet: XLSX.WorkSheet): void {
    const columnWidths = [
      { column: 'A', width: 15 },
      { column: 'B', width: 15 },
      { column: 'C', width: 15 },
      { column: 'D', width: 30 },
      { column: 'E', width: 30 },
    ];

    columnWidths.forEach((colWidth) => {
      worksheet['!cols'] = worksheet['!cols'] || [];
      worksheet['!cols'][colWidth.column.charCodeAt(0) - 65] = {
        wch: colWidth.width,
      };
    });
  }

  private centerHeaderRow(worksheet: XLSX.WorkSheet): void {
    const headerRow = 15;
    const rangeString = worksheet['!ref'];
    if (rangeString !== undefined) {
      const range = XLSX.utils.decode_range(rangeString);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
        const cell = worksheet[cellAddress];
        if (cell) {
          if (!cell.s) cell.s = {};
          cell.s.alignment = { horizontal: 'center' };
        }
      }
    } else {
      console.error('Worksheet range (!ref) is undefined. Unable to center header row.');
    }
  }

  private applyAdditionalStyling(worksheet: XLSX.WorkSheet): void {
    ['B6', 'B7', 'B8', 'B9'].forEach(cellAddress => {
      const cell = worksheet[cellAddress];
      if (cell) {
        if (!cell.s) cell.s = {};
        cell.s.font = { bold: true };
      }
    });

    const rangeString = worksheet['!ref'];
    if (rangeString !== undefined) {
      const range = XLSX.utils.decode_range(rangeString);
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          if (cell) {
            if (!cell.s) cell.s = {};
            cell.s.border = {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
            };
          }
        }
      }
    } else {
      console.error('Worksheet range (!ref) is undefined. Unable to apply additional styling.');
    }
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    FileSaver.saveAs(data, `${fileName}_${new Date().getTime()}.xlsx`);
  }
}
