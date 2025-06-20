import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import {
  ActivatedRoute,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProgramService } from 'src/app/services/programs/program.service';
import { Status } from 'src/app/models/Status';

@Component({
  selector: 'app-programsettings',
  templateUrl: './programsettings.component.html',
  styleUrls: ['./programsettings.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    RouterOutlet,
    RouterModule,
    MatButtonModule,
    MatIconModule,
  ],
  
})
export class ProgramsettingsComponent implements OnInit {
  programId: any;
  activeLink = 'program-informations';
  constructor(
    private programserv: ProgramService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam !== null) {
        this.programId = +idParam;
      } else {
        console.error(
          "Le paramètre d'ID du programme est invalide (nul ou non défini)."
        );
      }
    });
  }
  navigate(link: string) {
    this.activeLink = link;
    this.router.navigate(['/', link]);
  }

  goToProgramDetails() {
    this.router.navigate(['/programdetails', this.programId]);
  }

  onCloseProgram() {
    const confirmation = window.confirm('Etes-vous sûr de vouloir fermer ce programme ?'); 

    if (confirmation) {
      this.changeProgramStatus(this.programId, Status.FINISHED); 
    }
  }

  
  changeProgramStatus(idp: any, status: Status) {
    this.programserv.changeProgramStatus(idp, status).subscribe({
      next: (response) => {
        alert('Le programme a été clôturé!');
      },
      error: (error) => {
        console.error('Error changing program status:', error);
        alert('Impossible de modifier le statut du programme.');
      },
    });
  }
}
