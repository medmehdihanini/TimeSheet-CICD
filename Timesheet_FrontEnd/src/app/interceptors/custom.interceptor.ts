import { HttpInterceptorFn } from "@angular/common/http";
import { Inject, inject, Injector } from "@angular/core";
import { tap, throwError } from "rxjs";
import { UserserviceService } from "../services/user/userservice.service";
import { Router } from "@angular/router";


export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(UserserviceService);
  const router = inject(Router);
  
  //console.log('request', req.method, req.url);
 
      // Check if the token is expired


      
  if (!req.url.startsWith(inject(UserserviceService).Apiurl)) {
    const authService=inject(UserserviceService)
    const authToken = authService.getToken();
//    console.log(authToken);
    //console.log('request inside block ', req.method, req.url);
    // Setting token 
    const headers = req.headers.set('Authorization', `Bearer ${authToken}`);
    req = req.clone({headers});
  }
 
  return next(req).pipe(
  /*  tap({
      error: (error) => {
        // If the server responds with 401 Unauthorized, redirect to the login page
        if (error.status === 401) {
          router.navigate(['/login']);
        }
      }
    })*/
  );
}