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
public class ProjectFinancialStats {
    private Long projectId;
    private String projectName;
    private String projectDescription;
    private String projectStatus;
    
    // Manday statistics
    private Double projectManDayBudget;
    private Double projectConsumedManDayBudget;
    private Double projectRemainingManDayBudget;
    private Double projectUsagePercentage;
    
    // Financial statistics
    private BigDecimal projectTotalBudgetAmount;
    private BigDecimal projectConsumedBudgetAmount;
    private BigDecimal projectRemainingBudgetAmount;
}