import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PopupComponent } from './popup/popup.component';
import { AlertService } from 'src/app/services/alert.service';

export interface UserData {
  id: any;// we will need it if we will retrieve timesheets, programs or projects related to that user later
  image: any;
  role: any;
  firstname: any;
  lastname: any;
  email: string;
}


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
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
    MatTooltipModule,
    RouterModule,
    MatDialogModule,
  ],
})
export class UserComponent implements AfterViewInit,OnInit  {
  displayedColumns: string[] = ['image', 'firstname', 'lastname', 'role', 'email', 'update'];
  dataSource: MatTableDataSource<any>;
  users: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input') input: any;

  constructor(
    private userserv: UserserviceService,
    private dialog: MatDialog,
    private alertService: AlertService
  ) {
    this.getAllUsers();
    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource(this.users);
  //  console.log(this.dataSource)
  }
  ngOnInit(): void {
    this.getAllUsers();
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

  public getAllUsers(): void {
    this.userserv.getUsers().subscribe(
      (response: any[]) => {
        this.users = response;
        this.dataSource = new MatTableDataSource(this.users);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      //  console.log(this.users);
      },
      (error: HttpErrorResponse) => {
        this.alertService.error('Erreur', error.message || 'Erreur lors du chargement des utilisateurs');
      }
    );
  }

  public deleteUser(idu: any) {
    // Check if the user is trying to delete themselves
    const connectedUser = this.userserv.getUserConnected();
    if (connectedUser && connectedUser.id === idu) {
      this.alertService.error('Action interdite', 'Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }

    this.alertService.confirm(
      'Confirmation de suppression',
      'Voulez-vous vraiment supprimer cet utilisateur ?'
    ).then((result) => {
      if (result.isConfirmed) {
        this.userserv.deleteUser(idu).subscribe({
          next: (response) => {
            // Success - user deleted successfully
            this.alertService.success('Succès', 'Utilisateur supprimé avec succès');
            this.getAllUsers();
          },
          error: (error: HttpErrorResponse) => {
            // Check if it's actually a successful deletion (status 200) with text response
            if (error.status === 200) {
              // This is actually a success case - backend returned 200 with text response
              this.alertService.success('Succès', 'Utilisateur supprimé avec succès');
              this.getAllUsers();
            } else {
              // This is an actual error
              const errorMessage =  'Erreur lors de la suppression de l\'utilisateur';
              this.alertService.error('Erreur', errorMessage);
            }
          }
        });
      }
    });
  }
  editUser(code: any) {
    this.Openpopup(code, 'Edit User',PopupComponent);
  //  console.log(code)
  }
  saveUser() {
    this.Openpopup(null, 'Save User',PopupComponent);
  //  console.log(code)
  }



  Openpopup(code: any, title: any,component:any) {
    var _popup = this.dialog.open(component, {
      width: '40%',
      enterAnimationDuration: '250ms',
      exitAnimationDuration: '250ms',
      data: {
        title: title,
        code: code
      }
    });
    _popup.afterClosed().subscribe(item => {
    //   console.log(item)
      this.getAllUsers();
    })
  }
}
