package tn.ey.timesheetclient.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskDTO {
    private Long taskId;
    private String datte;
    private Double nbJour;
    private String text;
    private String workPlace;
}
