import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';
import { ProgramService } from '../../services/programs/program.service';
import { ProjectService } from '../../services/project/project.service';
import { LogsService } from '../../services/logs/logs.service';
import { AlertService } from '../../services/alert.service';
import { UserserviceService } from '../../services/user/userservice.service';
import { LogType } from '../../models/Log';

interface Log {
  id: number;
  username: string;
  email: string | null;
  action: string;
  timestamp: string;
  program?: {
    idprog: number;
    name: string;
  };
  project?: {
    idproject: number;
    name: string;
    program?: {
      idprog: number;
      name: string;
    };
  };
}

interface Project {
  idproject: number;
  name: string;
}

interface Program {
  idprog: number;
  name: string;
}

interface UserLogs {
  email: string;
  username: string;
  logs: Log[];
  stats: {
    totalActions: number;
    loginCount: number;
    createCount: number;
    updateCount: number;
    deleteCount: number;
    lastActivity: string;
  };
  isExpanded: boolean;
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe]
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: Log[] = [];
  filteredLogs: Log[] = [];
  projects: Project[] = [];
  programs: Program[] = [];
  searchTerm: string = '';
  searchDate: string = '';
  selectedLogs: Set<number> = new Set<number>();
  isAllSelected: boolean = false;
  showUndoButton: boolean = false;
  countdown: number = 10;
  selectedEmail: string = '';
  userLogs: UserLogs[] = [];
  private backupLogs: Log[] = [];
  private deleteTimer: any;
  private countdownTimer: any;
  private destroy$ = new Subject<void>();
  private loadedLogIds = new Set<number>();
  wsConnectionStatus = false;

  currentUser: any;
  userRole: string = '';
  userPrograms: number[] = [];
  userProjects: number[] = [];

  constructor(
    private logsService: LogsService,
    private alertService: AlertService,
    private userService: UserserviceService,
    private projectService: ProjectService,
    private programService: ProgramService,
    private webSocketService: WebSocketService,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('📋 LogsComponent initialized');
    this.initializeComponent();
    this.setupWebSocketConnection();
    this.loadInitialLogs();

    // Update time ago display every minute instead of every second for better performance
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.logs = [...this.logs];
        this.groupLogsByEmail();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.webSocketService.disconnect();

    // Clean up the timers
    if (this.deleteTimer) {
      this.deleteTimer.unsubscribe();
    }
    if (this.countdownTimer) {
      this.countdownTimer.unsubscribe();
    }
  }

  private loadProjects() {
    this.projectService.getAllProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          this.projects = data;
        },
        (error: Error) => {
          console.error('Error loading projects:', error);
        }
      );
  }


  private loadInitialLogs() {
    this.logsService.getAllLogs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (logs) => {
          console.log('📋 Loaded initial logs:', logs.length);
          this.logs = logs;
          this.filterLogs();
          this.groupLogsByEmail();
        },
        error: (error) => {
          console.error('❌ Error loading logs:', error);
          this.alertService.error('Error', 'Failed to load logs');
        }
      });
  }

  private setupWebSocketConnection() {
    console.log('📋 Setting up WebSocket connection for logs...');
    this.webSocketService.isConnected()
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.wsConnectionStatus = connected;
        console.log(`${connected ? '📡 WebSocket connected' : '🔴 WebSocket disconnected'}`);
      });

    // Subscribe to live log updates
    this.logsService.getLiveUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (logs: Log[]) => {
          if (logs.length > 0) {
            console.log('📨 Received new logs:', logs.length);
            this.logs = logs;
            this.filterLogs();
            this.groupLogsByEmail();
            this.alertService.success('New Log', 'A new action has been logged');
          }
        },
        error: (error) => {
          console.error('❌ WebSocket error:', error);
          this.alertService.error('Connection Error', 'Failed to connect to real-time logs');
        }
      });
  }

  getProjectName(id: number): string {
    const project = this.projects.find(p => p.idproject === id);
    return project ? project.name : 'Unknown Project';
  }

  getProgramName(id: number): string {
    const program = this.programs.find(p => p.idprog === id);
    return program ? program.name : 'Unknown Program';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'MMM d, y, h:mm a') || '';
  }

  getTimeAgo(timestamp: string): string {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
      }
    }

    return 'Just now';
  }

  formatActionMessage(action: string): string {
    // Remove redundant "User X performed action:" prefix
    let formattedAction = action.replace(/^User\s+.*?\s+performed\s+action:\s+/, '');

    // Add line breaks before important keywords
    formattedAction = formattedAction
      .replace(/\b(created|updated|deleted|assigned)\b/g, '\n$1')
      .replace(/\b(in program|in project|with ID)\b/g, '\n$1');

    return formattedAction.trim();
  }

  getDisplayMessage(log: Log): string {
    // Check if this is an anonymous user sign-in log
    if (log.email === 'anonymousUser') {
      // Extract email from the action message for sign-in actions
      const emailMatch = log.action.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        return `Utilisateur authentifié: ${emailMatch[1]}`;
      }
    }

    // For all other logs, use the existing formatActionMessage method
    return this.formatActionMessage(log.action);
  }

  private groupLogsByEmail() {
    const emailGroups = new Map<string, UserLogs>();

    // First sort all logs by timestamp
    const sortedLogs = this.filteredLogs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    sortedLogs.forEach(log => {
      if (!log.email) return;

      if (!emailGroups.has(log.email)) {
        emailGroups.set(log.email, {
          email: log.email,
          username: log.username,
          logs: [],
          stats: {
            totalActions: 0,
            loginCount: 0,
            createCount: 0,
            updateCount: 0,
            deleteCount: 0,
            lastActivity: ''
          },
          isExpanded: false
        });
      }

      const userLogs = emailGroups.get(log.email)!;
      userLogs.logs.push(log);

      // Update stats
      userLogs.stats.totalActions++;
      if (log.action.toLowerCase().includes('login')) userLogs.stats.loginCount++;
      if (log.action.toLowerCase().includes('create')) userLogs.stats.createCount++;
      if (log.action.toLowerCase().includes('update')) userLogs.stats.updateCount++;
      if (log.action.toLowerCase().includes('delete')) userLogs.stats.deleteCount++;

      // Update last activity
      const logDate = new Date(log.timestamp);
      if (!userLogs.stats.lastActivity || new Date(userLogs.stats.lastActivity) < logDate) {
        userLogs.stats.lastActivity = log.timestamp;
      }
    });

    // Convert to array and sort by last activity
    this.userLogs = Array.from(emailGroups.values())
      .sort((a, b) => new Date(b.stats.lastActivity).getTime() - new Date(a.stats.lastActivity).getTime());
  }

  private initializeComponent() {
    console.log('📋 Initializing user and role for logs');
    this.currentUser = this.userService.getUserConnected();
    if (this.currentUser) {
      this.userRole = this.currentUser.role;
      console.log('📋 User role for logs:', this.userRole);

      // Load role-specific permissions
      if (this.userRole === 'PROGRAM_MANAGER') {
        console.log('📋 Loading programs for Program Manager');
        this.programService.getProgramsWhereImChief(this.currentUser.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (programs: any[]) => {
              this.userPrograms = programs.map(p => p.idprog);
              console.log('📋 Loaded programs:', this.userPrograms);
              this.loadProjects(); // Load projects after programs
            },
            error: error => console.error('❌ Error loading user programs:', error)
          });
      } else if (this.userRole === 'PROJECT_MANAGER') {
        console.log('📋 Loading projects for Project Manager');
        this.projectService.getProjectsForChief(this.currentUser.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (projects: any[]) => {
              this.userProjects = projects.map(p => p.idproject);
              console.log('📋 Loaded projects:', this.userProjects);
            },
            error: error => console.error('❌ Error loading user projects:', error)
          });
      }
    }
  }

  private filterLogsByUserRole(logs: Log[]): Log[] {
    if (!this.currentUser) return [];

    let filteredLogs: Log[] = [];
    switch (this.userRole) {
      case 'SUPER_ADMIN':
        filteredLogs = logs;
        break;

      case 'PROGRAM_MANAGER':
        filteredLogs = logs.filter(log => {
          // Include logs for user's programs
          if (log.program && this.userPrograms.includes(log.program.idprog)) {
            return true;
          }
          // Include logs for projects under user's programs
          if (log.project?.program && this.userPrograms.includes(log.project.program.idprog)) {
            return true;
          }
          return false;
        });
        break;

      case 'PROJECT_MANAGER':
        filteredLogs = logs.filter(log =>
          log.project && this.userProjects.includes(log.project.idproject)
        );
        break;

      default:
        filteredLogs = [];
    }

    // Sort logs by timestamp in descending order
    return filteredLogs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  filterLogs() {
    // Apply role-based filtering first
    let filteredByRole = this.filterLogsByUserRole(this.logs);

    // Then apply search filters
    if (!this.searchTerm && !this.searchDate && !this.selectedEmail) {
      this.filteredLogs = filteredByRole;
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredLogs = filteredByRole.filter(log => {
        const matchesDate = !this.searchDate ||
          new Date(log.timestamp).toISOString().split('T')[0] === this.searchDate;
        const matchesSearch = !this.searchTerm ||
          log.username.toLowerCase().includes(searchLower) ||
          (log.email && log.email.toLowerCase().includes(searchLower)) ||
          log.action.toLowerCase().includes(searchLower);
        const matchesEmail = !this.selectedEmail || log.email === this.selectedEmail;

        return matchesDate && matchesSearch && matchesEmail;
      });
    }

    // Update the UI
    this.groupLogsByEmail();
  }

  onSearchChange() {
    this.filterLogs();
  }

  onDateChange() {
    this.filterLogs();
  }

  onEmailChange() {
    this.filterLogs();
  }

  toggleSelectAll() {
    this.isAllSelected = !this.isAllSelected;
    if (this.isAllSelected) {
      this.filteredLogs.forEach(log => this.selectedLogs.add(log.id));
    } else {
      this.selectedLogs.clear();
    }
  }

  toggleSelectLog(logId: number) {
    if (this.selectedLogs.has(logId)) {
      this.selectedLogs.delete(logId);
    } else {
      this.selectedLogs.add(logId);
    }
    this.isAllSelected = this.filteredLogs.length === this.selectedLogs.size;
  }

  deleteSelectedLogs() {
    if (this.selectedLogs.size === 0) {
      this.alertService.warning('No Selection', 'Please select logs to delete');
      return;
    }

    this.alertService.confirm(
      'Delete Selected Logs',
      `Are you sure you want to delete ${this.selectedLogs.size} selected log(s)?`
    ).then((result) => {
      if (result.isConfirmed) {
        const ids = Array.from(this.selectedLogs);
        this.logsService.deleteSelectedLogs(ids)
          .subscribe({
            next: (response) => {
              this.logs = this.logs.filter(log => !ids.includes(log.id));
              this.selectedLogs.clear();
              this.isAllSelected = false;
              this.filterLogs();
              this.groupLogsByEmail();
              this.alertService.success('Success', response);
            },
            error: (error) => {
              console.error('❌ Error deleting logs:', error);
              this.alertService.error('Error', 'Failed to delete selected logs');
            }
          });
      }
    });
  }

  deleteAllLogs() {
    if (this.logs.length === 0) {
      this.alertService.warning('No Logs', 'There are no logs to delete');
      return;
    }

    this.alertService.confirm(
      'Delete All Logs',
      'Are you sure you want to delete all logs? You can undo this action within 10 seconds.'
    ).then((result) => {
      if (result.isConfirmed) {
        this.backupLogs = [...this.logs];
        this.showUndoButton = true;
        this.countdown = 10;

        this.countdownTimer = interval(1000)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.countdown--;
            if (this.countdown <= 0) {
              this.countdownTimer.unsubscribe();
            }
          });

        this.deleteTimer = timer(10000)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            if (this.showUndoButton) {
              this.logsService.deleteAllLogs()
                .subscribe({
                  next: (response) => {
                    this.logs = [];
                    this.filteredLogs = [];
                    this.selectedLogs.clear();
                    this.isAllSelected = false;
                    this.showUndoButton = false;
                    this.backupLogs = [];
                    this.groupLogsByEmail();
                    this.alertService.success('Success', response);
                  },
                  error: (error) => {
                    console.error('❌ Error deleting logs:', error);
                    this.alertService.error('Error', 'Failed to delete logs');
                    this.undoDeleteAll();
                  }
                });
            }
          });
      }
    });
  }

  undoDeleteAll() {
    if (this.backupLogs.length > 0) {
      // Clear the timers if they're still running
      if (this.deleteTimer) {
        this.deleteTimer.unsubscribe();
      }
      if (this.countdownTimer) {
        this.countdownTimer.unsubscribe();
      }

      this.logs = [...this.backupLogs];
      this.filteredLogs = [...this.backupLogs];
      this.backupLogs = [];
      this.showUndoButton = false;
      this.alertService.success('Success', 'Delete operation cancelled');
    }
  }

  toggleUserLogs(user: UserLogs) {
    user.isExpanded = !user.isExpanded;
  }

  getUniqueEmails(): string[] {
    return [...new Set(this.logs.map(log => log.email).filter(email => email !== null))] as string[];
  }

  getLogTypeClass(logType: LogType): string {
    switch (logType) {
      case LogType.SYSTEM:
        return 'action-system';
      case LogType.PROGRAM:
        return 'action-program';
      case LogType.PROJECT:
        return 'action-project';
      default:
        return 'action-other';
    }
  }

  getActionType(action: string): string {
    action = action.toLowerCase();
    if (action.includes('created')) return 'created';
    if (action.includes('updated') || action.includes('modified')) return 'updated';
    if (action.includes('deleted')) return 'deleted';
    return 'other';
  }
}
