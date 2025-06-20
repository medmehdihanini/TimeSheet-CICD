package tn.ey.timesheetclient.program.service;

import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.model.ProgramProfile;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.program.model.ProjectProfile;
import tn.ey.timesheetclient.timesheet.dto.ProjectTasksDTO;

import java.util.List;
import java.util.Optional;

public interface ProjectService {

    ResponseEntity<?> createProject(Project p);
    ResponseEntity<?> createProject(Project p,Long idprogram);
    ResponseEntity<?> createProject(Project p,Long idprogram,Long idpchef,Boolean isUserId);
    ResponseEntity<?> updateProject(Project p,Long idp,Long idchef);
    ResponseEntity<?> retrieveAllProjects();
    ResponseEntity<?> retrieveOneProject(Long idp);
    List<Project> getProjectsByChefprojetId(Long chefprojetId);
    ResponseEntity<?> deleteOneProject(Long idp);
    ResponseEntity<?> deleteProjectProfile(Long idp);
    ResponseEntity<?> assignChefProjectToProject(Long idchef,Long idp);
    ResponseEntity<?> retrieveAllProjectsProgram(Long idprog);
    ResponseEntity<?> addImageTOoProject(MultipartFile image, Long idp);
    List<Object[]> getProjectProfiles(Long projectId);
    List<ProjectProfile> getProjectprofiles(Long projectId);
    ResponseEntity<?> assignProfileProject(Long idprof, Long idp, Double mandaybudget);
    Optional<ProjectProfile> findProjectProfileByProfileIdAndProjectId(Long profileId, Long projectId);
    List<Profile> getProfilesForProject(Long programId, Long projectId);
    ProgramProfile findByProgramIdAndProfileId(Long programId, Long profileId);
    public Double getTotalMandayBudget(Long programId, Long profileId);
    ResponseEntity<?> updateProjectProfile(Long profileId,Long projectId,double mandayBudget);    List<Project> getProjectsByChefProgramId(Long chefProgramId);
    
    // New method for detailed project profile statistics
    ResponseEntity<?> getProfileProjectStats(Long profileId, Long projectId);
    
    // New method to retrieve tasks by project and profile
    ResponseEntity<?> getProjectProfileTasks(Long projectId, Long profileId);
    
    // New method to get detailed project statistics
    ResponseEntity<?> getProjectStats(Long projectId);
}
