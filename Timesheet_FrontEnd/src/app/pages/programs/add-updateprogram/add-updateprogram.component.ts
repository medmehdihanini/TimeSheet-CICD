import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { MaterialModule } from 'src/app/MaterialModule';
import { MatSelectModule } from '@angular/material/select';
import { ProgramService } from 'src/app/services/programs/program.service';
import { AlertService } from 'src/app/services/alert.service';
import {
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

enum Status {
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  UNLAUNCHED = 'UNLAUNCHED',
  CANCELED = 'CANCELED',
  FINISHED = 'FINISHED',
}

@Component({
  selector: 'app-add-updateprogram',
  templateUrl: './add-updateprogram.component.html',
  styleUrls: ['./add-updateprogram.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
  ],

  providers: [
    { provide: NativeDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-TN' },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUpdateprogramComponent implements OnInit {
  programId: string | null = null;
  program: any;
  programForm: FormGroup;
  imageForm: FormGroup;
  chefprograms: any;
  statuses = Object.values(Status);
  progimage: any;

  constructor(
    private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<AddUpdateprogramComponent>,
    private buildr: FormBuilder,
    private service: UserserviceService,
    private profileserv: ProfileService,
    private progserv: ProgramService,
    private alertService: AlertService
  ) {
    this.programForm = this.buildr.group({
      numcontrat: ['', [Validators.required, onlyNumbers]],
      name: [
        '',
        [Validators.required, onlyLettersNumbersSpacesAndSpecialChars],
      ],
      status: [data.status, [Validators.required]],
      chefprogram: ['', [Validators.required]],
      startdate: new FormControl<Date | null>(null),
      enddate: new FormControl<Date | null>(null),
    });
    this.imageForm = this.buildr.group({
      image: ['', [Validators.required, this.validateImageType]],
    });
  }

  ngOnInit(): void {
    const parentRoute = this.route.parent;
    if (parentRoute) {
      this.programId = parentRoute.snapshot.paramMap.get('id');
      this.getprogramdetails();
      this.getProgramManagers();
    }
  }

  public getprogramdetails() {
    this.progserv.getOneProgram(this.programId).subscribe((response: any[]) => {
      this.program = response;
      this.programForm.patchValue({
        numcontrat: this.program.numcontrat,
        name: this.program.name,
        status: this.program.status,
        chefprogram: this.program.chefprogram,
      });
    });
  }

  public getProgramManagers() {
    this.progserv.getProgramManagers().subscribe((response: any[]) => {
      this.chefprograms = response;
    });
  }

  validateImageType(control: any) {
    const file = control.value;
    if (!file) {
      return null;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.indexOf(file.type) === -1) {
      return { invalidFileType: true };
    }
    return null;
  }

  formatDate(date: Date | null): string {
    if (!date) {
      return '';
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  public updateProgram() {
    if (this.programForm.valid) {
      const startdate = this.formatDate(
        this.programForm.get('startdate')?.value
      );
      const enddate = this.formatDate(this.programForm.get('enddate')?.value);

      const programData = {
        ...this.programForm.value,
        startdate: startdate,
        enddate: enddate,
      };
      this.progserv
        .updateProg(programData, this.programId)
        .subscribe(
          (response) => {
            this.alertService.success('Mise à jour effectuée avec succès !');
            this.ref.close();
          },
          (error) => {
            console.error('Error updating program', error);
            this.alertService.error('Erreur lors de la mise à jour du programme');
          }
        );
    }
  }

  public updateImage() {
    const imageFile = this.imageForm.get('image')?.value;
    this.progserv.addImageToProgram(this.programId, imageFile).subscribe(
      (response) => {
        this.alertService.success('Image mise à jour avec succès !');
        this.ref.close();
      },
      (error) => {
        console.error('Error uploading image', error);
        this.alertService.error('Erreur lors de la mise à jour de l\'image');
      }
    );
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.imageForm.patchValue({ image: file });
    }
  }
}

function onlyLettersNumbersSpacesAndSpecialChars(
  control: AbstractControl
): ValidationErrors | null {
  const value: string = control.value;
  // Adjust the regex to include letters including accented, numbers, spaces, and common special chars
  if (!/^[a-zA-Z0-9\s!@#$%^&*()_+{}\[\]:;"'<>,.?\/\\|\-À-ÿ]*$/.test(value)) {
    return { onlyLettersNumbersSpacesAndSpecialChars: true };
  }
  return null;
}
function onlyNumbers(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value;
  if (!/^\d+$/.test(value)) {
    return { onlyNumbers: true };
  }
  return null;
}
