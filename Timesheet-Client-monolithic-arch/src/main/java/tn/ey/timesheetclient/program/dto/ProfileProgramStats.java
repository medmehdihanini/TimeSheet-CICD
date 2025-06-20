package tn.ey.timesheetclient.program.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileProgramStats {
    private Long profileId;
    private String profileName;
    private String profileEmail;
    private String function;
    
    private Long programId;
    private String programName;
    private String programStatus;
    
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
    
    // Project-level financial statistics
    @Builder.Default
    private List<ProjectFinancialStats> projectsFinancialStats = new ArrayList<>();
}