import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../services/project/project.service';
import { ProfileStatsResponse, ProgramStatus, TimesheetStatus, ProjectStats } from '../../../models/profile-stats.models';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// EY Brand Colors
const EY_COLORS = {
  primary: '#333333',
  accent: '#ffe600',
  white: '#ffffff',
  lightGray: '#cccccc',
  gray: '#999999'
};

@Component({
  selector: 'app-profile-stat',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    CardModule,
    ProgressBarModule,
    TagModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressBarModule
  ],
  templateUrl: './profile-stat.component.html',
  styleUrls: ['./profile-stat.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerIn', [
      transition(':enter', [
        query('.summary-card, .program-card', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ])
      ])
    ])
  ]
})
export class ProfileStatComponent implements OnInit {
  profileStats: ProfileStatsResponse | null = null;
  profileDetails: any = null;
  loading = true;
  error = false;

  // Pagination properties
  projectsPerPage = 2;
  currentPage: { [key: number]: number } = {};

  // Program pagination properties
  programsPerPage = 2;
  currentProgramPage = 1;

  // Chart data
  workplaceChartData: any;
  workplaceChartOptions: any;

  programStatusChartData: any;
  programStatusChartOptions: any;

  timesheetStatusChartData: any;
  timesheetStatusChartOptions: any;

  Math = Math;

  constructor(
    private profileService: ProfileService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProfileData();
    this.setupCharts();
  }

  loadProfileData() {
    this.route.params.subscribe(params => {
      const profileId = +params['id'];
      this.loading = true;
      this.error = false;

      // Load profile details
      this.profileService.getOneProfile(profileId).subscribe({
        next: (details) => {
          this.profileDetails = details;
          // Then load profile stats
          this.profileService.getProfileStats(profileId).subscribe({
            next: (stats) => {
              this.profileStats = stats;
              this.updateCharts();
              this.loading = false;
            },
            error: (error) => {
              console.error('Error loading profile stats:', error);
              this.error = true;
              this.loading = false;
            }
          });
        },
        error: (error) => {
          console.error('Error loading profile details:', error);
          this.error = true;
          this.loading = false;
        }
      });
    });
  }

  setupCharts() {
    // Workplace Chart Options
    this.workplaceChartOptions = {
      plugins: {
        legend: {
          labels: {
            color: EY_COLORS.primary,
            font: {
              size: 14
            }
          }
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeInOutQuart'
      }
    };

    // Program Status Chart Options
    this.programStatusChartOptions = {
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: EY_COLORS.primary,
            font: {
              size: 12
            }
          },
          grid: {
            color: EY_COLORS.lightGray
          }
        },
        y: {
          ticks: {
            color: EY_COLORS.primary,
            font: {
              size: 12
            }
          },
          grid: {
            color: EY_COLORS.lightGray
          }
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeInOutQuart'
      }
    };

    // Timesheet Status Chart Options
    this.timesheetStatusChartOptions = {
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: EY_COLORS.primary,
            font: {
              size: 12
            }
          },
          grid: {
            color: EY_COLORS.lightGray
          }
        },
        y: {
          ticks: {
            color: EY_COLORS.primary,
            font: {
              size: 12
            }
          },
          grid: {
            color: EY_COLORS.lightGray
          }
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeInOutQuart'
      }
    };
  }

  updateCharts() {
    if (!this.profileStats) return;

    // Workplace Distribution Chart
    this.workplaceChartData = {
      labels: ['EY', 'Client'],
      datasets: [{
        data: [
          this.profileStats.workplaceCounts.EY,
          this.profileStats.workplaceCounts['Chez le client']
        ],
        backgroundColor: [EY_COLORS.accent, EY_COLORS.primary],
        borderColor: EY_COLORS.white,
        borderWidth: 2
      }]
    };

    // Program Status Chart
    const programStatusCounts = this.countStatuses(this.profileStats.programs, 'status');
    this.programStatusChartData = {
      labels: Object.keys(programStatusCounts).map(key => this.getStatusLabel(key as ProgramStatus)),
      datasets: [{
        data: Object.values(programStatusCounts),
        backgroundColor: EY_COLORS.accent,
        borderColor: EY_COLORS.white,
        borderWidth: 1,
        borderRadius: 4
      }]
    };

    // Timesheet Status Chart
    const timesheetStatusCounts = this.countTimesheetStatuses(this.profileStats.programs);
    this.timesheetStatusChartData = {
      labels: Object.keys(timesheetStatusCounts).map(key => this.getStatusLabel(key as TimesheetStatus)),
      datasets: [{
        data: Object.values(timesheetStatusCounts),
        backgroundColor: EY_COLORS.accent,
        borderColor: EY_COLORS.white,
        borderWidth: 1,
        borderRadius: 4
      }]
    };
  }

  countProgramStatuses() {
    const counts: { [key: string]: number } = {};
    this.profileStats?.programs.forEach(program => {
      counts[program.status] = (counts[program.status] || 0) + 1;
    });
    return counts;
  }

  countTimesheetStatuses(programs: any[]) {
    const counts: { [key: string]: number } = {};
    programs.forEach(program => {
      program.projects.forEach((project: ProjectStats) => {
        if (project.timesheetStatus) {
          counts[project.timesheetStatus] = (counts[project.timesheetStatus] || 0) + 1;
        }
      });
    });
    return counts;
  }

  getStatusColor(status: ProgramStatus | TimesheetStatus): string {
    switch (status) {
      case ProgramStatus.IN_PROGRESS:
      case TimesheetStatus.APPROVED:
        return EY_COLORS.accent;
      case ProgramStatus.ON_HOLD:
      case TimesheetStatus.PENDING:
        return EY_COLORS.gray;
      case ProgramStatus.FINISHED:
        return EY_COLORS.primary;
      case ProgramStatus.UNLAUNCHED:
      case TimesheetStatus.DRAFT:
        return EY_COLORS.lightGray;
      case ProgramStatus.CANCELED:
      case TimesheetStatus.REJECTED:
        return '#ef4444';
      default:
        return EY_COLORS.primary;
    }
  }

  getStatusLabel(status: ProgramStatus | TimesheetStatus): string {
    return status.replace('_', ' ');
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'play_circle';
      case 'ON_HOLD': return 'pause_circle';
      case 'FINISHED': return 'check_circle';
      case 'UNLAUNCHED': return 'schedule';
      case 'CANCELED': return 'cancel';
      case 'APPROVED': return 'check_circle';
      case 'REJECTED': return 'cancel';
      case 'PENDING': return 'hourglass_empty';
      case 'DRAFT': return 'edit';
      case 'SUBMITTED': return 'send';
      default: return 'info';
    }
  }

  calculateProgress(consumed: number, total: number): number {
    // Validate inputs
    if (typeof consumed !== 'number' || typeof total !== 'number') {
      console.warn('Invalid input types for calculateProgress:', { consumed, total });
      return 0;
    }

    // Handle edge cases
    if (total <= 0) {
      console.warn('Total mandays must be greater than 0');
      return 0;
    }

    if (consumed < 0) {
      console.warn('Consumed mandays cannot be negative');
      return 0;
    }

    // Calculate percentage
    const progress = (consumed / total) * 100;

    // Ensure the result is between 0 and 100
    return Math.min(Math.max(progress, 0), 100);
  }

  countStatuses(programs: any[], field: string) {
    const counts: { [key: string]: number } = {};
    programs.forEach(program => {
      counts[program[field]] = (counts[program[field]] || 0) + 1;
    });
    return counts;
  }

  getProgramStatuses(): ProgramStatus[] {
    return Object.values(ProgramStatus);
  }

  getTimesheetStatuses(): TimesheetStatus[] {
    return Object.values(TimesheetStatus);
  }

  getTotalProjects(): number {
    if (!this.profileStats?.programs) return 0;
    return this.profileStats.programs.reduce((total, program) =>
      total + (program.projects?.length || 0), 0);
  }

  getTotalTasks(): number {
    if (!this.profileStats?.programs) return 0;
    return this.profileStats.programs.reduce((total, program) =>
      total + program.projects.reduce((subTotal, project) =>
        subTotal + (project.taskCount || 0), 0), 0);
  }

  getTotalMandays(): number {
    if (!this.profileStats?.programs) return 0;
    return this.profileStats.programs.reduce((total, program) =>
      total + program.projects.reduce((subTotal, project) =>
        subTotal + (project.mandayBudget || 0), 0), 0);
  }

  getCompletedTasks(): number {
    if (!this.profileStats?.programs) return 0;
    return this.profileStats.programs.reduce((total, program) =>
      total + program.projects.reduce((subTotal, project) =>
        subTotal + (project.consumedMandayBudget || 0), 0), 0);
  }

  // Add these new methods for pagination
  getPaginatedProjects(programId: number, projects: any[]): any[] {
    const startIndex = ((this.currentPage[programId] || 1) - 1) * this.projectsPerPage;
    return projects.slice(startIndex, startIndex + this.projectsPerPage);
  }

  getTotalPages(projects: any[]): number {
    return Math.ceil(projects.length / this.projectsPerPage);
  }

  changePage(programId: number, page: number): void {
    this.currentPage[programId] = page;
  }

  getPageNumbers(programId: number, projects: any[]): number[] {
    const totalPages = this.getTotalPages(projects);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  navigateToProject(projectId: number): void {
    this.router.navigate(['/projectdetails', projectId]);
  }

  navigateToProgram(programId: number): void {
    this.router.navigate(['/programdetails', programId]);
  }

  // Program pagination methods
  getPaginatedPrograms(): any[] {
    if (!this.profileStats?.programs) return [];
    const startIndex = (this.currentProgramPage - 1) * this.programsPerPage;
    return this.profileStats.programs.slice(startIndex, startIndex + this.programsPerPage);
  }

  getTotalProgramPages(): number {
    if (!this.profileStats?.programs) return 0;
    return Math.ceil(this.profileStats.programs.length / this.programsPerPage);
  }

  changeProgramPage(page: number): void {
    this.currentProgramPage = page;
  }

  getProgramPageNumbers(): number[] {
    const totalPages = this.getTotalProgramPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  goToProfileTimesheet(profileId: number, projectId: number): void {
    this.router.navigate(['/timesheet', profileId, projectId]);
  }
}
