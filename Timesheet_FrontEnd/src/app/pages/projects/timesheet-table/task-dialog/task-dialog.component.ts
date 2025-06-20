import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventService } from 'src/app/services/event/event.service';
import { MatIconModule } from '@angular/material/icon';
import { AlertService } from 'src/app/services/alert.service';
import { CategorieService } from 'src/app/services/Diction/categorie.service';
import { ActiviteDictionnaireService } from 'src/app/services/Diction/activite-dictionnaire.service';
import { Categorie, ActiviteDictionnaire } from 'src/app/models/Categorie';
import { Observable, startWith, map } from 'rxjs';

@Component({
  selector: 'app-task-dialog',
  templateUrl: './task-dialog.component.html',
  styleUrls: ['./task-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule,
  ],
})
export class TaskDialogComponent implements OnInit {
  profileId: any;
  projectId: any;
  datte: any;
  duplicated: boolean;
  addTaskForm: FormGroup;
  isUpdateMode: boolean;
  taskId: number;

  // Dictionary-related properties
  categories: Categorie[] = [];
  activities: ActiviteDictionnaire[] = [];
  filteredActivities: Observable<ActiviteDictionnaire[]>;
  selectedCategory: Categorie | null = null;
  inputMode: 'manual' | 'dictionary' = 'manual';
  isAddingActivity = false;
  isLoadingActivities = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<TaskDialogComponent>,
    private fb: FormBuilder,
    private eventserv: EventService,
    private alertService: AlertService,
    private categorieService: CategorieService,
    private activiteService: ActiviteDictionnaireService
  ) {
    this.profileId = data.profileId;
    this.projectId = data.projectId;
    this.datte = data.datte;
    this.duplicated = data.duplicated;
    this.isUpdateMode = data.rowData !== undefined;

    this.addTaskForm = this.fb.group({
      datte: [this.datte, Validators.required],
      nbJour: ['', Validators.required],
      text: ['', Validators.required],
      workPlace: ['EY', Validators.required],
      activitySearch: [''],
      selectedCategory: [null],
      newActivityDescription: ['']
    });

    // Initialize filtered activities observable
    this.filteredActivities = this.addTaskForm.get('activitySearch')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterActivities(value || ''))
    );

    if (this.isUpdateMode) {
      this.taskId = data.rowData.idt;
      this.addTaskForm.patchValue({
        datte: data.rowData.Date,
        nbJour: data.rowData.nbDay,
        text: data.rowData.task,
        workPlace: data.rowData.workplace,
      });
    }
  }

  ngOnInit(): void {
    this.loadCategories();
    // Test if the service works at all
    console.log('🧪 Testing activite service...');
    this.activiteService.getAllActiviteDictionnaires().subscribe({
      next: (allActivities) => {
        console.log('🧪 All activities test:', allActivities);
      },
      error: (error) => {
        console.error('🧪 Error in getAllActiviteDictionnaires test:', error);
      }
    });

    // Listen to form control changes for selectedCategory
    this.addTaskForm.get('selectedCategory')?.valueChanges.subscribe(category => {
      this.onCategoryChange(category);
    });
  }

  private loadCategories(): void {
    console.log('Loading categories...');
    this.categorieService.getAllCategories().subscribe({
      next: (categories) => {
        console.log('Categories loaded:', categories);
        this.categories = categories || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
        this.alertService.error('Erreur', 'Impossible de charger les catégories');
      }
    });
  }

  private loadActivitiesForCategory(categoryId: number): void {
    console.log('🔄 Loading activities for category ID:', categoryId);
    this.isLoadingActivities = true;
    this.activities = []; // Clear existing activities

    // Add a timeout to simulate network delay for testing
    console.log('📡 Making API call to getActiviteDictionnairesByCategorie...');

    this.activiteService.getActiviteDictionnairesByCategorie(categoryId).subscribe({
      next: (activities) => {
        console.log('✅ Activities loaded successfully:', activities);
        console.log('📊 Number of activities received:', activities?.length || 0);
        this.activities = activities || [];
        this.isLoadingActivities = false;
        console.log('🎯 Updated component activities array:', this.activities);
      },
      error: (error) => {
        console.error('❌ Error loading activities:', error);
        console.error('📋 Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        this.activities = [];
        this.isLoadingActivities = false;
        this.alertService.error('Erreur', `Impossible de charger les activités: ${error.message || 'Erreur inconnue'}`);
      }
    });
  }

  private _filterActivities(value: string): ActiviteDictionnaire[] {
    if (!value || typeof value !== 'string') {
      return this.activities.slice();
    }
    const filterValue = value.toLowerCase();
    return this.activities.filter(activity =>
      activity.description.toLowerCase().includes(filterValue)
    );
  }

  onInputModeChange(mode: 'manual' | 'dictionary'): void {
    this.inputMode = mode;
    if (mode === 'manual') {
      this.selectedCategory = null;
      this.activities = [];
      this.addTaskForm.get('activitySearch')?.setValue('');
    } else {
      // Clear the text field when switching to dictionary mode
      this.addTaskForm.get('text')?.setValue('');
    }
  }

  onCategoryChange(category: Categorie): void {
    console.log('Category changed:', category);
    this.selectedCategory = category;
    this.activities = [];
    this.addTaskForm.get('activitySearch')?.setValue('');

    if (category && category.id) {
      console.log('Loading activities for category:', category.name, 'ID:', category.id);
      this.loadActivitiesForCategory(category.id);
    } else {
      console.log('No category selected or category has no ID');
    }
  }

  onActivitySelected(activity: ActiviteDictionnaire): void {
    // Insert the selected activity into the main text field
    this.addTaskForm.get('text')?.setValue(activity.description);
    // Clear the search field
    this.addTaskForm.get('activitySearch')?.setValue('');
  }

  displayActivity(activity: ActiviteDictionnaire): string {
    return activity ? activity.description : '';
  }

  toggleAddActivity(): void {
    this.isAddingActivity = !this.isAddingActivity;
    if (!this.isAddingActivity) {
      this.addTaskForm.get('newActivityDescription')?.setValue('');
    }
  }

  addNewActivity(): void {
    const description = this.addTaskForm.get('newActivityDescription')?.value?.trim();
    if (!description) {
      this.alertService.error('Erreur', 'La description de l\'activité est requise');
      return;
    }

    if (!this.selectedCategory || !this.selectedCategory.id) {
      this.alertService.error('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }

    const newActivity: ActiviteDictionnaire = {
      description: description
    };

    this.activiteService.createActiviteDictionnaire(this.selectedCategory.id, newActivity).subscribe({
      next: () => {
        this.alertService.success('Succès', 'Activité ajoutée avec succès');
        this.loadActivitiesForCategory(this.selectedCategory!.id!); // Reload activities
        this.toggleAddActivity();
        // Automatically select the new activity
        this.addTaskForm.get('text')?.setValue(newActivity.description);
      },
      error: (error) => {
        console.error('Error adding activity:', error);
        this.alertService.error('Erreur', 'Impossible d\'ajouter l\'activité');
      }
    });
  }

  deleteActivity(activity: ActiviteDictionnaire): void {
    if (!activity.id) {
      this.alertService.error('Erreur', 'Impossible de supprimer cette activité');
      return;
    }

    this.alertService.confirm(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer l'activité "${activity.description}" ?`
    ).then((result) => {
      if (result.isConfirmed) {
        this.activiteService.deleteActiviteDictionnaire(activity.id!).subscribe({
          next: () => {
            this.alertService.success('Succès', 'Activité supprimée avec succès');
            // Reload activities for the current category
            if (this.selectedCategory && this.selectedCategory.id) {
              this.loadActivitiesForCategory(this.selectedCategory.id);
            }
          },
          error: (error) => {
            console.error('Error deleting activity:', error);
            this.alertService.error('Erreur', 'Impossible de supprimer l\'activité');
          }
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.addTaskForm.valid) {
      if (this.isUpdateMode) {
        this.updateTask();
      } else {
        this.addTask();
      }
    }
  }

  private addTask(): void {
    const textValue = this.formatText(this.addTaskForm.get('text')?.value);
    this.addTaskForm.get('text')?.setValue(textValue);
    this.eventserv
      .addTask(this.addTaskForm.value, this.projectId, this.profileId)
      .subscribe(
        (response) => {
          this.alertService.success('Succès', 'Tâche ajoutée avec succès');
          this.dialogRef.close(this.addTaskForm.value);
        },
        (error) => {
          console.error('API Error:', error);
          this.alertService.error(
            'Erreur',
            error.error || 'Impossible d\'ajouter la tâche.'
          );
        }
      );
  }

  private updateTask(): void {
    const textValue = this.formatText(this.addTaskForm.get('text')?.value);
    this.addTaskForm.get('text')?.setValue(textValue);
    this.eventserv.updateTask(this.addTaskForm.value, this.taskId).subscribe(
      (response) => {
        this.alertService.success('Succès', 'Tâche mise à jour avec succès');
        this.dialogRef.close(this.addTaskForm.value);
      },
      (error) => {
        console.error('API Error:', error);
        this.alertService.error(
          'Erreur',
          error.error || 'Impossible de mettre à jour la tâche.'
        );
      }
    );
  }

  private formatText(text: string): string {
    return text.trim();
  }

  onDeleteTask() {
    this.alertService.confirm(
      'Confirmation de suppression',
      'Voulez-vous vraiment supprimer cette tâche ?'
    ).then((result) => {
      if (result.isConfirmed) {
        this.eventserv.deleteTask(this.taskId).subscribe(
          () => {
            this.alertService.success('Succès', 'Tâche supprimée avec succès');
            this.dialogRef.close();
            window.location.reload();
          },
          (error) => {
            this.alertService.error(
              'Erreur',
              error.error || 'Erreur lors de la suppression de la tâche'
            );
          }
        );
      }
    });
  }

}
