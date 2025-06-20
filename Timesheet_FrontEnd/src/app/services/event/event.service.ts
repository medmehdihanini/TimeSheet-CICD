import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HandleError } from '../service-helper';
import { firstValueFrom, Observable } from 'rxjs';
import { Event } from 'src/app/models/Event';
import { UserserviceService } from '../user/userservice.service';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private apiserverUrl = 'http://localhost:8083/api/v1/task';
  constructor(private http: HttpClient, private userserv: UserserviceService) {}

  public addTask(
    task: any,
    projectId: number,
    profileId: number
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiserverUrl}/addTask/${projectId}/${profileId}`,
      task
    );
  }

  public getTasks(projectId: number, profileId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiserverUrl}/getTasks/${projectId}/${profileId}`
    );
  }
  public getTasksForProfileAndMonth(
    Month: any,
    profileId: number
  ): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiserverUrl}/getTasksofmonth/${Month}/${profileId}`
    );
  }
  updateTask(taskId: number, updatedTask: any): Observable<any> {
    return this.http.put<any[]>(
      `${this.apiserverUrl}/updateTask/${updatedTask}`,taskId
    );
  }
  public getTasksByMonthAndProfile(monthYear: string, profileId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiserverUrl}/byMonthAndProfile`, {
      params: {
        monthYear: monthYear,
        profileId: profileId
      }
    });
  }

  public getTasksAndProjectIdByMonthAndProfile(monthYear: string, profileId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiserverUrl}/byMonthAndProfilewithProjectId`, {
      params: {
        monthYear: monthYear,
        profileId: profileId,
      }
    });
  }

  public deleteTask(taskId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiserverUrl}/deleteTask/${taskId}`);
  }

  public getTasksByProjectAndMonthYear(monthYear: string, projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiserverUrl}/byProjectAndMonthYear`, {
      params: {
        monthYear: monthYear,
        projectId: projectId,
      }
    });
  }
}

