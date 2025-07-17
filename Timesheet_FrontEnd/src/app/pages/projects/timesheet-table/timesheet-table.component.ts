import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { EventService } from 'src/app/services/event/event.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MaterialModule } from 'src/app/MaterialModule';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { ExcelExportService } from 'src/app/services/excel/excel-export.service';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { TimesheetService } from 'src/app/services/timesheet/timesheet.service';
import { PdfExportService } from 'src/app/services/PDF-export/pdf-export.service';
import { FacturePdfExportService, FactureInformation } from 'src/app/services/PDF-export/facture-pdf-export.service';
import { AlertService } from 'src/app/services/alert.service';

export class TableStickyHeaderExample {
  displayedColumns = ['Jour', 'Date', 'nbDay', 'workplace', 'task'];
  dataSource = [];
}

export class TimesheetInformations {
  Month: string;
  Year: string;
  ProjectName: string;
  ContractNumber: number;
  ExpertName: string;
  function: string;
}

export interface PeriodicElement {
  idt: number;
  Day: number;
  Date: string;
  nbDay: number | null;
  workplace: string;
  task: string;
  project: boolean;
  isDisabled?: boolean;
  duplicated?: boolean;
}

@Component({
  selector: 'app-timesheet-table',
  templateUrl: './timesheet-table.component.html',
  styleUrls: ['./timesheet-table.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatGridListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MaterialModule,
    MatIconModule,
    FormsModule,
  ],
})
export class TimesheetTableComponent implements OnInit, AfterViewInit {
  years: string[] = [];
  availableMonths: { name: string; value: string; frname: string }[] = [];
  selectedYear: string = '';
  totalNbJour: number = 0;
  connecteduser: any;
  profileId: any;
  projectId: any;
  timesheetinfo: TimesheetInformations;
  projectProfile: any;
  tasks: any;
  timesheet: any=null;
  programprofile: any;
  project: any;
  actuelYear: any;
  ELEMENT_DATA: PeriodicElement[] = [];
  isApprovalEmailLoading: boolean = false;
  displayedColumns: string[] = ['Jour', 'Date', 'nbDay', 'workplace', 'task'];
  calendarWeeks: PeriodicElement[][] = []; // Calendar weeks array for the new layout
  months: { name: string; value: string; frname: string }[] = [
    { name: 'January', value: '01', frname: 'Janvier' },
    { name: 'February', value: '02', frname: 'Février' },
    { name: 'March', value: '03', frname: 'Mars' },
    { name: 'April', value: '04', frname: 'Avril' },
    { name: 'May', value: '05', frname: 'Mai' },
    { name: 'June', value: '06', frname: 'Juin' },
    { name: 'July', value: '07', frname: 'Juillet' },
    { name: 'August', value: '08', frname: 'Août' },
    { name: 'September', value: '09', frname: 'Septembre' },
    { name: 'October', value: '10', frname: 'Octobre' },
    { name: 'November', value: '11', frname: 'Novembre' },
    { name: 'December', value: '12', frname: 'Décembre' },
  ];
  selectedMonthName: String = '';
  selectedMonth: string = '';
  dataSource = new MatTableDataSource(this.ELEMENT_DATA);
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('taskDialog') taskDialog!: ElementRef;
  constructor(
    private _liveAnnouncer: LiveAnnouncer,
    private route: ActivatedRoute,
    private router: Router,
    private userserv: UserserviceService,
    private projectserv: ProjectService,
    private eventservice: EventService,
    private timesheetservice: TimesheetService,
    private excelExportService: ExcelExportService,
    private exportService: PdfExportService,
    private factureExportService: FacturePdfExportService,
    private alertService: AlertService,
    public dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    // Initialize calendar structure
    this.groupIntoWeeks();

    this.route.queryParams.subscribe(params => {
      const monthParam = params['month'];
      if (monthParam) {
        this.selectedMonth = monthParam;
        localStorage.setItem('selectedMonth', this.selectedMonth);
      }
    });
    this.route.paramMap.subscribe(async (params) => {
      const idParam = params.get('idprof');
      const idprojParam = params.get('idproj');

      if (idParam && idprojParam) {
        this.projectId = +idprojParam;
        this.profileId = +idParam;
        this.connectedUser();
        try {
          await Promise.all([
            this.getProjectProfiles(),
            this.getProjectDetailsAndProfile(),
          ]);

          // Set years range based on program dates after project data is loaded
          this.setYearsRangeFromProgram();
          this.setCurrentMonthAndYear();

          // Ensure profileId and projectId are set before loading tasks
          if (this.profileId && this.projectId) {
            this.loadTasks(this.profileId);
          }
        } catch (error) {
          console.error('Error during initialization:', error);
        }
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
  public connectedUser() {
    this.connecteduser = this.userserv.getUserConnected();
  }



//Setting the list of years in the sekecct box , here you will set you program year range
  setYearsRange(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 7; i++) {
      this.years.push(i.toString());
    }
  }

  // New method to set years range based on program start and end dates
  setYearsRangeFromProgram(): void {
    if (!this.project?.program?.startdate || !this.project?.program?.enddate) {
      // Fallback to default range if program dates are not available
      this.setYearsRange();
      return;
    }

    // Parse program start and end dates (format: "DD/MM/YYYY")
    const startDateParts = this.project.program.startdate.split('/');
    const endDateParts = this.project.program.enddate.split('/');

    const startYear = parseInt(startDateParts[2]);
    const endYear = parseInt(endDateParts[2]);

    this.years = [];
    for (let year = startYear; year <= endYear; year++) {
      this.years.push(year.toString());
    }
  }

  // Get available months for the selected year based on program dates
  getAvailableMonthsForYear(year: string): { name: string; value: string; frname: string }[] {
    if (!this.project?.program?.startdate || !this.project?.program?.enddate) {
      return this.months; // Return all months if program dates are not available
    }

    const selectedYear = parseInt(year);
    const startDateParts = this.project.program.startdate.split('/');
    const endDateParts = this.project.program.enddate.split('/');

    const startYear = parseInt(startDateParts[2]);
    const startMonth = parseInt(startDateParts[1]);
    const endYear = parseInt(endDateParts[2]);
    const endMonth = parseInt(endDateParts[1]);

    let availableMonths = [...this.months];

    // If selected year is the start year, filter months before start month
    if (selectedYear === startYear) {
      availableMonths = availableMonths.filter(month => parseInt(month.value) >= startMonth);
    }

    // If selected year is the end year, filter months after end month
    if (selectedYear === endYear) {
      availableMonths = availableMonths.filter(month => parseInt(month.value) <= endMonth);
    }

    return availableMonths;
  }

  setCurrentMonthAndYear(): void {
    const currentDate = new Date();
    const storedMonth = localStorage.getItem('selectedMonth');
    const storedYear = localStorage.getItem('selectedYear');

    // Set year first
    let defaultYear = currentDate.getFullYear().toString();
    if (storedYear && storedYear !== 'undefined' && this.years.includes(storedYear)) {
      this.selectedYear = storedYear;
    } else if (this.years.length > 0) {
      // Find the closest available year to current year
      const currentYear = currentDate.getFullYear();
      const availableYears = this.years.map(y => parseInt(y));
      this.selectedYear = availableYears.reduce((prev, curr) =>
        Math.abs(curr - currentYear) < Math.abs(prev - currentYear) ? curr : prev
      ).toString();
    } else {
      this.selectedYear = defaultYear;
    }

    // Update available months for selected year
    this.availableMonths = this.getAvailableMonthsForYear(this.selectedYear);

    // Set month based on available months
    let defaultMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    if (storedMonth && storedMonth !== 'undefined' &&
        this.availableMonths.some(m => m.value === storedMonth)) {
      this.selectedMonth = storedMonth;
    } else if (this.availableMonths.length > 0) {
      // Find the closest available month to current month
      const currentMonth = currentDate.getMonth() + 1;
      const availableMonthValues = this.availableMonths.map(m => parseInt(m.value));
      const closestMonth = availableMonthValues.reduce((prev, curr) =>
        Math.abs(curr - currentMonth) < Math.abs(prev - currentMonth) ? curr : prev
      );
      this.selectedMonth = closestMonth.toString().padStart(2, '0');
    } else {
      this.selectedMonth = defaultMonth;
    }

    this.onMonthChange({ target: { value: this.selectedMonth } } as any);
  }
/*
  setCurrentMonthAndYear(): void {
    const currentDate = new Date();
    const storedMonth = localStorage.getItem('selectedMonth');
    this.selectedMonth =
      storedMonth && storedMonth !== 'undefined'
        ? storedMonth
        : (currentDate.getMonth() + 1).toString().padStart(2, '0');
    this.actuelYear = currentDate.getFullYear().toString();
    this.onMonthChange({ target: { value: this.selectedMonth } } as any);
  }
*/

updateTimesheetData(): void {
  const year = parseInt(this.selectedYear);
  const month = parseInt(this.selectedMonth) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  this.timesheet = null;

  const newElementData: PeriodicElement[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const formattedDate = `${('0' + date.getDate()).slice(-2)}/${(
      '0' +
      (date.getMonth() + 1)
    ).slice(-2)}/${date.getFullYear()}`;

    newElementData.push({
      idt: 0,
      Day: day,
      Date: formattedDate,
      nbDay: null,
      workplace: '',
      task: '',
      project: true,
    });
  }

  this.ELEMENT_DATA = newElementData;
  this.dataSource.data = this.ELEMENT_DATA;

  this.loadTasks(this.profileId); // Recharger les tâches après le changement de mois/année
}




  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  goToProject() {
    this.router.navigate(['/projectdetails', this.projectId]);
  }

  updateTotalNbJour(): void {
    this.totalNbJour = this.tasks
      .filter((task: any) => task.projectId === this.projectId)
      .reduce((total: number, task: any) => total + (task.nbJour || 0), 0);
  }
/*  onMonthChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedMonth = selectElement.value;
    localStorage.setItem('selectedMonth', this.selectedMonth);


    const year = new Date().getFullYear();
    const month = parseInt(this.selectedMonth) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    this.timesheet=null;
    const newElementData: PeriodicElement[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const formattedDate = `${('0' + date.getDate()).slice(-2)}/${(
        '0' +
        (date.getMonth() + 1)
      ).slice(-2)}/${date.getFullYear()}`;
      newElementData.push({
        idt: 0,
        Day: day,
        Date: formattedDate,
        nbDay: null,
        workplace: '',
        task: '',
        project: true,
      });
    }

    this.ELEMENT_DATA = newElementData;
    this.dataSource.data = this.ELEMENT_DATA;

    this.loadTasks(this.profileId); // Load tasks after the month has changed
  }*/

    onYearChange(event: Event): void {
      const selectElement = event.target as HTMLSelectElement;
      this.selectedYear = selectElement.value;
      localStorage.setItem('selectedYear', this.selectedYear);

      // Update available months for the new year
      this.availableMonths = this.getAvailableMonthsForYear(this.selectedYear);

      // Check if current selected month is still available in the new year
      if (!this.availableMonths.some(m => m.value === this.selectedMonth)) {
        // If current month is not available, select the first available month
        if (this.availableMonths.length > 0) {
          this.selectedMonth = this.availableMonths[0].value;
          localStorage.setItem('selectedMonth', this.selectedMonth);
        }
      }

      this.updateTimesheetData(); // Met à jour les données en fonction de la nouvelle année
    }


    onMonthChange(event: Event): void {
      const selectElement = event.target as HTMLSelectElement;
      this.selectedMonth = selectElement.value;
      localStorage.setItem('selectedMonth', this.selectedMonth);

      this.updateTimesheetData();
    }

  submitTimesheet(): void {
    if (this.totalNbJour > 0) {
      const trigger = 1;
      this.timesheetservice
        .ChangeTimsheetStatus(this.timesheet.idtimesheet, trigger)
        .subscribe({
          next: (response) => {
            this.timesheet = response;

            // Send the submission email
            this.timesheetservice.sendSubmissionEmail(this.timesheet.idtimesheet)
              .subscribe({
                next: (response) => {
                  this.alertService.success('Succès', 'Timesheet soumise avec succès');
                },
                error: (error) => {
                  const errorMessage = error.error || error.message || 'Erreur inconnue lors de l\'envoi de l\'email';
                  this.alertService.error('Erreur', 'Erreur lors de l\'envoi de l\'email : ' + errorMessage);
                }
              });
          },
          error: (error) => {
            this.alertService.error('Erreur', error.error || 'Erreur lors de la récupération du timesheet');
          },
        });
    } else {
      this.alertService.warning('Attention', 'Impossible de valider une feuille de temps vide');
    }
  }
  aprouveTimesheet(): void {
    const trigger = 3;
    this.timesheetservice.ChangeTimsheetStatus(this.timesheet.idtimesheet, trigger)
      .subscribe({
        next: (response) => {
          this.alertService.success('Succès', 'Timesheet approuvée avec succès');

          // Start loading indicator for email sending
          this.isApprovalEmailLoading = true;

          // Send the approval email
          this.timesheetservice.sendAprouvalEmail(this.timesheet.idtimesheet)
            .subscribe({
              next: () => {
                this.isApprovalEmailLoading = false;
                this.alertService.success('Succès', 'Email d\'approbation envoyé avec succès');
              },
              error: (error) => {
                this.isApprovalEmailLoading = false;
                this.alertService.error('Erreur', 'Erreur lors de l\'envoi de l\'email : ' + (error.error || error.message));
              }
            });
        },
        error: (error) => {
          this.alertService.error('Erreur', error.error || 'Erreur lors de la soumission du timesheet');
        },
      });
  }


/*  rejectTimesheet(): void {
    const trigger = 2;
    this.timesheetservice
      .ChangeTimsheetStatus(this.timesheet.idtimesheet, trigger)
      .subscribe({
        next: (response) => {
          this.timesheet = response;
        },
        error: (error) => {
          alert(error.error || 'Erreur lors de la récupération du timesheet');
        },
      });
  }*/

      rejectTimesheet(): void {
        const trigger = 2;
        this.timesheetservice.ChangeTimsheetStatus(this.timesheet.idtimesheet, trigger)
          .subscribe({
            next: (response) => {
              this.alertService.warning('Rejet', 'Timesheet rejetée');
                window.location.reload();
                this.timesheetservice.sendEmail(this.timesheet.idtimesheet)
                  .subscribe({
                    next: () => {

                    },
                    error: (error) => {
                      this.alertService.error('Erreur', 'Erreur lors de l\'envoi de l\'email : ' + (error.error || error.message));
                    }
                  });
            },
            error: (error) => {
              this.alertService.error('Erreur', error.error || 'Erreur lors du rejet du timesheet');
            },
          });
      }

  getTimesheet(): void {
   if (this.totalNbJour > 0) {
    console.log("selectedMonth:", this.selectedMonth , "selectedYear:", this.selectedYear, "projectId:", this.projectId, "profileId:", this.profileId);
      this.timesheetservice
        .getTimesheetByMonthAndYear(
          this.selectedMonth,
          this.selectedYear,
          this.projectId,
          this.profileId
        )
        .subscribe({
          next: (response) => {
            this.timesheet = response;
            console.log('Timesheet retrieved:', this.timesheet);
          },
          error: (error) => {
            this.alertService.error('Erreur', error.error || 'Erreur lors de la récupération du timesheet');
          },
        });
    }
  }

  isWeekend(dateString: string): boolean {
    if (!dateString) return false;

    const parts = dateString.split('/');
    if (parts.length !== 3) return false;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    // Validate parsed values
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 3000) return false;

    const date = new Date(year, month, day);

    // Check if the date is valid (handles cases like February 30th)
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return false;
    }

    const dayOfWeek = date.getDay();

    // Only check for weekends (Saturday = 6, Sunday = 0)
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  isHoliday(dateString: string): boolean {
    if (!dateString) return false;

    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    // Format date as YYYY-MM-DD for easy comparison
    const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // List of Tunisian holidays
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

  getBlockedDayReason(dateString: string): string {
    if (!dateString) return '';

    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();

    // Check weekends first
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'Weekend - Jour non ouvrable';
    }

    // Format date as YYYY-MM-DD for easy comparison
    const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // Map of Tunisian holidays with their names
    const tunisianHolidays: {[key: string]: string} = {
      [`${year}-01-01`]: 'Nouvel An',
      [`${year}-03-20`]: 'Fête de l\'Indépendance',
      [`${year}-04-09`]: 'Jour des Martyrs',
      [`${year}-05-01`]: 'Fête du Travail',
      [`${year}-07-25`]: 'Fête de la République',
      [`${year}-08-13`]: 'Fête de la femme',
      [`${year}-10-15`]: 'Fête de l\'évacuation',
      [`${year}-12-17`]: 'Jour anniversaire de la Révolution'
    };

    return tunisianHolidays[formattedDate] || 'Jour non ouvrable';
  }  getDisplayedBlockedReason(day: PeriodicElement): string {
    if (!day.isDisabled) return '';

    // Check if this day has tasks from other projects
    // Add null check for this.tasks to prevent errors
    if (this.tasks && this.tasks.length > 0) {
      const tasksForDate = this.tasks.filter((t: any) => t.datte === day.Date);
      const hasTasksFromOtherProjects = tasksForDate.some((t: any) => t.projectId !== this.projectId);

      if (hasTasksFromOtherProjects) {
        return 'Tâche existe déjà dans un autre projet';
      }
    }

    // Check if it's a weekend
    if (this.isWeekend(day.Date)) {
      return 'Week-end - Jour non ouvrable';
    }

    // Check if it's a holiday - show specific holiday name
    if (this.isHoliday(day.Date)) {
      const parts = day.Date.split('/');
      const dayNum = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      // Format date as YYYY-MM-DD for easy comparison
      const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;

      // Map of Tunisian holidays with their French names
      const tunisianHolidays: {[key: string]: string} = {
        [`${year}-01-01`]: 'Nouvel An',
        [`${year}-03-20`]: 'Fête de l\'Indépendance',
        [`${year}-04-09`]: 'Jour des Martyrs',
        [`${year}-05-01`]: 'Fête du Travail',
        [`${year}-07-25`]: 'Fête de la République',
        [`${year}-08-13`]: 'Fête de la femme',
        [`${year}-10-15`]: 'Fête de l\'évacuation',
        [`${year}-12-17`]: 'Jour anniversaire de la Révolution'
      };

      return tunisianHolidays[formattedDate] || 'Jour férié';
    }

    return 'Jour bloqué';
  }



  onRowHover(isHovered: boolean, row: any) {
    row.isHovered = isHovered;
  }

  public getProjectProfiles(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.projectserv
        .getProfileProject(this.profileId, this.projectId)
        .subscribe(
          (response: any[]) => {
            this.projectProfile = response;
            resolve();
          },
          (error) => {
            console.error('Error fetching project profiles:', error);
            reject(error);
          }
        );
    });
  }
  public getProjectDetailsAndProfile(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.projectserv.getProjectDetails(this.projectId).subscribe(
        (response: any[]) => {
          console.log('Paaaaaaaaaaaaaaaaaaaaaaaaaaaa:', response);
          this.project = response;

          this.projectserv
            .getProgramProfile(this.project.program.idprog, this.profileId)
            .subscribe(
              (profileResponse: any[]) => {
                this.programprofile = profileResponse;
                resolve();
              },
              (error) => {
                console.error('Error fetching program profile:', error);
                reject(error);
              }
            );
        },
        (error) => {
          console.error('Error fetching project details:', error);
          reject(error);
        }
      );
    });
  }

  public loadTasks(id: number): void {
    const monthYear = `${this.selectedMonth}/${this.selectedYear}`;
    console.log('Loading tasks for month/year:', monthYear);
    this.eventservice
      .getTasksAndProjectIdByMonthAndProfile(monthYear, this.profileId)
      .subscribe(
        (tasks) => {
          this.tasks = tasks;
          this.updateElementData();
          this.updateTotalNbJour();
          this.getTimesheet();
          // Make sure the calendar weeks are properly generated after data update
          this.groupIntoWeeks();
          console.log('Tasks loaded:', this.tasks);
          console.log('Total number of days:', this.totalNbJour);
          console.log('Timesheet:', this.timesheet);
        },
        (error) => {
          console.error('Error fetching tasks', error);
        }
      );
  }
  private updateElementData(): void {
    const year = parseInt(this.selectedYear);
    const month = parseInt(this.selectedMonth) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const newElementData: PeriodicElement[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const formattedDate = `${('0' + date.getDate()).slice(-2)}/${(
        '0' +
        (date.getMonth() + 1)
      ).slice(-2)}/${date.getFullYear()}`;

      const tasksForDate: any[] = this.tasks.filter(
        (t: any) => t.datte === formattedDate
      );

      const hasHalfDayTask = tasksForDate.some((t: any) => t.nbJour === 0.5);
      const isTask = tasksForDate.length > 0 ? tasksForDate[0].taskId : 0;
      const nbDay = tasksForDate.length > 0 ? tasksForDate[0].nbJour : null;
      const workplace =
        tasksForDate.length > 0 ? tasksForDate[0].workPlace : '';

      const isDisabled = tasksForDate.some(
        (t: any) => t.projectId !== this.projectId
      ) || this.isWeekend(formattedDate) || this.isHoliday(formattedDate);

      const originalRow: PeriodicElement = {
        idt: isTask,
        Day: day,
        Date: formattedDate,
        nbDay: isDisabled ? null : nbDay,
        workplace: isDisabled ? '' : workplace,
        task: isDisabled
          ? ''
          : tasksForDate.length > 0
          ? tasksForDate[0].text
          : '',
        project: true,
        isDisabled: isDisabled,
      };
      newElementData.push(originalRow);

      if (
        tasksForDate.some((t: any) => t.projectId !== this.projectId) &&
        hasHalfDayTask
      ) {
        const duplicatedTasksForDate = tasksForDate.filter(
          (t: any) => t.projectId === this.projectId
        );
        const duplicatedIdTask =
          duplicatedTasksForDate.length > 0
            ? duplicatedTasksForDate[0].taskId
            : 0;
        const duplicatedNbDay =
          duplicatedTasksForDate.length > 0
            ? duplicatedTasksForDate[0].nbJour
            : null;
        const duplicatedWorkplace =
          duplicatedTasksForDate.length > 0
            ? duplicatedTasksForDate[0].workPlace
            : '';
        const duplicatedTask =
          duplicatedTasksForDate.length > 0
            ? duplicatedTasksForDate[0].text
            : '';

        const duplicatedRow: PeriodicElement = {
          idt: duplicatedIdTask,
          Day: day,
          Date: formattedDate,
          nbDay: duplicatedNbDay,
          workplace: duplicatedWorkplace,
          task: duplicatedTask,
          project: true,
          duplicated: true,
          isDisabled: false,
        };
        newElementData.push(duplicatedRow);
      }
    }

    this.ELEMENT_DATA = newElementData;
    this.dataSource.data = this.ELEMENT_DATA;

    this.groupIntoWeeks(); // Group days into weeks after updating element data
  }


  // Group days into calendar weeks starting from Sunday
  private groupIntoWeeks(): void {
    this.calendarWeeks = []; // Reset calendar weeks array
    const year = parseInt(this.selectedYear);
    const month = parseInt(this.selectedMonth) - 1;

    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);

    // Get the day of the week (0 is Sunday, 1 is Monday, etc.)
    const dayOfWeek = firstDayOfMonth.getDay();
    // No conversion needed - use Sunday-based indexing directly

    // Create empty slots for days before the first day of the month
    const emptyDaysBefore: PeriodicElement[] = [];

    // Calculate days from previous month
    const lastDayOfPrevMonth = new Date(year, month, 0);
    const daysInPrevMonth = lastDayOfPrevMonth.getDate();

    for (let i = 0; i < dayOfWeek; i++) {
      const dayNum = daysInPrevMonth - dayOfWeek + i + 1;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const formattedDate = `${('0' + dayNum).slice(-2)}/${(
        '0' + (prevMonth + 1)
      ).slice(-2)}/${prevYear}`;

      emptyDaysBefore.push({
        idt: 0,
        Day: dayNum,
        Date: formattedDate,
        nbDay: null,
        workplace: '',
        task: '',
        project: false,
        isDisabled: true
      });
    }

    // Add days from current month
    const calendarData = [...emptyDaysBefore, ...this.ELEMENT_DATA];

    // Calculate how many days we need to add at the end to complete the grid
    const totalCells = Math.ceil(calendarData.length / 7) * 7;
    const daysToAdd = totalCells - calendarData.length;

    // Add empty slots for days after the last day of the month
    if (daysToAdd > 0) {
      for (let i = 1; i <= daysToAdd; i++) {
        const nextMonthDay = new Date(year, month + 1, i);
        const formattedDate = `${('0' + nextMonthDay.getDate()).slice(-2)}/${(
          '0' + (nextMonthDay.getMonth() + 1)
        ).slice(-2)}/${nextMonthDay.getFullYear()}`;

        calendarData.push({
          idt: 0,
          Day: nextMonthDay.getDate(),
          Date: formattedDate,
          nbDay: null,
          workplace: '',
          task: '',
          project: false,
          isDisabled: true
        });
      }
    }

    // Group into weeks of 7 days
    for (let i = 0; i < calendarData.length; i += 7) {
      this.calendarWeeks.push(calendarData.slice(i, i + 7));
    }
  }

  getFrenchMonthName(value: string): string {
    const month = this.months.find((month) => month.value === value);
    return month ? month.frname : '';
  }
  getEngishMonthName(value: string): string {
    const month = this.months.find((month) => month.value === value);
    return month ? month.name : '';
  }

  openProfileModal(datte: any, duplicated: boolean) {
    if (this.isWeekend(datte) || this.isHoliday(datte)) {
      return; // Don't open modal on weekends or holidays
    }

    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      data: {
        profileId: this.profileId,
        projectId: this.projectId,
        datte: datte,
        duplicated: duplicated,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks(this.profileId);
      }
    });
  }

  openUpdateModal(rowData: PeriodicElement) {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      data: {
        profileId: this.profileId,
        projectId: this.projectId,
        datte: rowData.Date,
        duplicated: rowData.duplicated,
        rowData: rowData,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks(this.profileId); // Reload tasks after the modal closes
      }
    });
  }

  exportToExcel(): void {
    const month = this.getFrenchMonthName(this.selectedMonth);
    const expertFullName = `${this.programprofile.profile.firstname} ${this.programprofile.profile.lastname}`;

    // Filter data to include only current month days that are not disabled and belong to current project
    const filteredData = this.ELEMENT_DATA.filter(item => {
      // Only include items that:
      // 1. Belong to current project (project === true)
      // 2. Are not disabled (unless they have actual data)
      // 3. Are from current month/year
      const itemDate = new Date(
        parseInt(item.Date.split('/')[2]),
        parseInt(item.Date.split('/')[1]) - 1,
        parseInt(item.Date.split('/')[0])
      );
      const currentMonth = parseInt(this.selectedMonth) - 1;
      const currentYear = parseInt(this.selectedYear);

      return item.project === true &&
             itemDate.getMonth() === currentMonth &&
             itemDate.getFullYear() === currentYear &&
             (!item.isDisabled || item.nbDay !== null);
    }).map(item => ({
      Day: item.Day.toString(),
      Date: item.Date,
      nbDay: item.nbDay || 0,
      workplace: item.workplace || '',
      task: item.task || ''
    }));

    const timesheetInfo = new TimesheetInformations();
    timesheetInfo.Month = month;
    timesheetInfo.Year = this.selectedYear;
    timesheetInfo.ProjectName = this.project.name;
    timesheetInfo.ContractNumber = this.project.program.numcontrat;
    timesheetInfo.ExpertName = expertFullName;
    timesheetInfo.function = this.programprofile.functionn;

    // Create well-formatted filename
    const fileName = `Timesheet_${this.programprofile.profile.firstname}_${this.programprofile.profile.lastname}_${month}_${this.selectedYear}_${this.project.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

    this.excelExportService.exportToTemplate(filteredData, timesheetInfo, fileName);
  }


  exportToPdf(): void {
    const month = this.getFrenchMonthName(this.selectedMonth);
    const timesheetInfo = new TimesheetInformations();
    timesheetInfo.Month = month;
    timesheetInfo.Year = this.selectedYear;
    timesheetInfo.ProjectName = this.project.name;
    timesheetInfo.ContractNumber = this.project.program.numcontrat;
    timesheetInfo.ExpertName =
      this.programprofile.profile.firstname +
      ' ' +
      this.programprofile.profile.lastname;
    timesheetInfo.function = this.programprofile.functionn;
    console.log('Exporting to PDF with timesheetInfo:', timesheetInfo);

    this.exportService.exportToPdf(this.ELEMENT_DATA, timesheetInfo);
  }

  exportFactureToPdf(): void {
    const month = this.getFrenchMonthName(this.selectedMonth);
    const monthYearString = `${this.selectedMonth}/${this.selectedYear}`;

    // Get actual tasks data for calculation
    this.eventservice.getTasksAndProjectIdByMonthAndProfile(monthYearString, this.profileId).subscribe({
      next: (tasks: any[]) => {
        // Calculate total days from actual tasks (sum of nbJour)
        const totalDays = tasks.reduce((sum: number, task: any) => sum + (task.nbJour || 0), 0);

        // Use daily rate from program profile
        const dailyRate = this.programprofile.dailyrate || 0;
        const totalAmount = dailyRate * totalDays;

        const factureInfo: FactureInformation = {
          Month: month,
          Year: this.selectedYear,
          ProjectName: this.project.name,
          ContractNumber: this.project.program.numcontrat,
          ExpertName: this.programprofile.profile.firstname + ' ' + this.programprofile.profile.lastname,
          function: this.programprofile.functionn,
          totalDays: totalDays,
          dailyRate: dailyRate,
          totalAmount: totalAmount
        };

        console.log('Exporting facture to PDF with factureInfo:', factureInfo);
        console.log('Calculated from actual tasks - Total days:', totalDays, 'Daily rate:', dailyRate);
        this.factureExportService.exportFactureToPdf(factureInfo);
      },
      error: (error) => {
        console.error('Error loading tasks for facture generation:', error);
        this.alertService.error('Erreur', 'Impossible de charger les tâches pour générer la facture');
      }
    });
  }

  isCurrentDay(dateString: string): boolean {
    if (!dateString) return false;

    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    const today = new Date();

    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }



}
