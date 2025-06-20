import { IProgram } from './../models/program.models';
import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { UserserviceService } from './user/userservice.service';
import { ProgramService } from './programs/program.service';
import { ProjectService } from './project/project.service';
import { Log, LogType } from '../models/Log';
import { IProject } from '../models/program.models';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private logSubject = new Subject<Log>();
  private connectionStatus = new BehaviorSubject<boolean>(false);

  constructor(
    private userService: UserserviceService,
    private programService: ProgramService,
    private projectService: ProjectService
  ) {
    this.initializeWebSocketConnection();
  }

  private initializeWebSocketConnection() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8083/ws'),
      debug: (str) => {
        console.log('📡 STOMP:', str);
      }
    });

    this.client.onConnect = () => {
      console.log('🌐 WebSocket Connected');
      this.connectionStatus.next(true);
      this.subscribeToLogs();
    };

    this.client.onDisconnect = () => {
      console.log('🔴 WebSocket Disconnected');
      this.connectionStatus.next(false);
      setTimeout(() => this.initializeWebSocketConnection(), 5000);
    };

    this.client.activate();
  }

  private subscribeToLogs() {
    const currentUser = this.userService.getUserConnected();
    if (!currentUser) {
      console.log('⚠️ No user connected');
      return;
    }

    console.log('👤 User Role:', currentUser.role);

    // Subscribe based on user role
    if (currentUser.role === 'SUPER_ADMIN') {
      console.log('📋 Subscribing to admin logs channel');
      this.client.subscribe('/logs/admin', message => {
        console.log('📨 Received admin log:', message.body);
        const log = JSON.parse(message.body) as Log;
        this.logSubject.next(log);
      });
    }

    if (currentUser.role === 'PROGRAM_MANAGER') {
      // Get programs where user is chief
      this.programService.getProgramsWhereImChief(currentUser.id).subscribe(programs => {
        console.log('👤 User is chief of programs:', programs);
        programs.forEach((program: IProgram) => {
          // Subscribe to each program's logs channel
          const programChannel = `/logs/program/${program.idprog}`;
          console.log('📋 Subscribing to program logs channel:', programChannel);
          this.client.subscribe(programChannel, message => {
            console.log('📨 Received program log:', message.body);
            const log = JSON.parse(message.body) as Log;
            this.logSubject.next(log);
          });
        });
      });
    }

    if (currentUser.role === 'PROJECT_MANAGER') {
      // Get projects where user is chief
      this.projectService.getProjectsForChief(currentUser.id).subscribe(projects => {
        console.log('👤 User is chief of projects:', projects);
        projects.forEach((project: IProject) => {
          // Subscribe to each project's logs channel
          const projectChannel = `/logs/project/${project.idproject}`;
          console.log('📋 Subscribing to project logs channel:', projectChannel);
          this.client.subscribe(projectChannel, message => {
            console.log('📨 Received project log:', message.body);
            const log = JSON.parse(message.body) as Log;
            this.logSubject.next(log);
          });
        });
      });
    }
  }

  public getLogs(): Observable<Log> {
    return this.logSubject.asObservable();
  }

  public isConnected(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
