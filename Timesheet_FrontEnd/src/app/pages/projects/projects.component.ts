import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgramService } from 'src/app/services/programs/program.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { map, Observable } from 'rxjs';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { ProgramProfileModalComponent } from '../programs/program-profiles/program-profile-modal/program-profile-modal.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageEvent } from '@angular/material/paginator';
import { FactureDateModalComponent } from './facture-date-modal/facture-date-modal.component';
import { ProjectFacturePdfExportService, ProjectFactureInformation, ProfileFactureData } from 'src/app/services/PDF-export/project-facture-pdf-export.service';
import { EventService } from 'src/app/services/event/event.service';
import { AlertService } from 'src/app/services/alert.service';

export interface ProfileData {
  idprofile: any;
  image: any;
  firstname: string;
  lastname: string;
  function: string;
  mandaybudget: string;
  progress: string;
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatGridListModule,
    MatTabsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatTooltipModule,
  ],
})
export class ProjectsComponent implements OnInit, AfterViewInit {
  projectId: any;
  project: any;
  projectManagers: any;
  projectprofiles: ProfileData[] = [];
  connecteduser: any;

  // Loading state variables
  isLoading = true;
  isProjectLoading = true;
  isProfilesLoading = true;

  // Pagination event object
  pageEvent: any;

  displayedColumns: string[] = [
    'image',
    'name',
    'function',
    'mandaybudget',
    'progress',
    'update',
    'stats'
  ];
  timesheetTypes: String[] = [
    'Tous les timesheets',
    'Timesheets approuvés',
    'Brouillons de timesheets',
    'Timesheets soumis',
    'Timesheets en attente',
    'Timesheets rejetés',
  ];
  dataSource: MatTableDataSource<ProfileData>;
  readonly panelOpenState = signal(false);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('programprofileModal') programprofileModal!: ElementRef;

  // Method to toggle panel state
  togglePanelState() {
    this.panelOpenState.update(state => !state);
  }

  constructor(
    private route: ActivatedRoute,
    private progserv: ProgramService,
    private router: Router,
    private projectserv: ProjectService,
    private userserv: UserserviceService,
    private profileser: ProfileService,
    public dialog: MatDialog,
    private projectFacturePdfService: ProjectFacturePdfExportService,
    private eventService: EventService,
    private alertService: AlertService
  ) {
    this.dataSource = new MatTableDataSource(this.projectprofiles);
  }
  ngOnInit(): void {
    this.isLoading = true;
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam !== null) {
        const parsedId = +idParam;
        if (isNaN(parsedId) || parsedId <= 0) {
          this.alertService.error(
            'ID de projet invalide',
            'L\'ID du projet fourni n\'est pas valide. Retour à la liste des projets.'
          );
          this.router.navigate(['/projects']);
          return;
        }

        this.projectId = parsedId;
        this.getprogramdetails();
        this.getProjectProfiles();
        this.connectedUser();

        // Set overall loading to false when both project and profiles are loaded
        Promise.all([
          new Promise(resolve => {
            const checkLoading = setInterval(() => {
              if (!this.isProjectLoading && !this.isProfilesLoading) {
                clearInterval(checkLoading);
                resolve(true);
              }
            }, 100);
          })
        ]).then(() => {
          this.isLoading = false;
        });

        // Failsafe timeout to ensure loading state doesn't persist indefinitely
        setTimeout(() => {
          this.isLoading = false;
          this.isProjectLoading = false;
          this.isProfilesLoading = false;
        }, 10000); // 10 seconds timeout
      }
    });
  }
  ngAfterViewInit() {
    // Set paginator and sort after the view is initialized
    if (this.dataSource) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // Initialize default page size and options
        if (this.paginator) {
          this.paginator.pageSize = 5;
          this.paginator.pageIndex = 0;
        }
      });
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  navigateToTimesheets(type: String): void {
    let status = '';
    switch (type) {
      case 'Tous les timesheets':
        status = 'all';
        break;
      case 'Timesheets soumis':
        status = 'SUBMITTED';
        break;
      case 'Timesheets approuvés':
        status = 'APPROVED';
        break;
      case 'Timesheets en attente':
        status = 'PENDING';
        break;
      case 'Brouillons de timesheets':
        status = 'DRAFT';
        break;
      case 'Timesheets rejetés':
        status = 'REJECTED';
        break;
    }

    this.router.navigate([`projects/timesheets/${this.projectId}`, { status }]);
  }

  public getprogramdetails() {
    this.isProjectLoading = true;
    this.projectserv
      .getProjectDetails(this.projectId)
      .subscribe({
        next: (response: any[]) => {
          this.project = response;
          this.isProjectLoading = false;
        },
        error: (err) => {
          console.error('Error loading project details:', err);
          this.alertService.error(
            'Erreur de chargement',
            'Impossible de charger les détails du projet. Veuillez réessayer.'
          );
          this.isProjectLoading = false;
        }
      });
  }

  public getProjectProfiles() {
    this.isProfilesLoading = true;
    this.projectserv
      .getProjectProfiles(this.projectId)
      .subscribe({
        next: (response: any[]) => {
          this.projectprofiles = response.map((item) => ({
            idprofile: item[0].idp,
            image: item[0].image,
            firstname: item[0].firstname,
            lastname: item[0].lastname,
            function: item[4],
            mandaybudget: item[1],
            progress: item[2],
          }));

          // Create new MatTableDataSource and initialize with data
          this.dataSource = new MatTableDataSource(this.projectprofiles);

          // Configure the dataSource
          this.dataSource.filterPredicate = (data: ProfileData, filter: string) => {
            const fullName = `${data.firstname} ${data.lastname}`.toLowerCase();
            const func = data.function?.toLowerCase() || '';
            return fullName.includes(filter) || func.includes(filter);
          };

          // Re-attach paginator and sort after data is loaded
          setTimeout(() => {
            if (this.paginator) {
              this.dataSource.paginator = this.paginator;
            }
            if (this.sort) {
              this.dataSource.sort = this.sort;
            }
            this.isProfilesLoading = false;
          });
        },
        error: (err) => {
          console.error('Error loading project profiles:', err);
          this.alertService.error(
            'Erreur de chargement',
            'Impossible de charger les profils du projet. Veuillez réessayer.'
          );
          this.isProfilesLoading = false;
        }
      });
  }
  goToProgramDetails(idprog: number) {
    this.router.navigate(['/programs/details', idprog]);
  }

  public connectedUser() {
    this.connecteduser = this.userserv.getUserConnected();
  }
  goToProfileTimesheet(idprofile: number) {
    this.router.navigate(['/projects/timesheet', idprofile, this.projectId]);
  }

  goToProgram() {
    this.router.navigate(['/programs/details', this.project.program.idprog]);
  }

  goToDetailedStats() {
    this.router.navigate(['/projects/detailed-stats', this.projectId]);
  }

  loadProfilesForAutocomplete(): Observable<any[]> {
    return this.profileser.getProjectManagers().pipe(
      map((response) => {
        this.projectManagers = response;
        return this.projectManagers;
      })
    );
  }

  openProfileModal() {
    this.loadProfilesForAutocomplete().subscribe({
      next: (profilesList) => {

        const dialogRef = this.dialog.open(ProgramProfileModalComponent, {
          width: '500px',
          data: {
            context: 'projectManager',
            projectId: this.projectId,
            profilesList: this.projectManagers,
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            window.location.reload();
          }
        });
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.alertService.error(
          'Erreur de chargement',
          'Impossible de charger la liste des profils. Veuillez réessayer.'
        );
      },
    });
  }

  viewStats(profileId: number): void {
    this.router.navigate(['/projects/stats', profileId, this.projectId]);
  }

  // Handle pagination events
  handlePageEvent(event: any) {
    this.pageEvent = event;
    // Force change detection to update the view
    this.dataSource._updateChangeSubscription();
  }

  // Helper method to calculate minimum of two numbers (used for pagination)
  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Calculate percentage for progress bar visualization
  getProgressPercentage(budget: string, consumed: string): number {
    const budgetValue = parseFloat(budget);
    const consumedValue = parseFloat(consumed);

    if (isNaN(budgetValue) || isNaN(consumedValue) || budgetValue <= 0) {
      return 0;
    }

    const percentage = (consumedValue / budgetValue) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  }

  // Helper methods for safe pagination
  getPagedData() {
    if (!this.dataSource || !this.dataSource.filteredData || !this.paginator) {
      return [];
    }
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const endIndex = startIndex + this.paginator.pageSize;
    return this.dataSource.filteredData.slice(startIndex, endIndex);
  }

  getNoDataMessage() {
    if (!this.dataSource || !this.dataSource.filter) {
      return 'Aucune donnée disponible';
    }
    return `Aucune donnée ne correspond au filtre "${this.dataSource.filter}"`;
  }

  // Open facture date modal for project-level facture generation
  openFactureDateModal() {
    const dialogRef = this.dialog.open(FactureDateModalComponent, {
      width: '400px',
      data: {
        projectName: this.project?.name || 'Projet Sans Nom'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.generateProjectFacture(result.month, result.year);
      }
    });
  }

  // Generate project-level facture for selected month and year
  generateProjectFacture(month: number, year: number) {
    if (!this.project?.idproject) {
      console.error('Project ID not available');
      this.alertService.error(
        'Erreur de projet',
        'ID du projet non disponible. Veuillez actualiser la page.'
      );
      return;
    }

    // Validate month and year
    if (!month || !year || month < 1 || month > 12 || year < 2000 || year > 2100) {
      this.alertService.error(
        'Données invalides',
        'Mois ou année invalide. Veuillez vérifier votre sélection.'
      );
      return;
    }

    // Show loading notification
    this.alertService.custom({
      title: 'Génération en cours...',
      text: 'Récupération des données du projet, veuillez patienter.',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      timer: false
    });

    // Format month-year for API call (assuming format like "2024-06")
    const monthYear = `${month.toString().padStart(2, '0')}/${year}`;

    this.eventService.getTasksByProjectAndMonthYear(monthYear, this.project.idproject)
      .subscribe({
        next: (data: any) => {
          this.processProjectFactureData(data, month, year);
        },
        error: (error) => {
          console.error('Error fetching project tasks:', error);
          this.alertService.error(
            'Erreur de récupération des données',
            `Impossible de récupérer les tâches pour ${month}/${year}. Veuillez vérifier que des données existent pour cette période.`
          );
        }
      });
  }

  // Process the API response and generate PDF
  private processProjectFactureData(data: any, month: number, year: number) {
    console.log('Received data for project facture:', data, 'Month:', month, 'Year:', year);

    // Check if data exists and has valid structure
    if (!data) {
      console.error('No data received from API');
      this.alertService.error(
        'Aucune donnée disponible',
        'Aucune donnée reçue de l\'API. Veuillez réessayer.'
      );
      return;
    }

    // Extract profiles from the API response
    let profilesData: any[] = [];
    if (data.profiles && Array.isArray(data.profiles)) {
      profilesData = data.profiles;
    } else if (Array.isArray(data)) {
      // Fallback for direct array format
      profilesData = data;
    } else {
      console.error('Data is not in expected format. Expected object with profiles array or direct array.');
      console.log('Received data structure:', data);
      this.alertService.error(
        'Format de données invalide',
        'Les données reçues ne sont pas dans le format attendu. Veuillez contacter le support technique.'
      );
      return;
    }

    if (profilesData.length === 0) {
      console.error('No profiles data available for selected month and year');
      this.alertService.warning(
        'Aucune donnée trouvée',
        `Aucun profil ou tâche trouvé pour ${month}/${year}. Vérifiez que des données existent pour cette période.`
      );
      return;
    }

    // First, get the project profiles with daily rates
    this.projectserv.getProjectProfiles(this.projectId).subscribe({
      next: (profilesWithRates: any[]) => {
        console.log('Project profiles with rates:', profilesWithRates);

        // Map profiles with their daily rates
        const profileRatesMap = new Map();
        profilesWithRates.forEach((item: any) => {
          const profileId = item[0].idp;
          const dailyRate = item[5]; // Daily rate is at index 5
          const profileFunction = item[4]; // Function is at index 4
          profileRatesMap.set(profileId, { dailyRate, function: profileFunction });
        });

        const profiles: ProfileFactureData[] = [];
        let totalAmount = 0;

        // Process each profile in the response
        profilesData.forEach((profileData: any) => {
          console.log('Processing profile:', profileData.profileName, 'with tasks:', profileData.tasks?.length || 0);

          if (profileData && profileData.tasks && Array.isArray(profileData.tasks) && profileData.tasks.length > 0) {
            // Calculate total days for this profile
            const totalDays = profileData.tasks.reduce((sum: number, task: any) => sum + (task.nbJour || 0), 0);
            console.log(`Profile ${profileData.profileName}: ${totalDays} total days`);

            // Get daily rate and function from the project profiles data
            let dailyRate = 500; // Default daily rate
            let profileFunction = 'Consultant'; // Default function

            const profileRateInfo = profileRatesMap.get(profileData.profileId);
            if (profileRateInfo) {
              dailyRate = profileRateInfo.dailyRate || 500;
              profileFunction = profileRateInfo.function || 'Consultant';
              console.log(`Found daily rate for profile ${profileData.profileName}: ${dailyRate} TND`);
            } else {
              console.log(`No daily rate found for profile ${profileData.profileName}, using default: ${dailyRate} TND`);
            }

            // Calculate total amount for this profile
            const profileTotalAmount = totalDays * dailyRate;

            profiles.push({
              ExpertName: profileData.profileName || 'Expert inconnu',
              function: profileFunction,
              totalDays: totalDays,
              dailyRate: dailyRate,
              totalAmount: profileTotalAmount
            });

            totalAmount += profileTotalAmount;
            console.log(`Added profile ${profileData.profileName}: ${totalDays} days × ${dailyRate} = ${profileTotalAmount} TND`);
          } else {
            console.log(`Skipping profile ${profileData.profileName}: no valid tasks found`);
          }
        });

        if (profiles.length === 0) {
          console.error('No valid profile data found with tasks');
          this.alertService.warning(
            'Aucune donnée valide trouvée',
            'Aucun profil avec des tâches valides trouvé pour la période sélectionnée.'
          );
          return;
        }

        console.log(`Total profiles processed: ${profiles.length}, Total amount: ${totalAmount} TND`);

        // Get month name in French
        const monthNames = [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];

        // Create project facture information
        console.log('=== Creating project facture information ===');
        console.log('Project object:', this.project);
        console.log('Project.program object:', this.project?.program);
        console.log('Contract number (numcontrat):', this.project?.program?.numcontrat);

        const projectFactureInfo: ProjectFactureInformation = {
          Month: monthNames[month - 1],
          Year: year.toString(),
          ProjectName: this.project?.name || 'Projet Sans Nom',
          ContractNumber: this.project?.program?.numcontrat ? this.project.program.numcontrat.toString() : 'N/A',
          profiles: profiles,
          totalAmount: totalAmount
        };

        console.log('Final project facture info:', projectFactureInfo);

        try {
          // Generate PDF
          this.projectFacturePdfService.exportProjectFactureToPdf(projectFactureInfo);

          // Show success notification
          this.alertService.success(
            'Facture générée avec succès',
            `La facture pour ${monthNames[month - 1]} ${year} a été téléchargée.`
          );
        } catch (error) {
          console.error('Error generating PDF:', error);
          this.alertService.error(
            'Erreur de génération PDF',
            'Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.'
          );
        }
      },
      error: (error) => {
        console.error('Error fetching project profiles with rates:', error);
        this.alertService.warning(
          'Impossible de récupérer les taux',
          'Utilisation des taux par défaut pour la génération de la facture.'
        );
        // Fallback to original logic with default rates if API call fails
        this.processProjectFactureDataFallback(profilesData, month, year);
      }
    });
  }

  // Fallback method with default rates if the profiles API call fails
  private processProjectFactureDataFallback(profilesData: any[], month: number, year: number) {
    const profiles: ProfileFactureData[] = [];
    let totalAmount = 0;

    // Process each profile in the response with default rates
    profilesData.forEach((profileData: any) => {
      if (profileData && profileData.tasks && Array.isArray(profileData.tasks) && profileData.tasks.length > 0) {
        const totalDays = profileData.tasks.reduce((sum: number, task: any) => sum + (task.nbJour || 0), 0);
        const dailyRate = 500; // Default daily rate
        const profileTotalAmount = totalDays * dailyRate;

        profiles.push({
          ExpertName: profileData.profileName || 'Expert inconnu',
          function: 'Consultant',
          totalDays: totalDays,
          dailyRate: dailyRate,
          totalAmount: profileTotalAmount
        });

        totalAmount += profileTotalAmount;
      }
    });

    if (profiles.length === 0) {
      console.error('No valid profile data found with tasks');
      this.alertService.warning(
        'Aucune donnée valide trouvée',
        'Aucun profil avec des tâches valides trouvé pour la période sélectionnée.'
      );
      return;
    }

    // Get month name in French
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Create project facture information
    console.log('=== Creating project facture information (fallback) ===');
    console.log('Project object:', this.project);
    console.log('Project.program object:', this.project?.program);
    console.log('Contract number (numcontrat):', this.project?.program?.numcontrat);

    const projectFactureInfo: ProjectFactureInformation = {
      Month: monthNames[month - 1],
      Year: year.toString(),
      ProjectName: this.project?.name || 'Projet Sans Nom',
      ContractNumber: this.project?.program?.numcontrat ? this.project.program.numcontrat.toString() : 'N/A',
      profiles: profiles,
      totalAmount: totalAmount
    };

    console.log('Final project facture info (fallback):', projectFactureInfo);

    try {
      // Generate PDF
      this.projectFacturePdfService.exportProjectFactureToPdf(projectFactureInfo);

      // Show success notification with warning about default rates
      this.alertService.success(
        'Facture générée avec taux par défaut',
        `La facture pour ${monthNames[month - 1]} ${year} a été téléchargée avec des taux par défaut.`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.alertService.error(
        'Erreur de génération PDF',
        'Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.'
      );
    }
  }
}
