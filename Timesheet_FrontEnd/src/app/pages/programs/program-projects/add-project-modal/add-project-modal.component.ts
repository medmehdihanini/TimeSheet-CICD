import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { map, Observable, startWith } from 'rxjs';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-add-project-modal',
  templateUrl: './add-project-modal.component.html',
  styleUrls: ['./add-project-modal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,],
})
export class AddProjectModalComponent {
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  @Input() projectMnagersList: any[] = [];
  @Output() selectedItemChange: EventEmitter<any> = new EventEmitter();

  selectedItem: any;
  addProjectForm: FormGroup;
  myControl = new FormControl('');
  filteredOptions: Observable<any[]>;
  chefProjectId: any;
  isEditMode: boolean;
  userId: boolean = false;
  specialItem: any = { id: 'special-item', firstname: 'Autres', lastname: 'chefs' };
  isLoading: boolean = false;


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddProjectModalComponent>,
    private fb: FormBuilder,
    private profileserv: ProfileService,
    private projectserv: ProjectService,
    private alertService: AlertService
  ) {
    this.isEditMode = !!data.project;
    this.projectMnagersList = [...data.projectMnagersList, this.specialItem];  // Add special item
    this.addProjectForm = this.fb.group({
      name: ['', [Validators.required, onlyLettersNumbersSpacesAndSpecialChars]],
      description: ['', Validators.required],
    });

    if (this.isEditMode) {
      this.addProjectForm.patchValue({
        name: data.project.name,
        description: data.project.description,
      });
      this.displayProfileName(data.project.chefprojet);
    }

    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.projectMnagersList.filter((profile) =>
      `${profile.firstname} ${profile.lastname}`.toLowerCase().includes(filterValue)
    );
  }


  onOptionSelected(option: any): void {
    if (option.id === 'special-item') {
      // Prevent the specialItem from being selected in the input
      this.myControl.setValue('');  // Reset the input field to an empty string

      // Keep the autocomplete panel open
      setTimeout(() => {
        this.autocompleteTrigger.openPanel();  // Re-open the panel
      });

      // Load the new project managers list
      this.profileserv.getProjectManagers().subscribe({
        next: (newProjectManagersList) => {
          const existingIds = new Set(this.projectMnagersList.map(item => item.id || item.idp));
          this.projectMnagersList = newProjectManagersList.filter((item: any) => !existingIds.has(item.email || item.email));

          // Update filtered options for the new list
          this.filteredOptions = this.myControl.valueChanges.pipe(
            startWith(''),
            map((value) => this._filter(value || ''))
          );

          // Trigger change detection to update the panel
          setTimeout(() => {
            this.autocompleteTrigger.openPanel();  // Ensure the panel is updated with new options
          });
        },
        error: (error) => {
          console.error('Error loading new project managers:', error);
        }
      });
    } else {
      // Handle normal option selection
      this.displayProfileName(option);
      this.chefProjectId = option.idp || option.id;
      this.userId = !option.idp;
    }
  }


  /*

  onOptionSelected(option: any): void {
    if (option.id === 'special-item') {
      // Load the new project managers list when special item is selected
      this.profileserv.getProjectManagers().subscribe({
        next: (newProjectManagersList) => {
          // Filter out items that are already in the first list (projectMnagersList)
          const existingIds = new Set(this.projectMnagersList.map(item => item.id || item.idp));
          this.projectMnagersList = newProjectManagersList.filter((item: any) => !existingIds.has(item.email || item.email));


          // Update filtered options for autocomplete
          this.filteredOptions = this.myControl.valueChanges.pipe(
            startWith(''),
            map((value) => this._filter(value || ''))
          );
        },
        error: (error) => {
          console.error('Error loading new project managers:', error);
        }
      });
    } else {
      this.displayProfileName(option);
      this.chefProjectId = option.idp || option.id;  // Ensure correct assignment of project manager id
      this.userId = !option.idp;
    }
  }*/


  displayProfileName(profile: any): string {
    return profile ? `${profile.firstname} ${profile.lastname}` : '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }
/*
  onSubmit(): void {
    if (this.isEditMode) {
      const projectId = this.data.project.idp;
      this.projectserv.updateProject(projectId, this.chefProjectId, this.addProjectForm.value).subscribe(
        (response) => {
          this.dialogRef.close(this.addProjectForm.value);
        },
        (error) => {
          alert(error.error || 'Erreur pendant la mise à jour du projet');
        }
      );
    } else {
      this.projectserv.addProgramProjectWithChefProject(this.addProjectForm.value, this.data.programId, this.chefProjectId, this.userId).subscribe(
        (response) => {
          this.dialogRef.close(this.addProjectForm.value);
        },
        (error) => {
          alert(error.error || 'Erreur pendant l\'ajout du projet');
        }
      );
    }
  }*/

    onSubmit(): void {
      // Disable the button and modal closing
      this.isLoading = true;
      this.dialogRef.disableClose = true; // Prevent modal close

      if (this.isEditMode) {
        const projectId = parseInt(this.data.project.idproject);
        console.log('CHef de Project:', this.chefProjectId);
        this.projectserv.updateProject(projectId, this.chefProjectId, this.addProjectForm.value).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.dialogRef.disableClose = false;
            this.dialogRef.close(this.addProjectForm.value);
            this.alertService.success('Succès', 'Le projet a été modifié avec succès');
          },
          error: (error) => {
            this.isLoading = false;
            this.dialogRef.disableClose = false;
            this.alertService.error(
              'Erreur',
              error.error || 'Une erreur est survenue lors de la modification du projet'
            );
          }
        });
      } else {
        this.projectserv.addProgramProjectWithChefProject(
          this.addProjectForm.value,
          this.data.programId,
          this.chefProjectId,
          this.userId
        ).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.dialogRef.disableClose = false;
            this.dialogRef.close(this.addProjectForm.value);
            this.alertService.success('Succès', 'Le projet a été ajouté avec succès');
          },
          error: (error) => {
            this.isLoading = false;
            this.dialogRef.disableClose = false;
            this.alertService.error(
              'Erreur',
              error.error || 'Une erreur est survenue lors de l\'ajout du projet'
            );
          }
        });
      }
    }
}

// Validation functions remain the same
function onlyLettersNumbersSpacesAndSpecialChars(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value;
  if (!/^[a-zA-Z0-9\s!@#$%^&*()_+{}\[\]:;"'<>,.?\/\\|\-À-ÿ]*$/.test(value)) {
    return { onlyLettersNumbersSpacesAndSpecialChars: true };
  }
  return null;
}
