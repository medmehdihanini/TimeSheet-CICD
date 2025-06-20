package tn.ey.timesheetclient.program.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.ey.timesheetclient.program.model.Status;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgramStatsDTO {
    // Program basic information
    private Long programId;
    private String programName;
    private Status programStatus;
    private String client;
    private String startDate;
    private String endDate;
    private Long contractNumber;

    // Projects statistics
    private int totalProjects;
    private Map<Status, Integer> projectsByStatus;
    
    // Profiles statistics
    private int totalProfiles;
    private Map<String, Integer> profilesByFunction;
    
    // Tasks statistics
    private int totalTasks;
    private Map<String, Integer> tasksByWorkplace;
    
    // Financial statistics
    private Double totalMandayBudget;
    private Double consumedMandayBudget;
    private Double remainingMandayBudget;
    private BigDecimal totalBudgetAmount;
    private BigDecimal consumedBudgetAmount;
    private BigDecimal remainingBudgetAmount;
    
    // List of projects with basic info
    private List<ProjectStatsDTO> projects;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectStatsDTO {
        private Long projectId;
        private String projectName;
        private Status projectStatus;
        private int profileCount;
        private int taskCount;
        private Double projectMandayBudget;
        private Double projectConsumedMandayBudget;
    }
}
