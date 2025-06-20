package tn.ey.timesheetclient.timesheet.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TaskWithProjectIdDTO {
    private Long taskId;
    private String datte;
    private Double nbJour;
    private String text;
    private String workPlace;
    private Long projectId;
}
