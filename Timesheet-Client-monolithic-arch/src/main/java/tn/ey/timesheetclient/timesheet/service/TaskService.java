package tn.ey.timesheetclient.timesheet.service;

import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.program.dao.ProgramProfileDao;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.dao.ProjectProfileDao;
import tn.ey.timesheetclient.program.model.ProgramProfile;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.program.model.ProjectProfile;
import tn.ey.timesheetclient.timesheet.dao.TaskDao;
import tn.ey.timesheetclient.timesheet.dto.ProjectTasksByProfileDTO;
import tn.ey.timesheetclient.timesheet.dto.ProfileWithTasksDTO;
import tn.ey.timesheetclient.timesheet.dto.TaskDTO;
import tn.ey.timesheetclient.timesheet.dto.TaskWithProjectIdDTO;
import tn.ey.timesheetclient.timesheet.model.Task;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class TaskService implements ITaskService{
    private final TaskDao _taskDao;
    private final ProjectProfileDao _ppDao;
    private final ProgramProfileDao _progprofileDao;
    private final ProjectDao _projectDao;
    private final profileDao _profileDao;

    @Override
    public ResponseEntity<?> addAssignTask(Task T,Long idproject,Long idprofile) {
        try{
            Optional<ProjectProfile> optionalPP = _ppDao.findByProfileIdpAndProjectIdproject(idprofile, idproject);
            if (optionalPP.isEmpty()) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas dans ce projet");
            }

            ProjectProfile p = optionalPP.get();
            Project project =_projectDao.findById(idproject).orElse(null);
            if(project == null){
                return ResponseEntity.badRequest().body("le projet n'existe pas");
            }
            ProgramProfile pp = _progprofileDao.findByProgramIdprogAndProfileIdp(project.getProgram().getIdprog(),idprofile);

            if(p.getMandaybudget() < (p.getConsumedmandaybudget()+T.getNbJour())){
               double rest = p.getMandaybudget() - p.getConsumedmandaybudget();
                return ResponseEntity.badRequest().body("Il reste "+ rest +"au profil pour ce projet");
            }
            Double nbbj =pp.getConsumedmandaybudget() + T.getNbJour();
            if(pp.getMandaybudget()<nbbj){
                return ResponseEntity.badRequest().body("Le profil a consommé son budget de jours-homme pour ce programme");
            }
            Double sum = _taskDao.sumNbJourByDatte(T.getDatte(),p.getId());
           System.out.println(sum);
            if(sum == null){
                sum = 0.0;
            }
            if(sum == 0.5 && T.getNbJour() > 0.5){
                return ResponseEntity.badRequest().body("Le profil a été engagé ce matin...");
            }
            if(sum == 1){
                return ResponseEntity.badRequest().body(" Le profil a été engagé toute la journée...");
            }
            T.setProfile(p);
            _taskDao.save(T);
            pp.setConsumedmandaybudget(nbbj);
            _progprofileDao.save(pp);
            p.setConsumedmandaybudget(p.getConsumedmandaybudget()+T.getNbJour());
            _ppDao.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement de la tâche");
        }
    }

    @Override
    public ResponseEntity<?> getProfileTasks(Long idproject,Long idprofile) {
        try{
            List<Task> tasks = _taskDao.findTasksByProjectIdAndProfileId(idproject,idprofile);
            if(tasks.isEmpty()){
                return ResponseEntity.badRequest().body("Aucune tâche n'est assignée à ce profil");
            }
            return  ResponseEntity.ok(tasks);
        }catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récuperation desâche");
    }
    }

    @Override
    public List<Task> getTasksByMonth(String monthNumber) {
        return _taskDao.findByMonthNumber(monthNumber);
    }
    @Override
    public List<Task> getTasksByMonthAndProfile(Long profileId,String monthNumber) {
        return _taskDao.findByMonthAndProfile(monthNumber,profileId);
    }
    @Override
    public ResponseEntity<?> updateTAsk(Long taskId,Task newtask) {
        try{
            Task task = _taskDao.findById(taskId).orElse(null);
            Optional<ProjectProfile> optionalPP = _ppDao.findByProfileIdpAndProjectIdproject(task.getProfile().getProfile().getIdp(),task.getProfile().getProject().getIdproject());
            if (optionalPP.isEmpty()) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas dans ce projet");
            }

            ProjectProfile p = optionalPP.get();
            ProgramProfile pp = _progprofileDao.findByProgramIdprogAndProfileIdp(task.getProfile().getProject().getProgram().getIdprog(),task.getProfile().getProfile().getIdp());
            if(task == null){
                return ResponseEntity.badRequest().body("La tâche n'existe pas");
            }

           Double nbj = p.getConsumedmandaybudget() - task.getNbJour();
            nbj += newtask.getNbJour();
            if(p.getMandaybudget()<nbj){
                return ResponseEntity.badRequest().body("Le profil a consommé son budget de jours-homme pour ce projet");
            }
            Double nbbj = pp.getConsumedmandaybudget() - task.getNbJour();
            nbbj += newtask.getNbJour();
            if(pp.getMandaybudget()<nbbj){
                return ResponseEntity.badRequest().body("Le profil a consommé son budget de jours-homme pour ce programmem");
            }
           pp.setConsumedmandaybudget(nbbj);
            p.setConsumedmandaybudget(nbj);
            task.setText(newtask.getText());
            task.setDatte(newtask.getDatte());
            task.setWorkPlace(newtask.getWorkPlace());
            task.setNbJour(newtask.getNbJour());
            _taskDao.save(task);
            _progprofileDao.save(pp);
            _ppDao.save(p);

            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la modification du tâche");
        }
    }

    @Override
    public List<Task> getTasksByMonthYear(String monthYear,Long id) {
        return _taskDao.findByMonthAndProfile(monthYear,id);
    }

    @Override
    public List<Task> getTasksByProfileIdAndNotProjectId(Long profileId, Long projectId) {
        return _ppDao.findTasksByProfileIdAndNotProjectId(profileId, projectId);
    }
    @Override
    public List<TaskWithProjectIdDTO> getTasksByMonthAndProfile(String monthYear, Long profileId)
     {
        return _taskDao.findByMonthAndProfilee(monthYear, profileId);
    }

    @Override
    public ResponseEntity<?> deleteTask(Long taskId) {
        try{
            Task task =_taskDao.findById(taskId).orElse(null);
            Optional<ProjectProfile> optionalPP = _ppDao.findByProfileIdpAndProjectIdproject(task.getProfile().getProfile().getIdp(),task.getProfile().getProject().getIdproject());
            if (optionalPP.isEmpty()) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas dans ce projet");
            }

            ProjectProfile p = optionalPP.get();
            ProgramProfile pp = _progprofileDao.findByProgramIdprogAndProfileIdp(task.getProfile().getProject().getProgram().getIdprog(),task.getProfile().getProfile().getIdp());
            double newconsumed = pp.getConsumedmandaybudget() - task.getNbJour();
            pp.setConsumedmandaybudget(newconsumed);
            _progprofileDao.save(pp);
            Double newConsumed = p.getConsumedmandaybudget() - task.getNbJour();
            p.setConsumedmandaybudget(newConsumed);
            _ppDao.save(p);
            _taskDao.deleteById(taskId);
            return ResponseEntity.ok().body(null);
        }catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la suppression du tâche");
    }
    }    @Override
    public ProjectTasksByProfileDTO getTasksByProjectAndMonthYear(Long projectId, String monthYear) {
        // Get the project information
        Project project = _projectDao.findById(projectId).orElse(null);
        if (project == null) {
            return ProjectTasksByProfileDTO.builder()
                    .projectId(projectId)
                    .projectName("Project not found")
                    .monthYear(monthYear)
                    .totalProfiles(0)
                    .totalTasks(0)
                    .totalTaskDays(0.0)
                    .profiles(new ArrayList<>())
                    .build();
        }
        
        // Get all tasks for the project in the specified month-year
        List<Task> allTasks = _taskDao.findTasksByProjectIdAndMonthYear(projectId, monthYear);
        
        // Group tasks by profile
        Map<Long, List<Task>> tasksByProfile = allTasks.stream()
                .filter(task -> task.getProfile() != null && task.getProfile().getProfile() != null)
                .collect(Collectors.groupingBy(task -> task.getProfile().getProfile().getIdp()));
        
        // Build profile DTOs with their tasks
        List<ProfileWithTasksDTO> profileDTOs = new ArrayList<>();
        double totalTaskDays = 0.0;
        int totalTasks = allTasks.size();
        
        for (Map.Entry<Long, List<Task>> entry : tasksByProfile.entrySet()) {
            Long profileId = entry.getKey();
            List<Task> profileTasks = entry.getValue();
            
            if (!profileTasks.isEmpty()) {
                // Get profile and project profile information
                Task firstTask = profileTasks.get(0);
                ProjectProfile projectProfile = firstTask.getProfile();
                
                if (projectProfile != null && projectProfile.getProfile() != null) {
                    // Convert tasks to TaskDTOs
                    List<TaskDTO> taskDTOs = profileTasks.stream()
                            .map(task -> TaskDTO.builder()
                                    .taskId(task.getId())
                                    .datte(task.getDatte())
                                    .nbJour(task.getNbJour())
                                    .text(task.getText())
                                    .workPlace(task.getWorkPlace())
                                    .build())
                            .collect(Collectors.toList());
                    
                    // Calculate task days for this profile
                    double profileTaskDays = profileTasks.stream()
                            .mapToDouble(task -> task.getNbJour() != null ? task.getNbJour() : 0.0)
                            .sum();
                    totalTaskDays += profileTaskDays;
                    
                    // Build profile DTO
                    ProfileWithTasksDTO profileDTO = ProfileWithTasksDTO.builder()
                            .profileId(profileId)
                            .profileName(projectProfile.getProfile().getFirstname() + " " + projectProfile.getProfile().getLastname())
                            .profileEmail(projectProfile.getProfile().getEmail())
                            .mandayBudget(projectProfile.getMandaybudget())
                            .consumedMandayBudget(projectProfile.getConsumedmandaybudget())
                            .remainingMandayBudget(projectProfile.getMandaybudget() - projectProfile.getConsumedmandaybudget())
                            .tasks(taskDTOs)
                            .build();
                    
                    profileDTOs.add(profileDTO);
                }
            }
        }
        
        // Sort profiles by name for consistent ordering
        profileDTOs.sort((p1, p2) -> p1.getProfileName().compareToIgnoreCase(p2.getProfileName()));
        
        // Build the final response DTO
        return ProjectTasksByProfileDTO.builder()
                .projectId(project.getIdproject())
                .projectName(project.getName())
                .projectDescription(project.getDescription())
                .projectStatus(project.getStatus() != null ? project.getStatus().toString() : "UNKNOWN")
                .monthYear(monthYear)
                .totalProfiles(profileDTOs.size())
                .totalTasks(totalTasks)
                .totalTaskDays(totalTaskDays)
                .profiles(profileDTOs)
                .build();
    }
}
