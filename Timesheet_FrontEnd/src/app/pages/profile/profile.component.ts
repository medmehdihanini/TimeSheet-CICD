import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { HttpErrorResponse } from '@angular/common/http';
import { PopupComponent } from '../user/popup/popup.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
})
export class ProfileComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['image', 'firstname', 'lastname', 'departement', 'mandaybudget', 'email', 'update', 'add_Account'];
  dataSource: MatTableDataSource<any>;
  profiles: any;
  loading: boolean = false;
  durationInSeconds = 5;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input') input: any;

  constructor(private profileserv: ProfileService, private dialog: MatDialog, private alertService: AlertService) {
    this.getAllProfiles();
    this.dataSource = new MatTableDataSource(this.profiles);
  }

  ngOnInit(): void {
    this.getAllProfiles();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilter() {
    if (this.input) {
      this.input.nativeElement.value = '';
      this.dataSource.filter = '';
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  public getAllProfiles(): void {
    this.profileserv.getAllProfiles().subscribe(
      (response: any[]) => {
        this.profiles = response;
        this.dataSource = new MatTableDataSource(this.profiles);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      (error: HttpErrorResponse) => {
        this.alertService.error('Erreur lors du chargement des profils: ' + error.message);
      }
    );
  }

  public deleteProfile(idu: any) {
    this.alertService.confirm(
      'Êtes-vous sûr de vouloir supprimer ce profil ?',
      'Cette action est irréversible.'
    ).then((result) => {
      if (result.isConfirmed) {
        this.profileserv.deleteProfile(idu).subscribe(
          (response: any) => {
            // Backend returns 200 OK with text response for successful deletions
            this.alertService.success('Profil supprimé avec succès !');
            this.getAllProfiles();
          },
          (error: any) => {
            let errorMessage = 'Erreur inconnue';
        if (error.error && typeof error.error === 'string') {
          // Backend returns plain text error message
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.alertService.error('Erreur lors de la suppresion du profil ' + errorMessage);
          }
        );
      }
    });
  }

  public editProfile(code: any) {
    this.Openpopup(code, 'Edit Profile',PopupComponent);
  //  console.log(code)
  }
  public saveProfile() {
    this.Openpopup(null, 'Save Profile',PopupComponent);
  //  console.log(code)
  }



  Openpopup(code: any, title: any,component:any) {
    var _popup = this.dialog.open(component, {
      width: '40%',
      height:'85%',
      enterAnimationDuration: '250ms',
      exitAnimationDuration: '250ms',
      data: {
        title: title,
        code: code
      }
    });
    _popup.afterClosed().subscribe(item => {
    //   console.log(item)
      this.getAllProfiles();
    })
  }

  public createAccount(idp: any) {
    this.loading = true; // Set loading to true when starting the request
    this.profileserv.CreateProfileForAccount(idp).subscribe(
      (response: string) => {
        this.loading = false; // Set loading to false when the request completes
        this.alertService.success('Compte créé avec succès !');
        this.getAllProfiles();
      },
      (error) => {
        this.loading = false; // Also set loading to false in case of error
        console.error('Error creating account', error);

        // Extract the error message from the backend response
        let errorMessage = 'Erreur inconnue';
        if (error.error && typeof error.error === 'string') {
          // Backend returns plain text error message
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.alertService.error('Erreur lors de la création du compte: ' + errorMessage);
      }
    );
  }


}
