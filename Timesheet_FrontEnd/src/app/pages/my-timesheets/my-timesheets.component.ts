import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimesheetService } from '../../services/timesheet/timesheet.service';
import { UserserviceService } from '../../services/user/userservice.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-my-timesheets',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './my-timesheets.component.html',
  styleUrls: ['./my-timesheets.component.scss']
})
export class MyTimesheetsComponent implements OnInit {
  timesheets: any[] = [];
  loading = false;
  profileId: number | null = null;

  filterForm = new FormGroup({
    month: new FormControl(new Date().getMonth() + 1),
    year: new FormControl(new Date().getFullYear())
  });

  months = [
    { value: 1, name: 'Janvier' },
    { value: 2, name: 'Février' },
    { value: 3, name: 'Mars' },
    { value: 4, name: 'Avril' },
    { value: 5, name: 'Mai' },
    { value: 6, name: 'Juin' },
    { value: 7, name: 'Juillet' },
    { value: 8, name: 'Août' },
    { value: 9, name: 'Septembre' },
    { value: 10, name: 'Octobre' },
    { value: 11, name: 'Novembre' },
    { value: 12, name: 'Décembre' }
  ];

  years: number[] = [];

  constructor(
    private timesheetService: TimesheetService,
    private userService: UserserviceService,
    private router: Router,
    private alertService: AlertService
  ) {
    // Generate years array (current year ± 5 years)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 7; i++) {
      this.years.push(i);
    }
  }

  ngOnInit(): void {
    this.initializeUser();

    // Subscribe to form changes
    this.filterForm.valueChanges.subscribe(() => {
      if (this.profileId) {
        this.loadTimesheets();
      }
    });
  }

  private initializeUser(): void {
    const user = this.userService.getUserConnected();
    if (user && user.id) {
      this.userService.getMatchingProfileId(user.id).subscribe({
        next: (profileData: any) => {
          this.profileId = profileData.idp;
          this.loadTimesheets();
        },
        error: (error: any) => {
          console.error('Error getting profile ID:', error);
          this.alertService.error('Erreur lors du chargement du profil utilisateur');
        }
      });
    } else {
      this.alertService.error('User not found. Please log in again.');
      this.userService.logout();
    }
  }

  private loadTimesheets(): void {
    if (!this.profileId) return;

    this.loading = true;
    const month = this.filterForm.get('month')?.value?.toString().padStart(2, '0') || '01';
    const year = this.filterForm.get('year')?.value?.toString() || new Date().getFullYear().toString();

    this.timesheetService.getTimesheetByMonthAndYearforprofil(month, year, this.profileId).subscribe({
      next: (data: any) => {
        this.timesheets = data || [];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading timesheets:', error);
        this.alertService.error('Error loading timesheets');
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return '#999999';
      case 'SUBMITTED':
        return '#ffe600';
      case 'APPROVED':
        return '#333333';
      case 'REJECTED':
        return '#ff4444';
      default:
        return '#cccccc';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'edit';
      case 'SUBMITTED':
        return 'schedule';
      case 'APPROVED':
        return 'check_circle';
      case 'REJECTED':
        return 'cancel';
      default:
        return 'help';
    }
  }

  openTimesheet(timesheet: any): void {
    if (timesheet?.projectprofile?.profile?.idp && timesheet?.projectprofile?.project?.idproject) {
      this.router.navigate(['/timesheet', timesheet.projectprofile.profile.idp, timesheet.projectprofile.project.idproject]);
    }
  }

  formatMonth(monthNumber: string): string {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return monthNames[parseInt(monthNumber) - 1] || monthNumber;
  }
}
