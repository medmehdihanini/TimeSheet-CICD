import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ProgramService } from 'src/app/services/programs/program.service';
import { ProfileProgramStats, ProjectFinancialStats } from 'src/app/models/profile-program-stats.model';

Chart.register(...registerables);

@Component({
  selector: 'app-program-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './program-stats.component.html',
  styleUrls: ['./program-stats.component.css']
})
export class ProgramStatsComponent implements OnInit {
  @ViewChild('financialChart') financialChartRef: ElementRef;
  @ViewChild('projectsComparisonChart') projectsComparisonChartRef: ElementRef;

  profileId: number;
  programId: number;
  stats: ProfileProgramStats;
  financialChart: Chart;
  projectsComparisonChart: Chart;
  projectCharts: Map<number, Chart> = new Map();

  loading = true;
  error = false;

  // Colors for charts
  chartColors = {
    yellow: '#ffe600',
    dark: '#333333',
    green: '#4CAF50',
    blue: '#2196F3',
    orange: '#FF9800',
    red: '#F44336',
    lightGrey: '#f5f5f5',
    grey: '#999999',
  };

  // Project color mapping
  projectColorMap: Map<number, string> = new Map();

  constructor(
    private route: ActivatedRoute,
    private programService: ProgramService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.profileId = +params['profileId'];
      this.programId = +params['programId'];
      this.loadStats();
    });
  }

  loadStats(): void {
    this.loading = true;
    this.error = false;

    this.programService.getProfilStatByProgramme(this.profileId, this.programId).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;

        // Initialize project colors
        if (this.stats.projectsFinancialStats && this.stats.projectsFinancialStats.length > 0) {
          this.initializeProjectColors();
        }

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

  initializeProjectColors(): void {
    const colors = this.generateChartColors(this.stats.projectsFinancialStats.length);
    this.stats.projectsFinancialStats.forEach((project, index) => {
      this.projectColorMap.set(project.projectId, colors[index]);
    });
  }

  initCharts(): void {
    // Destroy existing charts if they exist
    this.destroyCharts();

    // Create Financial Chart
    this.createFinancialChart();

    // Create project related charts if there are projects
    if (this.stats.projectsFinancialStats && this.stats.projectsFinancialStats.length > 0) {
      this.createProjectsComparisonChart();
      this.createProjectCharts();
    }
  }

  destroyCharts(): void {
    if (this.financialChart) {
      this.financialChart.destroy();
    }

    if (this.projectsComparisonChart) {
      this.projectsComparisonChart.destroy();
    }

    // Destroy any project charts
    this.projectCharts.forEach(chart => {
      if (chart) chart.destroy();
    });
    this.projectCharts.clear();
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
          backgroundColor: [this.chartColors.yellow, this.chartColors.dark],
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
            color: this.chartColors.dark,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: this.chartColors.dark
            }
          }
        }
      }
    });
  }

  createProjectsComparisonChart(): void {
    if (!this.projectsComparisonChartRef) return;

    const ctx = this.projectsComparisonChartRef.nativeElement.getContext('2d');

    // Sort projects by budget for better visualization and limit to top 15 if more than 15
    const sortedProjects = [...this.stats.projectsFinancialStats]
      .sort((a, b) => b.projectManDayBudget - a.projectManDayBudget);

    const projectsToShow = sortedProjects.length > 15 ? sortedProjects.slice(0, 15) : sortedProjects;

    // Prepare data for the chart
    const projectNames = projectsToShow.map(p => p.projectName);
    const consumedManDays = projectsToShow.map(p => p.projectConsumedManDayBudget);
    const remainingManDays = projectsToShow.map(p => p.projectRemainingManDayBudget);

    this.projectsComparisonChart = new Chart(ctx, {
      type: 'bar', // Horizontal bar chart works better with many projects
      data: {
        labels: projectNames,
        datasets: [
          {
            label: 'J/H Consommés',
            data: consumedManDays,
            backgroundColor: this.chartColors.yellow,
            borderColor: 'rgba(255, 230, 0, 0.8)',
            borderWidth: 1,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          },
          {
            label: 'J/H Restants',
            data: remainingManDays,
            backgroundColor: this.chartColors.dark,
            borderColor: 'rgba(51, 51, 51, 0.8)',
            borderWidth: 1,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        indexAxis: 'y', // Make bars horizontal
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: false,
            grid: {
              color: 'rgba(200, 200, 200, 0.2)'
            },
            ticks: {
              color: this.chartColors.dark
            },
            title: {
              display: true,
              text: 'Jours/Homme',
              color: this.chartColors.dark
            }
          },
          y: {
            stacked: false,
            grid: {
              display: false
            },
            ticks: {
              color: this.chartColors.dark
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              boxWidth: 15,
              color: this.chartColors.dark
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                return `${label}: ${value} J/H`;
              }
            }
          }
        }
      }
    });
  }

  createProjectCharts(): void {
    if (!this.stats.projectsFinancialStats) return;

    this.stats.projectsFinancialStats.forEach(project => {
      setTimeout(() => {
        const canvasId = `projectChart_${project.projectId}`;
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Destroy the old chart if it exists
            const existingChart = this.projectCharts.get(project.projectId);
            if (existingChart) {
              existingChart.destroy();
            }

            const chart = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: ['Consommé', 'Restant'],
                datasets: [{
                  data: [
                    project.projectConsumedBudgetAmount,
                    project.projectRemainingBudgetAmount
                  ],
                  backgroundColor: [this.chartColors.yellow, this.chartColors.dark],
                  borderColor: '#ffffff',
                  borderWidth: 1,
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: this.chartColors.dark,
                      boxWidth: 12,
                      font: {
                        size: 10
                      }
                    }
                  }
                }
              }
            });

            this.projectCharts.set(project.projectId, chart);
          }
        }
      }, 100);
    });
  }

  getBudgetIndicatorColor(projectId: number): string {
    return this.projectColorMap.get(projectId) || this.chartColors.grey;
  }

  calculateBudgetPercentage(projectBudget: number): number {
    if (!this.stats.totalBudgetAmount || this.stats.totalBudgetAmount === 0) {
      return 0;
    }
    return (projectBudget / this.stats.totalBudgetAmount) * 100;
  }

  adjustColorOpacity(color: string, opacity: number): string {
    // If it's already an rgba color
    if (color.startsWith('rgba')) {
      return color.replace(/[\d\.]+\)$/g, `${opacity})`);
    }

    // If it's a hex color
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Default case
    return color;
  }

  generateChartColors(count: number): string[] {
    // Base colors to use in charts
    const baseColors = [
      this.chartColors.yellow,
      this.chartColors.dark,
      this.chartColors.green,
      this.chartColors.blue,
      this.chartColors.orange,
      this.chartColors.red,
      '#9C27B0', // Purple
      '#00BCD4', // Cyan
      '#8BC34A', // Light Green
      '#607D8B', // Blue Grey
      '#E91E63', // Pink
      '#795548', // Brown
      '#9E9E9E', // Grey
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
      '#009688', // Teal
      '#CDDC39', // Lime
      '#FFC107', // Amber
    ];

    const colors: string[] = [];

    // If we have fewer projects than base colors, just use the base colors
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Generate additional colors with varying opacities and shades
    for (let i = 0; i < count; i++) {
      const baseColorIndex = i % baseColors.length;
      const baseColor = baseColors[baseColorIndex];

      // Vary saturation and lightness based on how many times we've cycled through the base colors
      const cycle = Math.floor(i / baseColors.length);
      const opacity = 0.6 + (0.4 * (cycle % 3) / 3);

      // If it's a hex color, convert to rgba
      if (baseColor.startsWith('#')) {
        // Convert hex to rgb
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);

        // Add some variation to the colors for each cycle
        const variation = cycle * 20;
        const r2 = Math.max(0, Math.min(255, r + (i % 2 === 0 ? variation : -variation)));
        const g2 = Math.max(0, Math.min(255, g + (i % 3 === 0 ? variation : -variation)));
        const b2 = Math.max(0, Math.min(255, b + (i % 5 === 0 ? variation : -variation)));

        colors.push(`rgba(${r2}, ${g2}, ${b2}, ${opacity})`);
      } else {
        colors.push(baseColor);
      }
    }

    return colors;
  }

  getProgressBarColor(percentage: number): string {
    if (percentage < 25) return this.chartColors.green;
    if (percentage < 50) return this.chartColors.blue;
    if (percentage < 75) return this.chartColors.yellow;
    if (percentage < 90) return this.chartColors.orange;
    return this.chartColors.red;
  }

  goBack(): void {
    this.router.navigate(['/programdetailSettings', this.programId, 'program-profiles']);
  }

  scrollToProject(projectId: number): void {
    // Short delay to ensure DOM is ready
    setTimeout(() => {
      try {
        // Find the project card directly by using a more specific selector
        const projectCardSelector = `.project-card[id="project-card-${projectId}"]`;
        const targetElement = document.querySelector(projectCardSelector) as HTMLElement;

        if (targetElement) {
          // Add a highlight effect
          targetElement.classList.add('highlighted-project');

          // Scroll to the element
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Remove the highlight effect after a delay
          setTimeout(() => {
            targetElement.classList.remove('highlighted-project');
          }, 2000);
        } else {
          console.log(`Project card for ID ${projectId} not found in DOM`);

          // Fallback: try to find the project by looping through all cards
          this.scrollToProjectByLoop(projectId);
        }
      } catch (error) {
        console.error('Error scrolling to project:', error);
      }
    }, 100);
  }

  private scrollToProjectByLoop(projectId: number): void {
    try {
      // Get all project cards
      const projectCards = Array.from(document.querySelectorAll('.project-card'));

      // Find the project with the matching ID
      for (let i = 0; i < this.stats.projectsFinancialStats.length; i++) {
        if (this.stats.projectsFinancialStats[i].projectId === projectId) {
          // If we found the matching project in our data, try to use the corresponding DOM element
          if (i < projectCards.length) {
            const card = projectCards[i] as HTMLElement;
            card.classList.add('highlighted-project');
            card.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });

            setTimeout(() => {
              card.classList.remove('highlighted-project');
            }, 2000);

            break;
          }
        }
      }
    } catch (error) {
      console.error('Error in fallback scroll method:', error);
    }
  }
}
