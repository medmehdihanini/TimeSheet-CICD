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
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventService } from 'src/app/services/event/event.service';
import { MatIconModule } from '@angular/material/icon';
import { AlertService } from 'src/app/services/alert.service';
import { RagService, TaskSuggestion } from 'src/app/services/rag/rag.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { Observable } from 'rxjs';

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

  // RAG-related properties
  project: any = null;
  isLoadingSuggestions = false;
  suggestions: TaskSuggestion[] = [];
  showSuggestions = false;
  inputMode: 'manual' | 'suggestions' = 'manual';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<TaskDialogComponent>,
    private fb: FormBuilder,
    private eventserv: EventService,
    private alertService: AlertService,
    private ragService: RagService,
    private projectService: ProjectService
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
      workPlace: ['EY', Validators.required]
    });

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
    this.loadProjectDetails();
  }

  private loadProjectDetails(): void {
    this.projectService.getProjectDetails(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
        console.log('Project loaded for RAG:', this.project);
      },
      error: (error) => {
        console.error('Error loading project details:', error);
        this.alertService.error('Erreur', 'Impossible de charger les détails du projet');
      }
    });
  }

  onInputModeChange(mode: 'manual' | 'suggestions'): void {
    this.inputMode = mode;
    if (mode === 'suggestions' && !this.showSuggestions) {
      this.getSuggestions();
    } else if (mode === 'manual') {
      this.showSuggestions = false;
    }
  }

  getSuggestions(): void {
    if (!this.project) {
      this.alertService.error('Erreur', 'Les détails du projet ne sont pas encore chargés');
      return;
    }

    // Create project description from available project data
    const projectDescription = this.buildProjectDescription();

    if (!projectDescription.trim()) {
      this.alertService.error('Erreur', 'Aucune description de projet disponible pour générer des suggestions');
      return;
    }

    this.isLoadingSuggestions = true;
    this.suggestions = [];

    this.ragService.getSuggestionsWithValidation(projectDescription, 5, true).subscribe({
      next: (response) => {
        this.isLoadingSuggestions = false;

        if ('validationError' in response) {
          // Handle validation error
          const validationResult = response.validationError;
          if (!validationResult.should_process) {
            this.alertService.error(
              'Description insuffisante',
              'La description du projet n\'est pas suffisamment détaillée pour générer des suggestions pertinentes.'
            );
            this.inputMode = 'manual';
            return;
          }
        } else {
          // Handle successful suggestions
          this.suggestions = response.suggestions || [];
          this.showSuggestions = true;

          if (this.suggestions.length === 0) {
            this.alertService.success(
              'Aucune suggestion',
              'Aucune suggestion de tâche n\'a pu être générée pour ce projet.'
            );
          }
        }
      },
      error: (error) => {
        this.isLoadingSuggestions = false;
        console.error('Error getting RAG suggestions:', error);
        this.alertService.error(
          'Erreur de service',
          'Impossible de récupérer les suggestions. Veuillez réessayer plus tard.'
        );
        this.inputMode = 'manual';
      }
    });
  }

  private buildProjectDescription(): string {
    if (!this.project) return '';

    const parts: string[] = [];

    // Add project name
    if (this.project.name) {
      parts.push(`Project: ${this.project.name}`);
    }

    // Add project description if available
    if (this.project.description) {
      parts.push(`Description: ${this.project.description}`);
    }

    // Add program information if available
    if (this.project.program) {
      if (this.project.program.name) {
        parts.push(`Program: ${this.project.program.name}`);
      }
      if (this.project.program.description) {
        parts.push(`Program Description: ${this.project.program.description}`);
      }
    }

    // Add technology stack if available
    if (this.project.technologies) {
      parts.push(`Technologies: ${this.project.technologies}`);
    }

    // If no specific details are available, create a generic description
    if (parts.length === 0 && this.project.name) {
      parts.push(`Software development project: ${this.project.name}`);
    }

    return parts.join('. ');
  }

  selectSuggestion(suggestion: TaskSuggestion): void {
    this.addTaskForm.get('text')?.setValue(suggestion.task_text);
    this.showSuggestions = false;
    this.inputMode = 'manual'; // Switch back to manual mode after selection
  }

  refreshSuggestions(): void {
    this.getSuggestions();
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
