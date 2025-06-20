import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { customInterceptor } from '../app/interceptors/custom.interceptor';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventService } from './services/event/event.service';
import { MatNativeDateModule } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([customInterceptor])),
    provideRouter(routes),
     provideAnimations(),
     {provide: 'APIREQRES', useValue:'http://localhost:8083/api/v1/auth/authenticate'},
    {provide:MatDialogRef , useValue:{} },
       { provide: MAT_DIALOG_DATA, useValue: {}},
     provideHttpClient(),
     importProvidersFrom(MatNativeDateModule),
    ]
};
