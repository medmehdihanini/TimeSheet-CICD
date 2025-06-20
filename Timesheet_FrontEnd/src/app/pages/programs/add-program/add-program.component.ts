import { ChangeDetectionStrategy, Component, OnInit, ViewChild, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { ProgramService } from 'src/app/services/programs/program.service';
import { MaterialModule } from 'src/app/MaterialModule';
import { Observable, switchMap, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { AlertService } from 'src/app/services/alert.service';

enum Status {
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  UNLAUNCHED = 'UNLAUNCHED',
  CANCELED = 'CANCELED',
  FINISHED = 'FINISHED',
}

@Component({
  selector: 'app-add-program',
  templateUrl: './add-program.component.html',
  styleUrls: ['./add-program.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    JsonPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MaterialModule,
  ],
  providers: [
    { provide: NativeDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-TN' },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProgramComponent implements OnInit {
  program: any;
  connecteduser: any;
  statuses: Status[] = [
    Status.IN_PROGRESS,
    Status.ON_HOLD,
    Status.UNLAUNCHED,
    Status.CANCELED,
    Status.FINISHED,
  ];
  programForm: FormGroup;
  imageForm: FormGroup;
  chefprograms: any;
  progimage: any;
  showSuccessNotification: boolean = false;
  today: string = new Date().toISOString().split('T')[0];
  @ViewChild('fileInput') fileInput: any;
  imagePreviewUrl: string | null = null;
  @ViewChild('stepper') stepper: MatStepper;
  isUploading: boolean = false;
  constructor(
    private buildr: FormBuilder,
    private router: Router,
    private userserv: UserserviceService,
    private profileserv: ProfileService,
    private dateAdapter: DateAdapter<Date>,
    private progserv: ProgramService,
    public dialogRef: MatDialogRef<AddProgramComponent>,
    @Inject(AlertService) private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {
    this.programForm = this.buildr.group({
      numcontrat: ['', [Validators.required, onlyNumbers]],
      name: ['', [Validators.required, onlyLettersNumbersSpacesAndSpecialChars]],
      chefprogram: [],
      dateRange: this.buildr.group({
        start: [null, Validators.required],
        end: [null, Validators.required]
      })
    });
    this.imageForm = this.buildr.group({
      image: ['', this.validateImageType],
    });
  }

  ngOnInit(): void {
    this.dateAdapter.setLocale('fr-TN');
    this.getProgramManagers();
    this.connectedUser();
    this.programForm.get('chefprogram')?.setValue(this.connecteduser);
  }

  connectedUser() {
    this.connecteduser = this.userserv.getUserConnected();
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }
    const today = new Date();
    return date >= today;
  };

  AddProgram(stepper: MatStepper) {
    if (this.programForm.valid) {
      const numcontrat = this.programForm.get('numcontrat')?.value;
      const dateRange = this.programForm.get('dateRange')?.value;
      const startdate = this.formatDate(dateRange.start);
      const enddate = this.formatDate(dateRange.end);

      const programData = {
        ...this.programForm.value,
        startdate: startdate,
        enddate: enddate,
      };
      
      this.progserv.addProg(programData)
        .pipe(switchMap(() => this.getProgByContact(numcontrat)))
        .subscribe({
          next: () => {
            stepper.next();
          },
          error: (error: HttpErrorResponse) => {
            this.alertService.error('Error', error.error || 'An unexpected error occurred');
          },
        });
    }
  }

  getProgByContact(numcontrat: string): Observable<any> {
    return this.progserv.getOneProgramWithContactNumber(numcontrat).pipe(
      tap((program) => {
        this.program = program;
      })
    );
  }

  getProgramManagers() {
    this.progserv.getProgramManagers().subscribe((response: any[]) => {
      this.chefprograms = response;
    });
  }

  deleteProgram() {
    const numcontrat = this.programForm.get('numcontrat')?.value;
    this.alertService.confirm('Are you sure?', "You won't be able to revert this!").then((result) => {
      if (result.isConfirmed) {
        this.progserv.deleteOneProgrambyContact(numcontrat).subscribe({
          next: () => {
            this.alertService.success('Deleted!', 'The program has been deleted successfully.').then(() => {
              this.router.navigate(['/programs']);
            });
          },
          error: (error) => {
            this.alertService.error('Error', 'Failed to delete the program. Please try again.');
          },
        });
      }
    });
  }
  redirectToAddProgram() {
    this.router.navigate(['/add-program']);
  }

  redirectToProgramProfiles() {
    const notif = 1;
    const id = this.program.idprog;
    this.dialogRef.close();
    this.router.navigate([
      `/programdetailSettings/${this.program.idprog}/program-profiles`
    ], {
      queryParams: { notif: notif }
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

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|png|gif)/)) {
        this.alertService.error('Invalid file type', 'Please upload a JPEG, PNG, or GIF image');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.error('File too large', 'Maximum file size is 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
        this.imageForm.patchValue({
          image: file
        });
        this.imageForm.get('image')?.updateValueAndValidity();
        // Force change detection
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imagePreviewUrl = null;
    this.imageForm.patchValue({
      image: null
    });
    this.fileInput.nativeElement.value = '';
    // Force change detection
    this.cdr.detectChanges();
  }

  updateImage() {
    if (this.imageForm.valid) {
      const imageFile = this.imageForm.get('image')?.value;
      if (!imageFile) {
        this.alertService.error('Error', 'No image selected');
        this.dialogRef.close();
        return;
      }

      this.isUploading = true;
      this.progserv.addImageToProgram(this.program.idprog, imageFile).subscribe({
        next: (response) => {
          this.alertService.success('Success', 'Image uploaded successfully').then(() => {
            if (this.stepper) {
              this.stepper.next();
            }
          });
        },
        error: (error) => {
          this.alertService.error('Error', 'Failed to upload image').then(() => {
            this.dialogRef.close();
          });
        },
        complete: () => {
          this.isUploading = false;
        }
      });
    } else {
      this.alertService.error('Error', 'Please select a valid image file');
      this.dialogRef.close();
    }
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

  skipStep(stepper: MatStepper) {
    stepper.next();
  }

  get dateRangeGroup(): FormGroup {
    return this.programForm.get('dateRange') as FormGroup;
  }
}
/*
function onlyLettersNumbersSpacesAndSpecialChars(
  control: AbstractControl
): ValidationErrors | null {
  const value: string = control.value;
  if (!/^[a-zA-Z0-9\s!@#$%^&*()_+{}\[\]:;"'<>,.?\/\\|\-À-ÿ]*$/.test(value)) {
    return { onlyLettersNumbersSpacesAndSpecialChars: true };
  }
  return null;
}*/
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

function onlyNumbers(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value;
  if (!/^\d+$/.test(value)) {
    return { onlyNumbers: true };
  }
  return null;
}