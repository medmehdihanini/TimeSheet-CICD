package tn.ey.timesheetclient.program.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileProjectStats {
    // Profile information
    private Long profileId;
    private String profileName;
    private String profileEmail;
    private String profileFunction;
    
    // Project information
    private Long projectId;
    private String projectName;
    private String projectDescription;
    private String projectStatus;
    
    // Program information (parent of project)
    private Long programId;
    private String programName;
    
    // Manday statistics
    private Double totalManDayBudget;
    private Double consumedManDayBudget;
    private Double remainingManDayBudget;
    private Double usagePercentage;
    
    // Financial statistics
    private BigDecimal dailyRate;
    private BigDecimal totalBudgetAmount;
    private BigDecimal consumedBudgetAmount;
    private BigDecimal remainingBudgetAmount;
    
    // Task statistics
    private Integer totalTaskCount;
    private Double totalTaskDays;
    
    // Timesheet statistics - overall
    private Integer totalTimesheetEntries;
    
    // Timesheet statistics - by status
    private Integer approvedTimesheets;
    private Integer rejectedTimesheets;
    private Integer pendingTimesheets;
    private Integer draftTimesheets;
    private Integer submittedTimesheets;
}