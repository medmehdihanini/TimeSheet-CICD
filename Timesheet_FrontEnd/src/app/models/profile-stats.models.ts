// Enum for program status
export enum ProgramStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    ON_HOLD = 'ON_HOLD',
    FINISHED = 'FINISHED',
    UNLAUNCHED = 'UNLAUNCHED',
    CANCELED = 'CANCELED'
  }
  
  // Enum for timesheet status
  export enum TimesheetStatus {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PENDING = 'PENDING',
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED'
  }
  
  // Interface for workplace counts
  export interface WorkplaceCounts {
    EY: number;
    'Chez le client': number;
  }
  
  // Interface for project statistics
  export interface ProjectStats {
    projectId: number;
    name: string;
    status: ProgramStatus;
    mandayBudget: number;
    consumedMandayBudget: number;
    taskCount: number;
    timesheetStatus: TimesheetStatus | null;
    workplaceCounts: WorkplaceCounts;
  }
  
  // Interface for program statistics
  export interface ProgramStats {
    programId: number;
    name: string;
    status: ProgramStatus;
    client: string;
    mandayBudget: number;
    consumedMandayBudget: number;
    projects: ProjectStats[];
  }
  
  // Interface for profile statistics response
  export interface ProfileStatsResponse {
    profileId: number;
    fullName: string;
    workplaceCounts: WorkplaceCounts;
    programs: ProgramStats[];
  }