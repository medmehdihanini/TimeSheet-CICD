package tn.ey.timesheetclient.program.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.ey.timesheetclient.program.model.Status;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProgramWithTasksDTO {
    // Program information
    private Long programId;
    private String programName;
    private Long contractNumber;
    private Status programStatus;
    
    // Profile information
    private Long profileId;
    private String profileName;
    private String profileEmail;
    private String profileFunction;
    private Double totalMandayBudget;
    private Double totalConsumedMandayBudget;
    private BigDecimal dailyRate;
    
    // List of projects with their tasks
    private List<ProjectWithTasksDTO> projects;
}