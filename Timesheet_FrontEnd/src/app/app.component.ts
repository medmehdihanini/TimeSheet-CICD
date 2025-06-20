import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule} from '@angular/material/toolbar'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSidenavModule } from '@angular/material/sidenav'
import { CustomSidenavComponent } from './components/custom-sidenav/custom-sidenav.component';
import { HttpClientModule } from '@angular/common/http';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    CustomSidenavComponent,
    HttpClientModule,
        ],
})
export class AppComponent {
  title = 'timesheet-EY-client';
  collapsed= signal(false)
  sidenavWidth = computed(()=> this.collapsed() ? '65px' : '250px');
}
