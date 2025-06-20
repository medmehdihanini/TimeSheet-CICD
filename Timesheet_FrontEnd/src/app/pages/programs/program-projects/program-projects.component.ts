import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProgramService } from 'src/app/services/programs/program.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MaterialModule } from 'src/app/MaterialModule';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { AddProjectModalComponent } from './add-project-modal/add-project-modal.component';
import { ModifyProfileModalComponent } from '../program-profiles/modify-profile-modal/modify-profile-modal.component';
import { ProgramProfileModalComponent } from '../program-profiles/program-profile-modal/program-profile-modal.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Observable, map } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';

export interface ProfileData {
  idprofile: any;
  image: any;
  firstname: string;
  lastname: string;
  function: string;
  dailyrate: number;
  mandaybudget: string;
  progress: String;
  id: number;
}

@Component({
  selector: 'app-program-projects',
  templateUrl: './program-projects.component.html',
  styleUrls: ['./program-projects.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatTabsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MaterialModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    RouterModule,
  ],
})
export class ProgramProjectsComponent implements OnInit, AfterViewInit {
  programId: string | null = null;
  associatedBudget: number = 0;
  consumedBudget: number = 0;
  associatedJH: number = 0;
  consumedJH: number = 0;
  projectId: any;
  programProjects: any;
  connecteduser: any;
  profilesList: any;
  projectMnagersList: any;
  projectprofiles: ProfileData[] = [];
  imageForm: FormGroup;
  showSuccessNotification: boolean = false;
  displayedColumns: string[] = [
    'image',
    'name',
    'function',
    'mandaybudget',
    'progress',
    'stats',
    'timesheet',
    'update',
    'Delete',
  ];
  dataSource: MatTableDataSource<ProfileData>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('programprofileModal') programprofileModal!: ElementRef;
  @ViewChild('addProjectModal') addProjectModal!: ElementRef;
  constructor(
    private route: ActivatedRoute,
    private progserv: ProgramService,
    private router: Router,
    private buildr: FormBuilder,
    private profileserv: ProfileService,
    private projectserv: ProjectService,
    private userserv: UserserviceService,
    private alertService: AlertService,
    public dialog: MatDialog
  ) {
    this.imageForm = this.buildr.group({
      image: ['', [Validators.required, this.validateImageType]],
    });
    this.dataSource = new MatTableDataSource(this.projectprofiles);
  }

  ngOnInit(): void {
    const parentRoute = this.route.parent;
    if (parentRoute) {
      this.programId = parentRoute.snapshot.paramMap.get('id');
    }

    this.getProgramProjects();
    this.connectedUser();
  }

  ngAfterViewInit() {
    // Wait for view to be fully initialized
    setTimeout(() => {
      if (this.paginator && this.sort) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  public connectedUser() {
    this.connecteduser = this.userserv.getUserConnected();
  }
  onTabChange(event: any) {
    const selectedIndex = event.index;
    this.projectId = this.programProjects[selectedIndex]?.idproject;
    if (this.projectId) {
      this.getProjectProfiles();
    }
  }
  public getProgramProjects() {
    this.projectserv
      .getProjectsProgram(this.programId)
      .subscribe((response: any[]) => {
        this.programProjects = response;

        // Automatically load profiles for the first project on initial load
        if (this.programProjects && this.programProjects.length > 0) {
          this.projectId = this.programProjects[0]?.idproject;
          if (this.projectId) {
            this.getProjectProfiles();
          }
        }
      });
  }

  filterProgramProjects(): void {
    // Filter projects where project.state === true
    this.programProjects = this.programProjects.filter(
      (project: any) => project.state === true
    );
  }
  public getProjectProfiles() {
    this.projectserv
      .getProjectProfiles(this.projectId)
      .subscribe((response: any[]) => {
        this.projectprofiles = response.map((item) => ({
          idprofile: item[0].idp,
          image: item[0].image,
          firstname: item[0].firstname,
          lastname: item[0].lastname,
          function: item[4],
          dailyrate: item[5],
          mandaybudget: item[1],
          progress: item[2],
          id: item[3],
        }));
        console.log('Project profiles loaded:', response);

        // Calculate associated and consumed budgets
        this.associatedBudget = this.projectprofiles.reduce(
          (sum, profile) => sum + (Number(profile.mandaybudget) * profile.dailyrate),
          0
        );
        this.consumedBudget = this.projectprofiles.reduce(
          (sum, profile) => sum + (Number(profile.progress)  * profile.dailyrate),
          0
        );

        // Calculate associated and consumed JH (Jours/Heures)
        this.associatedJH = this.projectprofiles.reduce(
          (sum, profile) => sum + Number(profile.mandaybudget),
          0
        );
        this.consumedJH = this.projectprofiles.reduce(
          (sum, profile) => sum + Number(profile.progress),
          0
        );

        // Update data source and reinitialize paginator and sort
        this.dataSource.data = this.projectprofiles;
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      });
  }
  goToProjectDetails(idproject: number): void {
    this.router.navigate([`/projectdetails/${idproject}`]);
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
  public updateImage(idp: any) {
    const imageFile = this.imageForm.get('image')?.value;
    this.projectserv.addImageToProject(idp, imageFile).subscribe(
      (response) => {
        this.getProgramProjects();
        this.showSuccessNotification = true;
        setTimeout(() => {
          this.showSuccessNotification = false;
        }, 30000);
      },
      (error) => {
        console.error('Error uploading image', error);
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

  goToProfileTimesheet(idprofile: number) {
    this.router.navigate(['/timesheet', idprofile, this.projectId]);
  }

  loadProfilesForAutocomplete(): Observable<any[]> {
    return this.projectserv
      .getProfilesForProject(this.programId, this.projectId)
      .pipe(
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
          data: {
            context: 'project',
            projectId: this.projectId,
            profilesList: this.profilesList,
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.getProjectProfiles();
          }
        });
      },
      error: (error) => {
        console.error('Error loading profiles:', error); // Handle the error appropriately
      },
    });
  }

  loadProjectManagersForAutocomplete(): Observable<any[]> {
  /*  return this.profileserv.getProjectManagers().pipe(
      map((response) => {
        this.projectMnagersList = response;
        return this.projectMnagersList;
      })
    );*/
    return this.progserv
      .getProgramAlreadyProfiles(this.programId)
      .pipe(
        map((response) => {
          this.projectMnagersList = response;
          return this.projectMnagersList;
        })
      );
  }
  openProjectModal() {
    this.loadProjectManagersForAutocomplete().subscribe({
      next: (projectMnagersList) => {
        // Check if the connected user's email is already in the list
        const userExists = projectMnagersList.some(
          (manager) => manager.email === this.connecteduser.email
        );

        // Only push the connected user if their email is not in the list
        if (!userExists) {
          this.projectMnagersList.push(this.connecteduser);
        }


        const dialogRef = this.dialog.open(AddProjectModalComponent, {
          width: '500px',
          data: {
            programId: this.programId,
            projectMnagersList: this.projectMnagersList,
          },
        });

        // Listen for selection changes in the modal
        dialogRef.componentInstance.selectedItemChange.subscribe((selectedItem) => {
          if (selectedItem.id === 'special-item') {
            // If the special item is selected, load the second list
            this.profileserv.getProjectManagers().subscribe({
              next: (newProjectManagersList) => {
                // Replace the list in the modal with the new list
                dialogRef.componentInstance.projectMnagersList = newProjectManagersList;
              },
              error: (error) => {
                console.error('Error loading new project managers:', error); // Handle error
              },
            });
          }
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.getProgramProjects();
          }
        });
      },
      error: (error) => {
        console.error('Error loading profiles:', error); // Handle the error appropriately
      },
    });
  }

  /*
  openProjectModal() {
    this.loadProjectManagersForAutocomplete().subscribe({
      next: (projectMnagersList) => {
        const userExists = projectMnagersList.some(
          (manager) => manager.email === this.connecteduser.email
        );
        if (!userExists) {
          this.projectMnagersList.push(this.connecteduser);
        }

        const dialogRef = this.dialog.open(AddProjectModalComponent, {
          width: '500px',
          data: {
            programId: this.programId,
            projectMnagersList: this.projectMnagersList,
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.getProgramProjects();
          }
        });
      },
      error: (error) => {
        console.error('Error loading profiles:', error); // Handle the error appropriately
      },
    });
  }*/
  openUpdateProjectModal(project: any): void {
    this.loadProjectManagersForAutocomplete().subscribe({
      next: (projectMnagersList) => {
        const dialogRef = this.dialog.open(AddProjectModalComponent, {
          width: '500px',
          data: {
            idp: project.idproject,
            projectMnagersList: this.projectMnagersList,
            project: project, // Pass the project data to the modal
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.getProgramProjects();
          }
        });
      },
      error: (error) => {
        console.error('Error loading profiles:', error); // Handle the error appropriately
      },
    });
  }
  openUpdateProjectProfileModal(idprofile: number, old: number): void {
    const dialogRef = this.dialog.open(ModifyProfileModalComponent, {
      width: '300px',
      height: '125',
      data: {
        projectId: this.projectId,
        idprofile: idprofile,
        context: 'project',
        oldmanday: old,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getProgramProjects();
    });
  }

  deleteProject(id: number): void {
    this.alertService.confirm(
      'Confirmation de suppression',
      'Êtes-vous sûr de vouloir supprimer ce projet ?'
    ).then((result) => {
      if (result.isConfirmed) {
        this.projectserv.deleteProject(id).subscribe({
          next: (message: string) => {
            this.getProgramProjects();
            this.alertService.success('Succès', message);
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            // Since error.error is already the text message from the server
            this.alertService.error('Erreur', error.error);
          }
        });
      }
    });
  }
  deleteProfile(idpp: any): void {
    this.alertService.confirm(
      'Confirmation de suppression',
      'Êtes-vous sûr de vouloir supprimer ce profil ?'
    ).then((result) => {
      if (result.isConfirmed) {
        this.projectserv.deleteProjectProfile(idpp).subscribe({
          next: (response) => {
            this.getProjectProfiles();
            this.alertService.success('Succès', 'Le profil a été supprimé avec succès');
          },
          error: (error) => {
            console.error('Error deleting profile:', error);
            this.alertService.error(
              'Erreur',
              'Une erreur est survenue lors de la suppression du profil'
            );
          }
        });
      }
    });
  }
}
