package tn.ey.timesheetclient.profile.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import tn.ey.timesheetclient.profile.DTO.ProfileStatsResponse;
import tn.ey.timesheetclient.profile.DTO.ProgramStats;
import tn.ey.timesheetclient.profile.DTO.ProjectStats;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profilefunction;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.dao.ProgramProfileDao;
import tn.ey.timesheetclient.program.dao.ProjectProfileDao;
import tn.ey.timesheetclient.program.model.ProgramProfile;
import tn.ey.timesheetclient.program.model.ProjectProfile;
import tn.ey.timesheetclient.timesheet.dao.TaskDao;
import tn.ey.timesheetclient.timesheet.dao.TimesheetDao;
import tn.ey.timesheetclient.timesheet.model.Task;
import tn.ey.timesheetclient.timesheet.model.Timesheet;
import tn.ey.timesheetclient.ChatRoom.dao.ChatMessageRepository;
import tn.ey.timesheetclient.ChatRoom.Model.ChatMessage;
import tn.ey.timesheetclient.ChatRoom.dao.ChatRoomRepository;
import tn.ey.timesheetclient.ChatRoom.Model.ChatRoom;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {    private final profileDao _profileDao;
    private final ProjectProfileDao _projectProfileDao;
    private final ProgramProfileDao _programProfileDao;
    private final TaskDao _taskDao;
    private final TimesheetDao _timesheetDao;
    private final ChatMessageRepository _chatMessageRepository;
    private final ChatRoomRepository _chatRoomRepository;
    @Override
    public ResponseEntity<?> createProfile(Profile p) {
        try {
            if (_profileDao.findByEmail(p.getEmail()) != null) {
                return ResponseEntity.badRequest().body("L'email existe déjà !!!!");
            }
            _profileDao.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauvegarde du profil");
        }
    }

    @Override
    public ResponseEntity<?> addProfileImage(MultipartFile file, Long idp) {
        try {
            Profile p = _profileDao.findById(idp).orElse(null);
            if (p == null) {
                return ResponseEntity.badRequest().body("Profil non trouvé !!!!");
            }
            byte[] bytes = file.getBytes();
            //Blob blob = new javax.sql.rowset.serial.SerialBlob(bytes);
            p.setImage(bytes);
            _profileDao.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(p);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauvegarde de l'image de profil");
        }
    }

    @Override
    public ResponseEntity<?> updateProfile(Profile p, Long idp) {
        try {
            Profile p2 = _profileDao.findById(idp).orElse(null);
            if (p2 == null) {
                return ResponseEntity.badRequest().body("Profil non trouvé !!!!");
            }
            if (!Objects.equals(p.getEmail(), p2.getEmail()) && _profileDao.findByEmail(p.getEmail()) != null) {
                return ResponseEntity.badRequest().body("L'email existe déjà !!!!");
            }
            p2.setFirstname(p.getFirstname());
            p2.setLastname(p.getLastname());
            p2.setEmail(p.getEmail());
            p2.setPfunction(p.getPfunction());
            p2.setDepartement(p.getDepartement());
            p2.setDailyrate(p.getDailyrate());
            p2.setMandaybudget(p.getMandaybudget());
            _profileDao.save(p2);
            return ResponseEntity.ok(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de modification du profil");
        }
    }

    @Override
    public ResponseEntity<?> getAllProfiles() {
        try {
            List<Profile> profiles = _profileDao.findAll();
            return ResponseEntity.ok(profiles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de modification du profil");
        }
    }    @Override
    @Transactional
    public ResponseEntity<?> deleteProfile(Long idp) {
        try {
            Profile p = _profileDao.findById(idp).orElse(null);
            if (p == null) {
                return ResponseEntity.badRequest().body("Profil non trouvé !!!!");
            }            // First, remove profile from all chat rooms they're a member of
            List<ChatRoom> chatRooms = _chatRoomRepository.findByMembersContaining(idp);
            for (ChatRoom chatRoom : chatRooms) {
                chatRoom.getMembers().remove(p);
                _chatRoomRepository.save(chatRoom);
            }
            
            // Second, remove profile from readBy sets of all chat messages
            List<ChatMessage> allChatMessages = _chatMessageRepository.findAll();
            for (ChatMessage chatMessage : allChatMessages) {
                if (chatMessage.getReadBy().contains(p)) {
                    chatMessage.getReadBy().remove(p);
                    _chatMessageRepository.save(chatMessage);
                }
            }
            
            // Third, delete all chat messages sent by this profile
            List<ChatMessage> chatMessages = _chatMessageRepository.findBySender_Idp(idp);
            for (ChatMessage chatMessage : chatMessages) {
                chatMessage.setSender(null);
                _chatMessageRepository.save(chatMessage);
            }
            _chatMessageRepository.deleteAll(chatMessages);
              // Fourth, delete all project profiles and their associated data
            List<ProjectProfile> projectProfiles = _projectProfileDao.findByProfile_Idp(idp);
            for (ProjectProfile projectProfile : projectProfiles) {
                // Delete all tasks associated with this project profile
                List<Task> tasks = _taskDao.findByProfile_Id(projectProfile.getId());
                for (Task task : tasks) {
                    task.setProfile(null);
                    _taskDao.save(task);
                }
                _taskDao.deleteAll(tasks);
                
                // Delete all timesheets associated with this project profile
                List<Timesheet> timesheets = _timesheetDao.findByProjectprofile_Id(projectProfile.getId());
                for (Timesheet timesheet : timesheets) {
                    timesheet.setProjectprofile(null);
                    _timesheetDao.save(timesheet);
                }
                _timesheetDao.deleteAll(timesheets);
                
                // Clear the profile association and delete the project profile
                projectProfile.setProfile(null);
                projectProfile.setProject(null);
                _projectProfileDao.save(projectProfile);
            }
            _projectProfileDao.deleteAll(projectProfiles);
              // Fifth, delete all program profiles
            List<ProgramProfile> programProfiles = _programProfileDao.findByProfile_Idp(idp);
            for (ProgramProfile programProfile : programProfiles) {
                // Restore manday budget back to profile before deletion
                if (programProfile.getProfile() != null && programProfile.getMandaybudget() != null) {
                    double newMandayBudget = programProfile.getProfile().getMandaybudget() + programProfile.getMandaybudget();
                    programProfile.getProfile().setMandaybudget(newMandayBudget);
                }
                
                // Clear the profile association and delete the program profile
                programProfile.setProfile(null);
                programProfile.setProgram(null);
                _programProfileDao.save(programProfile);
            }
            _programProfileDao.deleteAll(programProfiles);
            
            // Finally, delete the profile
            _profileDao.deleteById(idp);
            return ResponseEntity.ok(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de suppression du profil: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> getOneProfile(Long idp) {
        try {
            Profile p = _profileDao.findById(idp).orElse(null);
            if (p == null) {
                return ResponseEntity.badRequest().body("Profil non trouvé !!!!");
            }
            return ResponseEntity.ok(p);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de récupération du profil");
        }
    }

    @Override
    public List<Profile> getProjectManagers() {
        return _profileDao.findByPfunction(Profilefunction.PROJECT_MANAGER);
    }


    public ResponseEntity<?> getProfileStats(Long profileId) {
        try {
            // Fetch Profile for basic info
            Profile profile = _profileDao.findById(profileId).orElse(null);
            if (profile == null) {
                return ResponseEntity.badRequest().body("Profil non trouvé !!!!");
            }

            // Debug logging
            System.out.println("Profile ID: " + profile.getIdp());

            // Fetch all ProgramProfiles
            List<ProgramProfile> programProfiles = _programProfileDao.findByProfile_Idp(profileId);
            System.out.println("Program Profiles: " + programProfiles.size());

            // Fetch all ProjectProfiles
            List<ProjectProfile> projectProfiles = _projectProfileDao.findByProfile_Idp(profileId);
            System.out.println("Project Profiles: " + projectProfiles.size());

            // Debug ProjectProfile details
            projectProfiles.forEach(pr -> {
                List<Task> tasks = _taskDao.findByProfile_Id(pr.getId());
                System.out.println("ProjectProfile ID: " + pr.getId() +
                        ", Project ID: " + pr.getProject().getIdproject() +
                        ", Tasks: " + tasks.size());
            });

            ProfileStatsResponse response = new ProfileStatsResponse();
            response.setProfileId(profile.getIdp());
            response.setFullName(profile.getFirstname() + " " + profile.getLastname());

            // Global workplace counts
            Map<String, Long> globalWorkplaceCounts = new HashMap<>();
            globalWorkplaceCounts.put("EY", 0L);
            globalWorkplaceCounts.put("Chez le client", 0L);

            projectProfiles.forEach(pp -> {
                List<Task> tasks = _taskDao.findByProfile_Id(pp.getId());
                tasks.forEach(task -> {
                    String workPlace = task.getWorkPlace();
                    if ("EY".equals(workPlace)) {
                        globalWorkplaceCounts.merge("EY", 1L, Long::sum);
                    } else if ("Chez le client".equals(workPlace)) {
                        globalWorkplaceCounts.merge("Chez le client", 1L, Long::sum);
                    }
                });
            });
            response.setWorkplaceCounts(globalWorkplaceCounts);

            // Programs and their projects
            List<ProgramStats> programStats = programProfiles.stream()
                    .map(pp -> {
                        ProgramStats stats = new ProgramStats();
                        stats.setProgramId(pp.getProgram().getIdprog());
                        stats.setName(pp.getProgram().getName());
                        stats.setStatus(pp.getProgram().getStatus());
                        stats.setClient(pp.getProgram().getClient());
                        stats.setMandayBudget(pp.getMandaybudget());
                        stats.setConsumedMandayBudget(pp.getConsumedmandaybudget());

                        // Filter projects for this program
                        List<ProjectStats> projectStats = projectProfiles.stream()
                                .filter(pr -> pr.getProject().getProgram().getIdprog().equals(pp.getProgram().getIdprog()))
                                .map(pr -> {
                                    ProjectStats projStats = new ProjectStats();
                                    projStats.setProjectId(pr.getProject().getIdproject());
                                    projStats.setName(pr.getProject().getName());
                                    projStats.setStatus(pr.getProject().getStatus());
                                    projStats.setMandayBudget(pr.getMandaybudget());
                                    projStats.setConsumedMandayBudget(pr.getConsumedmandaybudget());

                                    // Task count using TaskDao
                                    List<Task> tasks = _taskDao.findByProfile_Id(pr.getId());
                                    long taskCount = tasks.size();
                                    projStats.setTaskCount(taskCount);
                                    System.out.println("Project ID: " + pr.getProject().getIdproject() +
                                            ", Tasks: " + taskCount);

                                    // Timesheet status
                                    List<Timesheet> timesheets = _timesheetDao.findByProjectprofile_Id(pr.getId());
                                    Timesheet timesheet = timesheets.stream().findFirst().orElse(null);
                                    projStats.setTimesheetStatus(timesheet != null ? timesheet.getStatus() : null);
                                    System.out.println("Project ID: " + pr.getProject().getIdproject() +
                                            ", Timesheet Status: " +
                                            (timesheet != null ? timesheet.getStatus() : "null"));

                                    // Workplace counts
                                    Map<String, Long> workplaceCounts = new HashMap<>();
                                    workplaceCounts.put("EY", 0L);
                                    workplaceCounts.put("Chez le client", 0L);

                                    tasks.forEach(task -> {
                                        String workPlace = task.getWorkPlace();
                                        if ("EY".equals(workPlace)) {
                                            workplaceCounts.merge("EY", 1L, Long::sum);
                                        } else if ("Chez le client".equals(workPlace)) {
                                            workplaceCounts.merge("Chez le client", 1L, Long::sum);
                                        }
                                    });
                                    projStats.setWorkplaceCounts(workplaceCounts);

                                    return projStats;
                                })
                                .collect(Collectors.toList());

                        stats.setProjects(projectStats);
                        return stats;
                    })
                    .collect(Collectors.toList());

            response.setPrograms(programStats);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des statistiques : " + e.getMessage());
        }
    }
}

