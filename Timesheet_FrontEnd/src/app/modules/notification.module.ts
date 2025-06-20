import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../services/notification/notification.service';

@NgModule({
  imports: [
    CommonModule,
    MatSnackBarModule
  ],
  providers: [NotificationService]  
})
export class NotificationModule { } 