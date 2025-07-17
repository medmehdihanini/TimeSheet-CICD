package tn.ey.timesheetclient.program.service;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.notification.model.Notification;
import tn.ey.timesheetclient.notification.service.NotificationService;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.dao.ProgramProfileDao;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.dao.ProjectProfileDao;
import tn.ey.timesheetclient.program.dto.ProgramStatsDTO;
import tn.ey.timesheetclient.program.dto.ProgramWithTasksDTO;
import tn.ey.timesheetclient.program.dto.ProjectFinancialStats;
import tn.ey.timesheetclient.program.dto.ProjectWithTasksDTO;
import tn.ey.timesheetclient.program.dto.TaskDetailsDTO;
import tn.ey.timesheetclient.program.model.*;
import tn.ey.timesheetclient.program.dao.ProgramDAO;
import tn.ey.timesheetclient.timesheet.dao.TaskDao;
import tn.ey.timesheetclient.timesheet.dao.TimesheetDao;
import tn.ey.timesheetclient.timesheet.model.Task;
import tn.ey.timesheetclient.timesheet.model.Timesheet;
import tn.ey.timesheetclient.user.model.Role;
import tn.ey.timesheetclient.user.model.User;
import tn.ey.timesheetclient.user.dao.UserRepository;

import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

import static tn.ey.timesheetclient.notification.model.NotificationStatus.PENDING;

@Service
@AllArgsConstructor
@Slf4j
public class ProgramServiceImpl implements ProgramService{
    private final ProgramDAO _programDao;
    private final UserRepository _userDao;
    private final profileDao _profileDao;
    private final ProgramProfileDao _ppDao;
    private final ProjectProfileDao _pfDao;
    private final TimesheetDao _timesheetDao;
    private final ProjectDao _projectDao;    private final TaskDao _taskDao;
    private final NotificationService _notificationService;



    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("dd/MM/yyyy");
    @Override
    public ResponseEntity<?> createProgram(Program p) {
        try{
            if(_programDao.findByNumcontrat(p.getNumcontrat()) != null){
                return ResponseEntity.badRequest().body("Le numéro de contact existe déjà");
            }
            p.setClient("GIZ");
            p.setStatus(Status.UNLAUNCHED);
            User chef = p.getChefprogram();

            _notificationService.sendNotification(
                    p.getChefprogram().getEmail(),
                    Notification.builder()
                            .Status(PENDING)
                            .Message(String.format("Bonjour %s,\n\nVous avez été assigné comme chef de programme pour %s.\n\nNuméro de contrat : %s\n\nCordialement,",
                                    chef.getFirstname(), p.getName(), p.getNumcontrat()))
                            .Title("Nouvelle assignation au programme " + p.getName())
                            .build()
            );
            _programDao.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauvegarde du programme");
        }
    }

    @Override
    public ResponseEntity<?> createProgram(Program p, Long idchefProgram) {
        try{
            User u = _userDao.findById(idchefProgram)  .orElse(null);
            if(u == null){
                return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
            }
            if(_programDao.findByNumcontrat(p.getNumcontrat()) != null){
                return ResponseEntity.badRequest().body("Le programme existe déjà");
            }
            p.setChefprogram(u);
            _notificationService.sendNotification(
                    u.getEmail(),
                    Notification.builder()
                            .Status(PENDING)
                            .Message(String.format("Bonjour %s,\n\nVous avez été assigné comme chef de programme pour %s.\n\nNuméro de contrat : %s\n\nCordialement,",
                                    u.getFirstname(), p.getName(), p.getNumcontrat()))
                            .Title("Nouvelle assignation au programme " + p.getName())
                            .build()
            );
            _programDao.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauvegarde du programme");
        }
    }



    @Override
    public ResponseEntity<?> addProgramImage(MultipartFile file, Long idp) {
        try{
            Program p=_programDao.findById(idp).orElse(null);
            if(p==null){
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }

            byte[] bytes = file.getBytes();
            // blob = new javax.sql.rowset.serial.SerialBlob(bytes);
            p.setImage(bytes);
            _programDao.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauve garde de l'image du programme");
        }
    }

    @Override
    public ResponseEntity<?> updateProgram(Program p, Long idp) {
        try{
            Program p2= _programDao.findById(idp).orElse(null);
            if(p2 == null){
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            if(!Objects.equals(p.getNumcontrat(), p2.getNumcontrat()) &&_programDao.findByNumcontrat(p.getNumcontrat())!= null){
                return ResponseEntity.badRequest().body("Le numéro de contact existe déjà");
            }
            p2.setStartdate(p.getStartdate());
            p2.setEnddate(p.getEnddate());
            p2.setName(p.getName());
            p2.setNumcontrat(p.getNumcontrat());
            p2.setChefprogram(p.getChefprogram());
            p2.setStatus(p.getStatus());
            _programDao.save(p2);
            _notificationService.sendNotification(
                    p2.getChefprogram().getEmail(),
                    Notification.builder()
                            .Status(PENDING)
                            .Message(String.format("Bonjour %s,\n\nLe programme %s a été mis à jour.\n\nNuméro de contrat : %s\n\nCordialement,",
                                    p2.getChefprogram().getFirstname(), p2.getName(), p2.getNumcontrat()))
                            .Title("Nouvelle assignation au programme " + p2.getName())
                            .build()
            );
            return ResponseEntity.ok(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de modification du programme");
        }
    }

    @Override
    public ResponseEntity<?> getAllPrograms() {
        try{
            List<Program> programs = _programDao.findAll();
            return ResponseEntity.ok(programs);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de récuperation des programmes");
        }
    }

    @Override
    public ResponseEntity<?> getAllProgramsByChefProg(Long idchef) {
        try{
            List<Program> programs = _programDao.findByChefprogram_Id(idchef);
            return ResponseEntity.ok(programs);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récupération des programmes du chef");
        }
    }

    @Override
    public ResponseEntity<?> deleteProgram(Long idp) {
        try{
            Program p= _programDao.findById(idp).orElse(null);
            if(p == null){
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            _programDao.deleteById(idp);
            return ResponseEntity.ok(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la suppression du programme");
        }
    }
    @Transactional
    @Override
    public ResponseEntity<?> deleteProgramByContractNumber(Long idp) {
        try {
            Program program = _programDao.findByNumcontrat(idp);
            if (program == null) {
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }

            // Get all projects for this program using repository query
            List<Project> projects = _projectDao.findByProgram_Idprog(program.getIdprog());
            
            // Delete all projects and their dependencies
            for (Project project : projects) {
                // Get all project profiles for this project
                List<ProjectProfile> projectProfiles = _pfDao.findProjectProfilesByProjectId(project.getIdproject());
                
                for (ProjectProfile pp : projectProfiles) {
                    // Delete all tasks for this project profile
                    List<Task> tasks = _taskDao.findByProfile_Id(pp.getId());
                    for (Task task : tasks) {
                        _taskDao.delete(task);
                    }
                    
                    // Delete all timesheets for this project profile
                    List<Timesheet> timesheets = _timesheetDao.findByProjectprofile_Id(pp.getId());
                    for (Timesheet timesheet : timesheets) {
                        _timesheetDao.delete(timesheet);
                    }
                    
                    // Delete the project profile
                    _pfDao.delete(pp);
                }
                
                // Clear project references and delete
                project.setChefprojet(null);
                project.setProgram(null);
                _projectDao.delete(project);
            }

            // Get all program profiles for this program using repository query
            List<ProgramProfile> programProfiles = _ppDao.findByProgram_Idprog(program.getIdprog());
            
            // Delete all program profiles and return budget to profiles
            for (ProgramProfile pp : programProfiles) {
                if (pp.getProfile() != null) {
                    // Return manday budget to profile
                    Profile profile = pp.getProfile();
                    profile.setMandaybudget(profile.getMandaybudget() + pp.getMandaybudget());
                    _profileDao.save(profile);
                }
                _ppDao.delete(pp);
            }

            // Clear program references and delete
            program.setChefprogram(null);
            _programDao.delete(program);

            return ResponseEntity.ok().body("Programme supprimé avec succès");
        } catch (Exception e) {
            log.error("Error deleting program by contract number: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la suppression du programme: " + e.getMessage());
        }
    }



    @Override
    public ResponseEntity<?> getOneProgram(Long idp) {
        try{
            Program p = _programDao.findById(idp).orElse(null);
            if(p == null){
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            return ResponseEntity.ok(p);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récupération de programme");
        }
    }
    @Override
    public ResponseEntity<?> getOneProgramWithContractNumber(Long idp) {
        try{
            Program p = _programDao.findByNumcontrat(idp);
            if(p == null){
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            return ResponseEntity.ok(p);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récupération du programme");
        }
    }

    @Override
    public ResponseEntity<?> changerProgramStatus(Long idp, Status status) {
        try{
            Program p= _programDao.findById(idp).orElse(null);
            if(p == null){
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }            if(status == Status.IN_PROGRESS) {
                // Check if program has any profiles assigned using repository query
                List<ProgramProfile> programProfiles = _ppDao.findByProgram_Idprog(p.getIdprog());
                if(programProfiles.isEmpty()) {
                    return ResponseEntity.badRequest().body("Il faut d'abord assigner des profiles à ce programme");
                }
            }
            if((status == Status.IN_PROGRESS) && (p.getChefprogram()== null)){
                return ResponseEntity.badRequest().body("Il faut d'abord assigner un chef de programme");
            }
            if(status == Status.IN_PROGRESS && p.getStatus()==  Status.IN_PROGRESS ){
                return ResponseEntity.badRequest().body("Programme déja lancé");
            }
            if(status == Status.IN_PROGRESS){
                LocalDateTime currentDateTime = LocalDateTime.now();
                Date currentDate = Date.from(currentDateTime.atZone(ZoneId.systemDefault()).toInstant());
                p.setLaunchedat(currentDate);
            }
            p.setStatus(status);
            _programDao.save(p);
            return ResponseEntity.ok(null);
        }catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de récuperation du programme");
    }
    }

    @Override
    public ResponseEntity<?> assignChefProgram(Long idchef, Long idp) {
        try{
            Program p = _programDao.findById(idp).orElse(null);
            User u = _userDao.findById(idchef).orElse(null);
            if(p == null){
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            if(u == null){
                return ResponseEntity.badRequest().body("L'utilisateur' n'existe pas");
            }
            p.setChefprogram(u);
            _programDao.save(p);
            _notificationService.sendNotification(
                    u.getEmail(),
                    Notification.builder()
                            .Status(PENDING)
                            .Message(String.format("Bonjour %s,\n\nVous avez été assigné comme chef de programme pour %s.\n\nNuméro de contrat : %s\n\nCordialement,",
                                    u.getFirstname(), p.getName(), p.getNumcontrat()))
                            .Title("Nouvelle assignation au programme " + p.getName())
                            .build()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauvegarde du programme");
        }
    }

    @Override
    public ResponseEntity<?> assignProfileProgram(Long idprof, Long idp, Double mandaybudget, BigDecimal dailyrate, String function) {
        try {
            Program p = _programDao.findById(idp).orElse(null);
            Profile profile = _profileDao.findById(idprof).orElse(null);
            if (p == null) {
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            if (profile == null) {
                return ResponseEntity.badRequest().body("Profil n'existe pas");
            }
            Long consumed = _ppDao.sumMandayBudgetByProfileId(profile.getIdp());
            if(consumed == null){
                consumed = 0L;
            }

            if ((consumed + mandaybudget) > 230) {
                return ResponseEntity.badRequest().body("profil à "+ (230 - consumed) +" J/H restants " );
            }
            double rest = profile.getMandaybudget() - mandaybudget;
            profile.setMandaybudget(rest);
            _profileDao.save(profile);
            ProgramProfile progprof= new ProgramProfile();
            progprof.setProfile(profile);
            progprof.setMandaybudget(mandaybudget);
            progprof.setProgram(p);
            progprof.setDailyrate(dailyrate);
            progprof.setFunctionn(function);
           // p.getProgramProfiles().add(progprof);
            _ppDao.save(progprof);
            //Program pp =_programDao.save(p);

            _notificationService.sendNotification(
                    profile.getEmail(),
                    Notification.builder()
                            .Status(PENDING)
                            .Message(String.format("Bonjour %s,\n\nVous avez été assigné au programme %s avec un budget de %s jours/homme.\n\nCordialement,",
                                    profile.getFirstname(), p.getName(), mandaybudget))
                            .Title("Assignation au programme " + p.getName())
                            .build()
            );
            return ResponseEntity.status(HttpStatus.OK).body(null);
        } catch (Exception e) {return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauvegarde du programme");
        }
    }

    public ResponseEntity<?> updateProgramProfileManDayBudget(Long idprof, Long idp, Double mandaybudget,BigDecimal dailyrate){
        try {

            Profile profile = _profileDao.findById(idprof).orElse(null);
            Program p = _programDao.findById(idp).orElse(null);
            if (p == null) {
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            if (profile == null) {
                return ResponseEntity.badRequest().body("Profil n'existe pas");
            }

            Long consumed = _ppDao.sumMandayBudgetByProfileId(profile.getIdp());
            if(consumed == null){
                consumed = 0L;
            }
            ProgramProfile progp = _ppDao.findByProgramIdprogAndProfileIdp(idp,idprof);
            double newmandaybudget = mandaybudget - progp.getMandaybudget();
            if (newmandaybudget > profile.getMandaybudget()) {
                return ResponseEntity.badRequest().body("profil à "+ profile.getMandaybudget() +" J/H restants " );
            }            
            // Get total consumed manday budget for this profile across all projects in this program
            Double totalConsumedMandayBudget = _pfDao.findTotalConsumedMandayBudgetByProgramAndProfile(idp, idprof);
            if (totalConsumedMandayBudget == null) {
                totalConsumedMandayBudget = 0.0;
            }
            if (totalConsumedMandayBudget > mandaybudget) {
                return ResponseEntity.badRequest().body("Le budget Jour/homme minimum est: " + totalConsumedMandayBudget + " (déjà consommé dans les projets)");
            }
            double newm = profile.getMandaybudget() - newmandaybudget;
            profile.setMandaybudget(newm);
            progp.setMandaybudget(mandaybudget);
            progp.setDailyrate(dailyrate);
            _profileDao.save(profile);


            _notificationService.sendNotification(
                   profile.getEmail(), // Replace with actual email logic
                    Notification.builder()
                            .Status(PENDING)
                            .Message(String.format("Bonjour %s,\n\nVotre budget pour le programme %s a été mis à jour à %s jours/homme et votre Tarif journalier est %s.\n\nCordialement,",
                                    profile.getFirstname(), p.getName(), mandaybudget, dailyrate))
                            .Title("Mise à jour du budget pour " + p.getName())
                            .build()
            );


            //Program pp =_programDao.save(p);
            return ResponseEntity.status(HttpStatus.OK).body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la mise à jour du budget J/H");

        }
    }

    @Override
    public List<ProgramProjection> findProgramsByStatuses(Long idc, List<Status> statuses) {
        return _programDao.findProgramsByStatuses(idc,statuses);
    }

    @Override
    public ResponseEntity<?> getProfilesOfProgram(Long idprog) {
        try {
            Program p = _programDao.findById(idprog).orElse(null);
            if (p == null) {
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            List<Object[]> profilesWithMandayBudget = _ppDao.findProfilesWithMandayBudgetByProgramId(idprog);
            return ResponseEntity.ok(profilesWithMandayBudget);
        } catch (Exception e) {return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauvegarde du programme");
        }
    }

    @Override
    public  ResponseEntity<?> getProgramManagers() {
        try {
        List<User> chefprograms = _userDao.findByRole(Role.PROGRAM_MANAGER);
            if (chefprograms.isEmpty()) {
                return ResponseEntity.badRequest().body("No Program Managers available!!!!");
            }
            return ResponseEntity.ok(chefprograms);
        } catch (Exception e) {return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauvegarde du programme");
        }
    }
    @Override
    public List<Profile> getProfilesForProgramId(Long programId) {
        List<Profile> profilesInProgram = _ppDao.findProfilesByProgramId(programId);

        List<Profile> allProfiles = _profileDao.findAll();

        return allProfiles.stream()
                .filter(profile -> !profilesInProgram.contains(profile))
                .collect(Collectors.toList());
    }
    @Override
    public List<Profile> getProgramProfiles(Long programId) {
       return _ppDao.findProfilesByProgramId(programId);
    }


    @Override
    public List<Program> getProgramsByProfileIdAndFunction(String email) {
        return _ppDao.findProgramsByProfileEmailAndProfileFunction(email);
    }


    //TODO not tested yet
    @Override
    public List<Program> getProgramsByStatus(Long id,Status status) {
        return _programDao.findByStatusAndChefprogramId(status, id);
    }

    @Override
    public ResponseEntity<?> deleteProfileFromProject(Long Idp) {
        try{
            ProgramProfile pp = _ppDao.findById(Idp).orElse(null);
            if(pp == null){
                return ResponseEntity.badRequest().body("Profile is not available in this program!!!");
            }
            double newm  = pp.getProfile().getMandaybudget() + pp.getMandaybudget();
            pp.getProfile().setMandaybudget(newm);
            _ppDao.deleteById(Idp);
            return ResponseEntity.ok().body(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la suppression ");
        }

    }
    @Override
    public boolean validateProgramDates(String startDateStr, String endDateStr) throws ParseException {
        DATE_FORMAT.setLenient(false);
        //Parsing dates from strings to date to hundle logic
        Date startDate = DATE_FORMAT.parse(startDateStr);
        Date endDate = DATE_FORMAT.parse(endDateStr);
        Date currentDate = new Date();
        System.out.println(currentDate);

        // Check if start date is in the future
        if (startDate.before(currentDate)) {
            return false;
        }

        // Check if start date is before end date
        if (!startDate.before(endDate)) {
            return false;
        }

        // Check if there's at least one month between start date and end date
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(startDate);
        calendar.add(Calendar.MONTH, 1);
        Date oneMonthLater = calendar.getTime();

        if (!oneMonthLater.before(endDate)) {
            return false;
        }

        return true;
    }

    @Override
    public ResponseEntity<?> getProfileProgramStats(Long profileId, Long programId) {
        try {
            System.out.println("DEBUG: Starting getProfileProgramStats method with profileId=" + profileId + ", programId=" + programId);
            
            // Find the profile and program
            Profile profile = _profileDao.findById(profileId).orElse(null);
            Program program = _programDao.findById(programId).orElse(null);
            
            if (profile == null) {
                System.out.println("DEBUG: Profile not found with ID: " + profileId);
                return ResponseEntity.badRequest().body("Le profil n'existe pas");
            }
            if (program == null) {
                System.out.println("DEBUG: Program not found with ID: " + programId);
                return ResponseEntity.badRequest().body("Le programme n'existe pas");
            }
            
            System.out.println("DEBUG: Found profile: " + profile.getFirstname() + " " + profile.getLastname());
            System.out.println("DEBUG: Found program: " + program.getName());
            
            // Find the ProgramProfile relationship
            ProgramProfile programProfile = _ppDao.findByProgramIdprogAndProfileIdp(programId, profileId);
            if (programProfile == null) {
                System.out.println("DEBUG: ProgramProfile relationship not found");
                return ResponseEntity.badRequest().body("Ce profil n'est pas assigné à ce programme");
            }
            
            System.out.println("DEBUG: Found program profile with manday budget: " + programProfile.getMandaybudget());
            
            // Calculate program-level statistics
            Double totalManDayBudget = programProfile.getMandaybudget();
            Double consumedManDayBudget = programProfile.getConsumedmandaybudget();
            Double remainingManDayBudget = totalManDayBudget - consumedManDayBudget;
            Double usagePercentage = (totalManDayBudget > 0) ? 
                    (consumedManDayBudget / totalManDayBudget) * 100 : 0.0;
            
            BigDecimal dailyRate = programProfile.getDailyrate();
            BigDecimal totalBudgetAmount = dailyRate.multiply(BigDecimal.valueOf(totalManDayBudget));
            BigDecimal consumedBudgetAmount = dailyRate.multiply(BigDecimal.valueOf(consumedManDayBudget));
            BigDecimal remainingBudgetAmount = dailyRate.multiply(BigDecimal.valueOf(remainingManDayBudget));
            
            // Get all projects for this program using ProjectDao
            List<Project> programProjects = _projectDao.findByProgram_Idprog(programId);
            System.out.println("DEBUG: Found " + programProjects.size() + " projects for this program using explicit query");
            
            // Create a list to hold project-level financial statistics
            List<ProjectFinancialStats> projectFinancialStatsList = new ArrayList<>();
            
            // Calculate financial statistics for each project in the program
            for (Project project : programProjects) {
                System.out.println("DEBUG: Processing project: " + project.getName() + " (ID: " + project.getIdproject() + ")");
                
                // Find if the profile is assigned to this project using ProjectProfileDao
                Optional<ProjectProfile> projectProfileOpt = _pfDao.findByProfileIdpAndProjectIdproject(profileId, project.getIdproject());
                
                Double projectManDayBudget = 0.0;
                Double projectConsumedManDayBudget = 0.0;
                Double projectRemainingManDayBudget = 0.0;
                Double projectUsagePercentage = 0.0;
                
                // If profile is assigned to this project, use actual values
                if (projectProfileOpt.isPresent()) {
                    System.out.println("DEBUG: Profile is assigned to this project");
                    ProjectProfile projectProfile = projectProfileOpt.get();
                    
                    projectManDayBudget = projectProfile.getMandaybudget();
                    projectConsumedManDayBudget = projectProfile.getConsumedmandaybudget();
                    projectRemainingManDayBudget = projectManDayBudget - projectConsumedManDayBudget;
                    projectUsagePercentage = (projectManDayBudget > 0) ? 
                            (projectConsumedManDayBudget / projectManDayBudget) * 100 : 0.0;
                } else {
                    System.out.println("DEBUG: Profile is NOT assigned to this project");
                }
                
                // Calculate project-level financial statistics using the daily rate from program profile
                BigDecimal projectTotalBudgetAmount = dailyRate.multiply(BigDecimal.valueOf(projectManDayBudget));
                BigDecimal projectConsumedBudgetAmount = dailyRate.multiply(BigDecimal.valueOf(projectConsumedManDayBudget));
                BigDecimal projectRemainingBudgetAmount = dailyRate.multiply(BigDecimal.valueOf(projectRemainingManDayBudget));
                
                // Create DTO for project financial statistics
                ProjectFinancialStats projectStats = ProjectFinancialStats.builder()
                        .projectId(project.getIdproject())
                        .projectName(project.getName())
                        .projectDescription(project.getDescription())
                        .projectStatus(project.getStatus().toString())
                        .projectManDayBudget(projectManDayBudget)
                        .projectConsumedManDayBudget(projectConsumedManDayBudget)
                        .projectRemainingManDayBudget(projectRemainingManDayBudget)
                        .projectUsagePercentage(projectUsagePercentage)
                        .projectTotalBudgetAmount(projectTotalBudgetAmount)
                        .projectConsumedBudgetAmount(projectConsumedBudgetAmount)
                        .projectRemainingBudgetAmount(projectRemainingBudgetAmount)
                        .build();
                
                projectFinancialStatsList.add(projectStats);
                System.out.println("DEBUG: Added project statistics for project: " + project.getName());
            }
            
            System.out.println("DEBUG: Total project statistics collected: " + projectFinancialStatsList.size());
            
            // Create the statistics DTO
            tn.ey.timesheetclient.program.dto.ProfileProgramStats stats = tn.ey.timesheetclient.program.dto.ProfileProgramStats.builder()
                    .profileId(profile.getIdp())
                    .profileName(profile.getFirstname() + " " + profile.getLastname())
                    .profileEmail(profile.getEmail())
                    .function(programProfile.getFunctionn())
                    .programId(program.getIdprog())
                    .programName(program.getName())
                    .programStatus(program.getStatus().toString())
                    .totalManDayBudget(totalManDayBudget)
                    .consumedManDayBudget(consumedManDayBudget)
                    .remainingManDayBudget(remainingManDayBudget)
                    .usagePercentage(usagePercentage)
                    .dailyRate(dailyRate)
                    .totalBudgetAmount(totalBudgetAmount)
                    .consumedBudgetAmount(consumedBudgetAmount)
                    .remainingBudgetAmount(remainingBudgetAmount)
                    .projectsFinancialStats(projectFinancialStatsList)
                    .build();
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("DEBUG: Exception in getProfileProgramStats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récupération des statistiques: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> getProgramProfileTasks(Long programId, Long profileId) {
        log.info("Processing getProgramProfileTasks for programId: {}, profileId: {}", programId, profileId);
        try {
            // Get the program
            Program program = _programDao.findById(programId).orElse(null);
            if (program == null) {
                log.warn("Program not found for programId: {}", programId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("program not found");
            }

            // Get the profile
            Profile profile = _profileDao.findById(profileId).orElse(null);
            if (profile == null) {
                log.warn("Profile not found for profileId: {}", profileId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Profile not found");
            }

            // Find the program-profile relationship
            ProgramProfile programProfile = _ppDao.findByProgramIdprogAndProfileIdp(programId, profileId);
            if (programProfile == null) {
                log.warn("No program-profile relationship found for programId: {}, profileId: {}", programId, profileId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Profile not assigned to this program");
            }

            // Get all projects for this program
            List<Project> projects = _projectDao.findByProgram_Idprog(programId);
            log.debug("Found {} projects for programId: {}", projects.size(), programId);

            // Create the response DTO - Program level
            ProgramWithTasksDTO responseDto = ProgramWithTasksDTO.builder()
                    .programId(program.getIdprog())
                    .programName(program.getName())
                    .contractNumber(program.getNumcontrat())
                    .programStatus(program.getStatus())
                    .profileId(profile.getIdp())
                    .profileName(profile.getFirstname() + " " + profile.getLastname())
                    .profileEmail(profile.getEmail())
                    .profileFunction(programProfile.getFunctionn()) // Verify this field exists
                    .totalMandayBudget(programProfile.getMandaybudget())
                    .totalConsumedMandayBudget(programProfile.getConsumedmandaybudget())
                    .dailyRate(programProfile.getDailyrate())
                    .projects(new ArrayList<>())
                    .build();

                    log.info("consumedMandayBudget:", programProfile.getConsumedmandaybudget());

            // For each project, get tasks for this profile
            for (Project project : projects) {
                // Check if the profile is assigned to this project
                Optional<ProjectProfile> projectProfileOpt = _pfDao.findByProfileIdpAndProjectIdproject(profileId, project.getIdproject());
                if (projectProfileOpt.isEmpty()) {
                    log.debug("Profile {} not assigned to project {}", profileId, project.getIdproject());
                    continue;
                }

                ProjectProfile projectProfile = projectProfileOpt.get();

                // Get tasks for this profile in this project
                List<Task> tasks = _taskDao.findTasksByProjectIdAndProfileId(project.getIdproject(), profileId);
                if (tasks.isEmpty()) {
                    log.debug("No tasks found for projectId: {}, profileId: {}", project.getIdproject(), profileId);
                    continue;
                }

                // Convert tasks to DTOs
                List<TaskDetailsDTO> taskDTOs = tasks.stream()
                        .map(task -> TaskDetailsDTO.builder()
                                .taskId(task.getId())
                                .taskDate(task.getDatte())
                                .workDays(task.getNbJour())
                                .description(task.getText())
                                .workPlace(task.getWorkPlace())
                                .build())
                        .collect(Collectors.toList());

                // Create project DTO and add to response
                ProjectWithTasksDTO projectDto = ProjectWithTasksDTO.builder()
                        .projectId(project.getIdproject())
                        .projectName(project.getName())
                        .projectDescription(project.getDescription())
                        .projectStatus(project.getStatus())
                        .mandayBudget(projectProfile.getMandaybudget())
                        .consumedMandayBudget(projectProfile.getConsumedmandaybudget())
                        .tasks(taskDTOs)
                        .build();

                responseDto.getProjects().add(projectDto);
            }

            log.info("Successfully retrieved tasks for programId: {}, profileId: {}", programId, profileId);
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            log.error("Error retrieving program profile tasks for programId: {}, profileId: {}", programId, profileId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des tâches du profil dans le programme");
        }
    }    @Override
    public ResponseEntity<?> getProgramStats(Long programId) {
        try {
            // Get the current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            User currentUser = _userDao.findUserByEmail(currentUserEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Get the program
            Program program = _programDao.findById(programId)
                    .orElseThrow(() -> new IllegalArgumentException("Program not found with ID: " + programId));
            
            // Check if the current user is the chefprogram or has SUPER_ADMIN role
            boolean isAuthorized = false;
            if (program.getChefprogram() != null && program.getChefprogram().getId().equals(currentUser.getId())) {
                isAuthorized = true;
            } else if (currentUser.getRole() == Role.SUPER_ADMIN) {
                isAuthorized = true;
            }
            
            if (!isAuthorized) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You are not authorized to access this program's statistics");
            }
            
            // Build program statistics
            ProgramStatsDTO stats = buildProgramStats(program);
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error while getting program statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred while fetching program statistics: " + e.getMessage());
        }
    }
      private ProgramStatsDTO buildProgramStats(Program program) {
        // Initialize basic program info
        ProgramStatsDTO.ProgramStatsDTOBuilder statsBuilder = ProgramStatsDTO.builder()
                .programId(program.getIdprog())
                .programName(program.getName())
                .programStatus(program.getStatus())
                .client(program.getClient())
                .startDate(program.getStartdate())
                .endDate(program.getEnddate())
                .contractNumber(program.getNumcontrat());
        
        // Get all projects for the program
        List<Project> projects = _projectDao.findByProgram_Idprog(program.getIdprog());
        log.info("Found {} projects for programId: {}", projects.size(), program.getIdprog());
        
        // Project statistics
        int totalProjects = projects.size();
        Map<Status, Integer> projectsByStatus = new HashMap<>();
        
        // Initialize project stats list
        List<ProgramStatsDTO.ProjectStatsDTO> projectStatsList = new ArrayList<>();
        
        // Total budget statistics
        Double totalMandayBudget = 0.0;
        Double consumedMandayBudget = 0.0;
        BigDecimal totalBudgetAmount = BigDecimal.ZERO;
        BigDecimal consumedBudgetAmount = BigDecimal.ZERO;
        
        // Process projects
        for (Project project : projects) {
            // Add to project status counts
            projectsByStatus.put(project.getStatus(), 
                projectsByStatus.getOrDefault(project.getStatus(), 0) + 1);
            
            // Calculate project stats
            int profileCount = _pfDao.findByProject_Idproject(project.getIdproject()).size();
            int taskCount = 0;
            Double projectMandayBudget = 0.0;
            Double projectConsumedMandayBudget = 0.0;
              for (ProjectProfile pp : _pfDao.findByProject_Idproject(project.getIdproject())) {
                // Count tasks for this project profile
                int profileTaskCount = _taskDao.findByProfile_Id(pp.getId()).size();
                taskCount += profileTaskCount;
                
                // Calculate manday budget
                projectMandayBudget += pp.getMandaybudget();
                projectConsumedMandayBudget += pp.getConsumedmandaybudget();
            }
            
            // Add project to stats list
            projectStatsList.add(ProgramStatsDTO.ProjectStatsDTO.builder()
                    .projectId(project.getIdproject())
                    .projectName(project.getName())
                    .projectStatus(project.getStatus())
                    .profileCount(profileCount)
                    .taskCount(taskCount)
                    .projectMandayBudget(projectMandayBudget)
                    .projectConsumedMandayBudget(projectConsumedMandayBudget)
                    .build());
            
            // Add to totals
            totalMandayBudget += projectMandayBudget;
            consumedMandayBudget += projectConsumedMandayBudget;
        }
          // Profiles statistics from program profiles

        List<ProgramProfile> programProfiles = _ppDao.findByProgram_Idprog(program.getIdprog());
        int totalProfiles = programProfiles.size();
        Map<String, Integer> profilesByFunction = new HashMap<>();
        
        // Task statistics
        int totalTasks = 0;
        Map<String, Integer> tasksByWorkplace = new HashMap<>();
        
        // Process program profiles for additional budget info
        for (ProgramProfile pp : programProfiles) {
            // Add to profiles by function
            String function = pp.getFunctionn();
            profilesByFunction.put(function, profilesByFunction.getOrDefault(function, 0) + 1);
            
            // Add to financial totals from program profiles
            if (pp.getDailyrate() != null) {
                totalBudgetAmount = totalBudgetAmount.add(pp.getDailyrate().multiply(BigDecimal.valueOf(pp.getMandaybudget())));
                consumedBudgetAmount = consumedBudgetAmount.add(pp.getDailyrate().multiply(BigDecimal.valueOf(pp.getConsumedmandaybudget())));
            }
            
            // Add to manday budgets
            totalMandayBudget += pp.getMandaybudget();
            consumedMandayBudget += pp.getConsumedmandaybudget();
        }
          // Gather all tasks from all projects for task statistics
        for (Project project : projects) {
            for (ProjectProfile pp : _pfDao.findByProject_Idproject(project.getIdproject())) {
                List<Task> tasks = _taskDao.findByProfile_Id(pp.getId());
                for (Task task : tasks) {
                    totalTasks++;
                    
                    // Add to tasks by workplace
                    String workplace = task.getWorkPlace();
                    if (workplace != null) {
                        tasksByWorkplace.put(workplace, tasksByWorkplace.getOrDefault(workplace, 0) + 1);
                    }
                }
            }
        }
        
        // Calculate remaining values
        Double remainingMandayBudget = totalMandayBudget - consumedMandayBudget;
        BigDecimal remainingBudgetAmount = totalBudgetAmount.subtract(consumedBudgetAmount);
        
        // Build the complete statistics
        return statsBuilder
                .totalProjects(totalProjects)
                .projectsByStatus(projectsByStatus)
                .totalProfiles(totalProfiles)
                .profilesByFunction(profilesByFunction)
                .totalTasks(totalTasks)
                .tasksByWorkplace(tasksByWorkplace)
                .totalMandayBudget(totalMandayBudget)
                .consumedMandayBudget(consumedMandayBudget)
                .remainingMandayBudget(remainingMandayBudget)
                .totalBudgetAmount(totalBudgetAmount)
                .consumedBudgetAmount(consumedBudgetAmount)
                .remainingBudgetAmount(remainingBudgetAmount)
                .projects(projectStatsList)
                .build();
    }
    }


