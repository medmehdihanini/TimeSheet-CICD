package tn.ey.timesheetclient.program.service;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.transaction.Transactional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.ChatRoom.Services.ChatRoomService;
import tn.ey.timesheetclient.auth.service.AuthenticationService;
import tn.ey.timesheetclient.mail.EmailHelperService;
import tn.ey.timesheetclient.notification.model.Notification;
import tn.ey.timesheetclient.notification.service.NotificationService;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.dao.ProgramDAO;
import tn.ey.timesheetclient.program.dao.ProgramProfileDao;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.dao.ProjectProfileDao;
import tn.ey.timesheetclient.program.dto.ProjectStatsDTO;
import tn.ey.timesheetclient.program.model.*;
import tn.ey.timesheetclient.timesheet.dao.TimesheetDao;
import tn.ey.timesheetclient.timesheet.dto.ProjectTasksDTO;
import tn.ey.timesheetclient.timesheet.model.Task;
import tn.ey.timesheetclient.timesheet.model.Timesheet;
import tn.ey.timesheetclient.user.model.User;
import tn.ey.timesheetclient.user.dao.UserRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static tn.ey.timesheetclient.notification.model.NotificationStatus.PENDING;
import static tn.ey.timesheetclient.notification.model.NotificationStatus.REJECTED;

@Service
@AllArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService{
    private final ProjectDao _projectDao;
    private final AuthenticationService _authserv;
    private final UserRepository _userDao;
    private final profileDao _profileDao;
    private final ProgramDAO _programDao;    private final ProjectProfileDao _projpDao;
    private final ProgramProfileDao _ppDao;
    private final EmailHelperService emailHelperService;
    private final TimesheetDao _timesheetdao;private final tn.ey.timesheetclient.timesheet.dao.TaskDao _taskDao;
    private final NotificationService _notificationService;
    private final ChatRoomService chatRoomService;
    @Override
    public ResponseEntity<?> createProject(Project p) {
        try{
            p.setStatus(Status.UNLAUNCHED);
            Project savedProject = _projectDao.save(p);
            
            // If the project has a chef projet, create a chat room
            if (savedProject.getChefprojet() != null) {
                ResponseEntity<?> chatRoomResponse = chatRoomService.createChatRoom(savedProject.getIdproject(), savedProject.getChefprojet().getId());
                if (chatRoomResponse.getStatusCode().is2xxSuccessful()) {
                    log.info("Chat room created for project: {}", savedProject.getName());
                } else {
                    log.warn("Failed to create chat room for project: {}", savedProject.getName());
                }
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProject);
        }catch (Exception e) {
            log.error("Error creating project: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement du projet");
        }
    }

    @Override
    public ResponseEntity<?> createProject(Project p, Long idprogram) {
        try{
           Program prog = _programDao.findById(idprogram).orElse(null);
           if(prog == null)
           {
               return ResponseEntity.badRequest().body("Le programme n'existe pas");
           }
           p.setProgram(prog);
           p.setStatus(Status.UNLAUNCHED);
           _projectDao.save(p);
             // If the project has a chef projet, create a chat room
            if (p.getChefprojet() != null) {
                ResponseEntity<?> chatRoomResponse = chatRoomService.createChatRoom(p.getIdproject(), p.getChefprojet().getId());
                if (chatRoomResponse.getStatusCode().is2xxSuccessful()) {
                    log.info("Chat room created for project: {}", p.getName());
                } else {
                    log.warn("Failed to create chat room for project: {}", p.getName());
                }
            }
           
            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        }catch (Exception e) {
            log.error("Error creating project: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement du projet");
        }
    }    @Override
    public ResponseEntity<?> createProject(Project p, Long idprogram,Long idchef,Boolean isUserId) {
        try{
           Program prog = _programDao.findById(idprogram).orElse(null);
            if(prog == null)
            {
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            if(isUserId) {
                User u = _userDao.findById(idchef).orElse(null);
                p.setChefprojet(u);
            }
            if(!isUserId) {
                Profile profileM = _profileDao.findById(idchef).orElse(null);
                if (profileM == null) {
                    return ResponseEntity.badRequest().body("Profile ne peut pas être un chef de projet");
                }
                User us = _userDao.findUserByEmail(profileM.getEmail()).orElse(null);
                if (us == null) {
                    _authserv.createAccountFromProfile(idchef);
                }
                User nuser =  _userDao.findUserByEmail(profileM.getEmail()).orElse(null);
                if(nuser != null){
                    p.setChefprojet(nuser);
                }
            }
            p.setProgram(prog);
            p.setStatus(Status.UNLAUNCHED);
            _projectDao.save(p);
              // Create a chat room for the project
            if (p.getChefprojet() != null) {
                ResponseEntity<?> chatRoomResponse = chatRoomService.createChatRoom(p.getIdproject(), p.getChefprojet().getId());
                if (chatRoomResponse.getStatusCode().is2xxSuccessful()) {
                    log.info("Chat room created for project: {}", p.getName());
                } else {
                    log.warn("Failed to create chat room for project: {}", p.getName());
                }
            }
            
            User chef = p.getChefprojet();
            if (chef != null) {
                _notificationService.sendNotification(
                        chef.getEmail(),
                        Notification.builder()
                                .Status(PENDING)                                .Message(String.format("Bonjour %s,\n\nBonne nouvelle ! Vous avez été nommé chef de projet. Voici les détails :\n\nNom du programme : %s\nNom du projet : %s\nDescription du projet : %s\n\nCordialement,",
                                        chef.getFirstname(), prog.getName(), p.getName(), p.getDescription()))
                                .Title("Nomination en tant que chef de projet")
                                .build()
                );
                
                // Send project manager nomination email using template
                emailHelperService.sendProjectManagerNominationEmail(
                    chef.getEmail(), 
                    chef.getFirstname(), 
                    prog.getName(), 
                    p.getName(), 
                    p.getDescription()
                );
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        }catch (Exception e) {
            log.error("Error creating project: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement du projet");
        }
    }

    @Override
    public ResponseEntity<?> updateProject(Project p, Long idp,Long idchef) {
        try{
            Project newp= _projectDao.findById(idp).orElse(null);
            if(newp == null){
                return ResponseEntity.badRequest().body("Le projet n'existe pas");
            }
            if (idchef != null) {
                User u = _userDao.findById(idchef).orElse(null);
                if (u == null) {
                    return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
                }

                newp.setChefprojet(u);
            }            newp.setName(p.getName());
            newp.setDescription(p.getDescription());            User oldChef = newp.getChefprojet();
              // Only update chef if idchef is provided and not null
            if (idchef != null) {
                User u = _userDao.findById(idchef).orElse(null);
                if (u == null) {
                    return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
                }
                
                // Update chef project in the database
                newp.setChefprojet(u);
                
                // Update chat room if there is a change in project manager
                if (oldChef == null || !oldChef.getId().equals(u.getId())) {
                    chatRoomService.getChatRoomByProjectId(idp).ifPresent(chatRoom -> {
                        // Add new chef project to chat room
                        if (u.getProfile() != null) {
                            chatRoomService.addProfileToChatRoom(chatRoom.getId(), u.getProfile().getIdp());
                            log.info("New project manager {} added to chat room for project {}", 
                                u.getFirstname() + " " + u.getLastname(), newp.getName());
                        }
                        
                        // Optionally remove old chef project from chat room if no longer associated with project
                        if (oldChef != null && oldChef.getProfile() != null) {
                            // Check if old chef is still associated with the project in other roles
                            // If not, consider removing them or keeping them as a historical member
                        }
                    });
                    
                    // Send notification
                    _notificationService.sendNotification(
                            u.getEmail(),
                            Notification.builder()
                                    .Status(PENDING)
                                    .Message(String.format("Bonjour %s,\n\nVous avez été assigné comme chef de projet pour %s.\n\nDescription : %s\n\nCordialement,",
                                            u.getFirstname(), newp.getName(), newp.getDescription()))
                                    .Title("Nouvelle assignation au projet " + newp.getName())
                                    .build()
                    );
                }
            }
            
            // Save the project
            _projectDao.save(newp);

            return ResponseEntity.ok().body(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement du projet");
        }
    }

    @Override
    public ResponseEntity<?> retrieveAllProjects() {
       try{
           List<Project> projects = _projectDao.findAll();
           return ResponseEntity.ok().body(projects);
       }catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la recuperation  des  projet");
    }
    }

    @Override
    public ResponseEntity<?> retrieveOneProject(Long idp) {
       try{
           Project p= _projectDao.findById(idp).orElse(null);
           if(p == null){
               return ResponseEntity.badRequest().body("Le projet n'existe pas");
           }
           return ResponseEntity.ok().body(p);
       }catch (Exception e) {
           return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement du projet");
       }
    }
    @Override
    public List<Project> getProjectsByChefprojetId(Long chefprojetId) {
        return _projectDao.findByChefprojetId(chefprojetId);
    }      @Transactional
@Override
public ResponseEntity<?> deleteOneProject(Long idp) {
    try{            
        Project project = _projectDao.findById(idp).orElse(null);
        if (project == null) {
            return ResponseEntity.badRequest().body("Le projet n'existe pas");
        }              
        
        log.info("Starting deletion process for project: {} (ID: {})", project.getName(), idp);
        
        // Step 1: Handle associated chat room and all chat-related data FIRST
        // This ensures all chat messages, read statuses, and chat room associations are properly cleaned up
        try {
            if (chatRoomService.deleteChatRoomByProjectId(idp)) {
                log.info("Chat room and all associated chat data for project '{}' has been successfully deleted", project.getName());
            } else {
                log.info("No chat room found for project '{}' or it was already deleted", project.getName());
            }
        } catch (Exception chatException) {
            log.error("Error deleting chat room for project '{}': {}", project.getName(), chatException.getMessage(), chatException);
            // Continue with project deletion even if chat room deletion fails
        }
        
        // Step 2: Get all project profiles for this project using repository query
        List<ProjectProfile> projectProfiles = _projpDao.findProjectProfilesByProjectId(idp);
        log.info("Found {} project profiles to delete for project '{}'", projectProfiles.size(), project.getName());
        
        // Step 3: Delete all project profiles and their dependencies
        for (ProjectProfile pp : projectProfiles) {
            Long projectProfileId = pp.getId();
            log.info("Processing ProjectProfile ID: {} for project '{}'", projectProfileId, project.getName());
            
            // Step 3a: Delete all tasks that reference this project profile
            List<Task> tasks = _taskDao.findByProfile_Id(projectProfileId);
            log.info("Found {} tasks for ProjectProfile ID: {}", tasks.size(), projectProfileId);
            
            for (Task task : tasks) {
                log.info("Deleting task ID: {} for ProjectProfile ID: {}", task.getId(), projectProfileId);
                _taskDao.delete(task);
            }
            
            // Step 3b: Delete all timesheets associated with this project profile
            List<Timesheet> timesheets = _timesheetdao.findByProjectprofile_Id(projectProfileId);
            log.info("Found {} timesheets for ProjectProfile ID: {}", timesheets.size(), projectProfileId);
            
            for (Timesheet timesheet : timesheets) {
                log.info("Deleting timesheet ID: {} for ProjectProfile ID: {}", timesheet.getIdtimesheet(), projectProfileId);
                _timesheetdao.delete(timesheet);
            }
            
            // Step 3c: Delete the project profile
            log.info("Deleting ProjectProfile ID: {}", projectProfileId);
            _projpDao.delete(pp);
        }
        
        // Step 4: Clear project associations before deletion
        project.setProgram(null);
        project.setChefprojet(null);
        
        // Step 5: Save the project with cleared associations before deletion
        _projectDao.save(project);
        
        // Step 6: Delete the project
        _projectDao.delete(project);
        
        log.info("Project '{}' (ID: {}) and all associated data (including chat room, messages, and read statuses) have been successfully deleted", project.getName(), idp);
        return ResponseEntity.ok().body("Project and all associated data deleted successfully");
        
    } catch (Exception e) {
        e.printStackTrace();
        log.error("Error deleting project with ID {}: {}", idp, e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting project: " + e.getMessage());
    }
}

    @Override
    public ResponseEntity<?> deleteProjectProfile(Long idp) {
        try{
            ProjectProfile p = _projpDao.findById(idp).orElse(null);
            if(p == null){
                return ResponseEntity.badRequest().body("Le profile n'existe pas");
            }
            
            // Remove profile from chat room if exists
            chatRoomService.getChatRoomByProjectId(p.getProject().getIdproject()).ifPresent(chatRoom -> {
                chatRoomService.removeProfileFromChatRoom(chatRoom.getId(), p.getProfile().getIdp());
                log.info("Profile {} removed from chat room for project {}", 
                    p.getProfile().getFirstname() + " " + p.getProfile().getLastname(), 
                    p.getProject().getName());
                    
            });
            
            _projpDao.deleteProjectProfileWithAssociations(idp);
            User chef = p.getProject().getChefprojet();

            if (chef != null) {
                _notificationService.sendNotification(
                        chef.getEmail(),
                        Notification.builder()
                                .Status(REJECTED)
                                .Message(String.format("Bonjour %s,\n\nLe projet %s a été supprimé.\n\nCordialement,",
                                        chef.getFirstname(), p.getProject().getName()))
                                .Title("Suppression du projet " + p.getProject().getName())
                                .build()
                );
            }
            return ResponseEntity.ok().body(null);
        }catch (Exception e) {
            log.error("Error removing profile from project: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la suppression du profile");
        }
    }

    @Override
    public ResponseEntity<?> assignChefProjectToProject(Long idchef, Long idp) {
       try{
           Project p= _projectDao.findById(idp).orElse(null);
           User u =_userDao .findById(idchef).orElse(null);
           if(p == null){
               return ResponseEntity.badRequest().body("Le projet n'existe pas");
           }if(u == null){
               return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
           }           p.setChefprojet(u);
           _projectDao.save(p);
           
           // Check if chat room exists for project, if not create one
           chatRoomService.getChatRoomByProjectId(idp).ifPresentOrElse(
               chatRoom -> {
                   // Add new chef project to chat room if not already a member
                   if (u.getProfile() != null) {
                       if (!chatRoomService.isProfileMemberOfChatRoom(chatRoom.getId(), u.getProfile().getIdp())) {
                           chatRoomService.addProfileToChatRoom(chatRoom.getId(), u.getProfile().getIdp());
                           log.info("New project manager {} added to existing chat room for project {}", 
                               u.getFirstname() + " " + u.getLastname(), p.getName());
                       }
                   }
               },
               () -> {
                   // Create chat room if it doesn't exist
                   ResponseEntity<?> chatRoomResponse = chatRoomService.createChatRoom(p.getIdproject(), u.getId());
                   if (chatRoomResponse.getStatusCode().is2xxSuccessful()) {
                       log.info("Chat room created for project: {}", p.getName());
                   } else {
                       log.warn("Failed to create chat room for project: {}", p.getName());
                   }
               }
           );
             _notificationService.sendNotification(
                   u.getEmail(),
                   Notification.builder()
                           .Status(PENDING)
                           .Message(String.format("Bonjour %s,\n\nBonne nouvelle ! Vous avez été affecté à un nouveau projet. Voici les détails :\n\nNom du programme : %s\nNom du projet : %s\nDescription du projet : %s\n\nCordialement,",
                                   u.getFirstname(), p.getProgram().getName(), p.getName(), p.getDescription()))
                           .Title("Nouvelle affectation à un projet")
                           .build()
           );
           
           // Send project assignment email using template
           emailHelperService.sendProjectAssignmentEmail(
               u.getEmail(), 
               u.getFirstname(), 
               p.getProgram().getName(), 
               p.getName(), 
               p.getDescription()
           );
           
           return ResponseEntity.ok().body(null);
       }catch (Exception e) {
           return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement du projet");
       }
    }

    @Override
    public ResponseEntity<?> retrieveAllProjectsProgram(Long idprog) {
            try{
                List<Project> projects = _projectDao.findByProgram_Idprog(idprog);
                return ResponseEntity.ok().body(projects);
            }catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement du projet");
            }
        }

    @Override
    public ResponseEntity<?> addImageTOoProject(MultipartFile image, Long idp) {
        try{
            Project p=_projectDao.findById(idp).orElse(null);
            if(p==null){
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            byte[] bytes = image.getBytes();
           // Blob blob = new javax.sql.rowset.serial.SerialBlob(bytes);
            p.setImage(bytes);
            _projectDao.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement de l'image du projet");
        }
    }

    @Override
    public List<Object[]> getProjectProfiles(Long projectId) {
        return _projpDao.findProfilesWithMandayBudgetAndConsumedByProjectId(projectId);
    }
    @Override
    public List<ProjectProfile> getProjectprofiles(Long projectId) {
        return _projpDao.findProjectProfilesByProjectId(projectId);
    }
    @Override
    public ResponseEntity<?> assignProfileProject(Long idprof, Long idp, Double mandaybudget) {
        try {
            Project p = _projectDao.findById(idp).orElse(null);
            Profile profile = _profileDao.findById(idprof).orElse(null);


            if (p == null) {
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            if (profile == null) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas");
            }
            ProgramProfile pp= _ppDao.findByProgramIdprogAndProfileIdp(p.getProgram().getIdprog(),profile.getIdp());
            Double already=this.getTotalMandayBudget(p.getProgram().getIdprog(),profile.getIdp());
            Double left = pp.getMandaybudget() - already;
            System.out.println(left);
            if (left < mandaybudget) {
                return ResponseEntity.badRequest().body("Il ne reste que " +left+"  Homme/Jour pour  "+profile.getFirstname()+" dans ce programme" );
            }
            ProjectProfile progprof = new ProjectProfile();
            progprof.setProfile(profile);
            progprof.setMandaybudget(mandaybudget);
            progprof.setProject(p);
            // p.getProgramProfiles().add(progprof);
            _projpDao.save(progprof);
            
            // Add profile to chat room if it exists
            chatRoomService.getChatRoomByProjectId(idp).ifPresent(chatRoom -> {
                chatRoomService.addProfileToChatRoom(chatRoom.getId(), idprof);
                log.info("Profile {} added to chat room for project {}", 
                    profile.getFirstname() + " " + profile.getLastname(), p.getName());
            });
            
            return ResponseEntity.status(HttpStatus.OK).body(null);
        } catch (Exception e) {
            log.error("Error assigning profile to project: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'assigniation du profil au projet");
        } 
    }

    @Override
    public Optional<ProjectProfile> findProjectProfileByProfileIdAndProjectId(Long profileId, Long projectId) {
        return _projpDao.findByProfileIdpAndProjectIdproject(profileId, projectId);
    }
    
    @Override
    public Optional<ProjectProfile> findProjectProfileById(Long projectProfileId) {
        return _projpDao.findById(projectProfileId);
    }
    
    @Override
    public ResponseEntity<?> updateProjectProfile(Long profileId, Long projectId, double mandayBudget) {
        try {
            Optional<ProjectProfile> optionalPP = _projpDao.findByProfileIdpAndProjectIdproject (profileId, projectId);
            if (optionalPP.isEmpty()) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas dans ce projet");
            }

            ProjectProfile pp = optionalPP.get();
            if (pp.getMandaybudget() > mandayBudget) {
                return ResponseEntity.badRequest().body("Le budget Jour/homme minimale est: " + pp.getMandaybudget());
            }
            ProgramProfile progp= _ppDao.findByProgramIdprogAndProfileIdp(pp.getProject().getProgram().getIdprog(),pp.getProfile().getIdp());
            if (progp == null) {
                return ResponseEntity.badRequest().body("Erreur de mise à jour du program Profile");
            }
            Double already=this.getTotalMandayBudget(pp.getProject().getProgram().getIdprog(),pp.getProfile().getIdp());
            System.out.println("-------------------------------------" + already + "-------------------------------------");
            Double left = progp.getMandaybudget() - already;
            System.out.println(left);
            Double diff = mandayBudget-pp.getMandaybudget();
            if (left < diff) {
                return ResponseEntity.badRequest().body("Il ne reste que " +left+"  Homme/Jour pour  "+pp.getProfile().getFirstname()+" dans ce programme" );
            }
            _ppDao.save(progp);
            pp.setMandaybudget(mandayBudget);
            _projpDao.save(pp);  // Don't forget to save the updated entity

            return ResponseEntity.status(HttpStatus.OK).body(pp);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la modification du profil au projet");
        }
    }



    @Override
    public List<Profile> getProfilesForProject(Long programId,Long projectId) {
        List<Profile> profilesInProgram = _projpDao.findProfilesByProjectId(projectId);

        List<Profile> allProfiles =_ppDao.findProfilesByProgramId(programId);

        return allProfiles.stream()
                .filter(profile -> !profilesInProgram.contains(profile))
                .collect(Collectors.toList());
    }
    @Override
    public ProgramProfile findByProgramIdAndProfileId(Long programId, Long profileId) {
        return _ppDao.findByProgramIdprogAndProfileIdp(programId, profileId);
    }
    @Override
    public Double getTotalMandayBudget(Long programId, Long profileId) {
        return _projpDao.findTotalMandayBudgetByProgramAndProfile(programId, profileId);
    }

    public List<Project> getProjectsByChefProgramId(Long chefProgramId) {
        return _projectDao.findAllByChefProgramId(chefProgramId);
    }

    @Override
    public ResponseEntity<?> getProfileProjectStats(Long profileId, Long projectId) {
        try {
            // Find the profile and project
            Profile profile = _profileDao.findById(profileId).orElse(null);
            Project project = _projectDao.findById(projectId).orElse(null);
            
            if (profile == null) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas");
            }
            if (project == null) {
                return ResponseEntity.badRequest().body("Le projet n'existe pas");
            }
            
            // Find the ProjectProfile relationship
            Optional<ProjectProfile> projectProfileOpt = _projpDao.findByProfileIdpAndProjectIdproject(profileId, projectId);
            if (projectProfileOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Ce profil n'est pas assigné à ce projet");
            }
            
            ProjectProfile projectProfile = projectProfileOpt.get();
            
            // Get the ProgramProfile to find the daily rate
            ProgramProfile programProfile = _ppDao.findByProgramIdprogAndProfileIdp(
                    project.getProgram().getIdprog(), profileId);
            
            if (programProfile == null) {
                return ResponseEntity.badRequest().body("Ce profil n'est pas assigné au programme parent de ce projet");
            }
            
            // Calculate manday statistics
            Double totalManDayBudget = projectProfile.getMandaybudget();
            Double consumedManDayBudget = projectProfile.getConsumedmandaybudget();
            Double remainingManDayBudget = totalManDayBudget - consumedManDayBudget;
            Double usagePercentage = (totalManDayBudget > 0) ? 
                    (consumedManDayBudget / totalManDayBudget) * 100 : 0.0;
            
            // Calculate financial statistics
            BigDecimal dailyRate = programProfile.getDailyrate();
            BigDecimal totalBudgetAmount = dailyRate.multiply(BigDecimal.valueOf(totalManDayBudget));
            BigDecimal consumedBudgetAmount = dailyRate.multiply(BigDecimal.valueOf(consumedManDayBudget));
            BigDecimal remainingBudgetAmount = dailyRate.multiply(BigDecimal.valueOf(remainingManDayBudget));
            
            // Calculate task statistics using TaskDao directly
            Integer totalTaskCount = _taskDao.countTasksByProjectIdAndProfileId(projectId, profileId);
            if (totalTaskCount == null) totalTaskCount = 0;
            
            Double totalTaskDays = _taskDao.sumTaskDaysByProjectIdAndProfileId(projectId, profileId);
            if (totalTaskDays == null) totalTaskDays = 0.0;
            
            // Calculate timesheet statistics
            List<Timesheet> timesheets = _timesheetdao.findByProjectprofile_Id(profileId);
            int totalTimesheetEntries = timesheets.size();
            
            // Count timesheets by status - now tracking all status types separately
            int approvedTimesheets = 0;
            int rejectedTimesheets = 0;
            int pendingTimesheets = 0;
            int draftTimesheets = 0;
            int submittedTimesheets = 0;
            
            for (Timesheet timesheet : timesheets) {
                if (timesheet.getStatus() == tn.ey.timesheetclient.timesheet.model.Status.APPROVED) {
                    approvedTimesheets++;
                } else if (timesheet.getStatus() == tn.ey.timesheetclient.timesheet.model.Status.REJECTED) {
                    rejectedTimesheets++;
                } else if (timesheet.getStatus() == tn.ey.timesheetclient.timesheet.model.Status.PENDING) {
                    pendingTimesheets++;
                } else if (timesheet.getStatus() == tn.ey.timesheetclient.timesheet.model.Status.DRAFT) {
                    draftTimesheets++;
                } else if (timesheet.getStatus() == tn.ey.timesheetclient.timesheet.model.Status.SUBMITTED) {
                    submittedTimesheets++;
                }
            }
            
            // Build and return the statistics DTO
            tn.ey.timesheetclient.program.dto.ProfileProjectStats stats = 
                    tn.ey.timesheetclient.program.dto.ProfileProjectStats.builder()
                    // Profile information
                    .profileId(profile.getIdp())
                    .profileName(profile.getFirstname() + " " + profile.getLastname())
                    .profileEmail(profile.getEmail())
                    .profileFunction(programProfile.getFunctionn())
                    
                    // Project information
                    .projectId(project.getIdproject())
                    .projectName(project.getName())
                    .projectDescription(project.getDescription())
                    .projectStatus(project.getStatus().toString())
                    
                    // Program information
                    .programId(project.getProgram().getIdprog())
                    .programName(project.getProgram().getName())
                    
                    // Manday statistics
                    .totalManDayBudget(totalManDayBudget)
                    .consumedManDayBudget(consumedManDayBudget)
                    .remainingManDayBudget(remainingManDayBudget)
                    .usagePercentage(usagePercentage)
                    
                    // Financial statistics
                    .dailyRate(dailyRate)
                    .totalBudgetAmount(totalBudgetAmount)
                    .consumedBudgetAmount(consumedBudgetAmount)
                    .remainingBudgetAmount(remainingBudgetAmount)
                    
                    // Task statistics
                    .totalTaskCount(totalTaskCount)
                    .totalTaskDays(totalTaskDays)
                    
                    // Timesheet statistics - now including all status types
                    .totalTimesheetEntries(totalTimesheetEntries)
                    .approvedTimesheets(approvedTimesheets)
                    .rejectedTimesheets(rejectedTimesheets)
                    .pendingTimesheets(pendingTimesheets)
                    .draftTimesheets(draftTimesheets)
                    .submittedTimesheets(submittedTimesheets)
                    .build();
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des statistiques de projet: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> getProjectProfileTasks(Long projectId, Long profileId) {
        try {
            // Get the project
            Project project = _projectDao.findById(projectId).orElse(null);
            if (project == null) {
                return ResponseEntity.badRequest().body("Le projet n'existe pas");
            }

            // Get the profile
            Profile profile = _profileDao.findById(profileId).orElse(null);
            if (profile == null) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas");
            }

            // Find the project-profile relationship
            Optional<ProjectProfile> projectProfileOpt = _projpDao.findByProfileIdpAndProjectIdproject(profileId, projectId);
            if (projectProfileOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Ce profil n'est pas assigné à ce projet");
            }

            ProjectProfile projectProfile = projectProfileOpt.get();

            // Get all tasks for this profile in this project
            List<Task> tasks = _taskDao.findTasksByProjectIdAndProfileId(projectId, profileId);

            // Create the response DTO
            ProjectTasksDTO responseDto = ProjectTasksDTO.builder()
                    .projectId(project.getIdproject())
                    .projectName(project.getName())
                    .projectDescription(project.getDescription())
                    .projectStatus(project.getStatus().toString())
                    .profileId(profile.getIdp())
                    .profileName(profile.getFirstname() + " " + profile.getLastname())
                    .profileEmail(profile.getEmail())
                    .mandayBudget(projectProfile.getMandaybudget())
                    .consumedMandayBudget(projectProfile.getConsumedmandaybudget())
                    .tasks(tasks)
                    .build();

            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            log.error("Error retrieving project profile tasks", e);
            return ResponseEntity.internalServerError().body("Erreur lors de la récupération des tâches du profil dans le projet");
        }
    }

    @Override
    public ResponseEntity<?> getProjectStats(Long projectId) {
        try {
            // Get project by ID
            Project project = _projectDao.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Project not found with ID: " + projectId));
            
            // Start building the ProjectStatsDTO
            ProjectStatsDTO.ProjectStatsDTOBuilder statsBuilder = ProjectStatsDTO.builder()
                    .projectId(project.getIdproject())
                    .projectName(project.getName())
                    .projectStatus(project.getStatus())
                    .projectDescription(project.getDescription());
            
            // Add program information if available
            if (project.getProgram() != null) {
                statsBuilder
                    .programId(project.getProgram().getIdprog())
                    .programName(project.getProgram().getName());
            }
            
            // Add chef project information if available
            if (project.getChefprojet() != null) {
                User chefProjet = project.getChefprojet();
                statsBuilder.chefProjetName(chefProjet.getFirstname() + " " + chefProjet.getLastname());
            }
            
            // Get project profiles
            List<ProjectProfile> projectProfiles = _projpDao.findProjectProfilesByProjectId(projectId);
              // Initialize counters
            int totalProfiles = projectProfiles.size();
            Double totalMandayBudget = 0.0;
            Double totalConsumedMandayBudget = 0.0;
            int totalTasks = 0;
            int totalTimesheets = 0;
            Map<String, Integer> tasksByWorkplace = new HashMap<>();
            List<ProjectStatsDTO.ProfileStatDTO> profileStats = new ArrayList<>();
            
            // Process each project profile
            for (ProjectProfile pp : projectProfiles) {
                totalMandayBudget += pp.getMandaybudget();
                totalConsumedMandayBudget += pp.getConsumedmandaybudget();
                
                // Count tasks
                List<Task> tasks = _taskDao.findByProfile(pp);
                int profileTaskCount = tasks.size();
                log.info("Processing profile: {}, Task Count: {}",
                        pp.getProfile().getFirstname() + " " + pp.getProfile().getLastname(), profileTaskCount);
                totalTasks += profileTaskCount;
                
                // Process tasks
                for (Task task : tasks) {
                    // Add to tasks by workplace
                    String workplace = task.getWorkPlace();
                    if (workplace != null && !workplace.isEmpty()) {
                        tasksByWorkplace.put(workplace, tasksByWorkplace.getOrDefault(workplace, 0) + 1);
                    }
                    

                }
                
                // Count timesheets
                List<Timesheet> timesheets = _timesheetdao.findByProjectprofile_Id(pp.getId());
                int profileTimesheetCount = timesheets.size();
                totalTimesheets += profileTimesheetCount;

                
                // Add profile statistics
                Profile profile = pp.getProfile();
                if (profile != null) {
                    profileStats.add(ProjectStatsDTO.ProfileStatDTO.builder()
                            .profileId(profile.getIdp())
                            .profileName(profile.getFirstname() + " " + profile.getLastname())
                            .mandayBudget(pp.getMandaybudget())
                            .consumedMandayBudget(pp.getConsumedmandaybudget())
                            .remainingMandayBudget(pp.getMandaybudget() - pp.getConsumedmandaybudget())
                            .taskCount(profileTaskCount)
                            .timesheetCount(profileTimesheetCount)
                            .build());
                }
            }
            
            // Calculate remaining budget and completion percentage
            Double remainingMandayBudget = totalMandayBudget - totalConsumedMandayBudget;
            Double completionPercentage = totalMandayBudget > 0 ? 
                    (totalConsumedMandayBudget / totalMandayBudget) * 100 : 0.0;
              // Complete the ProjectStatsDTO
            ProjectStatsDTO stats = statsBuilder
                    .totalProfiles(totalProfiles)
                    .totalMandayBudget(totalMandayBudget)
                    .totalConsumedMandayBudget(totalConsumedMandayBudget)
                    .remainingMandayBudget(remainingMandayBudget)
                    .completionPercentage(completionPercentage)
                    .totalTasks(totalTasks)
                    .tasksByWorkplace(tasksByWorkplace)
                    .totalTimesheets(totalTimesheets)
                    .profileStats(profileStats)
                    .build();
            
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error while getting project statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred while fetching project statistics: " + e.getMessage());
        }
    }
}
