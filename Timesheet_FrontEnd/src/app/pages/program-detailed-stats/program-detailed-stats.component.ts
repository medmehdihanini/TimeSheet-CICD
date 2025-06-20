// filepath: c:\EY PFE\project\Ahmed v1\Timesheet_FrontEnd\src\app\pages\program-detailed-stats\program-detailed-stats.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ProgramStatsDTO, ProjectStatsDTO } from '../../models/program-stats.model';
import { ProgramService } from '../../services/programs/program.service';
import { Status } from '../../models/Status';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-program-detailed-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    RouterModule,
    MatTableModule,
    MatProgressBarModule,
    MatTabsModule
  ],
  templateUrl: './program-detailed-stats.component.html',
  styleUrls: ['./program-detailed-stats.component.css']
})
export class ProgramDetailedStatsComponent implements OnInit {
  @ViewChild('budgetChart') budgetChartRef: ElementRef;
  @ViewChild('projectStatusChart') projectStatusChartRef: ElementRef;
  @ViewChild('profilesChart') profilesChartRef: ElementRef;
  @ViewChild('taskWorkplaceChart') taskWorkplaceChartRef: ElementRef;
  @ViewChild('projectComparisonChart') projectComparisonChartRef: ElementRef;

  programId: number;
  stats: ProgramStatsDTO;
  loading = true;
  error = false;

  // Pagination for projects
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  paginatedProjects: ProjectStatsDTO[] = [];

  // Pagination for profiles by function
  profilesFunctionCurrentPage = 1;
  profilesFunctionPageSize = 5;
  profilesFunctionTotalPages = 0;
  paginatedProfilesByFunction: {key: string, value: number}[] = [];

  // Charts
  budgetChart: Chart;
  projectStatusChart: Chart;
  profilesChart: Chart;
  taskWorkplaceChart: Chart;
  projectComparisonChart: Chart;

  // Expose Math to template
  Math = Math;

  // Colors for charts
  chartColors = {
    yellow: '#ffe600', // Changed from #ffe600 to #FFC107 (amber) for better readability
    dark: '#333333',
    green: '#4CAF50',
    blue: '#2196F3',
    orange: '#FF9800',
    red: '#F44336',
    purple: '#9C27B0',
    teal: '#009688',
    lightGrey: '#f5f5f5',
    grey: '#999999'
  };

  // Project status colors
  statusColors: Record<Status | string, string> = {
    [Status.UNLAUNCHED]: '#999999', // Grey
    'LAUNCHED': '#2196F3', // Blue
    [Status.IN_PROGRESS]: '#FF9800', // Orange
    [Status.FINISHED]: '#4CAF50', // Green
    [Status.ON_HOLD]: '#9C27B0', // Purple
    [Status.CANCELED]: '#F44336' // Red
  };

  // Helper method for templates to get object keys length
  getObjectKeysLength(obj: any): number {
    return Object.keys(obj).length;
  }

  // Table columns to display for projects
  projectColumns: string[] = ['name', 'status', 'profiles', 'tasks', 'budget', 'consumed', 'progress'];

  constructor(
    private route: ActivatedRoute,
    private programService: ProgramService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.programId = +params['id'];
      this.loadStats();
    });
  }

  loadStats(): void {
    this.loading = true;
    this.error = false;

    this.programService.getProgrammeStatistique(this.programId).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;

        // Initialize pagination
        this.initPagination();

        setTimeout(() => {
          this.initCharts();
        }, 200);
      },
      error: (err) => {
        console.error('Error loading program statistics:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  // Initialize pagination for projects
  initPagination(): void {
    if (this.stats && this.stats.projects) {
      this.totalPages = Math.ceil(this.stats.projects.length / this.pageSize);
      this.goToPage(1);
    }

    // Also initialize profiles by function pagination
    this.initProfilesFunctionPagination();
  }

  // Initialize pagination for profiles by function
  initProfilesFunctionPagination(): void {
    if (this.stats && this.stats.profilesByFunction) {
      // Convert Map to array for easier pagination
      const profileFunctionEntries = Object.entries(this.stats.profilesByFunction)
        .map(([key, value]) => ({ key, value }));

      this.profilesFunctionTotalPages = Math.ceil(profileFunctionEntries.length / this.profilesFunctionPageSize);
      this.goToProfileFunctionPage(1);
    }
  }

  // Go to specific page for profiles by function
  goToProfileFunctionPage(page: number): void {
    if (page < 1 || page > this.profilesFunctionTotalPages) {
      return;
    }

    this.profilesFunctionCurrentPage = page;

    // Convert Map to array for pagination
    const profileFunctionEntries = Object.entries(this.stats.profilesByFunction)
      .map(([key, value]) => ({ key, value }));

    const startIndex = (page - 1) * this.profilesFunctionPageSize;
    const endIndex = Math.min(startIndex + this.profilesFunctionPageSize, profileFunctionEntries.length);

    this.paginatedProfilesByFunction = profileFunctionEntries.slice(startIndex, endIndex);
  }

  // Get array of page numbers for profiles by function pagination
  getProfileFunctionPageNumbers(): number[] {
    const pages: number[] = [];

    // Show max 5 page numbers
    let startPage = Math.max(1, this.profilesFunctionCurrentPage - 2);
    let endPage = Math.min(this.profilesFunctionTotalPages, startPage + 4);

    // Adjust start if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Previous page for profiles by function
  previousProfileFunctionPage(): void {
    if (this.profilesFunctionCurrentPage > 1) {
      this.goToProfileFunctionPage(this.profilesFunctionCurrentPage - 1);
    }
  }

  // Next page for profiles by function
  nextProfileFunctionPage(): void {
    if (this.profilesFunctionCurrentPage < this.profilesFunctionTotalPages) {
      this.goToProfileFunctionPage(this.profilesFunctionCurrentPage + 1);
    }
  }

  // Go to specific page for projects
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.stats.projects.length);

    this.paginatedProjects = this.stats.projects.slice(startIndex, endIndex);
  }

  // Get array of page numbers for pagination controls
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

  // Previous page
  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  // Next page
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  initCharts(): void {
    this.destroyCharts();

    if (this.stats) {
      // Initialize each chart
      this.createBudgetChart();
      this.createProjectStatusChart();
      this.createProfilesChart();
      this.createTaskWorkplaceChart();
      this.createProjectComparisonChart();
    }
  }

  destroyCharts(): void {
    // Destroy existing charts to prevent duplicates
    if (this.budgetChart) {
      this.budgetChart.destroy();
    }
    if (this.projectStatusChart) {
      this.projectStatusChart.destroy();
    }
    if (this.profilesChart) {
      this.profilesChart.destroy();
    }
    if (this.taskWorkplaceChart) {
      this.taskWorkplaceChart.destroy();
    }
    if (this.projectComparisonChart) {
      this.projectComparisonChart.destroy();
    }
  }

  createBudgetChart(): void {
    if (!this.budgetChartRef) return;

    const ctx = this.budgetChartRef.nativeElement.getContext('2d');

    this.budgetChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Budget Consommé', 'Budget Restant'],
        datasets: [{
          data: [
            this.stats.consumedBudgetAmount,
            this.stats.remainingBudgetAmount
          ],
          backgroundColor: [this.chartColors.yellow, this.chartColors.dark],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 2,
          borderRadius: 5,
          spacing: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          title: {
            display: true,
            text: 'Budget Financier',
            color: this.chartColors.dark,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: this.chartColors.dark,
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: this.chartColors.dark,
            bodyColor: this.chartColors.dark,
            borderColor: this.chartColors.grey,
            borderWidth: 1,
            padding: 10,
            boxPadding: 5,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return context.label + ': ' + value.toLocaleString('fr-FR') + ' TND';
              }
            }
          }
        }
      }
    });
  }

  createProjectStatusChart(): void {
    if (!this.projectStatusChartRef || !this.stats.projectsByStatus) return;

    const ctx = this.projectStatusChartRef.nativeElement.getContext('2d');

    // Convert the map to an array of status-count pairs
    const statusCounts = Object.entries(this.stats.projectsByStatus);
    const labels = statusCounts.map(([status]) => status);
    const data = statusCounts.map(([, count]) => count);
    const backgroundColor = labels.map(status => {
      return this.statusColors[status as Status] || this.chartColors.grey;
    });

    this.projectStatusChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
    });
  }

  createProfilesChart(): void {
    if (!this.profilesChartRef || !this.stats.profilesByFunction) return;

    const ctx = this.profilesChartRef.nativeElement.getContext('2d');

    // Convert the map to arrays
    const functionEntries = Object.entries(this.stats.profilesByFunction);
    const functions = functionEntries.map(([func]) => func);
    const counts = functionEntries.map(([, count]) => count);

    // Generate colors
    const backgroundColors = this.generateColors(functions.length);

    this.profilesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: functions,
        datasets: [{
          label: 'Profils par Fonction',
          data: counts,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => this.adjustColorOpacity(color, 1)),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  createTaskWorkplaceChart(): void {
    if (!this.taskWorkplaceChartRef || !this.stats.tasksByWorkplace) return;

    const ctx = this.taskWorkplaceChartRef.nativeElement.getContext('2d');

    // Convert the map to arrays
    const workplaceEntries = Object.entries(this.stats.tasksByWorkplace);
    const workplaces = workplaceEntries.map(([place]) => place);
    const counts = workplaceEntries.map(([, count]) => count);

    // Generate colors
    const backgroundColors = [
      this.chartColors.blue,
      this.chartColors.yellow,
      this.chartColors.green,
      this.chartColors.orange,
      this.chartColors.purple
    ];

    this.taskWorkplaceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: workplaces,
        datasets: [{
          data: counts,
          backgroundColor: backgroundColors.slice(0, workplaces.length),
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
    });
  }

  createProjectComparisonChart(): void {
    if (!this.projectComparisonChartRef || !this.stats.projects) return;

    const ctx = this.projectComparisonChartRef.nativeElement.getContext('2d');

    // Sort projects by budget for better visualization and limit to top 10
    const sortedProjects = [...this.stats.projects]
      .sort((a, b) => b.projectMandayBudget - a.projectMandayBudget)
      .slice(0, 10);

    const projectNames = sortedProjects.map(p => p.projectName);
    const budgetData = sortedProjects.map(p => p.projectMandayBudget);
    const consumedData = sortedProjects.map(p => p.projectConsumedMandayBudget);

    this.projectComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: projectNames,
        datasets: [
          {
            label: 'Budget Total (J/H)',
            data: budgetData,
            backgroundColor: this.chartColors.dark,
            borderColor: this.chartColors.dark,
            borderWidth: 1
          },
          {
            label: 'Consommé (J/H)',
            data: consumedData,
            backgroundColor: this.chartColors.yellow,
            borderColor: this.chartColors.yellow,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Jours/Homme'
            }
          }
        }
      }
    });
  }

  calculateCompletionPercentage(project: ProjectStatsDTO): number {
    if (project.projectMandayBudget === 0) return 0;
    return (project.projectConsumedMandayBudget / project.projectMandayBudget) * 100;
  }

  getProgressBarColor(percentage: number): string {
    if (percentage >= 95) return this.chartColors.red;
    if (percentage >= 80) return this.chartColors.orange;
    return this.chartColors.green;
  }

  goToProjectDetails(projectId: number): void {
    this.router.navigate(['/projects/detailed-stats', projectId]);
  }

  goBack(): void {
    this.router.navigate(['/programs']);
  }

  // Helper function to generate array of colors
  generateColors(count: number): string[] {
    const baseColors = [
      this.chartColors.yellow,
      this.chartColors.blue,
      this.chartColors.green,
      this.chartColors.orange,
      this.chartColors.purple,
      this.chartColors.teal
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      const colorIndex = i % baseColors.length;
      const opacity = 0.7 + (i % 3) * 0.1; // Vary opacity for visual distinction
      colors.push(this.adjustColorOpacity(baseColors[colorIndex], opacity));
    }

    return colors;
  }

  // Helper to adjust color opacity
  adjustColorOpacity(color: string, opacity: number): string {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }

  // Get a color for profile function
  getProfileFunctionColor(functionName: string): string {
    // Map of common function names to colors with index signature
    const functionColors: {[key: string]: string} = {
      'consultant': this.chartColors.blue,
      'manager': this.chartColors.green,
      'partner': this.chartColors.purple,
      'developer': this.chartColors.orange,
      'analyst': this.chartColors.teal,
    };

    const lowerCaseFunctionName = functionName.toLowerCase();

    // Use function name to generate deterministic color if not in the map
    if (!functionColors[lowerCaseFunctionName]) {
      // Create a simple hash of the function name to get a consistent color
      let hash = 0;
      for (let i = 0; i < functionName.length; i++) {
        hash = functionName.charCodeAt(i) + ((hash << 5) - hash);
      }

      // Use the hash to pick from our predefined colors
      const baseColors = [
        this.chartColors.blue,
        this.chartColors.green,
        this.chartColors.orange,
        this.chartColors.purple,
        this.chartColors.teal
      ];
      const colorIndex = Math.abs(hash) % baseColors.length;

      return baseColors[colorIndex];
    }

    return functionColors[lowerCaseFunctionName];
  }

}
