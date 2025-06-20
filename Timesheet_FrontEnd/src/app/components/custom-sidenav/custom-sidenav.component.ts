import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon'
import { RouterModule } from '@angular/router';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

export type MenuItem = {
  icon: string;
  label: string;
  route?: any;
  onClick?: () => void;
};


@Component({
  selector: 'app-custom-sidenav',
  templateUrl: './custom-sidenav.component.html',
  styleUrls: ['./custom-sidenav.component.scss'],
  standalone: true,
  imports: [CommonModule,MatListModule, MatIconModule, RouterModule, MatRippleModule, MatSnackBarModule],
})
export class CustomSidenavComponent  implements OnInit{
  sideNavCollapsed = signal(false);
  isUploading = signal(false);
  @Input() set collapsed(val: boolean){
    this.sideNavCollapsed.set(val)
  }
  connecteduser:any;
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  programManagerMenuItems = signal<MenuItem[]>([
    {
      icon:'view_carousel',
      label:'Programmes',
      route:'programs'
    },
    {
      icon:'business_center',
      label:'Projets',
      route:'projects'
    },
    /*
    {
      icon: 'poll',
      label: 'Tableau de bord',
      onClick: () => this.redirectToPowerBI()
    },
    */
    {
      icon: 'assignment',
      label: 'Assignation de tâches',
      route: 'projects/task-assignments'
    },
    {
      icon: 'upload_file',
      label: 'Timesheet Upload',
      route: 'projects/timesheet-upload'
    },
    {
      icon:'history',
      label:'Logs',
      route:'logs'
    }
  ])

  partnerMenuItems = signal<MenuItem[]>([
    {
      icon:'view_carousel',
      label:'Programmes',
      route:'programs'
    },
    {
      icon:'business_center',
      label:'Projets',
      route:'projects'
    },
    {
      icon:'contacts',
      label:'Profils',
      route:'profiles'
    },
    {
      icon: 'poll',
      label: 'Tableau de bord',
      onClick: () => this.redirectToPowerBI()
    },
  ])
  projectManagerMenuItems = signal<MenuItem[]>([
    {
      icon:'business_center',
      label:'Projets',
      route:'projects'
    },
    {
      icon:'calendar_today',
      label:'Timesheets',
      route:'projects/timesheets'
    },
    {
      icon: 'assignment',
      label: 'Assignation de tâches',
      route: 'projects/task-assignments'
    },
    {
      icon: 'upload_file',
      label: 'Timesheet Upload',
      route: 'projects/timesheet-upload'
    },
    {
      icon:'history',
      label:'Logs',
      route:'logs'
    }
  ])
  marouenMenuItems = signal<MenuItem[]>([
    {
      icon:'view_carousel',
      label:'Programmes',
      route:'programs'
    },
    {
      icon:'business_center',
      label:'Projets',
      route:'projects'
    },
    {
      icon:'perm_contact_calendar',
      label:'Utilisateurs',
      route:'users'
    },
    {
      icon:'contacts',
      label:'Profils',
      route:'profiles'
    },
    {
      icon: 'poll',
      label: 'Tableau de bord',
      onClick: () => this.redirectToPowerBI()
    },
  ])
  adminMenuItems = signal<MenuItem[]>([
    {
      icon:'perm_contact_calendar',
      label:'Utilisateurs',
      route:'users'
    },
    {
      icon:'contacts',
      label:'Profils',
      route:'profiles'
    },
    {
      icon:'poll',
      label:'Tableau de bord',
      route:'dashboard'
    },
    {
      icon:'history',
      label:'Logs',
      route:'logs'
    }
  ])
  image:any
  chefDeProgramme: string = '';
  constructor(private userserv: UserserviceService, private cdr: ChangeDetectorRef, private snackBar: MatSnackBar){}

  ngOnInit(): void {
    this.connectedUser();
}

  ngAfterViewInit() {
    // Verify fileInput is properly initialized
    console.log('FileInput element:', this.fileInput?.nativeElement);
  }

  profilePicSize = computed(()=> this.sideNavCollapsed() ? '32' : '100')

  triggerFileInput(): void {
    console.log('triggerFileInput called');
    if (this.isUploading()) {
      console.log('Upload in progress, ignoring click');
      return;
    }

    if (!this.fileInput) {
      console.error('File input element not found');
      this.showError('System error: File input not initialized');
      return;
    }

    try {
      this.fileInput.nativeElement.click();
    } catch (error) {
      console.error('Error triggering file input:', error);
      this.showError('Failed to open file selector');
    }
  }

  onFileSelected(event: Event): void {
    console.log('onFileSelected called', event);
    const input = event.target as HTMLInputElement;

    if (!input.files || !input.files.length) {
      console.log('No file selected');
      return;
    }

    const file = input.files[0];
    console.log('Selected file:', file);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      this.showError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large:', file.size);
      this.showError('Image size should be less than 5MB');
      return;
    }

    this.uploadImage(file);
  }

  uploadImage(file: File): void {
    console.log('Starting image upload');
    this.isUploading.set(true);

    if (!this.connecteduser?.id) {
      console.error('User ID not found');
      this.showError('User information not available');
      this.isUploading.set(false);
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    this.userserv.addImageToUser(this.connecteduser.id, formData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Upload error:', error);
          let errorMessage = 'Failed to upload image. ';

          if (error.status === 0) {
            errorMessage += 'Server is not responding.';
          } else if (error.status === 413) {
            errorMessage += 'Image is too large.';
          } else if (error.error?.message) {
            errorMessage += error.error.message;
          } else {
            errorMessage += 'Please try again.';
          }

          this.showError(errorMessage);
          return of(null);
        }),
        finalize(() => {
          console.log('Upload completed or failed');
          this.isUploading.set(false);
          if (this.fileInput) {
            this.fileInput.nativeElement.value = ''; // Reset file input
          }
        })
      )
      .subscribe(response => {
        if (response) {
          console.log('Upload successful:', response);
          this.connecteduser.image = response.image;
          this.saveConnectedUser();
          this.cdr.detectChanges();
          this.showSuccess('Profile picture updated successfully');
        }
      });
  }

  private showError(message: string): void {
    console.log('Showing error:', message);
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    console.log('Showing success:', message);
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }

  public loadConnectedUser(): void {
    const dataStr = localStorage.getItem('Token');
    if (dataStr) {
      const data = JSON.parse(dataStr);
      this.connecteduser = data.connecteduser;
    }
  }

  public saveConnectedUser(): void {
    const dataStr = localStorage.getItem('Token');
    if (dataStr) {
      const data = JSON.parse(dataStr);
      data.connecteduser = this.connecteduser;
      localStorage.setItem('Token', JSON.stringify(data));
    }
  }

  logout(){
    this.userserv.logout();
  }
  public connectedUser(){
    this.connecteduser =  this.userserv.getUserConnected();

  }
  redirectToPowerBI() {
    this.chefDeProgramme = `${this.connecteduser.firstname}${this.connecteduser.lastname}`;
    const encodedChefDeProgramme = encodeURIComponent(this.chefDeProgramme);
    const url = `https://app.powerbi.com/reportEmbed?reportId=67f0d6b3-205e-441b-842d-c8b221d4ce84&autoAuth=true&pageName=Gestiondesfactures&filter=_program/NomCompletchefdeprog%20eq%20%27${encodedChefDeProgramme}%27`;
    window.open(url, '_blank');  // Opens in a new tab
  }
}

