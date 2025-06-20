import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgramService } from 'src/app/services/programs/program.service';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ProjectService } from 'src/app/services/project/project.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

interface Project {
  idproject: number;
  name: string;
  description: string;
  state: boolean;
  image: string | null;
  status: 'IN_PROGRESS' | 'ON_HOLD' | 'UNLAUNCHED' | 'CANCELED' | 'FINISHED';
  chefprojet: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
    image: string;
  };
}

@Component({
  selector: 'app-projects-projmanager',
  templateUrl: './projects-projmanager.component.html',
  styleUrls: ['./projects-projmanager.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    FormsModule,
    MatPaginatorModule
  ],
  animations: [
    trigger('cardAnimation', [
      state('void', style({
        transform: 'scale(0.8)',
        opacity: 0
      })),
      transition('void => *', [
        animate('0.3s ease-in-out')
      ])
    ])
  ]
})
export class ProjectsProjmanagerComponent implements OnInit {
  // Variables to track mouse movement
  @ViewChild('wrapper') wrapper!: ElementRef;
  private isDown = false;
  private startX: number = 0;
  private scrollLeft: number = 0;

  connecteduser: any;
  myprojects: Project[] = [];
  ProfileProjects: any;
  searchQuery: string = '';
  filteredProjects: Project[] = [];

  // Pagination properties
  pageSize = 3;
  pageSizeOptions = [3, 6, 9, 12];
  currentPage = 0;
  paginatedProjects: Project[] = [];

  constructor(
    private programserv: ProgramService,
    private projectserv: ProjectService,
    private userserv: UserserviceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.connectedUser();
    this.getChefProgramPrograms();
  }

  public connectedUser() {
    this.connecteduser = this.userserv.getUserConnected();
  }

  public getChefProgramPrograms() {
    this.projectserv
      .getProjectsForChief(this.connecteduser.id)
      .subscribe((response: Project[]) => {
        this.myprojects = response;
        this.filteredProjects = [...this.myprojects];
        this.updatePaginatedProjects();
      });
  }

  public getChefProgramProjects() {
    this.projectserv
      .getProjectsForProgmanager(this.connecteduser.id)
      .subscribe((response: Project[]) => {
        this.myprojects = response;
        this.filteredProjects = [...this.myprojects];
        this.updatePaginatedProjects();
      });
  }

  updatePaginatedProjects() {
    const startIndex = this.currentPage * this.pageSize;
    this.paginatedProjects = (this.filteredProjects || this.myprojects).slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedProjects();
  }

  filterProjects() {
    if (!this.searchQuery) {
      this.filteredProjects = [...this.myprojects];
    } else {
      this.filteredProjects = this.myprojects.filter((project: Project) =>
        project.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        project.chefprojet.firstname.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        project.chefprojet.lastname.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    this.currentPage = 0;
    this.updatePaginatedProjects();
  }

  // Navigate to project details
  goToProjectDetails(idprog: number) {
    this.router.navigate(['/projects/details', idprog]);
  }

  // Navigate to project detailed statistics
  goToProjectDetailedStats(projectId: number) {
    this.router.navigate(['/projects/detailed-stats', projectId]);
  }

  // Event handlers for mouse down, up, and move
  handleMouseDown(event: MouseEvent) {
    // Check if the click is outside of cards
    if (!(event.target instanceof HTMLElement && event.target.closest('.example-card'))) {
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

  getProjectImage(project: Project): string {
    if (project?.chefprojet?.image) {
      return 'data:image/png;base64,' + project.chefprojet.image;
    }
    return '../../../assets/imgholder.jpg';
  }

  getProjectManagerName(project: Project): string {
    if (project?.chefprojet) {
      return `${project.chefprojet.firstname} ${project.chefprojet.lastname}`;
    }
    return 'Unknown Manager';
  }
}
