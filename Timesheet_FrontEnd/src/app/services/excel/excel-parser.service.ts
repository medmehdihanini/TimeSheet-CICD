import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface TimesheetData {
  month: string;
  year: string;
  entries: TimesheetEntry[];
}

export interface TimesheetEntry {
  date: string;
  nb_jours: number;
  workplace: string;
  activities: string;
  isConflict?: boolean;
  conflictMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelParserService {

  constructor() { }

  /**
   * Extract data from a timesheet Excel file
   * @param file The Excel file to parse
   * @returns A Promise that resolves to the extracted TimesheetData
   */
  parseTimesheet(file: File): Promise<TimesheetData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          // Parse workbook from array buffer
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          console.log('Starting timesheet data extraction');

          // Try to find month and year from filename
          const filename = file.name;
          let month = '';
          let year = '';

          // Try to extract month/year from filename (e.g. "Timesheet-May-2023.xlsx")
          const monthYearMatch = filename.match(/(\w+)[_\-\s](\d{4})/i);
          if (monthYearMatch) {
            month = monthYearMatch[1]; // May
            year = monthYearMatch[2];  // 2023
          }

          console.log(`Extracted from filename - month: ${month}, year: ${year}`);

          // Extract entries from the worksheet
          const entries: TimesheetEntry[] = [];

          // Start processing from row 10 onwards (skipping header rows including E9 "Activités réalisées")
          for (let rowNum = 10; rowNum <= 35; rowNum++) {
            // Extract cells for each column
            const jourCell = worksheet[`A${rowNum}`];
            const dateCell = worksheet[`B${rowNum}`];
            const nbJoursCell = worksheet[`C${rowNum}`];
            const workplaceCell = worksheet[`D${rowNum}`];
            const activitiesCell = worksheet[`E${rowNum}`];

            // Skip rows where jour is "Jours" (this is the footer row)
            if (jourCell && jourCell.v === "Jours") {
              console.log(`Skipping footer row: ${rowNum}`);
              break;
            }

            // Skip empty rows or rows without date values
            if (!dateCell || !dateCell.v) {
              console.log(`Skipping row ${rowNum}: no date value`);
              continue;
            }

            // Skip header rows that might have been missed
            if (activitiesCell && typeof activitiesCell.v === 'string' &&
                activitiesCell.v.includes("Activités réalisées")) {
              console.log(`Skipping header row: ${rowNum}`);
              continue;
            }

            let dateValue = '';
            if (dateCell) {
              if (typeof dateCell.v === 'string') {
                dateValue = dateCell.v;
              } else if (dateCell.v instanceof Date) {
                // Format date as DD-MM-YYYY
                const date = dateCell.v;
                dateValue = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
              } else if (typeof dateCell.v === 'number' && dateCell.w) {
                // Use the formatted value if available
                dateValue = dateCell.w;
              }
            }

            // Parse number of days (should be 0.5 or 1)
            let nbJours = 0;
            if (nbJoursCell) {
              if (typeof nbJoursCell.v === 'number') {
                nbJours = nbJoursCell.v;
              } else if (typeof nbJoursCell.v === 'string') {
                const parsedValue = parseFloat(nbJoursCell.v);
                nbJours = isNaN(parsedValue) ? 0 : parsedValue;
              }
            }

            // If nb_jours is 0, default to 1
            if (nbJours === 0) {
              nbJours = 1;
            }

            // Extract workplace - ensure it's either "EY" or "Chez le client"
            let workplace = '';
            if (workplaceCell) {
              workplace = workplaceCell.v.toString().trim();
              // Normalize workplace value
              if (workplace.toLowerCase().includes('client')) {
                workplace = 'Chez le Client';
              } else if (workplace.toUpperCase().includes('EY')) {
                workplace = 'EY';
              }
            }

            // Extract activities
            let activities = activitiesCell ? activitiesCell.v.toString() : '';

            console.log(`Row ${rowNum}: Date=${dateValue}, Days=${nbJours}, Workplace=${workplace}`);

            entries.push({
              date: dateValue,
              nb_jours: nbJours,
              workplace: workplace,
              activities: activities
            });
          }

          // Try to extract month/year from first entry date if not found in filename
          if ((!month || !year) && entries.length > 0) {
            const firstEntry = entries[0];
            if (firstEntry.date) {
              // Try to extract month/year from date format like "4-5-2023" or "2023-05-04"
              const dateParts = firstEntry.date.split(/[-\/]/);
              if (dateParts.length === 3) {
                // Check if the first part is the year (YYYY-MM-DD)
                if (dateParts[0].length === 4) {
                  year = dateParts[0];
                  const monthNum = parseInt(dateParts[1]);
                  month = this.getMonthName(monthNum);
                }
                // Check if the last part is the year (DD-MM-YYYY)
                else if (dateParts[2].length === 4) {
                  year = dateParts[2];
                  const monthNum = parseInt(dateParts[1]);
                  month = this.getMonthName(monthNum);
                }
              }
            }
          }

          console.log(`Final month: ${month}, year: ${year}`);
          console.log(`Total entries extracted: ${entries.length}`);

          const result: TimesheetData = {
            month,
            year,
            entries: entries.filter(entry => entry.date) // Filter out entries without dates
          };

          // Log validation results
          const validation = this.validateTimesheetData(result);
          console.log(`Validation result: ${validation.isValid ? 'Valid' : 'Invalid'}`);
          if (!validation.isValid) {
            console.log('Validation issues:', validation.errors);
          }

          resolve(result);
        } catch (error) {
          console.error(`Error parsing Excel file: ${error}`);
          reject(`Error parsing Excel file: ${error}`);
        }
      };

      reader.onerror = (error) => {
        console.error(`Error reading Excel file: ${error}`);
        reject(`Error reading Excel file: ${error}`);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Get the month name from its number
   * @param monthNum The month number (1-12)
   * @returns The month name
   */
  private getMonthName(monthNum: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[Math.max(0, Math.min(monthNum - 1, 11))];
  }

  /**
   * Validates the extracted timesheet data
   * @param data The timesheet data to validate
   * @returns An object containing validation results
   */
  validateTimesheetData(data: TimesheetData): {
    isValid: boolean,
    errors: string[]
  } {
    const errors: string[] = [];

    // Check if month and year are present
    if (!data.month) {
      errors.push('Month is missing');
    }

    if (!data.year) {
      errors.push('Year is missing');
    }

    // Check if there are any entries
    if (!data.entries || data.entries.length === 0) {
      errors.push('No timesheet entries found');
      return { isValid: false, errors };
    }

    // Validate each entry
    data.entries.forEach((entry, index) => {
      if (!entry.date) {
        errors.push(`Entry ${index + 1}: Date is missing`);
      }

      if (entry.nb_jours !== 0.5 && entry.nb_jours !== 1) {
        errors.push(`Entry ${index + 1}: Number of days must be 0.5 or 1 (found ${entry.nb_jours})`);
      }

      if (!entry.workplace) {
        errors.push(`Entry ${index + 1}: Workplace is missing`);
      } else if (entry.workplace !== 'EY' && entry.workplace !== 'Chez le Client') {
        errors.push(`Entry ${index + 1}: Workplace must be "EY" or "Chez le Client" (found "${entry.workplace}")`);
      }

      if (!entry.activities) {
        errors.push(`Entry ${index + 1}: Activities description is missing`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
