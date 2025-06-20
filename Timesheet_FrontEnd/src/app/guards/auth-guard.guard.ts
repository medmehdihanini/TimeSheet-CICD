/*import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import {session} from '../models/session'


export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state:RouterStateSnapshot) => {
  const router:Router= inject(Router);
  const ProtectedRoutes: string[]=['/home','/programs','/projects','/timesheets','/repports']
  return ProtectedRoutes.includes(state.url) && !session ? router.navigate(['/login']) : true;
};
*/

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserserviceService } from '../services/user/userservice.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: UserserviceService, private router: Router){

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    /*if(!this.authService.isLoggedIn())
      this.router.navigate(['/login']);
    return true;*/

    if (!this.authService.isLoggedIn() || this.authService.isTokenExpired()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
  }
  
