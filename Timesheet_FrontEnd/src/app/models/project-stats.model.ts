// Project Statistics model based on the ProjectStatsDTO
export interface ProfileStatDTO {
    profileId: number;
    profileName: string;
    mandayBudget: number;
    consumedMandayBudget: number;
    remainingMandayBudget: number;
    taskCount: number;
    timesheetCount: number;
}

export enum Status {
    IN_PROGRESS = 'IN_PROGRESS',
    ON_HOLD = 'ON_HOLD',
    FINISHED = 'FINISHED',
    UNLAUNCHED = 'UNLAUNCHED',
    CANCELED = 'CANCELED'
}

export interface ProjectStats {
    // Project basic information
    projectId: number;
    projectName: string;
    projectStatus: Status;
    projectDescription: string;
    programId: number;
    programName: string;
    chefProjetName: string;

    // Profile statistics
    totalProfiles: number;
    totalMandayBudget: number;
    totalConsumedMandayBudget: number;
    remainingMandayBudget: number;
    completionPercentage: number;

    // Task statistics
    totalTasks: number;
    tasksByWorkplace: {[key: string]: number};

    // Timesheet statistics
    totalTimesheets: number;

    // Profile details
    profileStats: ProfileStatDTO[];
}
