import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { LayoutsComponent } from './components/layouts/layouts.component';
import { AuthGuard } from './guards/auth-guard.guard';
import { CORE_ROUTES } from './routes/core.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/login',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: LayoutsComponent,
    canActivate: [AuthGuard],
    children: [
      // Core routes
      ...CORE_ROUTES,

      // Program routes - lazy loaded
      {
        path: 'programs',
        loadChildren: () => import('./routes/program.routes').then(m => m.PROGRAM_ROUTES),
      },

      // Project routes - lazy loaded
      {
        path: 'projects',
        loadChildren: () => import('./routes/project.routes').then(m => m.PROJECT_ROUTES),
      },

      // Redirect legacy routes
      {
        path: 'programdetails/:id',
        redirectTo: 'programs/details/:id'
      },
      {
        path: 'projectdetails/:id',
        redirectTo: 'projects/details/:id'
      },
      {
        path: 'timesheet/:idprof/:idproj',
        redirectTo: 'projects/timesheet/:idprof/:idproj'
      },
      {
        path: 'timesheets/:idproj',
        redirectTo: 'projects/timesheets/:idproj'
      },
      {
        path: 'project-profile-tasks/:projectId/:profileId',
        redirectTo: 'projects/profile-tasks/:projectId/:profileId'
      },
      {
        path: 'program-profile-tasks/:programId/:profileId',
        redirectTo: 'programs/profile-tasks/:programId/:profileId'
      },
      {
        path: 'program-stats/:profileId/:programId',
        redirectTo: 'programs/stats/:profileId/:programId'
      },
      {
        path: 'project-stats/:profileId/:projectId',
        redirectTo: 'projects/stats/:profileId/:projectId'
      },

      {
        path: 'programdetailSettings/:id',
        redirectTo: 'programs/settings/:id'
      },
      {
        path: 'add-program',
        redirectTo: 'programs/add-program'
      },
      {
        path: 'timesheet-upload',
        redirectTo: 'projects/timesheet-upload'
      },
      {
        path: 'task-assignments',
        redirectTo: 'projects/task-assignments'
      },
    ],
  },

  // Wildcard route for 404 - must be last
  {
    path: '**',
    redirectTo: '/error/404'
  },
];
