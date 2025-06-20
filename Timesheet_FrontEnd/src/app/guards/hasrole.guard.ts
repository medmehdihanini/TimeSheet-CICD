import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { UserserviceService } from '../services/user/userservice.service';

@Injectable({
  providedIn: 'root',
})
export class HasRoleGuard implements CanActivate {

  constructor(
    private authService: UserserviceService,
    private router: Router
  ) {}

   userconnected= this.authService.getUserConnected();

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {

    //const isAuthorized = this.userconnected?.role.includes(route.data['role'])


    const roles = route.data['roles'] as string[] || [route.data['role']];  // Supporte un tableau ou un seul rôle

    // Vérification si l'utilisateur a au moins un rôle autorisé
    const isAuthorized = this.userconnected && roles.some(role => this.userconnected.role === role);


    if (!isAuthorized) {
      // Redirect to 403 unauthorized page
      this.router.navigate(['/error/403']);
      return false;
    }

    return isAuthorized || false;
  }
}
