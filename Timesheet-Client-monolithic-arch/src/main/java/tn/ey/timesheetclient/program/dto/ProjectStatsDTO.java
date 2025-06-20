package tn.ey.timesheetclient.program.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.ey.timesheetclient.program.model.Status;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectStatsDTO {
    // Project basic information
    private Long projectId;
    private String projectName;
    private Status projectStatus;
    private String projectDescription;
    private Long programId;
    private String programName;
    private String chefProjetName;
    
    // Profile statistics
    private int totalProfiles;
    private Double totalMandayBudget;
    private Double totalConsumedMandayBudget;
    private Double remainingMandayBudget;
    private Double completionPercentage;
    
    // Task statistics
    private int totalTasks;
    private Map<String, Integer> tasksByWorkplace;
      // Timesheet statistics
    private int totalTimesheets;
    
    // Profile details
    private List<ProfileStatDTO> profileStats;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileStatDTO {
        private Long profileId;
        private String profileName;
        private Double mandayBudget;
        private Double consumedMandayBudget;
        private Double remainingMandayBudget;
        private int taskCount;
        private int timesheetCount;
    }
}
