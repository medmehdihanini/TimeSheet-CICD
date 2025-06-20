import { Component, OnInit, ViewChild, ContentChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate } from '@angular/animations';
import { DatePipe } from '@angular/common';

import { ProgramService } from '../../services/programs/program.service';
import { ProjectService } from '../../services/project/project.service';
import { EventService } from '../../services/event/event.service';
import { CategorieService } from '../../services/Diction/categorie.service';
import { ActiviteDictionnaireService } from '../../services/Diction/activite-dictionnaire.service';
import { UserserviceService } from '../../services/user/userservice.service';
import { ActivityDialogComponent } from './activity-dialog/activity-dialog.component';
import { AlertService } from '../../services/alert.service';
import { firstValueFrom } from 'rxjs';

import { Categorie, ActiviteDictionnaire } from '../../models/Categorie';
import { UniqueDatepickerDirective } from './unique-datepicker.directive';

// Tunisian holidays (month and day only)
const TUNISIAN_HOLIDAYS = [
  { month: 4, day: 9, name: 'Journée des Martyrs' },
  { month: 5, day: 1, name: 'Fête du Travail' },
  { month: 7, day: 25, name: 'Fête de la République' },
  { month: 8, day: 13, name: 'Fête de la Femme' },
  { month: 10, day: 15, name: 'Fête de l\'Évacuation' },
  { month: 12, day: 17, name: 'Fête de la Révolution' }
];

@Component({
  selector: 'app-task-assignments',
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatTabsModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule,
    UniqueDatepickerDirective
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ],
  templateUrl: './task-assignments.component.html',
  styleUrls: ['./task-assignments.component.scss']
})
export class TaskAssignmentsComponent implements OnInit {  // Connected user
  connectedUser: any;
  userRole: string = '';

  // Selection models
  programs: any[] = [];
  selectedProgramId: number | null = null;

  projects: any[] = [];
  selectedProjectId: number | null = null;

  profiles: any[] = [];
  selectedProfileIds: number[] = [];

  // Task pagination
  pageSize: number = 5;
  pageIndex: number = 0;
  currentProfileIndex: number = 0;
  get currentProfileId(): number {
    return this.selectedProfileIds[this.currentProfileIndex] || 0;
  }

  // Month and year selection for task filtering
  months: {value: number, name: string}[] = [
    {value: 0, name: 'Janvier'},
    {value: 1, name: 'Février'},
    {value: 2, name: 'Mars'},
    {value: 3, name: 'Avril'},
    {value: 4, name: 'Mai'},
    {value: 5, name: 'Juin'},
    {value: 6, name: 'Juillet'},
    {value: 7, name: 'Août'},
    {value: 8, name: 'Septembre'},
    {value: 9, name: 'Octobre'},
    {value: 10, name: 'Novembre'},
    {value: 11, name: 'Décembre'}
  ];
  currentYear = new Date().getFullYear();
  years: number[] = [];
  selectedMonth: number = new Date().getMonth();
  selectedYear: number = this.currentYear;

  // Task data by profile
  profileTasksMap: Map<number, any[]> = new Map();

  // Categories and activities
  categories: Categorie[] = [];
  activiteDictionnaires: ActiviteDictionnaire[] = [];
  selectedActiviteDictionnaireIds: number[] = [];

  // Task assignment
  assignmentDate: Date = new Date();
  taskDescription: string = '';
  // Loading states
  loading = {
    programs: false,
    projects: false,
    profiles: false,
    tasks: false,
    categories: false,
    activities: false
  };

  // Track loading state for each profile's tasks
  profileTasksLoading: Set<number> = new Set();// Data structure to store profile-activity-date relationships
  profileActivityAssignments: Array<{
    profileId: number;
    activityId: number;
    date: Date;
    workPlace: string;  // 'EY' or 'Chez le client'
    nbJour: number;     // 1 or 0.5
  }> = [];constructor(
    private programService: ProgramService,
    private projectService: ProjectService,
    private eventService: EventService,
    private categorieService: CategorieService,
    private activiteDictionnaireService: ActiviteDictionnaireService,
    private userService: UserserviceService,
    private alertService: AlertService,
    private dialog: MatDialog
  ) {
    // Generate years (current year and 5 years in each direction)
    for (let i = this.currentYear - 5; i <= this.currentYear + 10; i++) {
      this.years.push(i);
    }
  }

  ngOnInit(): void {
    this.loadConnectedUser();
    this.loadCategories();
    this.loadActiviteDictionnaires();
  }

  loadConnectedUser(): void {
    this.connectedUser = this.userService.getUserConnected();
    this.userRole = this.connectedUser?.role;

    if (this.userRole === 'PROGRAM_MANAGER') {
      this.loadPrograms();
    } else if (this.userRole === 'PROJECT_MANAGER') {
      this.loadProjectsForProjectManager();
    }
  }

  loadPrograms(): void {
    this.loading.programs = true;
    this.programService.getProgramsWhereImChief(this.connectedUser.id).subscribe({
      next: (data) => {
        this.programs = data;
        this.loading.programs = false;
      },
      error: (error) => {
        console.error('Error loading programs:', error);
        this.loading.programs = false;
        this.showErrorMessage('Erreur lors du chargement des programmes');
      }
    });
  }

  onProgramChange(): void {
    if (!this.selectedProgramId) {
      this.projects = [];
      return;
    }

    this.loading.projects = true;
    this.projectService.getProjectsProgram(this.selectedProgramId).subscribe({
      next: (data) => {
        this.projects = data;
        this.loading.projects = false;
        this.selectedProjectId = null; // Reset project selection
        this.profiles = []; // Reset profiles
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading.projects = false;
        this.showErrorMessage('Erreur lors du chargement des projets');
      }
    });
  }

  loadProjectsForProjectManager(): void {
    this.loading.projects = true;
    this.projectService.getProjectsForChief(this.connectedUser.id).subscribe({
      next: (data) => {
        this.projects = data;
        this.loading.projects = false;
      },
      error: (error) => {
        console.error('Error loading projects for project manager:', error);
        this.loading.projects = false;
        this.showErrorMessage('Erreur lors du chargement des projets');
      }
    });
  }

  onProjectChange(): void {
    if (!this.selectedProjectId) {
      this.profiles = [];
      return;
    }

    this.loading.profiles = true;
    this.projectService.getProjectProfiles(this.selectedProjectId).subscribe({
      next: (response) => {
        this.profiles = response.map((item: any) => ({
          idp: item[0].idp,
          image: item[0].image,
          firstname: item[0].firstname,
          lastname: item[0].lastname,
          function: item[4],
          selected: false
        }));
        this.loading.profiles = false;
        this.selectedProfileIds = []; // Reset profile selection
        this.profileTasksMap.clear(); // Clear tasks
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.loading.profiles = false;
        this.showErrorMessage('Erreur lors du chargement des profils');
      }
    });
  }  onProfileSelectionChange(profileId: number, isChecked: boolean): void {
    if (isChecked) {
      if (!this.selectedProfileIds.includes(profileId)) {
        this.selectedProfileIds.push(profileId);
      }
    } else {
      this.selectedProfileIds = this.selectedProfileIds.filter(id => id !== profileId);
      // Clean up when profile is deselected
      this.profileTasksMap.delete(profileId);
      this.profileTasksLoading.delete(profileId);
      this.clearValidationErrorsForProfile(profileId);
    }

    // Load tasks for newly selected profiles
    if (isChecked) {
      this.loadTasksForProfile(profileId);
    }
  }

  onDateFilterChange(): void {
    // Format month-year string (e.g., "05-2023")
    const monthString = (this.selectedMonth + 1).toString().padStart(2, '0');
    const monthYearString = `${monthString}/${this.selectedYear}`;

    // Reload tasks for all selected profiles
    this.selectedProfileIds.forEach(profileId => {
      this.loadTasksForProfileByMonth(profileId, monthYearString);
    });
  }

  loadTasksForProfile(profileId: number): void {
    const monthString = (this.selectedMonth + 1).toString().padStart(2, '0');
    const monthYearString = `${monthString}/${this.selectedYear}`;
    this.loadTasksForProfileByMonth(profileId, monthYearString);
  }  loadTasksForProfileByMonth(profileId: number, monthYear: string): void {
    this.loading.tasks = true;
    this.profileTasksLoading.add(profileId);
    console.log(`Loading tasks for profile ${profileId} for month ${monthYear}`);
    this.eventService.getTasksAndProjectIdByMonthAndProfile(monthYear, profileId).subscribe({
      next: (tasks) => {
        this.profileTasksMap.set(profileId, tasks);
        this.profileTasksLoading.delete(profileId);
        console.log("this all task ",this.profileTasksMap);
        this.loading.tasks = false;

        // Revalidate assignments for this profile now that tasks are loaded
        this.revalidateAssignmentsForProfile(profileId);
      },
      error: (error) => {
        console.error(`Error loading tasks for profile ${profileId}:`, error);
        this.profileTasksLoading.delete(profileId);
        this.loading.tasks = false;
        this.showErrorMessage('Erreur lors du chargement des tâches');
      }
    });
  }

  loadCategories(): void {
    this.loading.categories = true;
    this.categorieService.getAllCategories().subscribe({
      next: (data) => {
        console.log('Categories loaded:', data);
        this.categories = data;
        this.loading.categories = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading.categories = false;
        this.showErrorMessage('Erreur lors du chargement des catégories');
      }
    });
  }

  loadActiviteDictionnaires(): void {
    this.loading.activities = true;
    this.activiteDictionnaireService.getAllActiviteDictionnaires().subscribe({
      next: (data) => {
        console.log('Activities loaded:', data);
        this.activiteDictionnaires = data;
        this.loading.activities = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.loading.activities = false;
        this.showErrorMessage('Erreur lors du chargement des activités');
      }
    });
  }

  getActivitiesByCategory(categoryId: number): ActiviteDictionnaire[] {
    return this.activiteDictionnaires.filter(
      activity => activity.categorie && activity.categorie.id === categoryId
    );
  }  // Track if a selection change is in progress to prevent flickering
  private selectionChangeInProgress = false;


  /**
   * Toggle activity selection with a single click
   * Fixed to ensure single clicks work and the whole row is clickable
   *
   * @param activityId The ID of the activity to toggle
   * @param event The click/selection event (optional)
   */
  toggleActivitySelection(activityId: number, event?: any): void {
    // Always prevent default behavior and stop event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Skip if already processing a selection to prevent rapid clicking issues
    if (this.selectionChangeInProgress) {
      return;
    }

    // Set flag immediately to block other selection attempts
    this.selectionChangeInProgress = true;

    // Update the selection state immediately for better UI responsiveness
    const index = this.selectedActiviteDictionnaireIds.indexOf(activityId);

    if (index === -1) {
      // Add activity to selections
      this.selectedActiviteDictionnaireIds = [...this.selectedActiviteDictionnaireIds, activityId];
    } else {
      // Remove activity from selections
      this.selectedActiviteDictionnaireIds = this.selectedActiviteDictionnaireIds.filter(id => id !== activityId);
    }

    // Reset the selection flag after a short delay to allow UI to stabilize
    setTimeout(() => {
      this.selectionChangeInProgress = false;
    }, 50);
  }
  /**
   * Check if an activity is selected with additional safeguards against false positives/negatives
   */
  isActivitySelected(activityId: number): boolean {
    // Ensure we're working with a valid ID
    if (activityId === undefined || activityId === null) {
      return false;
    }

    // Check if the activity ID is in our selection array
    const isSelected = this.selectedActiviteDictionnaireIds.includes(activityId);

    // Extra check to ensure selection state consistency
    // (This helps prevent UI state inconsistencies that can lead to flickering)
    if (this.selectionChangeInProgress) {
      return isSelected;
    }

    return isSelected;
  }
  hasDateConflict(profileId: number, date: Date | null): boolean {
    if (!date || !this.profileTasksMap.has(profileId)) {
      return false;
    }

    const selectedDateStr = date.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
    const tasks = this.profileTasksMap.get(profileId) || [];

    return tasks.some(task => {
      const taskDateStr = new Date(task.datte).toISOString().split('T')[0];
      return taskDateStr === selectedDateStr;
    });
  }
  // Category CRUD operations
  openCategoryDialog(category?: Categorie): void {
    const dialogRef = this.dialog.open(ActivityDialogComponent, {
      width: '500px',
      data: {
        isCategory: true,
        editMode: !!category,
        item: category
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (category) {
          // Update existing category
          this.categorieService.updateCategorie(category.id!, result).subscribe({
            next: () => {
              this.showSuccessMessage('Catégorie mise à jour avec succès');
              this.loadCategories();
              this.loadActiviteDictionnaires();
            },
            error: (error) => {
              console.error('Error updating category:', error);
              this.showErrorMessage('Erreur lors de la mise à jour de la catégorie');
            }
          });
        } else {
          // Create new category
          this.categorieService.createCategorie(result).subscribe({
            next: () => {
              this.showSuccessMessage('Catégorie créée avec succès');
              this.loadCategories();
            },
            error: (error) => {
              console.error('Error creating category:', error);
              this.showErrorMessage('Erreur lors de la création de la catégorie');
            }
          });
        }
      }
    });
  }  deleteCategory(category: Categorie): void {
    this.alertService.custom({
      title: 'Confirmation de suppression',
      text: `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" et toutes ses activités associées?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#FF5C5C'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categorieService.deleteCategorie(category.id!).subscribe({
          next: () => {
            this.showSuccessMessage('Catégorie supprimée avec succès');
            this.loadCategories();
            this.loadActiviteDictionnaires();
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.showErrorMessage('Erreur lors de la suppression de la catégorie');
          }
        });
      }
    });
  }

  // Activity CRUD operations
  openActivityDialog(categoryId?: number, activity?: ActiviteDictionnaire): void {
    const dialogRef = this.dialog.open(ActivityDialogComponent, {
      width: '500px',
      data: {
        isCategory: false,
        editMode: !!activity,
        categories: this.categories,
        item: activity
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (activity) {
          // Update existing activity
          this.activiteDictionnaireService.updateActiviteDictionnaire(activity.id!, result).subscribe({
            next: () => {
              this.showSuccessMessage('Activité mise à jour avec succès');
              this.loadActiviteDictionnaires();
            },
            error: (error) => {
              console.error('Error updating activity:', error);
              this.showErrorMessage('Erreur lors de la mise à jour de l\'activité');
            }
          });
        } else if (categoryId) {
          // Create new activity
          this.activiteDictionnaireService.createActiviteDictionnaire(categoryId, result).subscribe({
            next: () => {
              this.showSuccessMessage('Activité créée avec succès');
              this.loadActiviteDictionnaires();
            },
            error: (error) => {
              console.error('Error creating activity:', error);
              this.showErrorMessage('Erreur lors de la création de l\'activité');
            }
          });
        }
      }
    });
  }  deleteActivity(activity: ActiviteDictionnaire): void {
    this.alertService.custom({
      title: 'Confirmation de suppression',
      text: `Êtes-vous sûr de vouloir supprimer l'activité "${activity.description}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#FF5C5C'
    }).then((result) => {
      if (result.isConfirmed) {
        this.activiteDictionnaireService.deleteActiviteDictionnaire(activity.id!).subscribe({
          next: () => {
            this.showSuccessMessage('Activité supprimée avec succès');
            this.loadActiviteDictionnaires();
          },
          error: (error) => {
            console.error('Error deleting activity:', error);
            this.showErrorMessage('Erreur lors de la suppression de l\'activité');
          }
        });
      }
    });
  }  assignTasks(): void {
    if (this.profileActivityAssignments.length === 0) {
      this.showWarningMessage('Veuillez assigner au moins une activité à un profil');
      return;
    }

    // Final validation check before assignment
    if (this.hasDateValidationErrors()) {
      this.showErrorMessage('Veuillez corriger les erreurs de validation avant d\'assigner les tâches');
      return;
    }    // Additional validation: check each assignment individually
    const invalidAssignments = this.profileActivityAssignments.filter(assignment => {
      const validation = this.validateDateForProfile(assignment.date, assignment.profileId);
      return !validation.isValid;
    });

    if (invalidAssignments.length > 0) {
      this.showErrorMessage(`${invalidAssignments.length} assignation(s) ont des dates invalides. Veuillez corriger les erreurs avant de continuer.`);
      return;
    }

    // Get all unique profile IDs from the assignments
    const profileIds = [...new Set(this.profileActivityAssignments.map(a => a.profileId))];

    // Track successful and failed assignments
    let successCount = 0;
    let failureCount = 0;
    let totalAssignments = this.profileActivityAssignments.length;

    // For each profile-activity assignment, create a task
    this.profileActivityAssignments.forEach(assignment => {
      const { profileId, activityId, date } = assignment;

      // Check for date conflict
      if (this.hasDateConflict(profileId, date)) {
        failureCount++;
        const profileName = this.getProfileName(profileId);
        const activityName = this.getActivityDescription(activityId);
        this.showWarningMessage(`Conflit de date pour ${profileName} avec l'activité "${activityName}" à la date ${date.toLocaleDateString()}`);
        return;
      }

      // Get activity description
      const activity = this.activiteDictionnaires.find(a => a.id === activityId);
      if (!activity) {
        failureCount++;
        console.error(`Activity with ID ${activityId} not found`);
        return;
      }      const task = {
        datte: date.toISOString().split('T')[0], // Format as 'YYYY-MM-DD'
        nbJour: assignment.nbJour, // Use the selected day value
        text: activity.description,
        workPlace: assignment.workPlace // Use the selected workplace
      };

      this.eventService.addTask(task, this.selectedProjectId!, profileId).subscribe({
        next: () => {
          successCount++;
          if (successCount + failureCount === totalAssignments) {
            if (successCount > 0) {
              const monthName = this.months[this.selectedMonth].name;
              this.alertService.success(
                `Tâches assignées`,
                `${successCount} tâche(s) assignée(s) avec succès pour ${monthName} ${this.selectedYear}`
              );
            }
            this.refreshTasks();
          }
        },
        error: (error) => {
          failureCount++;
          console.error(`Error assigning task for profile ${profileId}:`, error);
          const profileName = this.getProfileName(profileId);
          const activityName = this.getActivityDescription(activityId);
          this.alertService.error(`Erreur d'assignation`, `Échec de l'assignation de "${activityName}" pour ${profileName}`);
        }
      });
    });
  }
  refreshTasks(): void {
    // Reload tasks for all selected profiles
    this.onDateFilterChange();
  }

  // Profile navigation methods
  setCurrentProfile(index: number): void {
    if (index >= 0 && index < this.selectedProfileIds.length) {
      this.currentProfileIndex = index;
      this.pageIndex = 0; // Reset pagination when switching profiles
    }
  }  // Pagination methods
  onPageChange(e: PageEvent): void {
    // Store old values before updating
    const oldPageSize = this.pageSize;

    // Update with new values from the event
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;    // If page size changed, we may need to adjust the current page
    if (oldPageSize !== this.pageSize) {
      const tasks = this.profileTasksMap.get(this.currentProfileId);
      if (tasks && tasks.length > 0) {
        // Calculate max possible page index with new page size
        const maxPageIndex = Math.ceil(tasks.length / this.pageSize) - 1;
        // Adjust page index if needed
        if (this.pageIndex > maxPageIndex) {
          this.pageIndex = maxPageIndex;
        }

        // Show notification about changed page size
        this.alertService.success('Pagination', `Affichage modifié à ${this.pageSize} éléments par page`);
      }
    }

    // Force refresh of the component to ensure the paginator stays visible
    setTimeout(() => {
      // This timeout ensures Angular completes its change detection cycle
      console.log(`Page changed: index=${this.pageIndex}, size=${this.pageSize}`);
    }, 0);
  }
  getPaginatedTasks(): any[] {
    if (!this.profileTasksMap.get(this.currentProfileId) || !this.profileTasksMap.get(this.currentProfileId)!.length) {
      return [];
    }

    const tasks = this.profileTasksMap.get(this.currentProfileId)!;
    const start = this.pageIndex * this.pageSize;
    const slicedTasks = tasks.slice(start, start + this.pageSize);

    // Ensure we have valid data after changing page size
    if (slicedTasks.length === 0 && this.pageIndex > 0) {
      // If we have no tasks for the current page index, reset to page 0
      this.pageIndex = 0;
      return tasks.slice(0, this.pageSize);
    }

    return slicedTasks;
  }

  // Helper methods for paginator
  getTasksLength(): number {
    if (!this.profileTasksMap.get(this.currentProfileId)) {
      return 0;
    }
    return this.profileTasksMap.get(this.currentProfileId)!.length;
  }

  getValidPageIndex(): number {
    if (!this.profileTasksMap.get(this.currentProfileId)) {
      return 0;
    }

    const tasks = this.profileTasksMap.get(this.currentProfileId)!;
    const maxPageIndex = Math.ceil(tasks.length / this.pageSize) - 1;

    // Make sure page index is not out of bounds
    if (this.pageIndex > maxPageIndex) {
      return Math.max(0, maxPageIndex);
    }

    return this.pageIndex;
  }

  showSuccessMessage(message: string): void {
    this.alertService.success('Succès', message);
  }

  getProfileName(profileId: number): string {
    const profile = this.profiles.find(p => p.idp === profileId);
    if (profile) {
      return `${profile.firstname} ${profile.lastname}`;
    }
    return `Profil #${profileId}`;
  }

  getActivityDescription(activityId: number): string {
    const activity = this.activiteDictionnaires.find(a => a.id === activityId);
    return activity ? activity.description : `Activité #${activityId}`;
  }
  showErrorMessage(message: string): void {
    this.alertService.error('Erreur', message);
  }

  showWarningMessage(message: string): void {
    this.alertService.warning('Attention', message);
  }
  // Enhanced track by functions for improved rendering performance and selection stability
  trackByActivityId(index: number, activity: ActiviteDictionnaire): number | string {
    // Ensure we always have a reliable identifier
    if (activity && activity.id !== undefined && activity.id !== null) {
      return activity.id;
    }
    // Fall back to a combination of description and index if ID is missing
    if (activity && activity.description) {
      return `${activity.description}-${index}`;
    }
    return index;
  }

  trackByCategoryId(index: number, category: Categorie): number | string {
    // Ensure we always have a reliable identifier
    if (category && category.id !== undefined && category.id !== null) {
      return category.id;
    }
    // Fall back to a combination of name and index if ID is missing
    if (category && category.name) {
      return `${category.name}-${index}`;
    }
    return index;
  }

  trackByProfileId(index: number, profile: any): number | string {
    // Ensure we always have a reliable identifier
    if (profile && profile.idp !== undefined && profile.idp !== null) {
      return profile.idp;
    }
    // Fall back to a combination of name and index if ID is missing
    if (profile && profile.firstname && profile.lastname) {
      return `${profile.firstname}-${profile.lastname}-${index}`;
    }
    return index;
  }

  // Enhanced track by function for activity IDs
  trackById(index: number, id: number): number | string {
    if (id !== undefined && id !== null) {
      // Force string conversion to avoid reference equality issues
      return `id-${id}`;
    }
    return `index-${index}`;
  }

  // Check if a specific profile-activity combination is assigned
  isProfileActivityAssigned(profileId: number, activityId: number): boolean {
    return this.profileActivityAssignments.some(
      assignment => assignment.profileId === profileId && assignment.activityId === activityId
    );
  }

  // Get the date for a specific profile-activity assignment
  getProfileActivityDate(profileId: number, activityId: number): Date | null {
    const assignment = this.profileActivityAssignments.find(
      a => a.profileId === profileId && a.activityId === activityId
    );
    return assignment ? assignment.date : null;
  }  // Toggle assignment for a profile-activity combination
  toggleProfileActivityAssignment(profileId: number, activityId: number, date: Date): void {
    // Check if tasks are still loading for this profile
    if (this.profileTasksLoading.has(profileId)) {
      this.showWarningMessage('Veuillez attendre que les tâches du profil soient chargées avant d\'assigner une date');
      return;
    }

    const validation = this.validateDateForProfile(date, profileId);
    if (!validation.isValid) {
      // Show warning message to user about the validation failure
      this.showWarningMessage(`Date invalide: ${validation.error}`);
      // Note: validation errors are now stored in validateDateForProfile method
      return;
    }

    // Clear any validation errors for this profile since the date is now valid
    // (this is now handled in validateDateForProfile method)

    const existingIndex = this.profileActivityAssignments.findIndex(
      a => a.profileId === profileId && a.activityId === activityId
    );

    if (existingIndex === -1) {
      // Add new assignment
      this.profileActivityAssignments.push({
        profileId,
        activityId,
        date,
        workPlace: 'EY', // Default to 'EY'
        nbJour: 1        // Default to 1 day
      });
    } else {
      // Update date if it exists
      this.profileActivityAssignments[existingIndex].date = date;
    }    // After updating assignments, validate all assignments
    this.validateAssignments();
  }
  // Remove a specific profile-activity assignment
  removeProfileActivityAssignment(profileId: number, activityId: number): void {
    this.profileActivityAssignments = this.profileActivityAssignments.filter(
      a => !(a.profileId === profileId && a.activityId === activityId)
    );

    this.validateAssignments();
  }  // Consolidated validation error storage
  validationErrors: { [key: string]: string[] } = {};

  // Legacy error storage for compatibility
  assignmentValidationErrors: { [key: string]: string[] } = {};
  dateValidationErrors: { [key: string]: string[] } = {};  // Validate a specific date for a profile with comprehensive checks
  validateDateForProfile(date: Date, profileId: number): { isValid: boolean; error?: string } {
    const errors: string[] = [];

    // Check if tasks are still loading for this profile
    if (this.profileTasksLoading.has(profileId)) {
      errors.push('Les tâches sont en cours de chargement pour ce profil');
      return { isValid: false, error: errors.join(', ') };
    }

    // Weekend validation
    const day = date.getDay();
    if (day === 0 || day === 6) {
      const dayName = day === 0 ? 'dimanche' : 'samedi';
      const formattedDate = this.formatDateDisplay(date);
      errors.push(`Les weekends ne sont pas autorisés (${formattedDate} est un ${dayName})`);
    }

    // Holiday validation
    const dateMonth = date.getMonth() + 1;
    const dateDay = date.getDate();
    const holiday = TUNISIAN_HOLIDAYS.find(holiday => holiday.month === dateMonth && holiday.day === dateDay);
    if (holiday) {
      const formattedDate = this.formatDateDisplay(date);
      errors.push(`Cette date est un jour férié: ${holiday.name} (${formattedDate})`);
    }

    // Check for existing tasks (only if tasks are loaded)
    if (this.areTasksLoadedForProfile(profileId)) {
      const existingTasks = this.profileTasksMap.get(profileId) || [];
      const dateStr = date.toISOString().split('T')[0];
      const hasExistingTask = existingTasks.some(task => {
        const taskDate = new Date(task.datte);
        return taskDate.toISOString().split('T')[0] === dateStr;
      });

      if (hasExistingTask) {
        const formattedDate = this.formatDateDisplay(date);
        errors.push(`Une tâche existe déjà pour cette date (${formattedDate})`);
      }
    }

    return {
      isValid: errors.length === 0,
      error: errors.join(', ')
    };
  }
  validateAssignments() {
    // Reset errors
    this.assignmentValidationErrors = {};
    this.dateValidationErrors = {};

    const datePipe = new DatePipe('en-US');
    const assignmentsByProfile: {[profileId: number]: Array<{date: string, activityId: number}>} = {};

    // First pass: Group assignments by profile
    for (const assignment of this.profileActivityAssignments) {
      if (!assignmentsByProfile[assignment.profileId]) {
        assignmentsByProfile[assignment.profileId] = [];
      }
      const dateStr = datePipe.transform(assignment.date, 'yyyy-MM-dd')!;
      assignmentsByProfile[assignment.profileId].push({
        date: dateStr,
        activityId: assignment.activityId
      });
    }

    // Second pass: Validate each assignment
    for (const assignment of this.profileActivityAssignments) {
      const errors: string[] = [];
      const dateStr = datePipe.transform(assignment.date, 'yyyy-MM-dd')!;
      const profileAssignments = assignmentsByProfile[assignment.profileId];

      // Check for duplicate assignments on the same date for this profile
      const duplicateDates = profileAssignments.filter(a => a.date === dateStr);
      if (duplicateDates.length > 1) {
        errors.push('Plusieurs tâches assignées à la même date');
      }

      // Check for conflict with existing tasks
      const existingTasks = this.profileTasksMap.get(assignment.profileId) || [];
      const hasExistingTask = existingTasks.some(task => {
        const taskDate = datePipe.transform(new Date(task.datte), 'yyyy-MM-dd');
        return taskDate === dateStr;
      });      if (hasExistingTask) {
        const formattedDate = this.formatDateDisplay(assignment.date);
        errors.push(`Une tâche existe déjà pour cette date (${formattedDate})`);
      }// Weekend validation
      const date = assignment.date;
      const day = date.getDay();
      if (day === 0 || day === 6) {
        const dayName = day === 0 ? 'dimanche' : 'samedi';
        const formattedDate = this.formatDateDisplay(date);
        errors.push(`Les weekends ne sont pas autorisés (${formattedDate} est un ${dayName})`);
      }

      // Holiday validation
      const dateMonth = date.getMonth() + 1;
      const dateDay = date.getDate();
      const holiday = TUNISIAN_HOLIDAYS.find(holiday => holiday.month === dateMonth && holiday.day === dateDay);
      if (holiday) {
        const formattedDate = this.formatDateDisplay(date);
        errors.push(`Cette date est un jour férié: ${holiday.name} (${formattedDate})`);
      }

      // Store errors by both profile-activity and profile
      if (errors.length > 0) {
        // Store for specific profile-activity combination
        this.assignmentValidationErrors[`${assignment.profileId}_${assignment.activityId}`] = errors;

        // Store for profile (used in the error message section)
        const profileErrors = this.dateValidationErrors[`${assignment.profileId}`] || [];
        const activityDesc = this.getActivityDescription(assignment.activityId);
        errors.forEach(error => {
          profileErrors.push(`${activityDesc}: ${error}`);
        });
        this.dateValidationErrors[`${assignment.profileId}`] = profileErrors;
      }
    }
  }

  hasAnyAssignmentError(): boolean {
    return Object.keys(this.assignmentValidationErrors).length > 0;
  }

  getAssignmentErrors(profileId: number, activityId: number): string[] {
    return this.assignmentValidationErrors[`${profileId}_${activityId}`] || [];
  }
  // Get the day value for a specific profile-activity assignment
  getProfileActivityNbJour(profileId: number, activityId: number): number {
    const assignment = this.profileActivityAssignments.find(
      a => a.profileId === profileId && a.activityId === activityId
    );
    return assignment ? assignment.nbJour : 1; // Default to 1 if not set
  }

  // Update the day value for a specific profile-activity assignment
  updateProfileActivityNbJour(profileId: number, activityId: number, nbJour: number): void {
    const existingAssignment = this.profileActivityAssignments.find(
      a => a.profileId === profileId && a.activityId === activityId
    );

    if (existingAssignment) {
      existingAssignment.nbJour = nbJour;
      this.validateAssignments();
    }
  }  // Helper method to format date for display
  formatDateDisplay(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Helper method to get holiday name for a specific date
  getHolidayName(date: Date): string | null {
    const dateMonth = date.getMonth() + 1;
    const dateDay = date.getDate();
    const holiday = TUNISIAN_HOLIDAYS.find(holiday => holiday.month === dateMonth && holiday.day === dateDay);
    return holiday ? holiday.name : null;
  }

  // Helper method to check if a date is a weekend
  isWeekend(date: Date | null): boolean {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  // Helper method to check if a date is a holiday
  isHoliday(date: Date | null): boolean {
    if (!date) return false;
    const dateMonth = date.getMonth() + 1;
    const dateDay = date.getDate();
    return TUNISIAN_HOLIDAYS.some(holiday => holiday.month === dateMonth && holiday.day === dateDay);
  }

  // Method to get errors for a profile
  getDateValidationErrors(profileId: number): string[] {
    return this.dateValidationErrors[`${profileId}`] || [];
  }

  // Method to check if there are any validation errors
  hasDateValidationErrors(): boolean {
    return Object.values(this.dateValidationErrors).some(errors => (errors as string[]).length > 0);
  }

  // Get the work place (location) for a specific profile-activity assignment
  getProfileActivityWorkPlace(profileId: number, activityId: number): string {
    const assignment = this.profileActivityAssignments.find(
      a => a.profileId === profileId && a.activityId === activityId
    );
    return assignment ? assignment.workPlace : 'EY'; // Default to 'EY' if not set
  }

  // Update the work place (location) for a specific profile-activity assignment
  updateProfileActivityWorkPlace(profileId: number, activityId: number, workPlace: string): void {
    const existingAssignment = this.profileActivityAssignments.find(
      a => a.profileId === profileId && a.activityId === activityId
    );

    if (existingAssignment) {
      existingAssignment.workPlace = workPlace;
    }
    // Validate after updating
    this.validateAssignments();
  }  // Handle date selection for assignments
  onDateSelection(date: Date | null, profileId: number): void {
    if (!date) {
      return;
    }

    const validation = this.validateDateForProfile(date, profileId);
    if (!validation.isValid) {
      // Show warning message to user
      this.showWarningMessage(`Date invalide: ${validation.error}`);

      // Store the validation error for UI display
      this.dateValidationErrors[`${profileId}`] = [validation.error!];

      // Don't set the assignment date if invalid
      return;
    }

    // Clear errors if date is valid
    this.clearValidationErrorsForProfile(profileId);
    this.assignmentDate = date;
  }
  // Handle date change for profile-activity assignments (replaces separate onDateSelection + toggleProfileActivityAssignment calls)
  handleDateChange(date: Date | null, profileId: number, activityId: number): void {
    if (!date) {
      // If date is cleared, remove the assignment
      this.removeProfileActivityAssignment(profileId, activityId);
      return;
    }

    // Check if tasks are still loading for this profile
    if (this.profileTasksLoading.has(profileId)) {
      this.showWarningMessage('Veuillez attendre que les tâches du profil soient chargées avant d\'assigner une date');
      return;
    }

    const validation = this.validateDateForProfile(date, profileId);
    if (!validation.isValid) {
      // Show warning message to user about the validation failure
      this.showWarningMessage(`Date invalide: ${validation.error}`);

      // Store the validation error for this specific profile-activity combination
      this.assignmentValidationErrors[`${profileId}_${activityId}`] = [validation.error!];

      // Don't create/update the assignment if the date is invalid
      return;
    }

    // Only clear validation errors for this specific profile-activity combination
    this.clearValidationErrorsForProfileActivity(profileId, activityId);

    const existingIndex = this.profileActivityAssignments.findIndex(
      a => a.profileId === profileId && a.activityId === activityId
    );

    if (existingIndex === -1) {
      // Add new assignment
      this.profileActivityAssignments.push({
        profileId,
        activityId,
        date,
        workPlace: 'EY', // Default to 'EY'
        nbJour: 1        // Default to 1 day
      });
    } else {
      // Update date if it exists
      this.profileActivityAssignments[existingIndex].date = date;
    }

    // After updating assignments, validate all assignments to refresh the complete validation state
    this.validateAssignments();
  }
  // Helper method to clear validation errors for a specific profile
  private clearValidationErrorsForProfile(profileId: number): void {
    delete this.dateValidationErrors[`${profileId}`];

    // Remove profile-specific assignment errors
    Object.keys(this.assignmentValidationErrors).forEach(key => {
      if (key.startsWith(`${profileId}_`)) {
        delete this.assignmentValidationErrors[key];
      }
    });
  }

  // Helper method to clear validation errors for a specific profile-activity combination only
  private clearValidationErrorsForProfileActivity(profileId: number, activityId: number): void {
    // Remove the specific profile-activity error
    const errorKey = `${profileId}_${activityId}`;
    delete this.assignmentValidationErrors[errorKey];

    // Note: We don't clear the profile-level errors here because other activities
    // for the same profile might still have validation errors. The validateAssignments()
    // method will rebuild the profile-level errors correctly.
  }

  // Helper method to revalidate assignments for a specific profile after tasks are loaded
  private revalidateAssignmentsForProfile(profileId: number): void {
    const profileAssignments = this.profileActivityAssignments.filter(
      assignment => assignment.profileId === profileId
    );

    if (profileAssignments.length > 0) {
      // Clear existing errors for this profile
      this.clearValidationErrorsForProfile(profileId);

      // Revalidate all assignments for this profile
      this.validateAssignments();
    }
  }

  // Check if tasks are still loading for any selected profiles
  areTasksLoadingForAnyProfile(): boolean {
    return this.selectedProfileIds.some(profileId => this.profileTasksLoading.has(profileId));
  }

  // Check if tasks are loaded for a specific profile
  areTasksLoadedForProfile(profileId: number): boolean {
    return this.profileTasksMap.has(profileId) && !this.profileTasksLoading.has(profileId);
  }
}
