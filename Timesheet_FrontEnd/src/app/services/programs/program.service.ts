import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Status } from 'src/app/models/Status';
import { ProfileProgramStats } from 'src/app/models/profile-program-stats.model';
import { ProgramProfileTasks } from 'src/app/models/program-profile-tasks.model';
import { ProgramStatsDTO } from 'src/app/models/program-stats.model';

@Injectable({
  providedIn: 'root',
})
export class ProgramService {
  private apiserverUrl = 'http://localhost:8083/api/v1/program';

  constructor(private http: HttpClient) {}

  public getAllPrograms(): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/getPrograms`);
  }
  public getProgramsWhereImChief(Id: any): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/getProgramsOfChief/${Id}`);
  }

  public addProg(program: any): Observable<any> {
    return this.http.post<any>(`${this.apiserverUrl}/addProg`, program);
  }
  public addProgIfChefProg(program: any, Ida: any): Observable<any> {
    return this.http.post<any>(`${this.apiserverUrl}/addProg/${Ida}`, program);
  }

  public updateProg(program: any, Idp: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiserverUrl}/updateProgram/${Idp}`,
      program
    );
  }
  getProgramsByStatuses(idc:number,statuses: string[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiserverUrl}/filterByStatus/${idc}`, statuses);
  }
  public getOneProgram(idp: any): Observable<any> {
    return this.http.get<any>(`${this.apiserverUrl}/getOneProgram/${idp}`);
  }
  public getOneProgramWithContactNumber(idp: any): Observable<any> {
    return this.http.get<any>(
      `${this.apiserverUrl}/getOneProgramWithContactNumber/${idp}`
    );
  }
  public getProgramAlreadyProfiles(idp: any): Observable<any> {
    return this.http.get<any>(
      `${this.apiserverUrl}/getprogprofiles/${idp}`
    );
  }

  public deleteOneProgram(idp: any): Observable<any> {
    return this.http.delete<void>(
      `${this.apiserverUrl}/deleteOneProgram/${idp}`
    );
  }

  public deleteOneProgrambyContact(idp: any): Observable<any> {
    return this.http.delete(
      `${this.apiserverUrl}/deleteOneProgramByContractNumber/${idp}`,
      { responseType: 'text' }
    );
  }
  public getProfilesOfProgram(idp: any): Observable<any> {
    return this.http.get<any>(`${this.apiserverUrl}/profilePrograms/${idp}`);
  }
  public changeProgramStatus(idp: any, status: Status): Observable<any> {
    let params = new HttpParams().set('idp', idp).set('status', status);
    return this.http.put(
      `${this.apiserverUrl}/changeProgramStatus`,
      {},
      { params }
    );
  }
  public getProgramManagers(): Observable<any> {
    return this.http.get<any>(`${this.apiserverUrl}/prograManagers`);
  }

  public addImageToProgram(idp: any, image: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('image', image);

    return this.http.put<any>(
      `${this.apiserverUrl}/addImageToProgram/${idp}`,
      formData
    );
  }

  public assignProfileProgram(
    idprog: any,
    idp: any,
    mandaybud: any,
    dr: any,
    fn:any
  ): Observable<any> {
    const params = new HttpParams()
      .set('idprog', idprog)
      .set('idp', idp)
      .set('manday', mandaybud)
      .set('dailyrate', dr)
      .set('function',fn)
    return this.http.put<any>(
      `${this.apiserverUrl}/assignProfileprogram`,
      null,
      { params: params }
    );
  }

  public getProgramProfiles(idp: any): Observable<any> {
    return this.http.get<any>(`${this.apiserverUrl}/profileforPrograms/${idp}`);
  }

  public getPartnerProfileAssociatedPrograms(idp: any): Observable<any> {
    return this.http.get<any>(
      `${this.apiserverUrl}/programsByPartnerProfile/${idp}`
    );
  }

  public deleteProfileFromProgram(idpp: any): Observable<any> {
    return this.http.delete(
      `${this.apiserverUrl}/deleteProfileFromProgram/${idpp}`
    );
  }

  public updateProgramProfileMandaybudget(Idprofile: any, IdProject: any,mandayBudget:any,daily:any): Observable<any> {
    return this.http.put<any>(
      `${this.apiserverUrl}/updateProgProfileManday/${Idprofile}/${IdProject}/${mandayBudget}/${daily}`,null
    );
  }

  public getProfilStatByProgramme(idprofil: number, idprogramme: number): Observable<ProfileProgramStats> {
    return this.http.get<ProfileProgramStats>(
      `${this.apiserverUrl}/profileProgramStats/${idprofil}/${idprogramme}`
    );
  }

  public getProgramProfileTasks(idprofil: number, idprogramme: number): Observable<ProgramProfileTasks> {
    return this.http.get<ProgramProfileTasks>(
      `${this.apiserverUrl}/tasks/${idprogramme}/${idprofil}`
    );
  }


  public getProgrammeStatistique(idprogramme: number): Observable<ProgramStatsDTO> {
    return this.http.get<ProgramStatsDTO>(
      `${this.apiserverUrl}/stats/${idprogramme}`
    );
  }
}
