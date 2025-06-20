import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/project/project.service';
import { ProjectProfileTasks, Task } from '../../models/project-profile-tasks.model';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { ChartConfiguration, ChartItem, ChartType, ChartData, TooltipItem } from 'chart.js';

@Component({
  selector: 'app-project-profile-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './project-profile-tasks.component.html',
  styleUrls: ['./project-profile-tasks.component.scss']
})
export class ProjectProfileTasksComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('budgetChart') budgetChart!: ElementRef<HTMLCanvasElement>;

  projectId!: number;
  profileId!: number;
  taskData: ProjectProfileTasks | null = null;
  displayedColumns: string[] = ['datte', 'nbJour', 'text', 'workPlace'];
  dataSource = new MatTableDataSource<Task>([]);
  loading = true;
  error = '';
  chart: Chart | undefined;
  filterValue: string = '';

  // Workplace counts
  eyWorkplaceCount: number = 0;
  clientWorkplaceCount: number = 0;

  // EY Colors
  eyColors = {
    darkGray: '#333333',
    yellow: '#ffe600',
    white: '#ffffff',
    lightGray: '#cccccc',
    mediumGray: '#999999'
  };

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = +params['projectId'];
      this.profileId = +params['profileId'];
      this.loadTaskData();
    });
  }

  ngAfterViewInit(): void {
    // DataSource configuration happens when data is loaded
  }

  loadTaskData(): void {
    this.loading = true;
    this.projectService.getProjectProfileTasks(this.projectId, this.profileId)
      .subscribe({
        next: (data: ProjectProfileTasks) => {
          this.taskData = data;
          this.dataSource = new MatTableDataSource(this.taskData.tasks);

          // Count workplaces
          this.countWorkplaces();

          // Set paginator and sorting after data is loaded
          setTimeout(() => {
            // Fix for paginator and sort not working in Angular Material
            if (this.paginator) {
              this.dataSource.paginator = this.paginator;
            }
            if (this.sort) {
              this.dataSource.sort = this.sort;
            }
            this.initChart();
          });

          this.loading = false;
        },
        error: (err: Error) => {
          console.error('Error loading task data:', err);
          this.error = 'Échec du chargement des tâches. Veuillez réessayer plus tard.';
          this.loading = false;
        }
      });
  }

  countWorkplaces(): void {
    if (!this.taskData || !this.taskData.tasks) return;

    this.eyWorkplaceCount = 0;
    this.clientWorkplaceCount = 0;

    this.taskData.tasks.forEach(task => {
      if (task.workPlace === 'EY') {
        this.eyWorkplaceCount++;
      } else if (task.workPlace === 'Chez le Client') {
        this.clientWorkplaceCount++;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  initChart(): void {
    if (!this.taskData || !this.budgetChart) return;

    const ctx = this.budgetChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Calculate remaining budget
    const remainingBudget = this.taskData.mandayBudget - this.taskData.consumedMandayBudget;

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Consommé', 'Restant'],
        datasets: [{
          data: [this.taskData.consumedMandayBudget, remainingBudget > 0 ? remainingBudget : 0],
          backgroundColor: [this.eyColors.yellow, this.eyColors.lightGray],
          borderColor: this.eyColors.darkGray,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: this.eyColors.darkGray
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: TooltipItem<ChartType>) {
                const label = context.label || '';
                const value = context.formattedValue;
                return `${label}: ${value} jours/homme`;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  getProgressPercentage(): number {
    if (!this.taskData || this.taskData.mandayBudget === 0) return 0;
    const percentage = (this.taskData.consumedMandayBudget / this.taskData.mandayBudget) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'LAUNCHED':
        return 'status-launched';
      case 'UNLAUNCHED':
        return 'status-unlaunched';
      case 'COMPLETED':
        return 'status-completed';
      default:
        return 'status-default';
    }
  }
}
