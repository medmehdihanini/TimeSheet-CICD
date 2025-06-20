import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ProgramProfileModalComponent } from '../program-profile-modal/program-profile-modal.component';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ProgramService } from 'src/app/services/programs/program.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { AlertService } from 'src/app/services/alert.service';
import { map, Observable, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-modify-profile-modal',
  templateUrl: './modify-profile-modal.component.html',
  styleUrls: ['./modify-profile-modal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,]
})
export class ModifyProfileModalComponent {
  profileId: any;
  projectId: any;
  addBudgetForm: FormGroup;
  oldBudget:number;
  context: 'Program' | 'project'
  dailyrate:any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ModifyProfileModalComponent>,
    private fb: FormBuilder,
    private progserv: ProgramService,
    private projectserv: ProjectService,
    private alertService: AlertService
  ) {
    this.context = data.context;
    this.profileId = data.idprofile;
    this.projectId = data.projectId;
    this.dailyrate = data.dailyrate

    // Set validators based on context
    const dailyrateValidators = this.context === 'project' ? [] : [Validators.required, onlyNumbers];

    this.addBudgetForm = this.fb.group({
      mandaybudget: [data.oldmanday, [Validators.required, onlyNumbers]],
      dailyrate: [data.dailyrate, dailyrateValidators],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    const mandaybudgetValue = Number(this.addBudgetForm.value.mandaybudget);
    if (this.context === 'project') {
      this.projectserv
        .updateProjectProfileMandaybudget(this.profileId, this.projectId, mandaybudgetValue)
        .subscribe(
          (response) => {
            this.alertService.success('Succès', 'Budget J/H ajouté avec succès !');
            this.dialogRef.close();
          },
          (error) => {
            this.alertService.error('Erreur', error.error || 'Erreur lors de la mise à jour du budget J/H');
          }
        );
    } else if (this.context === 'Program') {
      const daily = Number(this.addBudgetForm.value.dailyrate);
      this.progserv
        .updateProgramProfileMandaybudget(this.profileId, this.projectId, mandaybudgetValue, daily)
        .subscribe(
          (response) => {
            this.alertService.success('Succès', 'Budget J/H ajouté avec succès !');
            this.dialogRef.close();
          },
          (error) => {
            this.alertService.error('Erreur', error.error || 'Erreur lors de la mise à jour du budget J/H');
          }
        );
    }
  }
}

function onlyNumbers(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value;
  if (!/^\d+$/.test(value) || parseInt(value, 10) === 0) {
    return { onlyNumbers: true };
  }
  return null;
}
