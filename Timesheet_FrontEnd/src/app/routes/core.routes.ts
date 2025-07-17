import { Routes } from '@angular/router';
import { HasRoleGuard } from '../guards/hasrole.guard';
import { ChangePasswordComponent } from '../pages/change-password/change-password.component';
import { TableauBordComponent } from '../pages/dashboard/dashboard.component';
import { LogsComponent } from '../pages/logs/logs.component';
import { UserComponent } from '../pages/user/user.component';
import { ProfileComponent } from '../pages/profile/profile.component';
import { ProfileStatComponent } from '../pages/profilStat/profile-stat/profile-stat.component';
import { Error404Component } from '../pages/error-404/error-404.component';
import { Error403Component } from '../pages/error-403/error-403.component';
import { MyTimesheetsComponent } from '../pages/my-timesheets/my-timesheets.component';

export const CORE_ROUTES: Routes = [
  {
    path: 'change-password',
    component: ChangePasswordComponent
  },
  {
    path: 'dashboard',
    component: TableauBordComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['SUPER_ADMIN', 'PROGRAM_MANAGER', 'GPS_LEAD', 'PARTNER']
    }
  },
   {
    path: 'my-timesheets',
    component: MyTimesheetsComponent
  },
  {
    path: 'logs',
    component: LogsComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROJECT_MANAGER', 'SUPER_ADMIN', 'PROGRAM_MANAGER']
    }
  },
  {
    path: 'users',
    component: UserComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['SUPER_ADMIN', 'GPS_LEAD', 'PARTNER']
    }
  },
  {
    path: 'profiles',
    component: ProfileComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['SUPER_ADMIN', 'GPS_LEAD', 'PARTNER']
    }
  },  {
    path: 'profile-stats/:id',
    component: ProfileStatComponent
  },
  {
    path: 'error/404',
    component: Error404Component
  },
  {
    path: 'error/403',
    component: Error403Component
  }
];
