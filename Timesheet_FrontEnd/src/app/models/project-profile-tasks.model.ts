export interface Task {
  id: number;
  datte: string; // Keep the original property name as in the API
  nbJour: number;
  text: string;
  workPlace: string;
}

export interface ProjectProfileTasks {
  projectId: number;
  projectName: string;
  projectDescription: string;
  projectStatus: string;
  profileId: number;
  profileName: string;
  profileEmail: string;
  mandayBudget: number;
  consumedMandayBudget: number;
  tasks: Task[];
}
