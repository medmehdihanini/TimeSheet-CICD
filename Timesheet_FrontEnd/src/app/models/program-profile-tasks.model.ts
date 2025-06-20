export interface ProgramTask {
  taskId: number;
  taskDate: string;
  workDays: number;
  description: string;
  workPlace: string;
}

export interface ProgramProject {
  projectId: number;
  projectName: string;
  projectDescription: string;
  projectStatus: string;
  mandayBudget: number;
  consumedMandayBudget: number;
  tasks: ProgramTask[];
}

export interface ProgramProfileTasks {
  programId: number;
  programName: string;
  contractNumber: number;
  programStatus: string;
  profileId: number;
  profileName: string;
  profileEmail: string;
  profileFunction: string;
  totalMandayBudget: number;
  totalConsumedMandayBudget: number;
  dailyRate: number;
  projects: ProgramProject[];
}
