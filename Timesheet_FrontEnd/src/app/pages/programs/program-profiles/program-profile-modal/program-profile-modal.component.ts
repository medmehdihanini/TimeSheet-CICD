import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ProgramService } from 'src/app/services/programs/program.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-program-profile-modal',
  templateUrl: './program-profile-modal.component.html',
  styleUrls: ['./program-profile-modal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
})
export class ProgramProfileModalComponent implements OnInit {
  programId: any;
  projectId: any;
  addProfileForm: FormGroup;
  profilesList: any[] = [];
  myControl = new FormControl('');
  filteredOptions: Observable<any[]>;
  context: 'program' | 'project' | 'projectManager';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ProgramProfileModalComponent>,
    private fb: FormBuilder,
    private progserv: ProgramService,
    private projectserv: ProjectService,
    private alertService: AlertService
  ) {
    this.context = data.context;
    this.programId = data.programId;
    this.projectId = data.projectId;
    this.profilesList = data.profilesList;

    // Initialize form controls based on context
    const baseControls = {
      idp: ['', Validators.required],
    };

    // Add additional controls based on context
    if (this.context === 'program') {
      Object.assign(baseControls, {
        mandaybudget: ['', [Validators.required, onlyNumbers]],
        dailyrate: ['', [Validators.required, onlyNumbers]],
        function: [
          '',
          [Validators.required, onlyLettersNumbersSpacesAndSpecialChars],
        ],
      });
    } else if (this.context === 'project') {
      Object.assign(baseControls, {
        mandaybudget: ['', [Validators.required, onlyNumbers]],
      });
    }

    this.addProfileForm = this.fb.group(baseControls);

    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
  }

  ngOnInit(): void {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    const idpValue = this.addProfileForm.value.idp;
    const mandaybudgetValue = this.addProfileForm.value.mandaybudget;
    const drValue = this.addProfileForm.value.dailyrate;
    const fnvalue = this.addProfileForm.value.function;
    if (this.context === 'program') {
      this.progserv
        .assignProfileProgram(
          idpValue,
          this.programId,
          mandaybudgetValue,
          drValue,
          fnvalue
        )
        .subscribe(
          (response) => {
            this.alertService.success(
              'Succès',
              'Profil ajouté avec succès au programme !'
            );
            this.dialogRef.close(this.addProfileForm.value);
          },
          (error) => {
            this.alertService.error(
              'Erreur',
              error.error || "Erreur lors de l'attribution du profil"
            );
          }
        );
    } else if (this.context === 'project') {
      this.projectserv
        .assignProfileToProject(idpValue, this.projectId, mandaybudgetValue)
        .subscribe(
          (response) => {
            this.alertService.success(
              'Succès',
              'Profil ajouté avec succès au projet !'
            );
            this.dialogRef.close(this.addProfileForm.value);
          },
          (error) => {
            this.alertService.error(
              'Erreur',
              error.error || "Erreur lors de l'attribution du profil"
            );
          }
        );
    } else if (this.context === 'projectManager') {
      this.projectserv
        .assignProjectManagerToProject(idpValue, this.projectId)
        .subscribe(
          (response) => {
            this.alertService.success(
              'Succès',
              'Chef de projet assigné avec succès !'
            );
            this.dialogRef.close(this.addProfileForm.value);
          },
          (error) => {
            this.alertService.error(
              'Erreur',
              error.error || "Erreur lors de l'assignation du chef de projet"
            );
          }
        );
    }
  }

  onOptionSelected(option: any): void {
    if (this.context === 'projectManager') {
      this.displayProfileName(option);
      this.addProfileForm.controls['idp'].setValue(option.id);
    } else {
      this.displayProfileName(option);
      this.addProfileForm.controls['idp'].setValue(option.idp);
    }
  }

  displayProfileName(profile: any): string {
    return profile ? `${profile.firstname} ${profile.lastname}` : '';
  }

  private _filter(value: string): any[] {
    const filterValue = value.trim().toLowerCase();
    return this.profilesList.filter((profile) =>
      `${profile.firstname.toLowerCase()} ${profile.lastname.toLowerCase()}`.includes(
        filterValue
      )
    );
  }
}

function onlyNumbers(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value;
  if (!/^\d+$/.test(value) || parseInt(value, 10) === 0) {
    return { onlyNumbers: true };
  }
  return null;
}
function onlyLettersNumbersSpacesAndSpecialChars(
  control: AbstractControl
): ValidationErrors | null {
  const value: string = control.value;
  // Updated regex to disallow numbers only
  if (
    !/^(?=.*[a-zA-Z])[a-zA-Z0-9\s!@#$%^&*()_+{}\[\]:;"'<>,.?\/\\|\-À-ÿ]*$/.test(
      value
    )
  ) {
    return { onlyLettersNumbersSpacesAndSpecialChars: true };
  }
  return null;
}
