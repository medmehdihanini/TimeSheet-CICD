export class ProjectFinancialStats {
    projectId: number;
    projectName: string;
    projectDescription: string;
    projectStatus: string;
    projectManDayBudget: number;
    projectConsumedManDayBudget: number;
    projectRemainingManDayBudget: number;
    projectUsagePercentage: number;
    projectTotalBudgetAmount: number;
    projectConsumedBudgetAmount: number;
    projectRemainingBudgetAmount: number;
}

export class ProfileProgramStats {
    profileId: number;
    profileName: string;
    profileEmail: string;
    function: string;

    programId: number;
    programName: string;
    programStatus: string;

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

    // Projects statistics
    projectsFinancialStats: ProjectFinancialStats[];
}
