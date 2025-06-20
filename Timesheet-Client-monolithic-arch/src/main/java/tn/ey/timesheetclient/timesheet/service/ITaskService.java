package tn.ey.timesheetclient.timesheet.service;

import org.springframework.http.ResponseEntity;
import tn.ey.timesheetclient.timesheet.dto.ProjectTasksByProfileDTO;
import tn.ey.timesheetclient.timesheet.dto.TaskWithProjectIdDTO;
import tn.ey.timesheetclient.timesheet.model.ExcelMetadataDTO;
import tn.ey.timesheetclient.timesheet.model.ResourceDTO;
import tn.ey.timesheetclient.timesheet.model.Task;

import java.util.List;

public interface ITaskService {

    ResponseEntity<?> addAssignTask(Task T, Long idproject, Long idprofile);

    ResponseEntity<?> getProfileTasks(Long idproject, Long idprofile);

    ResponseEntity<?> updateTAsk(Long taskId, Task newtask);

    List<Task> getTasksByMonthYear(String monthYear, Long id);

    List<Task> getTasksByProfileIdAndNotProjectId(Long profileId, Long projectId);

    ResponseEntity<?> deleteTask(Long taskId);

    List<Task> getTasksByMonth(String monthNumber);

    List<Task> getTasksByMonthAndProfile(Long profileId, String monthNumber);    List<TaskWithProjectIdDTO> getTasksByMonthAndProfile(String monthYear, Long profileId);
    
    ProjectTasksByProfileDTO getTasksByProjectAndMonthYear(Long projectId, String monthYear);
}