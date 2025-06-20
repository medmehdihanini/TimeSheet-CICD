import { Routes } from '@angular/router';
import { HasRoleGuard } from '../guards/hasrole.guard';
import { ProjectsComponent } from '../pages/projects/projects.component';
import { ProjectsProjmanagerComponent } from '../pages/project-manger/projects-projmanager/projects-projmanager.component';
import { ProjectStatsComponent } from '../pages/project-stats/project-stats.component';
import { ProjectProfileTasksComponent } from '../pages/project-profile-tasks/project-profile-tasks.component';
import { TimesheetsComponent } from '../pages/timesheets/timesheets.component';
import { TimesheetTableComponent } from '../pages/projects/timesheet-table/timesheet-table.component';
import { TimesheetUploadComponent } from '../pages/timesheet-upload/timesheet-upload.component';
import { TaskAssignmentsComponent } from '../pages/task-assignments/task-assignments.component';
import { ProjectDetailedStatsComponent } from '../pages/project-detailed-stats/project-detailed-stats.component';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    component: ProjectsProjmanagerComponent
  },
  {
    path: 'details/:id',
    component: ProjectsComponent
  },
  {
    path: 'timesheet/:idprof/:idproj',
    component: TimesheetTableComponent
  },
  {
    path: 'timesheets/:idproj',
    component: TimesheetsComponent
  },
  {
    path: 'profile-tasks/:projectId/:profileId',
    component: ProjectProfileTasksComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROJECT_MANAGER', 'PROGRAM_MANAGER', 'PARTNER', 'GPS_LEAD']
    }
  },
  {
    path: 'stats/:profileId/:projectId',
    component: ProjectStatsComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROJECT_MANAGER', 'PROGRAM_MANAGER', 'PARTNER', 'GPS_LEAD']
    }
  },
  {
    path: 'detailed-stats/:id',
    component: ProjectDetailedStatsComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROJECT_MANAGER', 'PROGRAM_MANAGER', 'PARTNER', 'GPS_LEAD']
    }
  },
  {
    path: 'timesheet-upload',
    component: TimesheetUploadComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROGRAM_MANAGER', 'PROJECT_MANAGER']
    }
  },
  {
    path: 'task-assignments',
    component: TaskAssignmentsComponent,
    canActivate: [HasRoleGuard],
    data: {
      roles: ['PROJECT_MANAGER', 'PROGRAM_MANAGER']
    }
  }
];
