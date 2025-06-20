import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimesheetData, TimesheetEntry } from 'src/app/services/excel/excel-parser.service';
import { AlertService } from 'src/app/services/alert.service';
import { EventService } from 'src/app/services/event/event.service';
import { Router } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { ProjectService } from 'src/app/services/project/project.service';

@Component({
  selector: 'app-timesheet-verification',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatMenuModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatSelectModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './timesheet-verification.component.html',
  styleUrls: ['./timesheet-verification.component.css']
})
export class TimesheetVerificationComponent implements OnInit, OnChanges {
  @Input() timesheetData: TimesheetData | null = null;
  @Input() projectId: number | null = null;
  @Input() profileId: number | null = null;

  @Output() confirm = new EventEmitter<TimesheetData>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Add profile data property
  profileData: any = null;
  profileImageUrl: string | null = null;
  tableData: TimesheetEntry[] = [];
  dataSource: MatTableDataSource<TimesheetEntry>;
  displayedColumns: string[] = ['rowNumber', 'date', 'nb_jours', 'workplace', 'activities', 'actions'];

  // Month and year selection
  selectedMonth: string | null = null;
  selectedYear: string | null = null;
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  years: string[] = [];

  existingTasks: any[] = [];
  existingTasksMap: {[date: string]: any} = {};
  hasDateConflicts: boolean = false;
  duplicateDateMap: {[date: string]: boolean} = {};

  // Enhanced loading state variables
  isInitialLoading: boolean = true;  // Initial component loading
  isLoadingTasks: boolean = false;   // Loading existing tasks
  isSubmitting: boolean = false;     // Form submission in progress

  workplaceOptions: string[] = ['EY', 'Chez le Client'];

  // Add new property to track validation state
  hasValidationErrors: boolean = false;
  validationErrors: string[] = [];
  // Date picker restrictions based on selected month/year
  minDate: Date | null = null;
  maxDate: Date | null = null;

  // Manday budget tracking properties
  projectProfiles: any[] = [];
  currentProfileBudget: any = null;
  maxAllowedRows: number = 0;
  remainingMandays: number = 0;
  isLoadingBudget: boolean = false;
  constructor(
    private alertService: AlertService,
    private eventService: EventService,
    private changeDetector: ChangeDetectorRef,
    private router: Router,
    private profileService: ProfileService,
    private projectService: ProjectService
  ) {
    this.dataSource = new MatTableDataSource<TimesheetEntry>([]);

    // Initialize years list (current year - 2 to current year + 2)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      this.years.push(year.toString());
    }
  }

  ngOnInit(): void {
    // Start with loading state
    this.isInitialLoading = true;

    // Load profile data if profile ID is available
    this.loadProfileData();

    setTimeout(() => {
      if (this.timesheetData) {
        this.initializeTableData();
        this.loadExistingTasks();
        // Validate data on init
        this.validateTableData();
      }

      // End initial loading after initialization is complete (with a small delay for smooth transition)
      setTimeout(() => {
        this.isInitialLoading = false;
      }, 500);
    }, 800); // Small delay for better user experience
  }

  ngOnChanges(): void {
    // When inputs change, show loading
    this.isInitialLoading = true;

    // Reload profile data if profile ID changed
    this.loadProfileData();

    setTimeout(() => {
      if (this.timesheetData) {
        this.initializeTableData();
        this.loadExistingTasks();
        // Validate data on changes
        this.validateTableData();
      }

      // End loading
      this.isInitialLoading = false;
    }, 500);
  }

  /**
   * Load profile data from the ProfileService
   */
  loadProfileData(): void {
    if (!this.profileId) {
      console.warn('No profile ID provided, cannot load profile data');
      return;
    }    this.profileService.getOneProfile(this.profileId).subscribe({
      next: (profile) => {
        console.log('Profile data loaded:', profile);
        this.profileData = profile;

        // Load profile image if available
        if (profile.image) {
          this.loadProfileImage(profile.image);
        }

        // Load project budget information after profile is loaded
        this.loadProjectBudgetInfo();
      },
      error: (error) => {
        console.error('Error loading profile data:', error);
        this.alertService.error(
          'Erreur',
          'Impossible de charger les informations du profil.'
        );
      }
    });
  }

  /**
   * Load the profile image from the server
   * @param imagePath The path to the image on the server
   */
  private loadProfileImage(imagePath: string): void {
    // For development, use a direct URL
    if (imagePath.startsWith('http')) {
      this.profileImageUrl = imagePath;
      return;
    }

    // For production, use the API base URL
    const apiUrl = 'http://localhost:3000'; // Change this to your API base URL
    this.profileImageUrl = `${apiUrl}${imagePath}`;
  }

  /**
   * Initialize table data from the input timesheet data
   */
  private initializeTableData(): void {
    if (this.timesheetData && this.timesheetData.entries) {
      // Filter out entries with no activities and empty entries
      this.tableData = [...this.timesheetData.entries].filter(entry =>
        entry.date && entry.activities && entry.activities.trim() !== ''
      );

      // Extract month and year from the first date entry
      if (this.tableData.length > 0) {
        const firstEntry = this.tableData[0];
        if (firstEntry.date) {
          const parsedDate = this.parseDate(firstEntry.date);

          if (parsedDate) {
            // Get month name from the first entry's date
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];

            const extractedMonth = monthNames[parsedDate.getMonth()];
            const extractedYear = parsedDate.getFullYear().toString();

            console.log(`Extracted month/year from first entry: ${extractedMonth}/${extractedYear}`);

            // Always set the selectedMonth and selectedYear based on first entry
            this.selectedMonth = extractedMonth;
            this.selectedYear = extractedYear;

            // Update the timesheet data
            this.timesheetData.month = this.selectedMonth;
            this.timesheetData.year = this.selectedYear;
          }
        }
      } else {
        // If no entries with date found, use current month/year as fallback
        const currentDate = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];

        this.selectedMonth = monthNames[currentDate.getMonth()];
        this.selectedYear = currentDate.getFullYear().toString();

        // Update the timesheet data with current month/year
        if (this.timesheetData) {
          this.timesheetData.month = this.selectedMonth;
          this.timesheetData.year = this.selectedYear;
        }
      }      // Initialize duplicate date tracking
      this.updateDuplicateDateMap();

      // Update date picker restrictions based on selected month/year
      this.updateDatePickerRestrictions();

      // Load existing tasks for the selected month/year after initialization
      this.loadExistingTasks();
    }
  }

  /**
   * Handle month selection change
   */
  onMonthChange(): void {
    console.log('Month changed to:', this.selectedMonth);
    if (this.timesheetData) {
      this.timesheetData.month = this.selectedMonth || '';
    }
    this.updateDatePickerRestrictions();
    this.loadExistingTasks();
  }

  /**
   * Handle year selection change
   */
  onYearChange(): void {
    console.log('Year changed to:', this.selectedYear);
    if (this.timesheetData) {
      this.timesheetData.year = this.selectedYear || '';
    }
    this.updateDatePickerRestrictions();
    this.loadExistingTasks();
  }
  /**
   * Update date picker restrictions based on selected month and year
   */
  private updateDatePickerRestrictions(): void {
    if (!this.selectedMonth || !this.selectedYear) {
      // If no month/year selected, allow any date
      this.minDate = null;
      this.maxDate = null;
      return;
    }

    const monthNumber = this.getMonthNumber(this.selectedMonth);
    const year = parseInt(this.selectedYear);

    if (!monthNumber || isNaN(year)) {
      this.minDate = null;
      this.maxDate = null;
      return;
    }

    // Create min date (first day of the selected month)
    this.minDate = new Date(year, parseInt(monthNumber) - 1, 1);

    // Create max date (last day of the selected month)
    this.maxDate = new Date(year, parseInt(monthNumber), 0);

    console.log('Date picker restrictions updated:', {
      month: this.selectedMonth,
      year: this.selectedYear,
      minDate: this.minDate,
      maxDate: this.maxDate
    });

    // Check existing entries for dates outside the new range
    this.validateDatesInRange();
  }

  /**
   * Validate that all existing dates are within the selected month/year range
   * Clear dates that are outside the range and warn the user
   */
  private validateDatesInRange(): void {
    if (!this.minDate || !this.maxDate || !this.tableData.length) {
      return;
    }

    let clearedDatesCount = 0;
    const clearedDates: string[] = [];

    this.tableData.forEach((entry, index) => {
      if (entry.date) {
        const entryDate = this.parseDate(entry.date);
        if (entryDate && (entryDate < this.minDate! || entryDate > this.maxDate!)) {
          // Date is outside the selected month/year range
          const formattedDate = `${entryDate.getDate()}/${entryDate.getMonth() + 1}/${entryDate.getFullYear()}`;
          clearedDates.push(formattedDate);

          // Clear the date
          this.tableData[index].date = '';

          // Clear any conflict status since the date is now empty
          this.tableData[index].isConflict = false;
          this.tableData[index].conflictMessage = '';

          clearedDatesCount++;
        }
      }
    });

    // Show warning if dates were cleared
    if (clearedDatesCount > 0) {
      this.alertService.warning(
        'Dates modifiées',
        `${clearedDatesCount} date(s) ont été effacées car elles ne correspondent pas au mois/année sélectionné (${this.selectedMonth} ${this.selectedYear}).`
      );

      // Update duplicate tracking and validation after clearing dates
      this.updateDuplicateDateMap();
      this.checkForDateConflicts();
      this.validateTableData();
    }
  }

  /**
   * Load existing tasks from the EventService for the selected month/year
   */
  private loadExistingTasks(): void {
    console.log('Loading existing tasks for profile:', this.profileId);
    console.log('Month/Year:', this.selectedMonth, this.selectedYear);

    if (!this.profileId || !this.selectedMonth || !this.selectedYear) {
      console.warn('Missing required parameters for task loading:',
        { profileId: this.profileId, month: this.selectedMonth, year: this.selectedYear });
      return;
    }

    // Format month/year to match the expected format in the API
    const monthNumeric = this.getMonthNumber(this.selectedMonth);
    const monthYear = `${monthNumeric}/${this.selectedYear}`;
    console.log('Using monthYear format:', monthYear);

    this.isLoadingTasks = true;
    // Clear existing tasks while loading
    this.existingTasks = [];
    this.existingTasksMap = {};

    this.eventService.getTasksAndProjectIdByMonthAndProfile(monthYear, this.profileId)
      .subscribe({
        next: (tasks) => {
          console.log('Retrieved tasks:', tasks);
          this.existingTasks = tasks;

          // Create a lookup map by date for quick conflict checking
          this.existingTasksMap = {};
          tasks.forEach(task => {
            const formattedDate = this.formatDateForComparison(task.datte);
            if (formattedDate) {
              this.existingTasksMap[formattedDate] = task;
            }
          });

          console.log('Task date map for conflict checking:', this.existingTasksMap);

          // Check for conflicts with current entries
          this.checkForDateConflicts();

          // Add a small delay to show loading state for better UX
          setTimeout(() => {
            this.isLoadingTasks = false;
            this.changeDetector.detectChanges(); // Force view update
          }, 800);

          if (tasks.length > 0) {
            this.alertService.success('Succès', `${tasks.length} tâches existantes chargées pour ${this.selectedMonth} ${this.selectedYear}`);
          }
        },
        error: (error) => {
          console.error('Error loading existing tasks', error);
          setTimeout(() => {
            this.isLoadingTasks = false;
            this.changeDetector.detectChanges(); // Force view update
          }, 800);
          this.alertService.error('Erreur', 'Impossible de charger les tâches existantes. Veuillez réessayer.');
        }
      });
  }

  /**
   * Extract month and year directly from the entries in MM/YYYY format
   * This pulls MM/YYYY straight from the date entries in the Excel file
   */
  private extractMonthYearFromEntries(): void {
    if (!this.tableData || this.tableData.length === 0) {
      console.warn('No timesheet entries to extract month/year from');
      return;
    }

    console.log('Raw tableData to extract from:', this.tableData);

    // Find the first entry with a valid date
    for (const entry of this.tableData) {
      if (!entry.date) continue;

      console.log('Analyzing date entry:', entry.date);

      // This regex will extract the month and year from various date formats
      // DD/MM/YYYY (26/05/2025), YYYY-MM-DD (2025-05-26), or DD-Month (15-May)
      let month = '';
      let year = '';

      // First try DD/MM/YYYY format (most common from Excel)
      if (entry.date.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const parts = entry.date.split('/');
        if (parts.length === 3) {
          month = parts[1]; // The middle part is the month
          year = parts[2];  // The last part is the year
          console.log(`Found DD/MM/YYYY format: month=${month}, year=${year}`);
        }
      }

      // If not found, try YYYY-MM-DD format
      else if (entry.date.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
        const parts = entry.date.split('-');
        if (parts.length === 3) {
          month = parts[1]; // The middle part is the month
          year = parts[0];  // The first part is the year
          console.log(`Found YYYY-MM-DD format: month=${month}, year=${year}`);
        }
      }

      // Try DD-Month or DD/Month format (15-May or 15/May)
      else {
        const monthNameMap: { [key: string]: string } = {
          'jan': '01', 'january': '01', 'janvier': '01',
          'feb': '02', 'february': '02', 'février': '02', 'fevrier': '02',
          'mar': '03', 'march': '03', 'mars': '03',
          'apr': '04', 'april': '04', 'avril': '04',
          'may': '05', 'mai': '05',
          'jun': '06', 'june': '06', 'juin': '06',
          'jul': '07', 'july': '07', 'juillet': '07',
          'aug': '08', 'august': '08', 'août': '08', 'aout': '08',
          'sep': '09', 'september': '09', 'septembre': '09',
          'oct': '10', 'october': '10', 'octobre': '10',
          'nov': '11', 'november': '11', 'novembre': '11',
          'dec': '12', 'december': '12', 'décembre': '12', 'decembre': '12'
        };

        // Match patterns like "15/May" or "15-May"
        const match = entry.date.match(/\d+[-\/](\w+)/);
        if (match && match[1]) {
          const monthName = match[1].toLowerCase();

          // Find the month number
          for (const [key, value] of Object.entries(monthNameMap)) {
            if (monthName === key || monthName.startsWith(key)) {
              month = value;
              break;
            }
          }

          // Use current year if year is not specified
          const currentDate = new Date();
          year = currentDate.getFullYear().toString();
          console.log(`Found DD/Month format: month=${month}, year=${year}`);
        }
      }

      // If we found a valid month/year, use it
      if (month && year) {
        this.selectedMonth = month;
        this.selectedYear = year;

        // Update the API call format by ensuring month has leading zero if needed
        if (month.length === 1) {
          month = '0' + month;
        }

        // Create and log the format we'll use for the API
        const monthYear = `${month}/${year}`;
        console.log(`Final extracted month/year for API calls: ${monthYear}`);

        // Update the timesheet data if available
        if (this.timesheetData) {
          this.timesheetData.month = month;
          this.timesheetData.year = year;
        }

        return;
      }
    }

    console.warn('Failed to extract month/year from any entry. No valid date formats found.');
  }

  /**
   * Get the numeric month from month name
   */
  private getMonthNumber(monthName: string | null): string {
    if (!monthName) return '';

    const months: {[key: string]: string} = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };

    return months[monthName] || '';
  }

  /**
   * Format a date string for consistent comparison
   * @param dateStr Date string in format DD/MM/YYYY or similar
   * @returns Standardized date string for comparison
   */
  private formatDateForComparison(dateStr: string): string | null {
    try {
      const date = this.parseDate(dateStr);
      if (date) {
        // Format as DD/MM/YYYY for consistent comparison
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
    } catch (error) {
      console.error('Error formatting date for comparison:', error);
    }
    return null;
  }

  /**
   * Format a date for display in the task list
   * @param dateString The date string to format (DD/MM/YYYY)
   */
  formatDateDisplay(dateString: string): string {
    try {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);

        const date = new Date(year, month, day);

        // Get day name in French
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const dayName = dayNames[date.getDay()];

        // Format as "Lundi 05/05/2025"
        return `${dayName} ${dateString}`;
      }
      return dateString;
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Check all entries for conflicts with existing tasks
   */
  private checkForDateConflicts(): void {
    this.hasDateConflicts = false;

    this.tableData.forEach(entry => {
      if (!entry.date) return;

      const formattedDate = this.formatDateForComparison(entry.date);
      if (formattedDate && this.existingTasksMap[formattedDate]) {
        this.hasDateConflicts = true;
        entry.isConflict = true;
        entry.conflictMessage = `Cette date existe déjà dans une autre tâche (${this.existingTasksMap[formattedDate].text})`;
      } else {
        entry.isConflict = false;
        entry.conflictMessage = '';
      }
    });
  }

  /**
   * Update the duplicate date map to track which dates appear more than once
   */
  private updateDuplicateDateMap(): void {
    this.duplicateDateMap = {};

    // First pass: count occurrences
    const dateCount: { [date: string]: number } = {};

    this.tableData.forEach(entry => {
      if (entry.date) {
        const normalizedDate = this.normalizeDate(entry.date);
        dateCount[normalizedDate] = (dateCount[normalizedDate] || 0) + 1;
      }
    });

    // Second pass: mark duplicates
    Object.keys(dateCount).forEach(date => {
      this.duplicateDateMap[date] = dateCount[date] > 1;
    });
  }

  /**
   * Normalize date format to ensure consistent comparison
   */
  private normalizeDate(dateString: string): string {
    try {
      const date = this.parseDate(dateString);
      if (date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.error('Error normalizing date:', error);
    }
    return dateString; // Fall back to original string if parsing fails
  }

  /**
   * Check if a date is a duplicate
   */
  isDuplicateDate(dateString: string | null): boolean {
    if (!dateString) return false;
    const normalizedDate = this.normalizeDate(dateString);
    return !!this.duplicateDateMap[normalizedDate];
  }

  /**
   * Check if a date has a conflict with an existing task
   */
  isConflictDate(entry: TimesheetEntry): boolean {
    return !!entry.isConflict;
  }
  /**
   * Add a new empty row to the timesheet entries
   * Checks manday budget limits before allowing new rows
   */  addRow(): void {
    if (!this.timesheetData) return;

    // Check if we're still loading budget information
    if (this.isLoadingBudget) {
      this.alertService.warning(
        'Chargement en cours',
        'Veuillez patienter...'
      );
      return;
    }

    // Check if budget information is available
    if (!this.currentProfileBudget) {
      this.alertService.warning(
        'Budget indisponible',
        'Impossible de vérifier les limites de budget.'
      );
      return;
    }

    // Calculate current total days that will be consumed by existing rows
    const currentRowsDays = this.getCurrentTotalDays();

    // Check if we can add exactly one more row based on remaining budget
    // Each row can use 0.5 or 1 day, so we check if we have at least 0.5 days remaining
    const remainingAfterCurrent = this.remainingMandays - currentRowsDays;

    if (remainingAfterCurrent < 0.5) {
      // Simple, clear warning message
      this.alertService.warning(
        'Budget épuisé',
        `Votre budget de ${this.currentProfileBudget.mandayBudget} jours est épuisé. Impossible d'ajouter plus d'activités.`
      );
      return;
    }

    // If we reach here, the budget allows adding a new row
    const newEntry: TimesheetEntry = {
      date: '',
      nb_jours: 1,
      workplace: 'EY',
      activities: ''
    };

    // Add to both the data source and the original data
    this.tableData = [...this.tableData, newEntry];
    if (this.timesheetData.entries) {
      this.timesheetData.entries.push(newEntry);
    } else {
      this.timesheetData.entries = [newEntry];
    }    // Show simple warning if budget is getting low
    const remainingAfterAdd = this.remainingMandays - (currentRowsDays + 1);
    if (remainingAfterAdd <= 1) {
      this.alertService.warning(
        'Budget presque épuisé',
        `Plus que ${remainingAfterAdd} jour(s) disponible(s).`
      );
    }

    // Validate new data
    this.validateTableData();

    // Force change detection to update the table
    setTimeout(() => {
      this.changeDetector.detectChanges();
    });
  }

  /**
   * Calculate the total number of days from current rows
   * @returns Total days that will be consumed by current table entries
   */
  private getCurrentTotalDays(): number {
    return this.tableData.reduce((total, entry) => {
      return total + (entry.nb_jours || 0);
    }, 0);
  }

  /**
   * Remove a row from the timesheet entries
   * @param index The index of the row to remove
   */
  removeRow(index: number): void {
    if (!this.timesheetData || index < 0 || index >= this.tableData.length) return;

    // Remove from both the data source and the original data
    this.tableData.splice(index, 1);
    this.tableData = [...this.tableData]; // Create a new reference

    if (this.timesheetData.entries) {
      // Find the corresponding entry in the original data
      const entryToRemove = this.tableData[index];
      this.timesheetData.entries = this.timesheetData.entries.filter(entry =>
        entry !== entryToRemove
      );
    }

    // Update duplicate tracking after removing a row
    this.updateDuplicateDateMap();

    // Check for conflicts after removing a row
    this.checkForDateConflicts();

    // Validate updated data
    this.validateTableData();

    // Force change detection to update the table
    setTimeout(() => {
      this.changeDetector.detectChanges();
    });
  }

  /**
   * Handle date changes from the date picker
   * @param event The date change event
   * @param index The index of the entry being modified
   */
  dateChanged(event: any, index: number): void {
    if (!event.value) return;

    const date = event.value;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Format as YYYY-MM-DD for storage
    this.tableData[index].date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // Update the month and year if they're not set
    if (!this.selectedMonth) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      this.selectedMonth = monthNames[date.getMonth()];
    }

    if (!this.selectedYear) {
      this.selectedYear = year.toString();
    }

    // Check if selected date is a holiday
    if (this.isHoliday(date)) {
      const holidayName = this.getHolidayName(date);
      this.alertService.warning(
        'Jour férié',
        `Attention: Le ${day}/${month}/${year} est un jour férié (${holidayName}).`
      );
    }

    // Check for conflicts with existing tasks
    const formattedDate = this.formatDateForComparison(`${day}/${month}/${year}`);
    if (formattedDate && this.existingTasksMap[formattedDate]) {
      this.tableData[index].isConflict = true;
      this.tableData[index].conflictMessage = `Cette date existe déjà dans une autre tâche (${this.existingTasksMap[formattedDate].text})`;

      this.alertService.warning(
        'Conflit de date',
        `Attention: Le ${day}/${month}/${year} est déjà utilisé pour une autre tâche. Veuillez choisir une autre date ou supprimer cette Activités.`
      );

      // Update conflict status
      this.hasDateConflicts = true;
    } else {
      this.tableData[index].isConflict = false;
      this.tableData[index].conflictMessage = '';

      // Recheck all entries for conflicts
      this.checkForDateConflicts();
    }

    // After date change, check for duplicates
    this.updateDuplicateDateMap();

    // Re-validate after date change
    this.validateTableData();
  }

  /**
   * Parse a date string to a Date object for the date picker
   * @param dateStr The date string to parse
   * @returns A Date object
   */
  parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    try {
      // Handle YYYY-MM-DD format
      if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
        return new Date(dateStr);
      }

      // Handle DD-MM-YYYY or DD/MM/YYYY format
      if (dateStr.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/)) {
        const parts = dateStr.split(/[-\/]/);
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }

      // Handle DD/Month format like "15-May"
      const monthNamePattern = /(\d+)[-\/](\w+)/;
      const match = dateStr.match(monthNamePattern);
      if (match) {
        const day = parseInt(match[1], 10);
        const monthStr = match[2].toLowerCase();
        const monthMap: { [key: string]: number } = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        const month = monthMap[monthStr.substring(0, 3).toLowerCase()];
        const year = new Date().getFullYear();

        if (month !== undefined) {
          return new Date(year, month, day);
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }

  /**
   * Check if a date is a weekend (Saturday or Sunday)
   * @param date The date to check
   * @returns True if the date is a weekend
   */
  isWeekend(date: Date | null): boolean {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  /**
   * Check if a date is a holiday in Tunisia
   * @param date The date to check
   * @returns True if the date is a holiday
   */
  isHoliday(date: Date | null): boolean {
    if (!date) return false;

    // Format date as YYYY-MM-DD for easy comparison
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // List of Tunisian holidays (static dates)
    const tunisianHolidays = [
      // Fixed annual holidays
      `${year}-01-01`, // Nouvel An
      `${year}-03-20`, // Fête de l'Indépendance
      `${year}-04-09`, // Jour des Martyrs
      `${year}-05-01`, // Fête du Travail
      `${year}-07-25`, // Fête de la République
      `${year}-08-13`, // Fête de la femme
      `${year}-10-15`, // Fête de l'évacuation
      `${year}-12-17`, // Jour anniversaire de la Révolution
    ];

    return tunisianHolidays.includes(formattedDate);
  }

  /**
   * Get the name of a holiday for a given date
   * @param date The date to check
   * @returns The name of the holiday, or null if not a holiday
   */
  getHolidayName(date: Date | null): string | null {
    if (!date) return null;

    // Format date as MM-DD for comparison (ignoring year)
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const mmdd = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // Map of holiday dates to names
    const holidayNames: { [key: string]: string } = {
      '01-01': 'Nouvel An',
      '03-20': 'Fête de l\'Indépendance',
      '04-09': 'Jour des Martyrs',
      '05-01': 'Fête du Travail',
      '07-25': 'Fête de la République',
      '08-13': 'Fête de la femme',
      '10-15': 'Fête de l\'évacuation',
      '12-17': 'Jour anniversaire de la Révolution'
    };

    return holidayNames[mmdd] || 'Jour férié';
  }

  /**
   * Calculate the total number of days in the timesheet
   */
  getTotalDays(): number {
    if (!this.tableData || this.tableData.length === 0) return 0;

    return this.tableData.reduce((total, entry) => {
      return total + (entry.nb_jours || 0);
    }, 0);
  }

  /**
   * Get entries that have conflicts with existing tasks
   * @returns Array of entries with conflicts
   */
  getConflictingEntries(): TimesheetEntry[] {
    return this.tableData.filter(entry => entry.isConflict === true);
  }

  /**
   * Emit the confirm event with the updated timesheet data
   */
  confirmTimesheet(): void {
    // First validate the table data
    const isValid = this.validateTableData();

    if (!isValid) {
      // Display the first 3 errors to the user
      const errorMessage = this.validationErrors.slice(0, 3).join('\n') +
                           (this.validationErrors.length > 3 ? `\n...et ${this.validationErrors.length - 3} autre(s) erreur(s)` : '');

      this.alertService.error('Erreurs de validation', errorMessage);
      return;
    }

    // Check for date conflicts with existing tasks
    const conflictingEntries = this.getConflictingEntries();
    if (conflictingEntries.length > 0) {
      const warningMessage = `${conflictingEntries.length} Activités(s) ont des dates qui existent déjà dans les timesheets existants. Veuillez les modifier ou les supprimer avant de continuer.`;

      let detailedMessage = 'Dates en conflit: ';
      conflictingEntries.forEach((entry: TimesheetEntry, index: number) => {
        const formattedDate = this.formatDateForComparison(entry.date!);
        detailedMessage += `${formattedDate}${index < conflictingEntries.length - 1 ? ', ' : ''}`;
      });

      this.alertService.error('Erreur de validation', `${warningMessage}\n${detailedMessage}`);
      return;
    }

    // Show processing state
    this.isSubmitting = true;

    // Count successful API calls
    let successCount = 0;
    let totalEntries = this.tableData.length;
    let hasErrors = false;

    if (!this.projectId || !this.profileId) {
      this.alertService.error('Erreur', 'ID de projet ou de profil manquant');
      this.isSubmitting = false;
      return;
    }    // Process each entry and call the API sequentially (one by one)
    const tasksToProcess: any[] = [];

    this.tableData.forEach((entry: TimesheetEntry) => {
      if (!entry.date || !entry.workplace || !entry.activities) {
        return; // Skip incomplete entries (should be caught by validation)
      }

      // Format the task data according to API requirements
      const taskData = {
        datte: this.formatDateForComparison(entry.date), // Format as DD/MM/YYYY
        nbJour: entry.nb_jours.toString(),
        text: entry.activities,
        workPlace: entry.workplace
      };

      tasksToProcess.push(taskData);
    });

    // Execute API calls sequentially (one by one) to avoid race conditions
    if (tasksToProcess.length > 0) {
      this.processTasksSequentially(tasksToProcess, 0).pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      ).subscribe({
        next: (results) => {
          // Count successful results
          successCount = results.successCount;

          // Show success message
          this.alertService.success(
            'Timesheet enregistré',
            `${successCount} activité(s) ont été ajoutée(s) avec succès.`
          );

          // Navigate to the timesheet view
          this.router.navigate([`timesheet/${this.profileId}/${this.projectId}`]);
        },
        error: (error) => {
          console.error('Error saving timesheet entries:', error);

          // Handle specific error message from backend
          if (error.error && typeof error.error === 'string') {
            // Check if it contains the specific message about remaining days
            if (error.error.includes("Il reste") && error.error.includes("au profil pour ce projet")) {
              // Use custom styling for this specific error type
              this.alertService.custom({
                title: 'Limite de jours dépassée',
                text: error.error,
                icon: 'warning',
                iconColor: '#ff9800',
                confirmButtonText: 'Compris',
                showCancelButton: false,
                toast: false,
                position: 'center',
                customClass: {
                  popup: 'custom-warning-popup',
                  title: 'custom-warning-title',
                  content: 'custom-warning-content',
                  confirmButton: 'custom-warning-confirm'
                }
              });
            } else {
              // Standard error message
              this.alertService.error('Erreur', error.error);
            }
          } else {
            // Generic error message
            this.alertService.error(
              'Erreur',
              'Une erreur est survenue lors de l\'enregistrement du timesheet. Veuillez réessayer.'
            );
          }

          this.isSubmitting = false;
        }
      });
    } else {
      this.alertService.warning('Attention', 'Aucune activité valide à enregistrer.');
      this.isSubmitting = false;
    }
  }

  /**
   * Cancel the verification and emit the cancel event
   */
  cancelVerification(): void {
    // Don't allow cancellation during submission
    if (this.isSubmitting) return;

    this.cancel.emit();
  }

  /**
   * Validate the table data and return any errors
   * This checks for required fields, valid values, and date conflicts
   */
  validateTableData(): boolean {
    this.validationErrors = [];

    if (this.tableData.length === 0) {
      this.validationErrors.push('Le timesheet ne contient aucune activité. Veuillez ajouter au moins une activité.');
      this.hasValidationErrors = true;
      return false;
    }

    // Check for required fields and valid values
    for (let i = 0; i < this.tableData.length; i++) {
      const entry = this.tableData[i];
      const rowNum = i + 1;

      // Check for missing date
      if (!entry.date) {
        this.validationErrors.push(`Ligne ${rowNum}: La date est manquante`);
      } else {
        const parsedDate = this.parseDate(entry.date);

        // Check for weekend
        if (parsedDate && this.isWeekend(parsedDate)) {
          this.validationErrors.push(`Ligne ${rowNum}: Le ${entry.date} est un weekend`);
        }

        // Check for holiday
        if (parsedDate && this.isHoliday(parsedDate)) {
          const holidayName = this.getHolidayName(parsedDate);
          this.validationErrors.push(`Ligne ${rowNum}: Le ${entry.date} est un jour férié (${holidayName})`);
        }

        // Check for duplicate date
        if (this.isDuplicateDate(entry.date)) {
          this.validationErrors.push(`Ligne ${rowNum}: Le ${entry.date} est déjà utilisé dans une autre Activités`);
        }
      }

      // Check for missing or invalid workplace
      if (!entry.workplace) {
        this.validationErrors.push(`Ligne ${rowNum}: Le lieu de travail est manquant`);
      } else if (entry.workplace !== 'EY' && entry.workplace !== 'Chez le Client') {
        this.validationErrors.push(`Ligne ${rowNum}: Le lieu de travail doit être "EY" ou "Chez le Client" (trouvé: "${entry.workplace}")`);
      }

      // Check for missing activities
      if (!entry.activities || entry.activities.trim() === '') {
        this.validationErrors.push(`Ligne ${rowNum}: La description des activités est manquante`);
      }

      // Check for invalid number of days
      if (entry.nb_jours !== 0.5 && entry.nb_jours !== 1) {
        this.validationErrors.push(`Ligne ${rowNum}: Le nombre de jours doit être 0.5 ou 1 (trouvé: ${entry.nb_jours})`);
      }

      // Check if entry has a conflict with existing tasks
      if (entry.isConflict) {
        this.validationErrors.push(`Ligne ${rowNum}: ${entry.conflictMessage || 'Conflit avec une tâche existante'}`);
      }
    }

    // Update validation state
    this.hasValidationErrors = this.validationErrors.length > 0;    // Log validation errors for debugging
    if (this.hasValidationErrors) {
      console.log("Validation errors:", this.validationErrors);
    }

    return !this.hasValidationErrors;
  }

  /**
   * Get a human-readable date range for the current month/year selection
   */
  getDateRangeText(): string {
    if (!this.selectedMonth || !this.selectedYear || !this.minDate || !this.maxDate) {
      return 'Sélectionnez un mois et une année pour restreindre les dates';
    }

    const startDay = this.minDate.getDate();
    const endDay = this.maxDate.getDate();
    return `Dates disponibles: ${startDay}/${this.getMonthNumber(this.selectedMonth)}/${this.selectedYear} - ${endDay}/${this.getMonthNumber(this.selectedMonth)}/${this.selectedYear}`;
  }

  /**
   * Load project profiles and calculate remaining manday budget for the current profile
   */
  loadProjectBudgetInfo(): void {
    if (!this.projectId || !this.profileData?.idp) {
      console.warn('Project ID or profile data not available, cannot load budget info');
      return;
    }

    this.isLoadingBudget = true;
    console.log('Loading project budget info for project:', this.projectId, 'profile:', this.profileData.idp);    this.projectService.getProjectProfiles(this.projectId).subscribe({
      next: (projectProfiles) => {
        console.log('Project profiles loaded:', projectProfiles);
        console.log('Sample profile structure:', projectProfiles[0]);
        this.projectProfiles = projectProfiles;

        // Find the current profile in the project profiles
        const currentProfile = projectProfiles.find((profile: any) => {
          // The project profiles API returns data in a specific format
          // Check both possible formats for profile ID
          const profileId = profile[0]?.idp || profile.profile_id || profile.idp;
          return profileId === this.profileData.idp;
        });        if (currentProfile) {
          console.log('Current profile found:', currentProfile);          // Extract manday budget information
          // Based on the working pattern in program-projects.component.ts:
          // item[1] = mandaybudget, item[2] = progress (consumed mandays)
          this.currentProfileBudget = {
            mandayBudget: currentProfile[1] || 0,
            consumedMandayBudget: currentProfile[2] || 0
          };

          console.log('Current profile budget:', this.currentProfileBudget);

          // Calculate remaining mandays
          this.remainingMandays = this.currentProfileBudget.mandayBudget - this.currentProfileBudget.consumedMandayBudget;

          // The maximum rows that can be added is the remaining mandays
          // Since each row can have 0.5 or 1 day, we need to be conservative
          // and assume each row will use 1 day (worst case scenario)
          this.maxAllowedRows = Math.max(0, this.remainingMandays);

          console.log('Remaining mandays:', this.remainingMandays);
          console.log('Max allowed rows:', this.maxAllowedRows);

          this.isLoadingBudget = false;
        } else {
          console.warn('Current profile not found in project profiles');
          this.remainingMandays = 0;
          this.maxAllowedRows = 0;
          this.isLoadingBudget = false;
        }
      },
      error: (error) => {
        console.error('Error loading project budget info:', error);
        this.isLoadingBudget = false;
        this.remainingMandays = 0;
        this.maxAllowedRows = 0;        this.alertService.warning(
          'Information budget indisponible',
          'Le contrôle de budget ne sera pas actif.'
        );
      }
    });
  }

  /**
   * Get budget status information for display
   * @returns Object containing budget status details
   */
  getBudgetStatus(): {
    text: string;
    remainingDays: number;
    isWarning: boolean;
    isError: boolean;
    canAddRows: boolean;
  } {
    if (!this.currentProfileBudget) {
      return {
        text: 'Information de budget non disponible',
        remainingDays: 0,
        isWarning: false,
        isError: true,
        canAddRows: false
      };
    }    const currentDays = this.getCurrentTotalDays();
    const remainingAfterCurrent = this.remainingMandays - currentDays;
    const canAddRows = remainingAfterCurrent >= 0.5; // Allow adding if at least 0.5 days remaining

    let text = `${this.currentProfileBudget.consumedMandayBudget}/${this.currentProfileBudget.mandayBudget} jours utilisés | Restant: ${remainingAfterCurrent} jours`;

    return {
      text,
      remainingDays: remainingAfterCurrent,
      isWarning: remainingAfterCurrent <= 2 && remainingAfterCurrent > 0,
      isError: remainingAfterCurrent <= 0,
      canAddRows
    };
  }

  /**
   * Process tasks sequentially (one by one) to avoid race conditions
   * This ensures that each task is processed after the previous one completes,
   * preventing concurrent updates to consumedMandayBudget
   * @param tasks Array of task data to process
   * @param currentIndex Current index in the tasks array
   * @returns Observable that completes when all tasks are processed
   */
  private processTasksSequentially(tasks: any[], currentIndex: number): Observable<{successCount: number, failureCount: number, errors: any[]}> {
    return new Observable(observer => {
      let successCount = 0;
      let failureCount = 0;
      let errors: any[] = [];

      const processNextTask = (index: number) => {
        // If we've processed all tasks, emit the final result
        if (index >= tasks.length) {
          observer.next({
            successCount,
            failureCount,
            errors
          });
          observer.complete();
          return;
        }

        const currentTask = tasks[index];
        console.log(`Processing task ${index + 1} of ${tasks.length}:`, currentTask);

        // Call the API for the current task
        this.eventService.addTask(currentTask, this.projectId!, this.profileId!).subscribe({
          next: (result) => {
            console.log(`Task ${index + 1} completed successfully:`, result);
            successCount++;

            // Process the next task after a small delay to ensure proper sequencing
            setTimeout(() => {
              processNextTask(index + 1);
            }, 100); // 100ms delay between API calls
          },
          error: (error) => {
            console.error(`Task ${index + 1} failed:`, error);
            failureCount++;
            errors.push({
              taskIndex: index + 1,
              task: currentTask,
              error: error
            });

            // If this is a critical error (like budget exceeded), stop processing
            if (error.error && typeof error.error === 'string' &&
                (error.error.includes("Il reste") || error.error.includes("budget"))) {
              // Emit error to stop the entire process
              observer.error(error);
              return;
            }

            // For non-critical errors, continue with the next task
            setTimeout(() => {
              processNextTask(index + 1);
            }, 100);
          }
        });
      };

      // Start processing from the current index
      processNextTask(currentIndex);
    });
  }
}
