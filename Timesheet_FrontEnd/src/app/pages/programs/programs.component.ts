import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { ProgramService } from 'src/app/services/programs/program.service';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddProgramComponent } from './add-program/add-program.component';
import { Status } from 'src/app/models/Status';
import { MaterialModule } from 'src/app/MaterialModule';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'src/app/services/alert.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-programs',
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
  ],
})
export class ProgramsComponent implements OnInit {
  @ViewChild('wrapper') wrapper!: ElementRef;

  @ViewChild('AddProgrammodal') AddProgramComponent!: ElementRef;
  @ViewChild('dropdownMenu') dropdownMenu: any;
  // Variables to track mouse movement
  private isDown = false;
  private startX: number = 0;
  private scrollLeft: number = 0;
  selectedStatuses: string[] = [];
  statusList: string[] = ['IN_PROGRESS', 'ON_HOLD', 'FINISHED', 'UNLAUNCHED', 'CANCELED'];
  connecteduser: any;
  myprograms: any;
  partnerPrograms: any;
  isDropdownOpen = false;
  searchQuery: string = '';
  filteredPrograms: any[] = [];

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 6; // Default value
  itemsPerPageOptions: number[] = [3, 6, 9];
  totalPages: number = 1;
  paginatedPrograms: any[] = [];

  constructor(
    private programserv: ProgramService,
    private userserv: UserserviceService,
    private router: Router,
    public dialog: MatDialog,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.connectedUser();
    this.getChefProgramPrograms();
    if (this.connecteduser.role === "PARTNER") {
      this.getPartnerAssociatedPrograms();
    }
    // Initialize pagination with default values
    this.currentPage = 1;
    this.itemsPerPage = 6;
    this.totalPages = 1;
  }

  public connectedUser() {
    this.connecteduser = this.userserv.getUserConnected();
  }

  public getChefProgramPrograms() {
    this.programserv
      .getProgramsWhereImChief(this.connecteduser.id)
      .subscribe((response: any[]) => {
        this.myprograms = response;
        this.filteredPrograms = response;
        this.updatePagination(); // Initialize pagination when programs are loaded
      });
  }

  filterPrograms(): void {
    let filtered = [...this.myprograms];

    // Apply status filter if any status is selected
    if (this.selectedStatuses.length > 0) {
      filtered = filtered.filter((program: any) =>
        this.selectedStatuses.includes(program.status)
      );
    }

    // Apply search filter if there's a search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter((program: any) => {
        return (
          program.name?.toLowerCase().includes(query) ||
          program.numcontrat?.toString().toLowerCase().includes(query) ||
          program.status?.toLowerCase().includes(query) ||
          program.programManager?.name?.toLowerCase().includes(query) ||
          program.programManager?.email?.toLowerCase().includes(query)
        );
      });
    }

    this.filteredPrograms = filtered;
    this.updatePagination();
  }

  onStatusChange() {
    this.filterPrograms();
  }

  goToProgramDetails(idprog: number) {
    this.router.navigate(['/programs/details', idprog]);
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

  getPartnerAssociatedPrograms() {
    this.programserv
      .getPartnerProfileAssociatedPrograms(this.connecteduser.email)
      .subscribe((response: any[]) => {
        this.partnerPrograms = response;
      });
  }


  redirectToAddProgram() {
    this.router.navigate(['/programs/add-program']);
  }

  deleteProgram(numcontrat: number, event: Event) {
    event.stopPropagation();
    this.alertService.confirm(
      'Supprimer le Programme',
      'Êtes-vous sûr de vouloir supprimer ce programme ? Cette action ne peut pas être annulée.'
    ).then((result) => {
      if (result.isConfirmed) {
        this.programserv.deleteOneProgrambyContact(numcontrat).subscribe({
          next: (response: string) => {
            this.alertService.success(
              'Succès',
              response || 'Le programme a été supprimé avec succès.'
            );
            this.getChefProgramPrograms();
          },
          error: (error) => {
            console.error('Failed to delete program:', error);
            this.alertService.error(
              'Erreur',
              'Échec de la suppression du programme. Veuillez réessayer.'
            );
          }
        });
      }
    });
  }

  openAddProgramModal(): void {
    const dialogRef = this.dialog.open(AddProgramComponent, {
      width: '600px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {});
  }

  handleMouseDown(event: MouseEvent) {

    if (
      !(
        event.target instanceof HTMLElement &&
        event.target.closest('.example-card')
      )
    ) {
      this.isDown = true;
      this.startX = event.pageX - this.wrapper.nativeElement.offsetLeft;
      this.scrollLeft = this.wrapper.nativeElement.scrollLeft;
    }
  }

  handleMouseLeave() {
    this.isDown = false;
  }

  handleMouseUp() {
    this.isDown = false;
  }

  handleMouseMove(event: MouseEvent) {
    if (this.isDown) {
      event.preventDefault();
      const x = event.pageX - this.wrapper.nativeElement.offsetLeft;
      const walk = (x - this.startX) * 3; // Adjust scrolling speed
      this.wrapper.nativeElement.scrollLeft = this.scrollLeft - walk;
    }
  }
  changeProgramStatus(idp: any, event?: MouseEvent) {
    if (event) {
      event.stopPropagation(); // Prevent navigation to details page
    }

    this.programserv.changeProgramStatus(idp, Status.IN_PROGRESS).subscribe(
      (response) => {
        if (response) {
          location.reload();
        }
      },
      (error) => {
        alert(error.error || 'Le lancement du programme a échoué');
      }
    );
  }

  canAddProgram(): boolean {
    return ['PROGRAM_MANAGER', 'PARTNER', 'GPS_LEAD'].includes(this.connecteduser.role);
  }

  getUserImage(user: any): string {
    return user.image
      ? 'data:image/png;base64,' + user.image
      : '../../../assets/imgholder.jpg';
  }

  getProgramManagerImage(manager: any): string {
    return manager.image
      ? 'data:image/jpg;base64,' + manager.image
      : '../../../assets/imgholder.jpg';
  }

  getProgramImage(program: any): string {
    return program.image
      ? 'data:image/png;base64,' + program.image
      : '../../../assets/téléchargé.png';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'in-progress';
      case 'ON_HOLD':
      case 'UNLAUNCHED':
        return 'on-hold';
      case 'CANCELED':
        return 'canceled';
      case 'FINISHED':
        return 'finished';
      default:
        return '';
    }
  }

  canLaunchProgram(status: string): boolean {
    return status === 'UNLAUNCHED' || status === 'ON_HOLD';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'play_circle';
      case 'ON_HOLD':
        return 'pause_circle';
      case 'FINISHED':
        return 'check_circle';
      case 'UNLAUNCHED':
        return 'schedule';
      case 'CANCELED':
        return 'cancel';
      default:
        return 'help';
    }
  }

  getStatusCount(status: string): number {
    return this.myprograms?.filter((p: any) => p.status === status).length || 0;
  }

  toggleStatus(status: string): void {
    const index = this.selectedStatuses.indexOf(status);
    if (index === -1) {
      this.selectedStatuses.push(status);
    } else {
      this.selectedStatuses.splice(index, 1);
    }
    this.filterPrograms();
  }

  clearFilters(): void {
    this.selectedStatuses = [];
    this.filterPrograms();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  updatePagination(): void {
    // Calculate total pages
    this.totalPages = Math.ceil(this.filteredPrograms.length / this.itemsPerPage);

    // Ensure current page is within valid range
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    // Calculate start and end index for current page
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    // Update paginated programs
    this.paginatedPrograms = this.filteredPrograms.slice(startIndex, endIndex);
  }

  onItemsPerPageChange(newValue: number): void {
    this.itemsPerPage = newValue;
    this.currentPage = 1; // Reset to first page
    this.updatePagination();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  viewProgramStats(programId: any, event: MouseEvent) {
    event.stopPropagation(); // Prevent navigation to details page
    this.router.navigate(['/programs/detailed-stats', programId]);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'En Cours';
      case 'ON_HOLD':
        return 'En Attente';
      case 'FINISHED':
        return 'Terminé';
      case 'UNLAUNCHED':
        return 'Non Lancé';
      case 'CANCELED':
        return 'Annulé';
      default:
        return status;
    }
  }
}
