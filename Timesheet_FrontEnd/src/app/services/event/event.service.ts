import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HandleError } from '../service-helper';
import { firstValueFrom, Observable } from 'rxjs';
import { Event } from 'src/app/models/Event';
import { UserserviceService } from '../user/userservice.service';
import { RagService } from '../rag/rag.service';
import { tap, switchMap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private apiserverUrl = 'http://localhost:8083/api/v1/task';
  constructor(
    private http: HttpClient,
    private userserv: UserserviceService,
    private ragService: RagService
  ) {}

  public addTask(
    task: any,
    projectId: number,
    profileId: number
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiserverUrl}/addTask/${projectId}/${profileId}`,
      task
    ).pipe(
      tap((response) => {
        // After successfully adding a task, reload RAG data in the background
        this.ragService.reloadTaskData().pipe(
          catchError((error) => {
            console.warn('Failed to reload RAG data after adding task:', error);
            // Don't fail the main operation if RAG reload fails
            return of(null);
          })
        ).subscribe({
          next: (reloadResponse) => {
            if (reloadResponse) {
              console.log('RAG data reload initiated:', reloadResponse.message);
            }
          },
          error: (error) => {
            console.warn('RAG data reload error:', error);
          }
        });
      }),
      catchError((error) => {
        console.error('Error adding task:', error);
        throw error;
      })
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

