import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ProgramService } from 'src/app/services/programs/program.service';
import { CommonModule  } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProgramProfileModalComponent } from './program-profile-modal/program-profile-modal.component';
import { Observable, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { ModifyProfileModalComponent } from './modify-profile-modal/modify-profile-modal.component';
import { RouterModule } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';

export interface Profile {
  idp: number;
  firstname: string;
  lastname: string;
  function: string;
  departement: string;
}

export interface ProfileData {
  idp: any;
  idprofile:any;
  image: any;
  firstname: string;
  lastname: string;
  function: string;
  mandaybudget: string;
  consumedmandaybudget: string;
  Dailyrate: string;
}
@Component({
  selector: 'app-program-profiles',
  templateUrl: './program-profiles.component.html',
  styleUrls: ['./program-profiles.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    RouterModule,
  ],
})
export class ProgramProfilesComponent implements OnInit, AfterViewInit {
  programId: string | null = null;
  program: any;
  showNotification: boolean = false;
  profilesList: any;
  mandaybud: any;
  allowedValue:any;
  consumedValue:any;
  profileId: any;
  totalMandayBudget: number = 0;
  totalConsumedManday: number = 0;
  programProfiles: ProfileData[] = [];
  displayedColumns: string[] = [
    'image',
    'name',
    'function',
    'Dailyrate',
    'mandaybudget',
    'progress',
    'stats',
    'update',
    'Delete',
  ];
  dataSource: MatTableDataSource<ProfileData>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('programprofileModal') programprofileModal!: ElementRef;
  constructor(
    private route: ActivatedRoute,
    private progserv: ProgramService,
    private router: Router,
    private alertService: AlertService,
    public dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource(this.programProfiles);
  }

  ngOnInit(): void {
    const parentRoute = this.route.parent;
    if (parentRoute) {
      this.programId = parentRoute.snapshot.paramMap.get('id');
      this.getprogramdetails();
      this.getProfilesWithMandayBudget();
    }

    this.route.queryParams.subscribe(params => {
      const notf = params['notif'];
      if (notf === '1') {
        alert('Programme ajouté avec succès.')
      }
    });
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
  public getprogramdetails() {
    this.progserv.getOneProgram(this.programId).subscribe((response: any[]) => {
      this.program = response;
    });
  }


  public getProfilesWithMandayBudget() {
    this.progserv.getProfilesOfProgram(this.programId).subscribe((response: any[]) => {
      this.programProfiles = response.map((item) => ({
        idp: item[3],
        idprofile: item[0].idp,
        image: item[0].image,
        firstname: item[0].firstname,
        lastname: item[0].lastname,
        function: item[5],
        mandaybudget: item[1],
        consumedmandaybudget: item[2],
        Dailyrate: item[4],
      })) as ProfileData[];

      // Calculate allowedValue
      this.allowedValue = this.programProfiles.reduce((acc, item) => {
        const mandaybudget = parseFloat(item.mandaybudget);
        const dailyrate = parseFloat(item.Dailyrate);
        return acc + mandaybudget * dailyrate;
      }, 0);

      // Calculate consumedValue
      this.consumedValue = this.programProfiles.reduce((acc, item) => {
        const consumedmandaybudget = parseFloat(item.consumedmandaybudget);
        const dailyrate = parseFloat(item.Dailyrate);
        return acc + consumedmandaybudget * dailyrate;
      }, 0);

      // Calculate total manday budget
      this.totalMandayBudget = this.programProfiles.reduce((acc, item) => {
        return acc + parseFloat(item.mandaybudget);
      }, 0);

      // Calculate total consumed manday
      this.totalConsumedManday = this.programProfiles.reduce((acc, item) => {
        return acc + parseFloat(item.consumedmandaybudget);
      }, 0);

      this.dataSource.data = this.programProfiles;
    });
  }

  loadProfilesForAutocomplete(): Observable<any[]> {
    return this.progserv.getProgramProfiles(this.programId).pipe(
      map((response) => {
        this.profilesList = response;
        return this.profilesList;
      })
    );
  }

  openProfileModal() {
    this.loadProfilesForAutocomplete().subscribe({
      next: (profilesList) => {

        const dialogRef = this.dialog.open(ProgramProfileModalComponent, {
          width: '500px',
          data: { context: 'program', programId: this.programId, profilesList: this.profilesList },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.getProfilesWithMandayBudget();
          }
        });
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
      },
    });
  }

  deleteProfile(idpp: any): void {
    this.alertService.confirm(
      'Confirmation',
      'Voulez-vous vraiment supprimer ce profil ?'
    ).then((result) => {
      if (result.isConfirmed) {
        this.progserv.deleteProfileFromProgram(idpp).subscribe(
          response => {
            this.alertService.success('Succès', 'Profil supprimé avec succès !');
            this.getProfilesWithMandayBudget();
          },
          error => {
            this.alertService.error('Erreur', error.error || 'Erreur lors de la suppression du profil');
            console.error('Error deleting profile:', error);
          }
        );
      }
    });
  }


  openUpdateProjectProfileModal(idprofile:number,old : number,daily:number): void {
    const dialogRef = this.dialog.open(ModifyProfileModalComponent, {
      width: '300px',
      height: '125',
      data: {
        projectId: this.programId,
        idprofile: idprofile,
        context:'Program',
        oldmanday: old,
        dailyrate: daily
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getProfilesWithMandayBudget();
    });
  }

  viewStats(profileId: number): void {
    this.router.navigate(['/programs/stats', profileId, this.programId]);
  }
}
