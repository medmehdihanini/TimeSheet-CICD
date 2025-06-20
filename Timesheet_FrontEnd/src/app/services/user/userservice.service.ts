import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ProfileId } from '../../models/chat/ProfileId';

@Injectable({
  providedIn: 'root',
})
export class UserserviceService {
  private apiserverUrl = 'http://localhost:8083/api/v1/auth';
  private apiUserUrl = 'http://localhost:8083/api/v1/user';
  private tokenKey = 'Token';
  public connectedUser: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject('APIREQRES') public Apiurl: string
  ) {}

  public login(auth: any): Observable<any> {
    return this.http.post<any>(`${this.apiserverUrl}/authenticate`, auth);
  }

  public logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
    window.location.reload();
  }

  public isLoggedIn(): boolean {
    let token = localStorage.getItem(this.tokenKey);
    return token != null && token.length > 0;
  }

  public isTokenExpired(): boolean {
    const token = this.getToken();
    if (token) {
      const expiry = JSON.parse(atob(token.split('.')[1])).exp;
      return Date.now() > expiry * 1000;
    }
    return true; // If there is no token then its considered as expired
  }

  public getToken(): string | null {
    let loggedUserData: any;
    const localData = localStorage.getItem('Token');
    if (localData != null) {
      loggedUserData = JSON.parse(localData);
      this.tokenKey = loggedUserData.token;
      //      console.log('this.token key : ',this.tokenKey)
      return this.tokenKey;
    }
    return this.isLoggedIn() ? localStorage.getItem(this.tokenKey) : null;
  }

  get apiUrl() {
    return this.Apiurl;
  }
  public getUserConnected() {
    let loggedUserData: any;
    const localData = localStorage.getItem('Token');
    if (localData != null) {
      loggedUserData = JSON.parse(localData);
      this.connectedUser = loggedUserData.connecteduser;
      //  console.log('this.connecteduser : ',this.connectedUser)
      return this.connectedUser;
    }
  }

  public getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUserUrl}/getAllUsers`);
  }

  public saveuser(_val: any): Observable<any> {
    return this.http.post<any>(`${this.apiserverUrl}/register`, _val);
  }

  public getOneUser(Id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUserUrl}/getUserById/${Id}`);
  }
  public updateUser(idu: number, user: any): Observable<any> {
    return this.http.put<any>(`${this.apiUserUrl}/updateUser/${idu}`, user);
  }
  public deleteUser(idu: any): Observable<any> {
    return this.http.delete<void>(`${this.apiUserUrl}/deleteUser/${idu}`);
  }
  public addImageToUser(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUserUrl}/addImageToUser/${id}`, formData);
  }
  //TODO
  public UpdatePassword(_val: any): Observable<any> {
    // Set responseType to 'text' to properly handle text responses
    return this.http.post(`${this.apiserverUrl}/change-password`, _val, {
      responseType: 'text',
    });
  }

  public ForgetPassword(_val: any): Observable<any> {
    // Set responseType to 'text' to properly handle text responses
    return this.http.post(`${this.apiserverUrl}/reset-password`, _val, {
      responseType: 'text',
    });
  }


   public getMatchingProfileId(userId: number): Observable<ProfileId> {
    return this.http.get<ProfileId>(`${this.apiUserUrl}/getMatchingProfileId/${userId}`);
  }
}
