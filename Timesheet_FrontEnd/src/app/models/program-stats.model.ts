import { Status } from './Status';

export class ProjectStatsDTO {
    projectId: number;
    projectName: string;
    projectStatus: Status;
    profileCount: number;
    taskCount: number;
    projectMandayBudget: number;
    projectConsumedMandayBudget: number;
}

export class ProgramStatsDTO {
    // Program basic information
    programId: number;
    programName: string;
    programStatus: Status;
    client: string;
    startDate: string;
    endDate: string;
    contractNumber: number;

    // Projects statistics
    totalProjects: number;
    projectsByStatus: Map<Status, number>;

    // Profiles statistics
    totalProfiles: number;
    profilesByFunction: Map<string, number>;

    // Tasks statistics
    totalTasks: number;
    tasksByWorkplace: Map<string, number>;

    // Financial statistics
    totalMandayBudget: number;
    consumedMandayBudget: number;
    remainingMandayBudget: number;
    totalBudgetAmount: number;
    consumedBudgetAmount: number;
    remainingBudgetAmount: number;

    // List of projects with basic info
    projects: ProjectStatsDTO[];
}
