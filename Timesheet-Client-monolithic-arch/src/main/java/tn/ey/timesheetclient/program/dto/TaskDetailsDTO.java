package tn.ey.timesheetclient.program.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskDetailsDTO {
    private Long taskId;
    private String taskDate;
    private Double workDays;
    private String description;
    private String workPlace;
}