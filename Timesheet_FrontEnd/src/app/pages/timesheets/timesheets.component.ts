import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from 'src/app/services/project/project.service';
import { TimesheetService } from 'src/app/services/timesheet/timesheet.service'; // Import the TimesheetService
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-timesheets',
  templateUrl: './timesheets.component.html',
  styleUrls: ['./timesheets.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
})
export class TimesheetsComponent implements OnInit {
  projectId: any | null = '';
  status: string | null = '';
  project: any;
  projectprofiles: any[] = [];
  timesheetsByProfileId: Map<number, any[]> = new Map();
  profileTimesheetsArray: { profileId: number; timesheets: any[]; profile?: any; }[] = [];
  filteredProfileTimesheetsArray: { profileId: number; timesheets: any[]; profile?: any; }[] = [];
  selectedProfileId: string | number | null = null;
  selectedStatus: string | null = null; // Changed from array to single value
  selectedMonth: string | null = null; // Changed from array to single value
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectserv: ProjectService,
    private timesheetService: TimesheetService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.projectId = params['idproj'];
      // Handle status parameter from URL (e.g., /timesheets/6;status=APPROVED)
      if (params['status']) {
        // If status is 'all', set to empty string to show "Tous les statuts"
        if (params['status'] === 'all') {
          this.selectedStatus = '';
        } else {
          this.selectedStatus = params['status'];
        }
      } else {
        // Only set to empty string if no status parameter is provided
        this.selectedStatus = '';
      }
      if (this.projectId) {
        this.loadData();
      }
    });
  }

  onStatusChange(): void {
    this.applyFilters();
  }  private loadData() {
    forkJoin({
      projectDetails: this.projectserv.getProjectDetails(this.projectId),
      projectProfiles: this.projectserv.getProjectprofiles(this.projectId),
      timesheets: this.timesheetService.getTimesheetsByProjectId(this.projectId, 'all')
    }).subscribe(({ projectDetails, projectProfiles, timesheets }) => {
      this.project = projectDetails;
      this.projectprofiles = projectProfiles;

      this.timesheetsByProfileId = new Map<number, any[]>(
        Object.entries(timesheets).map(([profileId, timesheets]) => [
          Number(profileId),
          timesheets as any[],
        ])
      );

      // After fetching both profiles and timesheets, update the profileTimesheetsArray
      this.updateProfileTimesheetsArray();
      this.applyFilters();
    }, (error) => {
      console.error('Error loading data:', error);
      alert(error.error);
    });
  }
      private updateProfileTimesheetsArray() {
        this.profileTimesheetsArray = this.projectprofiles.map((profile) => {
          const timesheets = this.timesheetsByProfileId.get(profile.id) || [];

          // Sort timesheets by year and month
          timesheets.sort((a, b) => {
            const yearComparison = a.year - b.year;
            if (yearComparison !== 0) {
              return yearComparison;
            }
            return a.mois - b.mois;
          });

          return {
            profileId: profile.id,
            timesheets,
            profile,
          };
        });

        this.applyFilters();
      }

      applyFilters() {
        this.filteredProfileTimesheetsArray = this.profileTimesheetsArray
          .filter((profileData) => {
            // If selectedProfileId is empty string, show all profiles
            if (!this.selectedProfileId || this.selectedProfileId === '') {
              return true;
            } else {
              // Convert both to numbers for comparison
              const selectedId = Number(this.selectedProfileId);
              return !isNaN(selectedId) && profileData.profileId === selectedId;
            }
          })
          .map((profileData) => {
            const filteredTimesheets = profileData.timesheets.filter((timesheet) => {
              // If selectedMonth is empty string, show all months
              const monthMatch = !this.selectedMonth || this.selectedMonth === '' ||
                                String(timesheet.mois).padStart(2, '0') === this.selectedMonth;

              // If selectedStatus is empty string, show all statuses
              const statusMatch = !this.selectedStatus || this.selectedStatus === '' ||
                                 timesheet.status === this.selectedStatus;

              return monthMatch && statusMatch;
            });

            return {
              ...profileData,
              timesheets: filteredTimesheets,
            };
          });
      }


  ngOnChanges(): void {
    this.applyFilters();
  }

  onMonthChange(): void {
    this.applyFilters();
  }

  gotoProject() {
    this.router.navigate([`projectdetails/${this.projectId}`]);
  }

  getEngishMonthName(value: string): string {
    const month = this.months.find((month) => month.value === value);
    return month ? month.name : '';
  }

  goToProfileTimesheet(idprofile: number, selectedMonth: string) {
    this.router.navigate(['/timesheet', idprofile, this.projectId], {
      queryParams: { month: selectedMonth },
    });
  }
}
