import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgramService } from 'src/app/services/programs/program.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { ProjectService } from 'src/app/services/project/project.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StatusModalComponent } from './status-modal/status-modal.component';
import { Status } from 'src/app/models/Status';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-programdetails',
  templateUrl: './programdetails.component.html',
  styleUrls: ['./programdetails.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatTabsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class ProgramdetailsComponent implements OnInit, AfterViewInit {
  // ViewChild for accessing the tabs header DOM element
  @ViewChild('tabsHeader') tabsHeader: ElementRef;

  programId: number;
  program: any;
  programProfiles: {
    profile: any;
    mandaybudget: number;
    consumedmandaybudget: number;
    dailyrate: number;
  }[] = [];
  paginatedProfiles: any[] = []; // Profiles for current page
  programProjects: any[] = [];
  paginatedProjects: any[] = []; // Projects for current page
  connecteduser: any;
  allowedValue: number = 0;
  consumedValue: number = 0;
  programForm: FormGroup;
  activeTab: number = 0; // For tab functionality

  // Pagination properties for projects
  currentPage: number = 1;
  itemsPerPage: number = 4; // Show 5 projects per page
  totalPages: number = 1;

  // Pagination properties for profiles
  profileCurrentPage: number = 1;
  profileItemsPerPage: number = 5; // Show 5 profiles per page
  profileTotalPages: number = 1;

  // Tab scrolling properties
  tabScrollPosition: number = 0;
  isRightScrollDisabled: boolean = false;
  scrollAmount: number = 200; // Amount to scroll in pixels

  constructor(
    private buildr: FormBuilder,
    private route: ActivatedRoute,
    private progserv: ProgramService,
    private router: Router,
    private projectserv: ProjectService,
    private userserv: UserserviceService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.programForm = this.buildr.group({
      allowedbudget: [''],
      consumedBudget: [''],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam !== null) {
        this.programId = +idParam;
        this.getprogramdetails();
        this.getProfilesWithMandayBudget();
        this.getProgramProjects();
        this.connectedUser();
        console.log("programedate",this.program?.enddate && this.program?.startdate);
      } else {
        console.error('Le paramètre d\'ID du programme est invalide (nul ou indéfini).');
      }
    });
  }

  ngAfterViewInit(): void {
    // Check if scrolling is needed and update button states after view init
    setTimeout(() => {
      if (this.tabsHeader && this.tabsHeader.nativeElement) {
        this.updateScrollButtonState();
      }
    }, 500);
  }

  public connectedUser() {
    this.connecteduser = this.userserv.getUserConnected();
  }

  public getprogramdetails() {
    this.progserv.getOneProgram(this.programId).subscribe((response: any[]) => {
      this.program = response;
      console.log('Program details:', this.program);
    });
  }

  public getProfilesWithMandayBudget() {
    this.progserv
      .getProfilesOfProgram(this.programId)
      .subscribe((response: any[]) => {
        this.programProfiles = response.map((item) => ({
          profile: item[0],
          mandaybudget: item[1],
          consumedmandaybudget: item[2],
          dailyrate: item[4],
        }));
        // Calculate allowedValue
        this.allowedValue = this.programProfiles.reduce((acc, item) => {
          return acc + item.mandaybudget * item.dailyrate;
        }, 0);

        // Calculate consumedValue
        this.consumedValue = this.programProfiles.reduce((acc, item) => {
          return acc + item.consumedmandaybudget * item.dailyrate;
        }, 0);

        // Initialize pagination for profiles
        this.updateProfilePagination();
      });
  }

  public getProgramProjects() {
    this.projectserv
      .getProjectsProgram(this.programId)
      .subscribe((response: any[]) => {
        this.programProjects = response;
        // Initialize pagination after getting projects
        this.updatePagination();
        // Update scroll button state after projects are loaded
        setTimeout(() => this.updateScrollButtonState(), 300);
      });
  }

  // Enhanced pagination methods
  updatePagination(): void {
    if (!this.programProjects) return;

    this.totalPages = Math.ceil(this.programProjects.length / this.itemsPerPage);
    this.goToPage(1); // Initialize with first page
    // Force change detection to ensure pagination works
    this.cdr.detectChanges();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    const startIndex = (page - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.programProjects.length);
    this.paginatedProjects = this.programProjects.slice(startIndex, endIndex);

    // Force change detection to ensure pagination works
    this.cdr.detectChanges();
    console.log(`Navigated to page ${page}, showing projects ${startIndex+1}-${endIndex} of ${this.programProjects.length}`);
  }

  getPaginationRange(): number[] {
    const maxPagesToShow = 5;
    const pages: number[] = [];

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Profile pagination methods
  updateProfilePagination(): void {
    if (!this.programProfiles) return;

    this.profileTotalPages = Math.ceil(this.programProfiles.length / this.profileItemsPerPage);
    this.goToProfilePage(1); // Initialize with first page
    // Force change detection to ensure pagination works
    this.cdr.detectChanges();
  }

  goToProfilePage(page: number): void {
    if (page < 1 || page > this.profileTotalPages) return;

    this.profileCurrentPage = page;
    const startIndex = (page - 1) * this.profileItemsPerPage;
    const endIndex = Math.min(startIndex + this.profileItemsPerPage, this.programProfiles.length);
    this.paginatedProfiles = this.programProfiles.slice(startIndex, endIndex);

    // Force change detection to ensure pagination works
    this.cdr.detectChanges();
  }

  getProfilePaginationRange(): number[] {
    const maxPagesToShow = 5;
    const pages: number[] = [];

    let startPage = Math.max(1, this.profileCurrentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > this.profileTotalPages) {
      endPage = this.profileTotalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Tab scrolling methods
  scrollTabs(direction: 'left' | 'right'): void {
    if (!this.tabsHeader || !this.tabsHeader.nativeElement) return;

    const tabsContainer = this.tabsHeader.nativeElement;
    const currentScroll = tabsContainer.scrollLeft;

    if (direction === 'left') {
      tabsContainer.scrollLeft = Math.max(0, currentScroll - this.scrollAmount);
    } else {
      tabsContainer.scrollLeft = currentScroll + this.scrollAmount;
    }

    // Update scroll position after scrolling
    setTimeout(() => {
      this.tabScrollPosition = tabsContainer.scrollLeft;
      this.updateScrollButtonState();
    }, 100);
  }

  updateScrollButtonState(): void {
    if (!this.tabsHeader || !this.tabsHeader.nativeElement) return;

    const tabsContainer = this.tabsHeader.nativeElement;
    this.tabScrollPosition = tabsContainer.scrollLeft;

    // Check if we can scroll right further
    this.isRightScrollDisabled = tabsContainer.scrollWidth - tabsContainer.scrollLeft <= tabsContainer.clientWidth;
  }

  changeProgramStatus(idp: any) {
    this.progserv.changeProgramStatus(idp, Status.IN_PROGRESS).subscribe(
      (response) => {
        if (response) {
          alert('Le statut a été changé avec succès.');
          this.getprogramdetails();
        }
      },
      (error) => {
        alert(error.error || 'Échec lors du lancement du programme.');
      }
    );
  }

  getFrenchFormattedDate(date: Date | string | null | undefined): string {
    if (!date) {
      return ''; // Return an empty string if the date is null or undefined
    }
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(date).toLocaleDateString('fr-FR', options);
  }

  public changeStatus(status: Status) {
    this.progserv.changeProgramStatus(this.programId, status).subscribe(
      (response) => {
        alert('Le statut a été changé avec succès.');
        this.program = response;
      },
      (error) => {
        console.error('Problème lors du changement de statut.', error);
      }
    );
  }

  openStatusModal() {
    const dialogRef = this.dialog.open(StatusModalComponent, {
      width: '250px',
      data: { status: this.program.status },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.changeStatus(result);
        window.location.reload();
      }
    });
  }

  goToProgramDetailsSettings() {
    this.router.navigate(['/programs/settings', this.programId]);
  }

  goToPrograms() {
    this.router.navigate(['/programs']);
  }

  // Method to calculate total manday budget from all profiles
  getTotalMandayBudget(): number {
    if (!this.programProfiles || this.programProfiles.length === 0) {
      return 0;
    }

    return this.programProfiles.reduce((total, item) => {
      return total + (item.mandaybudget || 0);
    }, 0);
  }

  // Method to calculate total consumed manday budget from all profiles
  getTotalConsumedMandayBudget(): number {
    if (!this.programProfiles || this.programProfiles.length === 0) {
      return 0;
    }

    return this.programProfiles.reduce((total, item) => {
      return total + (item.consumedmandaybudget || 0);
    }, 0);
  }

  // Method to handle tab switching
  setActiveTab(index: number): void {
    this.activeTab = index;
  }

  goToProjectDetails(idproject: number): void {
    this.router.navigate([`/projects/details/${idproject}`]);
  }

  // Navigate to profile stats in the context of this program
  viewProfileStats(profileId: number): void {
    this.router.navigate(['/programs/stats', profileId, this.programId]);
  }
   viewProgramStats(programId: any) {
    this.router.navigate(['/programs/detailed-stats', programId]);
  }
}
