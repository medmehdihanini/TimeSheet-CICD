import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectProfileTasks } from '../../models/project-profile-tasks.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiserverUrl = 'http://localhost:8083/api/v1/project';

  constructor(private http: HttpClient) {}

  public addProgramProjectWithChefProject(
    project: any,
    IdProgram: any,
    Ida: any,
    userId:any
  ): Observable<any> {
    return this.http.post<any>(`${this.apiserverUrl}/AddProject/${IdProgram}/${Ida}/${userId}`, project);
  }

  public getProjectsProgram(Id: any): Observable<any> {
    return this.http.get(
      `${this.apiserverUrl}/retrieveProjectsByProgram/${Id}`
    );
  }
  public getProgramProfile(Idprogram: any,Idprofile: any): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/getProgramprofile/${Idprogram}/${Idprofile}`);
  }

  public getProjectDetails(Id: any): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/getProject/${Id}`);
  }

  public getProjectsForChief(Id: any): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/chefprojet/${Id}`);
  }
  public updateProject(idp: any,idchef:any, project: any): Observable<any> {
    return this.http.put<any>(`${this.apiserverUrl}/updateproject/${idp}/${idchef}`, project);
  }

  public deleteProject(id: number): Observable<string> {
    return this.http.delete(`${this.apiserverUrl}/deleteOneProject/${id}`, { responseType: 'text' });
  }

  public getProjectProfiles(Id: any): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/retrieveProjectProfiles/${Id}`);
  }

  public getProjectprofiles(Id: any): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/retrieveProjectprofiles/${Id}`);
  }
  public getProfileProject(Idprofile: any, IdProject: any): Observable<any> {
    return this.http.get<any>(
      `${this.apiserverUrl}/getprojectprofile/${Idprofile}/${IdProject}`
    );
  }

  public addImageToProject(idp: any, image: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('image', image);

    return this.http.put<any>(
      `${this.apiserverUrl}/addImageToProject/${idp}`,
      formData
    );
  }

  public getProfilesForProject(
    idProgram: any,
    IdProject: any
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiserverUrl}/retrieveProfilesForProject/${idProgram}/${IdProject}`
    );
  }
  public assignProfileToProject(
    idProfile: any,
    IdProject: any,
    manDayBudget: any
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiserverUrl}/assignProfileproject/${idProfile}/${IdProject}/${manDayBudget}`,
      null
    );
  }
  public assignProjectManagerToProject(
    idProfile: any,
    IdProject: any
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiserverUrl}/assignProjectManager/${idProfile}/${IdProject}`,
      null
    );
  }

  public deleteProjectProfile(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiserverUrl}/deleteProjectProfile/${id}`);
  }

  public updateProjectProfileMandaybudget(Idprofile: any, IdProject: any,mandayBudget:any): Observable<any> {
    return this.http.put<any>(
      `${this.apiserverUrl}/updateppManDayBudget/${Idprofile}/${IdProject}/${mandayBudget}`,null
    );
  }

  public getProjectsForProgmanager(Id: any): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/chefprogram/${Id}`);
  }

  public getAllProjects(): Observable<any> {
    return this.http.get(`${this.apiserverUrl}/getProjects`);
  }

  public getStatProjectbyProfil(idprofil: number, idProject: number): Observable<any> {
      return this.http.get<any>(
        `${this.apiserverUrl}/profileProjectStats/${idprofil}/${idProject}`
      );
    }
    public getProjectProfileTasks(projectId: number, profileId: number): Observable<ProjectProfileTasks> {
      return this.http.get<any>(
        `${this.apiserverUrl}/tasks/${projectId}/${profileId}`
      );
    }
     public getProjetStat(projectId: number): Observable<any> {
      return this.http.get<any>(
        `${this.apiserverUrl}/stats/${projectId}`
      );
    }

}

