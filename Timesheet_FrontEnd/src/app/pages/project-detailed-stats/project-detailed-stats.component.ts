import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { MaterialModule } from '../../MaterialModule';
import { ProjectService } from '../../services/project/project.service';
import { ProjectStats, ProfileStatDTO } from '../../models/project-stats.model';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { forkJoin } from 'rxjs';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-project-detailed-stats',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  templateUrl: './project-detailed-stats.component.html',
  styleUrls: ['./project-detailed-stats.component.css']
})
export class ProjectDetailedStatsComponent implements OnInit, AfterViewInit {
  @ViewChild('budgetChart') budgetChartCanvas: ElementRef;
  @ViewChild('taskDistributionChart') taskDistributionCanvas: ElementRef;
  @ViewChild('profileCompletionChart') profileCompletionCanvas: ElementRef;
  @ViewChild('workplaceDistributionChart') workplaceDistributionCanvas: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  // Chart objects
  budgetChart: Chart;
  taskDistributionChart: Chart;
  profileCompletionChart: Chart;
  workplaceDistributionChart: Chart;

  // Project data
  projectId: number = 0;
  projectStats?: ProjectStats;
  loading: boolean = true;
  error: string | null = null;

  // Budget calculations (in monetary value)
  associatedBudget: number = 0;
  consumedBudget: number = 0;
  projectProfilesWithRates: any[] = [];

  // Profiles table data source with pagination
  profilesDataSource = new MatTableDataSource<ProfileStatDTO>();

  // Custom pagination for the main table
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  paginatedProfiles: ProfileStatDTO[] = [];

  // Custom pagination for Task Distribution by Profile section
  taskDistCurrentPage = 1;
  taskDistPageSize = 5;
  taskDistTotalPages = 0;
  paginatedTaskDistProfiles: ProfileStatDTO[] = [];

  // Custom pagination for Budget Usage by Profile section
  budgetUsageCurrentPage = 1;
  budgetUsagePageSize = 5;
  budgetUsageTotalPages = 0;
  paginatedBudgetUsageProfiles: ProfileStatDTO[] = [];

  // Expose Math to template
  Math = Math;

  // EY chart colors
  eyColors: string[] = [
    '#FFE600', // EY Yellow
    '#2E2E38', // EY Dark Gray
    '#6D6E71', // EY Gray
    '#5B18FF', // Purple
    '#00A3E0', // Blue
    '#91D8F7', // Light Blue
    '#8BC691', // Green
    '#7F84FF', // Indigo
    '#E3008C'  // Pink
  ];

  // Profiles table columns
  displayedColumns: string[] = [
    'profileName',
    'mandayBudget',
    'consumedMandayBudget',
    'remainingMandayBudget',
    'taskCount',
    'timesheetCount',
    'progress'
  ];

  // Status translations
  statusTranslations: { [key: string]: string } = {
    'IN_PROGRESS': 'En cours',
    'ON_HOLD': 'En attente',
    'FINISHED': 'Terminé',
    'UNLAUNCHED': 'Non lancé',
    'CANCELED': 'Annulé'
  };

  constructor(
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = +params['id']; // Convert to number
      this.loadProjectStats();
    });
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
    // The paginator will be connected to the data source when the data is loaded
    // If we already have data when view is initialized, connect the paginator
    if (this.projectStats && this.projectStats.profileStats) {
      this.initPagination();
      this.initTaskDistPagination();
      this.initBudgetUsagePagination();
    }
  }

  loadProjectStats(): void {
    this.loading = true;
    this.error = null;

    // Get both project stats and project profiles with daily rates
    forkJoin({
      stats: this.projectService.getProjetStat(this.projectId),
      profiles: this.projectService.getProjectProfiles(this.projectId)
    }).subscribe({
      next: (results) => {
        this.projectStats = results.stats;

        // Process profiles to extract daily rates
        this.projectProfilesWithRates = results.profiles.map((item: any) => ({
          idprofile: item[0].idp,
          image: item[0].image,
          firstname: item[0].firstname,
          lastname: item[0].lastname,
          function: item[4],
          dailyrate: item[5],
          mandaybudget: item[1],
          progress: item[2],
          id: item[3],
        }));

        // Calculate associated and consumed budgets
        this.associatedBudget = this.projectProfilesWithRates.reduce(
          (sum, profile) => sum + (Number(profile.mandaybudget) * profile.dailyrate),
          0
        );
        this.consumedBudget = this.projectProfilesWithRates.reduce(
          (sum, profile) => sum + (Number(profile.progress) * profile.dailyrate),
          0
        );        // Set up the profiles data source for the table with pagination
        if (this.projectStats && this.projectStats.profileStats) {
          // Initialize our custom pagination
          this.initPagination();
          this.initTaskDistPagination();
          this.initBudgetUsagePagination();
        }

        this.loading = false;

        // Initialize charts after data is loaded
        setTimeout(() => {
          this.initCharts();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading project data:', error);
        this.error = 'Échec du chargement des statistiques du projet. Veuillez réessayer plus tard.';
        this.loading = false;
      }
    });
  }

  initCharts(): void {
    if (!this.projectStats) return;

    this.createBudgetChart();
    this.createTaskDistributionChart();
    this.createProfileCompletionChart();
    this.createWorkplaceDistributionChart();
  }

  createBudgetChart(): void {
    if (this.budgetChartCanvas && this.projectStats) {
      const consumed = this.projectStats.totalConsumedMandayBudget;
      const remaining = this.projectStats.remainingMandayBudget;

      this.budgetChart = new Chart(this.budgetChartCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Budget Consommé', 'Budget Restant'],
          datasets: [{
            data: [consumed, remaining],
            backgroundColor: [this.eyColors[0], this.eyColors[1]],
            borderColor: 'white',
            borderWidth: 2
          }]
        },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: 'Arial',
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const percentage = Math.round((value / this.projectStats!.totalMandayBudget) * 100);
                return `${context.label}: ${value} jours/homme (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  }


  createTaskDistributionChart(): void {
    if (this.taskDistributionCanvas && this.projectStats) {
      // Create data for profiles
      const labels = this.projectStats.profileStats.map(profile => profile.profileName);
      const taskData = this.projectStats.profileStats.map(profile => profile.taskCount);

      this.taskDistributionChart = new Chart(this.taskDistributionCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Nombre de Tâches',
            data: taskData,
            backgroundColor: this.eyColors[3],
            borderColor: this.eyColors[1],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `Tasks: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Tasks'
              }
            }
          }
        }
        });
    }
  }

  createProfileCompletionChart(): void {
    if (this.profileCompletionCanvas && this.projectStats) {
      // Create data for profiles completion percentage
      const labels = this.projectStats.profileStats.map(profile => profile.profileName);
      const consumedData = this.projectStats.profileStats.map(profile => profile.consumedMandayBudget);
      const remainingData = this.projectStats.profileStats.map(profile => profile.remainingMandayBudget);

      this.profileCompletionChart = new Chart(this.profileCompletionCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Consumed Budget',
              data: consumedData,
              backgroundColor: this.eyColors[0],
              borderColor: this.eyColors[1],
              borderWidth: 1
            },
            {
              label: 'Remaining Budget',
              data: remainingData,
              backgroundColor: this.eyColors[2],
              borderColor: this.eyColors[1],
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          },
          scales: {
            x: {
              stacked: true
            },
            y: {
              stacked: true,
              beginAtZero: true,
              title: {
                display: true,
                text: 'Man-days'
              }
            }
          }
        }
      });
    }
  }

  createWorkplaceDistributionChart(): void {
    if (this.workplaceDistributionCanvas && this.projectStats) {
      // Create data for workplace distribution
      const labels = Object.keys(this.projectStats.tasksByWorkplace);
      const data = Object.values(this.projectStats.tasksByWorkplace);

      this.workplaceDistributionChart = new Chart(this.workplaceDistributionCanvas.nativeElement, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: [this.eyColors[5], this.eyColors[6]],
            borderColor: 'white',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number;
                  const percentage = Math.round((value / this.projectStats!.totalTasks) * 100);
                  return `${context.label}: ${value} tasks (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  /**
   * Translates project status to French
   */
  getStatusInFrench(status: string): string {
    return this.statusTranslations[status] || status;
  }

  /**
   * Calculate task percentage for visualization
   */
  getTaskPercentage(taskCount: number): number {
    if (!this.projectStats || !this.projectStats.profileStats) return 0;

    // Get the maximum task count across all profiles to scale the bars
    const maxTasks = Math.max(...this.projectStats.profileStats.map(p => p.taskCount));
    if (maxTasks === 0) return 0;

    return (taskCount / maxTasks) * 100;
  }

  /**
   * Calculate budget consumption percentage
   */
  getBudgetPercentage(profile: ProfileStatDTO): number {
    if (!profile || profile.mandayBudget === 0) return 0;
    return (profile.consumedMandayBudget / profile.mandayBudget) * 100;
  }

  /**
   * Get error message in French
   */
  getErrorMessage(err: any): string {
    return 'Échec du chargement des statistiques du projet. Veuillez réessayer plus tard.';
  }

  /**
   * Initialize custom pagination
   */
  initPagination(): void {
    if (this.projectStats && this.projectStats.profileStats) {
      this.totalPages = Math.ceil(this.projectStats.profileStats.length / this.pageSize);
      this.goToPage(1);
    }
  }

  /**
   * Initialize pagination for Task Distribution section
   */
  initTaskDistPagination(): void {
    if (this.projectStats && this.projectStats.profileStats) {
      this.taskDistTotalPages = Math.ceil(this.projectStats.profileStats.length / this.taskDistPageSize);
      this.goToTaskDistPage(1);
    }
  }

  /**
   * Initialize pagination for Budget Usage section
   */
  initBudgetUsagePagination(): void {
    if (this.projectStats && this.projectStats.profileStats) {
      this.budgetUsageTotalPages = Math.ceil(this.projectStats.profileStats.length / this.budgetUsagePageSize);
      this.goToBudgetUsagePage(1);
    }
  }

  /**
   * Go to specific page for main table
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.projectStats?.profileStats?.length || 0);

    this.paginatedProfiles = this.projectStats?.profileStats?.slice(startIndex, endIndex) || [];
  }

  /**
   * Go to specific page for Task Distribution section
   */
  goToTaskDistPage(page: number): void {
    if (page < 1 || page > this.taskDistTotalPages) {
      return;
    }

    this.taskDistCurrentPage = page;
    const startIndex = (page - 1) * this.taskDistPageSize;
    const endIndex = Math.min(startIndex + this.taskDistPageSize, this.projectStats?.profileStats?.length || 0);

    this.paginatedTaskDistProfiles = this.projectStats?.profileStats?.slice(startIndex, endIndex) || [];
  }

  /**
   * Go to specific page for Budget Usage section
   */
  goToBudgetUsagePage(page: number): void {
    if (page < 1 || page > this.budgetUsageTotalPages) {
      return;
    }

    this.budgetUsageCurrentPage = page;
    const startIndex = (page - 1) * this.budgetUsagePageSize;
    const endIndex = Math.min(startIndex + this.budgetUsagePageSize, this.projectStats?.profileStats?.length || 0);

    this.paginatedBudgetUsageProfiles = this.projectStats?.profileStats?.slice(startIndex, endIndex) || [];
  }

  /**
   * Get array of page numbers for pagination controls
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];

    // Show max 5 page numbers
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + 4);

    // Adjust start if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Get array of page numbers for Task Distribution pagination
   */
  getTaskDistPageNumbers(): number[] {
    const pages: number[] = [];

    // Show max 5 page numbers
    let startPage = Math.max(1, this.taskDistCurrentPage - 2);
    let endPage = Math.min(this.taskDistTotalPages, startPage + 4);

    // Adjust start if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Get array of page numbers for Budget Usage pagination
   */
  getBudgetUsagePageNumbers(): number[] {
    const pages: number[] = [];

    // Show max 5 page numbers
    let startPage = Math.max(1, this.budgetUsageCurrentPage - 2);
    let endPage = Math.min(this.budgetUsageTotalPages, startPage + 4);

    // Adjust start if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Go to previous page (main table)
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Go to next page (main table)
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Go to previous page (Task Distribution)
   */
  previousTaskDistPage(): void {
    if (this.taskDistCurrentPage > 1) {
      this.goToTaskDistPage(this.taskDistCurrentPage - 1);
    }
  }

  /**
   * Go to next page (Task Distribution)
   */
  nextTaskDistPage(): void {
    if (this.taskDistCurrentPage < this.taskDistTotalPages) {
      this.goToTaskDistPage(this.taskDistCurrentPage + 1);
    }
  }

  /**
   * Go to previous page (Budget Usage)
   */
  previousBudgetUsagePage(): void {
    if (this.budgetUsageCurrentPage > 1) {
      this.goToBudgetUsagePage(this.budgetUsageCurrentPage - 1);
    }
  }

  /**
   * Go to next page (Budget Usage)
   */
  nextBudgetUsagePage(): void {
    if (this.budgetUsageCurrentPage < this.budgetUsageTotalPages) {
      this.goToBudgetUsagePage(this.budgetUsageCurrentPage + 1);
    }
  }

   goToProjectDetailedStats(projectId: number) {
    this.router.navigate(['/projects/detailed-stats', projectId]);
  }
}
