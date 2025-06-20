package tn.ey.timesheetclient.program.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.ey.timesheetclient.program.model.Status;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProjectWithTasksDTO {
    private Long projectId;
    private String projectName;
    private String projectDescription;
    private Status projectStatus;
    private Double mandayBudget;
    private Double consumedMandayBudget;
    private List<TaskDetailsDTO> tasks;
}