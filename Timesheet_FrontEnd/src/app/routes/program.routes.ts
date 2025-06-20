import { Routes } from '@angular/router';
import { HasRoleGuard } from '../guards/hasrole.guard';
import { ProgramsComponent } from '../pages/programs/programs.component';
import { ProgramdetailsComponent } from '../pages/programs/programdetails/programdetails.component';
import { ProgramsettingsComponent } from '../pages/programs/programsettings/programsettings.component';
import { AddUpdateprogramComponent } from '../pages/programs/add-updateprogram/add-updateprogram.component';
import { ProgramProfilesComponent } from '../pages/programs/program-profiles/program-profiles.component';
import { ProgramBillComponent } from '../pages/programs/progaram-bill/program-bill.component';
import { ProgramProjectsComponent } from '../pages/programs/program-projects/program-projects.component';
import { AddProgramComponent } from '../pages/programs/add-program/add-program.component';
import { ProgramStatsComponent } from '../pages/program-stats/program-stats.component';
import { ProgramProfileTasksComponent } from '../pages/program-profile-tasks/program-profile-tasks.component';
import { ProgramDetailedStatsComponent } from '../pages/program-detailed-stats/program-detailed-stats.component';

export const PROGRAM_ROUTES: Routes = [
  {
    path: '',
    component: ProgramsComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROGRAM_MANAGER', 'PARTNER', 'GPS_LEAD']
    }
  },
  {
    path: 'add-program',
    component: AddProgramComponent
  },
  {
    path: 'details/:id',
    component: ProgramdetailsComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROGRAM_MANAGER', 'GPS_LEAD', 'PARTNER']
    }
  },
  {
    path: 'settings/:id',
    component: ProgramsettingsComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROGRAM_MANAGER', 'PARTNER', 'GPS_LEAD']
    },
    children: [
      { path: '', redirectTo: 'program-informations', pathMatch: 'full' },
      {
        path: 'program-informations',
        component: AddUpdateprogramComponent,
        pathMatch: 'full'
      },
      {
        path: 'program-projects',
        component: ProgramProjectsComponent,
        pathMatch: 'full'
      },
      {
        path: 'program-profiles',
        component: ProgramProfilesComponent,
        pathMatch: 'full'
      },
      {
        path: 'billing',
        component: ProgramBillComponent,
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'stats/:profileId/:programId',
    component: ProgramStatsComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROGRAM_MANAGER', 'PARTNER', 'GPS_LEAD']
    }
  },
  {
    path: 'profile-tasks/:programId/:profileId',
    component: ProgramProfileTasksComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROGRAM_MANAGER', 'PARTNER', 'GPS_LEAD']
    }  },
  {
    path: 'detailed-stats/:id',
    component: ProgramDetailedStatsComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROGRAM_MANAGER', 'PARTNER', 'GPS_LEAD']
    }
  }
];
