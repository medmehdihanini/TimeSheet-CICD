package tn.ey.timesheetclient.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfileWithTasksDTO {
    private Long profileId;
    private String profileName;
    private String profileEmail;
    private Double mandayBudget;
    private Double consumedMandayBudget;
    private Double remainingMandayBudget;
    private List<TaskDTO> tasks;
}
