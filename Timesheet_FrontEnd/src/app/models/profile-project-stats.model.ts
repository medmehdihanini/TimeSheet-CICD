export class ProfileProjectStats {
    // Profile information
    profileId: number;
    profileName: string;
    profileEmail: string;
    profileFunction: string;

    // Project information
    projectId: number;
    projectName: string;
    projectDescription: string;
    projectStatus: string;

    // Program information (parent of project)
    programId: number;
    programName: string;

    // Manday statistics
    totalManDayBudget: number;
    consumedManDayBudget: number;
    remainingManDayBudget: number;
    usagePercentage: number;

    // Financial statistics
    dailyRate: number;
    totalBudgetAmount: number;
    consumedBudgetAmount: number;
    remainingBudgetAmount: number;

    // Task statistics
    totalTaskCount: number;
    totalTaskDays: number;

    // Timesheet statistics
    totalTimesheetEntries: number;
    approvedTimesheets: number;
    pendingTimesheets: number;
    rejectedTimesheets: number;
    draftTimesheets: number;
    submittedTimesheets: number;

}
