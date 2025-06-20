import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationRequest } from 'src/app/models/AuthenticationRequest';
import { FormsModule } from '@angular/forms';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { session } from 'src/app/models/session';
import { AlertService } from 'src/app/services/alert.service';
import { default as Swal } from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  connecteduser: any;
  credentials: any = {
    email: '',
    password: '',
  };
  errorMessage: string = '';
  currentYear: number = new Date().getFullYear();
  router = inject(Router);

  constructor(
    private userserv: UserserviceService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    localStorage.clear();
  }

  login() {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Veuillez saisir votre email et mot de passe';
      return;
    }

    this.errorMessage = '';

    this.userserv.login(this.credentials).subscribe(
      (res: any) => {
        // Check if res exists and has valid data
        if (res && res.token) {
          localStorage.setItem('Token', JSON.stringify(res));

          this.connectedUser();
          if (this.connecteduser.role === 'PROGRAM_MANAGER' || this.connecteduser.role === 'PARTNER' || this.connecteduser.role === 'GPS_LEAD') {
            this.router.navigate(['/programs']);
          } else if (this.connecteduser.role === 'PROJECT_MANAGER') {
            this.router.navigate(['/projects']);
          } else if (this.connecteduser.role === 'SUPER_ADMIN') {
            this.router.navigate(['/users']);
          } else {
            // Handle other roles or default route
            this.router.navigate(['/default']);
          }
        } else {
          // Handle case where response exists but doesn't have expected structure
          this.errorMessage = 'Échec de connexion. Veuillez réessayer.';
          this.alertService.error('Échec de Connexion', 'Authentification échouée. Veuillez vérifier vos informations.');
        }
      },
      (error) => {
        // Handle HTTP error
        console.error('Login error:', error);
        this.errorMessage = 'Identifiants invalides. Veuillez réessayer.';
        this.alertService.error('Échec de Connexion', 'Email ou mot de passe invalide. Veuillez réessayer.');
      }
    );
  }

  forgotPassword(): void {
    this.alertService.custom({
      title: 'Réinitialisation du Mot de Passe',
      text: 'Veuillez saisir votre adresse email pour recevoir un nouveau mot de passe.',
      input: 'email',
      inputPlaceholder: 'Entrez votre adresse email',
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      cancelButtonText: 'Annuler',
      inputValidator: (value: string) => {
        if (!value) {
          return 'Vous devez saisir votre email!';
        }

        // Validate email format with regex
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!emailPattern.test(value)) {
          return 'Veuillez saisir une adresse email valide';
        }
        return null;
      },
      toast: false,
      position: 'center'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // Show loading state
        this.alertService.custom({
          title: 'Traitement en cours',
          text: 'Veuillez patienter...',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Call the ForgetPassword service using indexing to avoid TypeScript issues
        const request = { email: result.value };

        // Utilisation alternative pour contourner les erreurs TypeScript
        (this.userserv as any)['ForgetPassword'](request).subscribe({
          next: (response: string) => {
            // Success - response is a string message
            this.alertService.success('Succès', response);
          },
          error: (error: HttpErrorResponse) => {
            // Error - could be a string message or an error object
            let errorMessage = 'Erreur lors de la réinitialisation du mot de passe';

            if (error && error.error) {
              // If the error has a message property
              errorMessage = typeof error.error === 'string' ? error.error : errorMessage;
            }

            this.alertService.error('Échec', errorMessage);
          }
        });
      }
    });
  }

  public connectedUser() {
    this.connecteduser = this.userserv.getUserConnected();
  }
}
