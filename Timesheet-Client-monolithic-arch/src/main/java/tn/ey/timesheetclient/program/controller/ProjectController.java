package tn.ey.timesheetclient.program.controller;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.Logs.services.LogService;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.dao.ProgramDAO;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.program.model.ProgramProfile;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.program.model.ProjectProfile;
import tn.ey.timesheetclient.program.service.ProjectService;
import tn.ey.timesheetclient.timesheet.dto.ProjectTasksDTO;
import tn.ey.timesheetclient.user.dao.UserRepository;
import tn.ey.timesheetclient.user.model.User;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/project")
@AllArgsConstructor
@Slf4j
public class ProjectController {
    private final ProjectService projectservice;
    private final LogService logService;
    private final ProjectDao projectDao;
    private final ProgramDAO programDAO;
    private final profileDao _profileDao;
    private final UserRepository userRepository;

    @PostMapping("/AddProject")
    public ResponseEntity<?> createProject(@RequestBody Project p) {
        ResponseEntity<?> response = projectservice.createProject(p);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProjectAction("Nouveau projet créé: " + p.getName(), p);
        }
        return response;
    }

    @PostMapping("/AddProject/{idprogram}")
    public ResponseEntity<?> createProjectt(@RequestBody Project p, @PathVariable Long idprogram) {
        Program program = programDAO.findById(idprogram).orElse(null);
        String programName = program != null ? program.getName() : "Programme inconnu";
        
        ResponseEntity<?> response = projectservice.createProject(p, idprogram);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProjectAction("Projet créé: " + p.getName() + " dans le programme: " + programName, p);
        }
        return response;
    }

    @PostMapping("/AddProject/{idprogram}/{idprojectManager}/{isUserId}")
    public ResponseEntity<?> createProjectProgramProjectManager(@RequestBody Project p, @PathVariable Long idprogram, @PathVariable Long idprojectManager, @PathVariable Boolean isUserId) {
        Program program = programDAO.findById(idprogram).orElse(null);
        String programName = program != null ? program.getName() : "Programme inconnu";
        
        String managerName;
        if (isUserId) {
            User manager = userRepository.findById(idprojectManager).orElse(null);
            managerName = manager != null ? manager.getFirstname() + " " + manager.getLastname() : "Chef de projet inconnu";
        } else {
            Profile manager = _profileDao.findById(idprojectManager).orElse(null);
            managerName = manager != null ? manager.getFirstname() + " " + manager.getLastname() : "Chef de projet inconnu";
        }
        
        ResponseEntity<?> response = projectservice.createProject(p, idprogram, idprojectManager, isUserId);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProjectAction("Projet créé: " + p.getName() + " dans le programme: " + programName + " avec chef de projet: " + managerName, p);
        }
        return response;
    }

    @PutMapping("/updateproject/{idp}/{idchef}")
    public ResponseEntity<?> updateProject(@PathVariable Long idp, @RequestBody Project p, @PathVariable Long idchef) {
        User chef = userRepository.findById(idchef).orElse(null);
        String chefName = chef != null ? chef.getFirstname() + " " + chef.getLastname() : "Chef de projet inconnu";
        
        ResponseEntity<?> response = projectservice.updateProject(p, idp, idchef);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProjectAction("Projet mis à jour avec nouveau chef: " + chefName, p);
        }
        return response;
    }

    @PutMapping("/addImageToProject/{idp}")
    public ResponseEntity<?> addImageToProject(@RequestParam("image") MultipartFile image, @PathVariable Long idp) {
        ResponseEntity<?> response = projectservice.addImageTOoProject(image, idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            Project p = projectDao.findById(idp).orElse(null);
            if (p != null) {
                logService.logProjectAction("Image ajoutée au projet: " + p.getName(), p);
            }
            return response;
        }
        return response;
    }

    @DeleteMapping("/deleteOneProject/{idp}")
    public ResponseEntity<?> deleteOneProject(@PathVariable Long idp) {
        Project p = projectDao.findById(idp).orElse(null);
        String projectName = p != null ? p.getName() : "Projet inconnu";
        
        ResponseEntity<?> response = projectservice.deleteOneProject(idp);
        if (response.getStatusCode().is2xxSuccessful() && p != null) {
            logService.logProjectAction("Projet supprimé: " + projectName, p);
        }
        return response;
    }

    @PutMapping("/assignProjectManager/{idchef}/{idp}")
    public ResponseEntity<?> assignProjectManager(@PathVariable Long idchef, @PathVariable Long idp) {
        User chef = userRepository.findById(idchef).orElse(null);
        Project p = projectDao.findById(idp).orElse(null);
        
        String chefName = chef != null ? chef.getFirstname() + " " + chef.getLastname() : "Chef de projet inconnu";
        String projectName = p != null ? p.getName() : "Projet inconnu";
        
        ResponseEntity<?> response = projectservice.assignChefProjectToProject(idchef, idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            if (p != null) {
                logService.logProjectAction("Chef de projet " + chefName + " assigné au projet: " + projectName, p);
            }
        }
        return response;
    }

    @DeleteMapping("/deleteProjectProfile/{idp}")
    public ResponseEntity<?> deleteProjectProfile(@PathVariable Long idp) {
        // Idéalement, il faudrait récupérer les détails du ProjectProfile, mais nous n'avons pas d'accès direct par ID
        ResponseEntity<?> response = projectservice.deleteProjectProfile(idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProjectAction("Profil retiré du projet", null);
        }
        return response;
    }

    @PutMapping("/assignProfileproject/{idprog}/{idp}/{manday}")
    public ResponseEntity<?> assignProfileToProject(@PathVariable Long idprog, @PathVariable Long idp, @PathVariable Double manday) {
        Profile profile = _profileDao.findById(idprog).orElse(null);
        Project project = projectDao.findById(idp).orElse(null);
        
        String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
        String projectName = project != null ? project.getName() : "Projet inconnu";
        
        ResponseEntity<?> response = projectservice.assignProfileProject(idprog, idp, manday);
        if (response.getStatusCode().is2xxSuccessful()) {
            if (project != null) {
                logService.logProjectAction("Profil " + profileName + " assigné au projet " + projectName + " avec " + manday + " jours-homme", project);
            }
        }
        return response;
    }

    @PutMapping("/updateppManDayBudget/{profileId}/{projectId}/{mandayBudget}")
    public ResponseEntity<?> updateppManDayBudget(@PathVariable Long profileId, @PathVariable Long projectId, @PathVariable double mandayBudget) {
        Profile profile = _profileDao.findById(profileId).orElse(null);
        Project project = projectDao.findById(projectId).orElse(null);
        
        String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
        String projectName = project != null ? project.getName() : "Projet inconnu";
        
        ResponseEntity<?> response = projectservice.updateProjectProfile(profileId, projectId, mandayBudget);
        if (response.getStatusCode().is2xxSuccessful()) {
            if (project != null) {
                logService.logProjectAction("Budget jours-homme mis à jour à " + mandayBudget + " pour le profil " + profileName + " dans le projet " + projectName, project);
            }
        }
        return response;
    }

    // Read-only operations don't need logging
    @GetMapping("/getProjects")
    public ResponseEntity<?> getAllProjects() {
        return projectservice.retrieveAllProjects();
    }

    @GetMapping("/getProject/{idp}")
    public ResponseEntity<?> getOneProject(@PathVariable Long idp) {
        return projectservice.retrieveOneProject(idp);
    }

    @GetMapping("/retrieveProjectsByProgram/{idp}")
    public ResponseEntity<?> retrieveAllProjectsProgram(@PathVariable Long idp) {
        return projectservice.retrieveAllProjectsProgram(idp);
    }

    @GetMapping("/chefprojet/{id}")
    public List<Project> getProjectsByChefprojet(@PathVariable Long id) {
        return projectservice.getProjectsByChefprojetId(id);
    }

    @GetMapping("/retrieveProjectProfiles/{idp}")
    public List<Object[]> retrieveProjectProfiles(@PathVariable Long idp) {
        return projectservice.getProjectProfiles(idp);
    }

    @GetMapping("/retrieveProjectprofiles/{idp}")
    public List<ProjectProfile> retrieveProjectprofiles(@PathVariable Long idp) {
        return projectservice.getProjectprofiles(idp);
    }

    @GetMapping("/getprojectprofile/{profileId}/{projectId}")
    public Optional<ProjectProfile> getProjectProfile(@PathVariable Long profileId, @PathVariable Long projectId) {
        return projectservice.findProjectProfileByProfileIdAndProjectId(profileId, projectId);
    }

    @GetMapping("/retrieveProfilesForProject/{idprogram}/{idproject}")
    public List<Profile> retrieveProfilesForProject(@PathVariable Long idprogram, @PathVariable Long idproject) {
        return projectservice.getProfilesForProject(idprogram, idproject);
    }

    @GetMapping("/getProgramprofile/{programId}/{profileId}")
    public ProgramProfile getProgramProfile(@PathVariable Long programId, @PathVariable Long profileId) {
        return projectservice.findByProgramIdAndProfileId(programId, profileId);
    }

    @GetMapping("/chefprogram/{chefProgramId}")
    public ResponseEntity<List<Project>> getProjectsByChefProgramId(@PathVariable Long chefProgramId) {
        List<Project> projects = projectservice.getProjectsByChefProgramId(chefProgramId);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/profileProjectStats/{profileId}/{projectId}")
    public ResponseEntity<?> getProfileProjectStats(@PathVariable Long profileId, @PathVariable Long projectId) {


        return  projectservice.getProfileProjectStats(profileId, projectId);


    }


    @GetMapping("/tasks/{projectId}/{profileId}")
    public ResponseEntity<?> getProjectProfileTasks(@PathVariable Long projectId, @PathVariable Long profileId) {

        ResponseEntity<?> response = projectservice.getProjectProfileTasks(projectId, profileId);
      
        return response;
    }

    @GetMapping("/stats/{projectId}")
    public ResponseEntity<?> getProjectStats(@PathVariable Long projectId) {
        Project project = projectDao.findById(projectId).orElse(null);
        String projectName = project != null ? project.getName() : "Projet inconnu";
        
        ResponseEntity<?> response = projectservice.getProjectStats(projectId);
        if (response.getStatusCode().is2xxSuccessful()) {
            if (project != null) {
                logService.logProjectAction("Statistiques consultées pour le projet: " + projectName, project);
            }
        }
        return response;
    }
}