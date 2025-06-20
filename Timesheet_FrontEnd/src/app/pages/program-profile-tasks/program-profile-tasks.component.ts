import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren, QueryList, HostListener, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProgramService } from '../../services/programs/program.service';
import { ProgramProfileTasks } from '../../models/program-profile-tasks.model';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { ProgramProject, ProgramTask } from '../../models/program-profile-tasks.model';

@Component({
  selector: 'app-program-profile-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './program-profile-tasks.component.html',
  styleUrls: ['./program-profile-tasks.component.css']
})
export class ProgramProfileTasksComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('budgetChart') budgetChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workplaceChart') workplaceChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tabsWrapper') tabsWrapper!: ElementRef<HTMLDivElement>;
  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
  @ViewChildren(MatSort) sorts!: QueryList<MatSort>;

  programId!: number;
  profileId!: number;
  taskData: ProgramProfileTasks | null = null;
  displayedColumns: string[] = ['taskDate', 'workDays', 'description', 'workPlace'];
  projectDataSources: { [projectId: number]: MatTableDataSource<ProgramTask> } = {};
  loading = true;
  error = '';

  // Custom dropdown properties
  isDropdownOpen = false;
  projectSearchQuery = '';
  filteredProjects: ProgramProject[] = [];

  // Tab scrolling
  scrollPosition: number = 0;
  scrollAmount: number = 200;
  isScrolledToEnd: boolean = false;

  // Project workplace counts
  projectWorkplaceCounts: { [projectId: number]: { ey: number; client: number } } = {};

  // Workplace counts
  eyWorkplaceCount: number = 0;
  clientWorkplaceCount: number = 0;

  // Current selected tab
  selectedProjectIndex: number = 0;

  // EY Colors
  eyColors = {
    darkGray: '#333333',
    yellow: '#ffe600',
    white: '#ffffff',
    lightGray: '#cccccc',
    mediumGray: '#999999'
  };

  // Chart options
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Roboto, "Helvetica Neue", sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(51, 51, 51, 0.8)',
        titleFont: {
          family: 'Roboto, "Helvetica Neue", sans-serif',
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Roboto, "Helvetica Neue", sans-serif',
          size: 13
        },
        padding: 12,
        cornerRadius: 6,
        displayColors: true
      }
    },
    cutout: '65%',
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  budgetChartInstance: Chart | undefined;
  workplaceChartInstance: Chart | undefined;

  // Track if view has been checked to prevent excessive operations
  private viewChecked = false;

  constructor(
    private route: ActivatedRoute,
    private programService: ProgramService,
    private cdr: ChangeDetectorRef
  ) { }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const clickedElement = event.target as HTMLElement;
    const selector = document.querySelector('.custom-project-selector');

    // Check if click is outside the dropdown
    if (selector && !selector.contains(clickedElement)) {
      this.isDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.programId = +params['programId'];
      this.profileId = +params['profileId'];
      this.loadTaskData();
    });
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
    setTimeout(() => {
      this.checkScrollPosition();
    }, 500);
  }

  ngAfterViewChecked(): void {
    // This lifecycle hook runs after view and children are initialized
    if (!this.viewChecked && this.paginators && this.paginators.length > 0) {
      this.setupPaginators();
      this.viewChecked = true;
      this.cdr.detectChanges(); // Prevent ExpressionChangedAfterItHasBeenCheckedError
    }
  }

  loadTaskData(): void {
    this.loading = true;
    this.error = '';

    this.programService.getProgramProfileTasks(this.profileId, this.programId)
      .subscribe({
        next: (data: ProgramProfileTasks) => {
          this.taskData = data;

          // Initialize data sources for each project
          if (this.taskData.projects) {
            this.filteredProjects = [...this.taskData.projects]; // Initialize filtered projects

            this.taskData.projects.forEach(project => {
              this.projectDataSources[project.projectId] = new MatTableDataSource(project.tasks);
              // Don't set _pageSize directly as it doesn't exist on MatTableDataSource

              // Count workplaces for each project
              this.countProjectWorkplaces(project);
            });
          }

          // Count workplaces across all projects
          this.countWorkplaces();

          // Initialize charts after a short delay to ensure the DOM is ready
          setTimeout(() => {
            this.initCharts();

            // Set up sorting and pagination for each project table
            if (this.paginators && this.sorts) {
              this.paginators.forEach((paginator, index) => {
                const projectId = this.taskData?.projects[index]?.projectId;
                if (projectId && this.projectDataSources[projectId]) {
                  this.projectDataSources[projectId].paginator = paginator;
                  paginator.pageSize = 5; // Ensure pageSize is set to 5
                  paginator.pageIndex = 0; // Reset to first page
                }
              });

              this.sorts.forEach((sort, index) => {
                const projectId = this.taskData?.projects[index]?.projectId;
                if (projectId && this.projectDataSources[projectId]) {
                  this.projectDataSources[projectId].sort = sort;
                }
              });
            }

            // Check scrollable tabs
            this.checkScrollPosition();
          }, 100);

          this.loading = false;
        },
        error: (err: Error) => {
          console.error('Error loading program profile tasks data:', err);
          this.error = 'Failed to load tasks. Please try again later.';
          this.loading = false;
        }
      });
  }

  // Custom dropdown methods
  toggleProjectDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevent the event from bubbling up
    }
    this.isDropdownOpen = !this.isDropdownOpen;

    // Reset search when opening
    if (this.isDropdownOpen) {
      this.projectSearchQuery = '';
      this.filterProjects();
    }
  }

  filterProjects(): void {
    if (!this.taskData?.projects) return;

    const query = this.projectSearchQuery.toLowerCase().trim();

    if (!query) {
      this.filteredProjects = [...this.taskData.projects];
      return;
    }

    this.filteredProjects = this.taskData.projects.filter(project =>
      project.projectName.toLowerCase().includes(query) ||
      project.projectDescription.toLowerCase().includes(query) ||
      project.projectStatus.toLowerCase().includes(query)
    );
  }

  selectProject(index: number): void {
    if (index >= 0 && index < this.taskData!.projects.length) {
      this.selectedProjectIndex = index;
      this.isDropdownOpen = false; // Close dropdown after selection
    }
  }

  // Tab navigation functions
  scrollTabs(direction: 'left' | 'right'): void {
    if (!this.tabsWrapper) return;

    const container = this.tabsWrapper.nativeElement;
    const scrollAmount = direction === 'left' ? -this.scrollAmount : this.scrollAmount;

    container.scrollTo({
      left: container.scrollLeft + scrollAmount,
      behavior: 'smooth'
    });

    // Update scroll position after animation
    setTimeout(() => {
      this.checkScrollPosition();
    }, 300);
  }

  checkScrollPosition(): void {
    if (!this.tabsWrapper) return;

    const container = this.tabsWrapper.nativeElement;
    this.scrollPosition = container.scrollLeft;

    // Check if scrolled to end
    this.isScrolledToEnd = (container.scrollWidth - container.clientWidth - container.scrollLeft) < 10;
  }

  onProjectSelectionChange(event: MatSelectChange): void {
    this.selectedProjectIndex = event.value;
  }

  countWorkplaces(): void {
    if (!this.taskData || !this.taskData.projects) return;

    this.eyWorkplaceCount = 0;
    this.clientWorkplaceCount = 0;

    this.taskData.projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.workPlace === 'EY') {
          this.eyWorkplaceCount++;
        } else if (task.workPlace === 'Chez le Client') {
          this.clientWorkplaceCount++;
        }
      });
    });
  }

  countProjectWorkplaces(project: ProgramProject): void {
    if (!project || !project.tasks) return;

    let eyCount = 0;
    let clientCount = 0;

    project.tasks.forEach(task => {
      if (task.workPlace === 'EY') {
        eyCount++;
      } else if (task.workPlace === 'Chez le Client') {
        clientCount++;
      }
    });

    this.projectWorkplaceCounts[project.projectId] = { ey: eyCount, client: clientCount };
  }

  getProjectWorkplaceCount(project: ProgramProject, workplace: string): number {
    if (!project || !this.projectWorkplaceCounts[project.projectId]) return 0;

    if (workplace === 'EY') {
      return this.projectWorkplaceCounts[project.projectId].ey;
    } else if (workplace === 'Chez le Client') {
      return this.projectWorkplaceCounts[project.projectId].client;
    }

    return 0;
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedProjectIndex = event.index;

    // Reset pagination after tab change - important!
    this.viewChecked = false;

    // Use setTimeout to ensure DOM is updated before accessing paginators
    setTimeout(() => {
      this.setupPaginators();
      this.cdr.detectChanges();
    });
  }

  initCharts(): void {
    this.initBudgetChart();
    this.initWorkplaceChart();
  }

  initBudgetChart(): void {
    if (!this.taskData || !this.budgetChart) return;

    const remainingBudget = this.taskData.totalMandayBudget - this.taskData.totalConsumedMandayBudget;
    const ctx = this.budgetChart.nativeElement.getContext('2d');

    if (ctx) {
      if (this.budgetChartInstance) {
        this.budgetChartInstance.destroy();
      }

      this.budgetChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Consommé', 'Restant'],
          datasets: [{
            data: [this.taskData.totalConsumedMandayBudget, remainingBudget > 0 ? remainingBudget : 0],
            backgroundColor: [
              this.eyColors.yellow,
              'rgba(204, 204, 204, 0.7)'
            ],
            borderColor: [
              this.eyColors.darkGray,
              this.eyColors.darkGray
            ],
            borderWidth: 1,
            hoverBackgroundColor: [
              'rgba(255, 230, 0, 0.85)',
              'rgba(204, 204, 204, 0.85)'
            ],
            hoverBorderColor: this.eyColors.darkGray,
            hoverBorderWidth: 2
          }]
        },
        options: {
          ...this.chartOptions,
          plugins: {
            ...this.chartOptions.plugins,
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw as number;
                  const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => (a as number) + (b as number), 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} jours (${percentage}%)`;
                }
              },
              backgroundColor: 'rgba(51, 51, 51, 0.8)',
              titleFont: {
                family: 'Roboto, "Helvetica Neue", sans-serif',
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                family: 'Roboto, "Helvetica Neue", sans-serif',
                size: 13
              },
              padding: 12,
              cornerRadius: 6,
              displayColors: true
            }
          }
        }
      });
    }
  }

  initWorkplaceChart(): void {
    if (!this.workplaceChart) return;

    const ctx = this.workplaceChart.nativeElement.getContext('2d');

    if (ctx) {
      if (this.workplaceChartInstance) {
        this.workplaceChartInstance.destroy();
      }

      this.workplaceChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['EY', 'Chez le Client'],
          datasets: [{
            data: [this.eyWorkplaceCount, this.clientWorkplaceCount],
            backgroundColor: [
              'rgba(255, 230, 0, 0.7)',
              'rgba(51, 51, 51, 0.7)'
            ],
            borderColor: this.eyColors.white,
            borderWidth: 1,
            hoverBackgroundColor: [
              'rgba(255, 230, 0, 0.85)',
              'rgba(51, 51, 51, 0.85)'
            ],
            hoverBorderColor: this.eyColors.white,
            hoverBorderWidth: 2
          }]
        },
        options: {
          ...this.chartOptions,
          plugins: {
            ...this.chartOptions.plugins,
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw as number;
                  const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => (a as number) + (b as number), 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} tâches (${percentage}%)`;
                }
              },
              backgroundColor: 'rgba(51, 51, 51, 0.8)',
              titleFont: {
                family: 'Roboto, "Helvetica Neue", sans-serif',
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                family: 'Roboto, "Helvetica Neue", sans-serif',
                size: 13
              },
              padding: 12,
              cornerRadius: 6,
              displayColors: true
            }
          }
        }
      });
    }
  }

  getProgressPercentage(): number {
    if (!this.taskData || this.taskData.totalMandayBudget === 0) return 0;
    const percentage = (this.taskData.totalConsumedMandayBudget / this.taskData.totalMandayBudget) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  }

  getProjectProgressPercentage(project: ProgramProject): number {
    if (!project || project.mandayBudget === 0) return 0;
    const percentage = (project.consumedMandayBudget / project.mandayBudget) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'LAUNCHED':
      case 'IN_PROGRESS':
        return 'status-launched';
      case 'UNLAUNCHED':
        return 'status-unlaunched';
      case 'FINISHED':
      case 'COMPLETED':
        return 'status-completed';
      default:
        return 'status-default';
    }
  }

  applyFilter(event: Event, project: ProgramProject): void {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.projectDataSources[project.projectId]) {
      this.projectDataSources[project.projectId].filter = filterValue.trim().toLowerCase();

      if (this.projectDataSources[project.projectId].paginator) {
        this.projectDataSources[project.projectId].paginator?.firstPage();
      }
    }
  }

  // New method to setup paginators properly
  setupPaginators(): void {
    if (!this.paginators || !this.taskData || !this.taskData.projects) return;

    this.paginators.forEach((paginator, index) => {
      // Use the currently selected project index
      const projectId = this.taskData?.projects[index]?.projectId;
      if (projectId && this.projectDataSources[projectId]) {
        // Reset and connect paginator to data source
        this.projectDataSources[projectId].paginator = paginator;
        paginator.pageSize = 5;
        paginator.pageIndex = 0;

        // Force data source to update with paginator
        this.projectDataSources[projectId].paginator = paginator;
      }
    });
  }
}
