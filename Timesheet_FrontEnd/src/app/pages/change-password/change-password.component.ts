import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { UserserviceService } from '../../services/user/userservice.service';
import { AlertService } from '../../services/alert.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  passwordForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isSubmitting = false;
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';

  constructor(
    private fb: FormBuilder,
    private userService: UserserviceService,
    private alertService: AlertService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.checkPasswordStrength();
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.hideCurrentPassword = !this.hideCurrentPassword;
        break;
      case 'new':
        this.hideNewPassword = !this.hideNewPassword;
        break;
      case 'confirm':
        this.hideConfirmPassword = !this.hideConfirmPassword;
        break;
    }
  }

  checkPasswordStrength(): void {
    const password = this.passwordForm.get('newPassword')?.value || '';

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

    if (password.length < 8) {
      this.passwordStrength = 'weak';
    } else if (criteriaCount < 3) {
      this.passwordStrength = 'weak';
    } else if (criteriaCount === 3) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      this.isSubmitting = true;
      const user = this.userService.getUserConnected();

      if (!user || !user.email) {
        this.alertService.error('Erreur', 'Information utilisateur non disponible');
        this.isSubmitting = false;
        return;
      }

      const passwordData = {
        email: user.email,
        oldPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword
      };

      this.userService.UpdatePassword(passwordData).subscribe({
        next: (response: string) => {
          // The response is now guaranteed to be a string
          this.alertService.success('Succès', response);
          this.isSubmitting = false;

          // Reset form after successful change
          this.passwordForm.reset();

          // Logout user and redirect to login page after a short delay
          setTimeout(() => {
            this.userService.logout();
          }, 200);
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'Erreur lors du changement de mot de passe';

          // For text responses in error case
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          }

          this.alertService.error('Erreur', errorMessage);
          this.isSubmitting = false;
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.passwordForm.controls).forEach(key => {
        const control = this.passwordForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
