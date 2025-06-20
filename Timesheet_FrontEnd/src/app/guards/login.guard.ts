
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserserviceService } from '../services/user/userservice.service';

@Injectable({
  providedIn: 'root'
})
export class loginGuard implements CanActivate {

  constructor(private authService: UserserviceService, private router: Router){

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if(this.authService.isLoggedIn())
      this.router.navigate(['/home']);
    return true;
  }
  
}