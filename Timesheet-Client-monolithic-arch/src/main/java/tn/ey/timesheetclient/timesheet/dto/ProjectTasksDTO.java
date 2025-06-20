package tn.ey.timesheetclient.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.ey.timesheetclient.timesheet.model.Task;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProjectTasksDTO {
    private Long projectId;
    private String projectName;
    private String projectDescription;
    private String projectStatus;
    private Long profileId;
    private String profileName;
    private String profileEmail;
    private Double mandayBudget;
    private Double consumedMandayBudget;
    private List<Task> tasks;
}