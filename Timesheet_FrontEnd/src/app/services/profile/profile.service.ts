import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiserverUrl = 'http://localhost:8083/api/v1/profile';
  private tocreateProfileAccount = 'http://localhost:8083/api/v1/auth'

  constructor(private http: HttpClient) {}

  public getAllProfiles(): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/getAllProfiles`);
  }

  public saveProfile(_val: any): Observable<any> {
    return this.http.post<any>(`${this.apiserverUrl}/addprofile`, _val);
  }
  public getOneProfile(Id: any): Observable<any> {
    return this.http.get<any>(`${this.apiserverUrl}/getOneProfile/${Id}`);
  }

  public updateProfile(idu: number, user: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiserverUrl}/modifyProfile/${idu}`,
      user
    );
  }
  public deleteProfile(idu: any): Observable<any> {
    return this.http.delete(`${this.apiserverUrl}/deleteProfile/${idu}`, { responseType: 'text' });
  }

  public CreateProfileForAccount(idp: any): Observable<any>{
    return this.http.post(`${this.tocreateProfileAccount}/registerwithprofile/${idp}`, null, { responseType: 'text' });
  }

  public getProjectManagers(): Observable<any> {
    return this.http.get<any>(`http://localhost:8083/api/v1/user/getAllProjectManagers`);
  }
  public getProfileStats(Idprofile:any): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/${Idprofile}/stats`);
}
}
