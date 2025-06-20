import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, forkJoin, firstValueFrom } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { WebSocketService } from '../websocket.service';
import { UserserviceService } from '../user/userservice.service';
import { Log } from '../../models/Log';
import { ProgramService } from '../programs/program.service';
import { ProjectService } from '../project/project.service';
import { IProgram, IProject } from '../../models/program.models';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private readonly apiUrl = 'http://localhost:8083/api/v1/logs';
  private logsSubject = new BehaviorSubject<Log[]>([]);
  private loadedLogIds = new Set<number>();

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService,
    private userService: UserserviceService,
    private programService: ProgramService,
    private projectService: ProjectService
  ) {
    // Subscribe to WebSocket logs
    this.webSocketService.getLogs()
      .subscribe({
        next: async (log) => {
          if (!this.loadedLogIds.has(log.id)) {
            if (await this.userCanSeeLog(log)) {
              this.loadedLogIds.add(log.id);
              const currentLogs = this.logsSubject.value;
              this.logsSubject.next([log, ...currentLogs]);
            }
          }
        },
        error: (error) => console.error('Error receiving WebSocket log:', error)
      });
  }

  private async userCanSeeLog(log: Log): Promise<boolean> {
    const currentUser = this.userService.getUserConnected();
    if (!currentUser) return false;

    switch (currentUser.role) {
      case 'SUPER_ADMIN':
        return true;

      case 'PROGRAM_MANAGER':
        if (!log.program && !log.project?.program) return false;
        const programAccess = await this.isProgramManager(currentUser.id, log.program?.idprog);
        const projectProgramAccess = await this.isProgramManager(currentUser.id, log.project?.program?.idprog);
        return programAccess || projectProgramAccess;

      case 'PROJECT_MANAGER':
        if (!log.project) return false;
        return await this.isProjectManager(currentUser.id, log.project.idproject);

      default:
        return false;
    }
  }

  private async isProgramManager(userId: number, programId?: number): Promise<boolean> {
    if (!programId) return false;
    const programs = await firstValueFrom(this.programService.getProgramsWhereImChief(userId));
    return programs.some((p: IProgram) => p.idprog === programId);
  }

  private async isProjectManager(userId: number, projectId?: number): Promise<boolean> {
    if (!projectId) return false;
    const projects = await firstValueFrom(this.projectService.getProjectsForChief(userId));
    return projects.some((p: IProject) => p.idproject === projectId);
  }

  getAllLogs(): Observable<Log[]> {
    const currentUser = this.userService.getUserConnected();
    if (!currentUser) {
      return of([]);
    }

    switch (currentUser.role) {
      case 'SUPER_ADMIN':
        return this.http.get<Log[]>(`${this.apiUrl}/all`).pipe(
          tap(logs => {
            logs.forEach(log => this.loadedLogIds.add(log.id));
            this.logsSubject.next(logs);
          }),
          catchError(error => {
            console.error('Error fetching all logs:', error);
            return of([]);
          })
        );

      case 'PROGRAM_MANAGER':
        return this.programService.getProgramsWhereImChief(currentUser.id).pipe(
          switchMap((programs: IProgram[]) => {
            if (!programs.length) return of([]);
            const requests = programs.map(program =>
              this.http.get<Log[]>(`${this.apiUrl}/program/${program.idprog}`)
            );
            return forkJoin(requests).pipe(
              map((logArrays: Log[][]) => {
                const uniqueLogs = new Set<Log>();
                logArrays.forEach(logs => logs.forEach(log => uniqueLogs.add(log)));
                const allLogs = Array.from(uniqueLogs);
                allLogs.forEach(log => this.loadedLogIds.add(log.id));
                this.logsSubject.next(allLogs);
                return allLogs;
              })
            );
          }),
          catchError(error => {
            console.error('Error fetching program logs:', error);
            return of([]);
          })
        );

      case 'PROJECT_MANAGER':
        return this.projectService.getProjectsForChief(currentUser.id).pipe(
          switchMap((projects: IProject[]) => {
            if (!projects.length) return of([]);
            const requests = projects.map(project =>
              this.http.get<Log[]>(`${this.apiUrl}/project/${project.idproject}`)
            );
            return forkJoin(requests).pipe(
              map((logArrays: Log[][]) => {
                const uniqueLogs = new Set<Log>();
                logArrays.forEach(logs => logs.forEach(log => uniqueLogs.add(log)));
                const allLogs = Array.from(uniqueLogs);
                allLogs.forEach(log => this.loadedLogIds.add(log.id));
                this.logsSubject.next(allLogs);
                return allLogs;
              })
            );
          }),
          catchError(error => {
            console.error('Error fetching project logs:', error);
            return of([]);
          })
        );

      default:
        return of([]);
    }
  }

  getLiveUpdates(): Observable<Log[]> {
    return this.logsSubject.asObservable();
  }

  deleteSelectedLogs(ids: number[]): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete-selected`, {
      body: ids,
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(response => {
        if (response.ok) {
          // Only update the local state if the API call was successful
          const currentLogs = this.logsSubject.value.filter(log => !ids.includes(log.id));
          ids.forEach(id => this.loadedLogIds.delete(id));
          this.logsSubject.next(currentLogs);
          return response.body || 'Selected logs deleted successfully.';
        } else {
          throw new Error(response.body || 'Error deleting selected logs');
        }
      }),
      catchError(error => {
        // If it's an HTTP error response, use its message
        if (error.error && typeof error.error === 'string') {
          throw new Error(error.error);
        }
        // Otherwise use a default message
        throw new Error('Error deleting selected logs');
      })
    );
  }

  deleteAllLogs(): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete-all`, {
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(response => {
        if (response.ok) {
          // Only update the local state if the API call was successful
          this.loadedLogIds.clear();
          this.logsSubject.next([]);
          return response.body || 'All logs deleted successfully.';
        } else {
          throw new Error(response.body || 'Error deleting all logs');
        }
      }),
      catchError(error => {
        // If it's an HTTP error response, use its message
        if (error.error && typeof error.error === 'string') {
          throw new Error(error.error);
        }
        // Otherwise use a default message
        throw new Error('Error deleting all logs');
      })
    );
  }
}
