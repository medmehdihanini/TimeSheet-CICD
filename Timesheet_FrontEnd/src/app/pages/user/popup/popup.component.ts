import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/MaterialModule';
import { MatSelectModule } from '@angular/material/select';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, MatSelectModule],
})
export class PopupComponent implements OnInit {
  myform: FormGroup;
  profileform: FormGroup;
  roles: string[] = [
    'SUPER_ADMIN',
    'PARTNER',
    'GPS_LEAD',
    'PROGRAM_MANAGER',
    'PROJECT_MANAGER',
  ];
  functions: string[] = [
    'CONSULTANT',
    'PROJECT_MANAGER',
    'PROGRAM_MANAGER',
    'PARTNER',
  ];
  departments: string[] = ['TST', 'People', 'BC', 'Innovation','GPS_Market'];
  id: any;
  inputdata: any;
  editdata: any;
  closemessage = 'closed using directive';
  loading: boolean = false;
  isUserForm: boolean = true; // Variable to track the form type

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<PopupComponent>,
    private buildr: FormBuilder,
    private service: UserserviceService,
    private profileserv: ProfileService,
    private alertService: AlertService
  ) {
    // Initialize both forms
    this.myform = this.buildr.group({
      firstname: ['', [Validators.required, onlyLettersAndSpaces]],
      lastname: ['', [Validators.required, onlyLettersAndSpaces]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });

    this.profileform = this.buildr.group({
      firstname: ['', [Validators.required, onlyLettersAndSpaces]],
      lastname: ['', [Validators.required, onlyLettersAndSpaces]],
      departement: ['', Validators.required],
      mandaybudget: ['230', [Validators.required, onlyNumbers]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.inputdata = this.data;
    // Determine the form type based on the title
    this.isUserForm = this.inputdata.title.toLowerCase().includes('user');
    if (this.inputdata.code > 0) {
      this.setpopupdata(this.inputdata.code);
    }
  }
  setpopupdata(code: any) {
    if (code != null) {
      this.id = code;
      if (this.isUserForm) {
        this.service.getOneUser(code).subscribe((item) => {
          this.editdata = item;
          this.myform.setValue({
            firstname: this.editdata.firstname,
            lastname: this.editdata.lastname,
            email: this.editdata.email,
            role: this.editdata.role,
          });
        });
      } else {
        this.profileserv.getOneProfile(code).subscribe((item) => {
          console.log(item)
          this.editdata = item;
          this.profileform.setValue({
            firstname: this.editdata.firstname,
            lastname: this.editdata.lastname,
            email: this.editdata.email,
            departement: this.editdata.departement,
            mandaybudget: this.editdata.mandaybudget,
          });
        });
      }
    }
  }

  closepopup() {
    this.ref.close();
  }

  saveUser() {
    this.loading = true;
    const saveObservable = this.isUserForm
      ? this.service.saveuser(this.myform.value)
      : this.profileserv.saveProfile(this.profileform.value);

    saveObservable.subscribe(
      () => {
        this.loading = false;
        const entityType = this.isUserForm ? 'Utilisateur' : 'Profil';
        this.alertService.success('Succès', `${entityType} ajouté avec succès`);
        this.closepopup();
      },
      (error) => {
        this.loading = false;
        const entityType = this.isUserForm ? 'utilisateur' : 'profil';
        this.alertService.error(
          'Erreur',
          error.error || `Impossible d'ajouter l'${entityType}.`
        );
      }
    );
  }

  updateUser() {
    const updateObservable = this.isUserForm
      ? this.service.updateUser(this.id, this.myform.value)
      : this.profileserv.updateProfile(this.id, this.profileform.value);

    updateObservable.subscribe(
      () => {
        const entityType = this.isUserForm ? 'Utilisateur' : 'Profil';
        this.alertService.success('Succès', `${entityType} mis à jour avec succès`);
        this.closepopup();
      },
      (error) => {
        const entityType = this.isUserForm ? 'utilisateur' : 'profil';
        this.alertService.error(
          'Erreur',
          error.error || `Impossible de mettre à jour l'${entityType}.`
        );
      }
    );
  }
}
function onlyLettersAndSpaces(
  control: AbstractControl
): ValidationErrors | null {
  const value: string = control.value;
  if (!/^[a-zA-Z\s]*$/.test(value)) {
    // If the value contains anything other than letters and spaces
    return { onlyLettersAndSpaces: true }; // Return an error object
  }
  return null; // No error return null
}

function onlyNumbers(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value;
  if (!/^\d+$/.test(value)) {
    // If the value contains any non-digit character
    return { onlyNumbers: true }; // Return an error object
  }
  return null; // No error, return null
}
