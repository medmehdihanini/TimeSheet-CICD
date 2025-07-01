package tn.ey.timesheetclient.timesheet.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.ey.timesheetclient.Logs.services.LogService;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.timesheet.dao.TaskDao;
import tn.ey.timesheetclient.timesheet.dto.ProjectTasksByProfileDTO;
import tn.ey.timesheetclient.timesheet.dto.TaskWithProjectIdDTO;
import tn.ey.timesheetclient.timesheet.model.Task;
import tn.ey.timesheetclient.timesheet.service.ITaskService;

import java.util.List;


@RestController
@RequestMapping("/api/v1/task")
@AllArgsConstructor
public class TaskController {

    private final ITaskService taskService;
    private final LogService logService;
    private final TaskDao taskDao;
    private final profileDao profileDao;
    private final ProjectDao projectDao;

    @PostMapping("/addTask/{idproject}/{idprofile}")
    public ResponseEntity<?> addTask(@RequestBody Task T, @PathVariable Long idproject, @PathVariable Long idprofile) {
        ResponseEntity<?> response = taskService.addAssignTask(T, idproject, idprofile);
        if (response.getStatusCode().is2xxSuccessful()) {
            Project project = projectDao.findById(idproject).orElse(null);
            Profile profile = profileDao.findById(idprofile).orElse(null);
            
            String projectName = project != null ? project.getName() : "Projet inconnu";
            String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
            
            logService.logProjectAction("Tâche ajoutée: " + T.getText() + " au projet: " + projectName + " pour le profil: " + profileName, project);
        }
        return response;
    }

    @GetMapping("/getTasks/{idproject}/{idprofile}")
    public ResponseEntity<?> getTAskForProfile(@PathVariable Long idproject, @PathVariable Long idprofile) {
        return taskService.getProfileTasks(idproject, idprofile);
    }

    @GetMapping("/byMonthAndProfile")
    public ResponseEntity<List<Task>> getTasksByMonthAndProfile(
            @RequestParam String monthYear,
            @RequestParam Long profileId) {
        List<Task> tasks = taskService.getTasksByMonthAndProfile(profileId, monthYear);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/getTasksofmonth/{monthnum}/{idprofile}")
    public List<Task> getTAskForProfile(@PathVariable String monthnum, @PathVariable Long idprofile) {
        return taskService.getTasksByMonthAndProfile(idprofile, monthnum);
    }

    @GetMapping("/getMonthTasks/{nuMonth}")
    public List<Task> getTAskForProfile(@PathVariable String nuMonth) {
        return taskService.getTasksByMonth(nuMonth);
    }

    @PutMapping("/updateTask/{taskId}")
    public ResponseEntity<?> updateTask(@RequestBody Task task, @PathVariable Long taskId) {
        Task originalTask = taskDao.findById(taskId).orElse(null);
        ResponseEntity<?> response = taskService.updateTAsk(taskId, task);
        
        if (response.getStatusCode().is2xxSuccessful() && originalTask != null) {
            Project project = null;
            String projectName = "Projet inconnu";
            
            if (originalTask.getProfile() != null && originalTask.getProfile().getProject() != null) {
                project = originalTask.getProfile().getProject();
                projectName = project.getName();
            }
            
            if (project != null) {
                logService.logProjectAction("Tâche mise à jour: \"" + task.getText() + "\" dans le projet: " + projectName, project);
            } else {
                logService.logAction("Tâche mise à jour: \"" + task.getText() + "\"");
            }
        }
        return response;
    }

    @GetMapping("/unavailable/{profileId}/{projectId}")
    public List<Task> getUnavailableHours(@PathVariable Long profileId, @PathVariable Long projectId) {
        return taskService.getTasksByProfileIdAndNotProjectId(profileId, projectId);
    }

    @GetMapping("/byMonthAndProfilewithProjectId")
    public ResponseEntity<List<TaskWithProjectIdDTO>> getTasksByMonthAndProfilee(
            @RequestParam String monthYear,
            @RequestParam Long profileId) {
        List<TaskWithProjectIdDTO> tasks = taskService.getTasksByMonthAndProfile(monthYear, profileId);
        return ResponseEntity.ok(tasks);
    }

    @DeleteMapping("/deleteTask/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable Long taskId) {
        Task task = taskDao.findById(taskId).orElse(null);
        String taskDesc = task != null && task.getText() != null ? task.getText() : "Tâche inconnue";
        
        // Store project reference before deleting
        Project project = null;
        String projectName = "Projet inconnu";
        
        if (task != null && task.getProfile() != null && task.getProfile().getProject() != null) {
            project = task.getProfile().getProject();
            projectName = project.getName();
        }
        
        ResponseEntity<?> response = taskService.deleteTask(taskId);
        
        if (response.getStatusCode().is2xxSuccessful()) {
            if (project != null) {
                logService.logProjectAction("Tâche supprimée: \"" + taskDesc + "\" du projet: " + projectName, project);
            } else {
                logService.logAction("Tâche supprimée: \"" + taskDesc + "\"");
            }
        }
        return response;
    }    @GetMapping("/byProjectAndMonthYear")
    public ResponseEntity<ProjectTasksByProfileDTO> getTasksByProjectAndMonthYear(
            @RequestParam Long projectId,
            @RequestParam String monthYear) {
        ProjectTasksByProfileDTO result = taskService.getTasksByProjectAndMonthYear(projectId, monthYear);
        return ResponseEntity.ok(result);
    }
}