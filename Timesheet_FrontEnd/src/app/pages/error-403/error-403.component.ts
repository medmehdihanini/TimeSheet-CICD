import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { UserserviceService } from '../../services/user/userservice.service';

@Component({
  selector: 'app-error-403',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './error-403.component.html',
  styleUrls: ['./error-403.component.css']
})
export class Error403Component implements OnInit {

  constructor(
    private router: Router,
    private userService: UserserviceService
  ) { }

  ngOnInit(): void {
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  goBack(): void {
    window.history.back();
  }
}
