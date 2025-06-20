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
public class ProjectTasksByProfileDTO {
    private Long projectId;
    private String projectName;
    private String projectDescription;
    private String projectStatus;
    private String monthYear;
    private Integer totalProfiles;
    private Integer totalTasks;
    private Double totalTaskDays;
    private List<ProfileWithTasksDTO> profiles;
}
