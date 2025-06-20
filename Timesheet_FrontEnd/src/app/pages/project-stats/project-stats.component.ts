import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProjectService } from 'src/app/services/project/project.service';
import { ProfileProjectStats } from 'src/app/models/profile-project-stats.model';

Chart.register(...registerables);

@Component({
  selector: 'app-project-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './project-stats.component.html',
  styleUrls: ['./project-stats.component.css']
})
export class ProjectStatsComponent implements OnInit {
  @ViewChild('financialChart') financialChartRef: ElementRef;
  @ViewChild('timesheetChart') timesheetChartRef: ElementRef;
  @ViewChild('hoursChart') hoursChartRef: ElementRef;

  profileId: number;
  projectId: number;
  stats: ProfileProjectStats;
  financialChart: Chart;
  timesheetChart: Chart;
  hoursChart: Chart;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.profileId = +params['profileId'];
      this.projectId = +params['projectId'];
      this.loadStats();
    });
  }

  loadStats(): void {
    this.loading = true;
    this.error = false;

    this.projectService.getStatProjectbyProfil(this.profileId, this.projectId).subscribe({
      next: (data) => {
        this.stats = data;
        console.log('Statistics loaded:', this.stats);
        this.loading = false;
        setTimeout(() => {
          this.initCharts();
        }, 100);
      },
      error: (err) => {
        console.error('Error loading statistics', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  initCharts(): void {
    // Destroy existing charts if they exist
    if (this.financialChart) {
      this.financialChart.destroy();
    }
    if (this.timesheetChart) {
      this.timesheetChart.destroy();
    }
    if (this.hoursChart) {
      this.hoursChart.destroy();
    }

    // Create Financial Chart
    this.createFinancialChart();

    // Create Hours Chart
    this.createHoursChart();

    // Create Timesheet Chart
    this.createTimesheetChart();
  }

  createFinancialChart(): void {
    const ctx = this.financialChartRef.nativeElement.getContext('2d');

    this.financialChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Consommé', 'Restant'],
        datasets: [{
          data: [
            this.stats.consumedBudgetAmount,
            this.stats.remainingBudgetAmount
          ],
          backgroundColor: ['#ffe600', '#333333'],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Budget Financier',
            color: '#333333',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: '#333333'
            }
          }
        }
      }
    });
  }

  createHoursChart(): void {
    const ctx = this.hoursChartRef.nativeElement.getContext('2d');

    this.hoursChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['J/H Consommé', 'J/H Restant'],
        datasets: [{
          data: [
            this.stats.consumedManDayBudget,
            this.stats.remainingManDayBudget
          ],
          backgroundColor: ['#ffe600', '#333333'],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Budget Heures (J/H)',
            color: '#333333',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: '#333333'
            }
          }
        }
      }
    });
  }

  createTimesheetChart(): void {
    // Only create the timesheet chart if there are timesheet entries
    if (this.stats.totalTimesheetEntries === 0) {
      return;
    }

    const ctx = this.timesheetChartRef.nativeElement.getContext('2d');

    this.timesheetChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Approuvé', 'En attente', 'Rejeté', 'Brouillon', 'Soumis'],
        datasets: [{
          data: [
            this.stats.approvedTimesheets,
            this.stats.pendingTimesheets,
            this.stats.rejectedTimesheets,
            this.stats.draftTimesheets,
            this.stats.submittedTimesheets
          ],
          backgroundColor: ['#4CAF50', '#ffe600', '#F44336', '#2196F3', '#FF9800'],
          borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Statut des Timesheets',
            color: '#333333',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: '#333333'
            }
          }
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projectdetails', this.projectId]);
  }

  viewTaskDetails(): void {
    // Navigate to the project-profile-tasks page with the current project and profile IDs
    this.router.navigate(['/projects/profile-tasks', this.projectId, this.profileId]);
  }
}
