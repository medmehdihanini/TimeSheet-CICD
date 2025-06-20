package tn.ey.timesheetclient.timesheet.service;


import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import tn.ey.timesheetclient.mail.EmailHelperService;
import tn.ey.timesheetclient.notification.model.Notification;
import tn.ey.timesheetclient.notification.service.NotificationService;
import tn.ey.timesheetclient.program.dao.ProjectProfileDao;
import tn.ey.timesheetclient.program.model.ProjectProfile;
import tn.ey.timesheetclient.timesheet.dao.TimesheetDao;
import tn.ey.timesheetclient.timesheet.model.Status;
import tn.ey.timesheetclient.timesheet.model.Timesheet;
import tn.ey.timesheetclient.user.dao.UserRepository;
import tn.ey.timesheetclient.user.model.User;
import tn.ey.timesheetclient.user.service.UserService;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static tn.ey.timesheetclient.notification.model.NotificationStatus.PENDING;

@Service
@AllArgsConstructor
@Slf4j
public class TimesheetService implements ITimesheetService {    private final TimesheetDao _timesheetDao;
    private final ProjectProfileDao _projectProfileDao;
    private final EmailHelperService emailHelperService;
    private final NotificationService _notificationService;
    private final UserRepository _userRepository;
    private final UserService _userService;
    

    @Override
    public ResponseEntity<?> addAssignTimesheet(String month, String year, Long idproject, Long idprofile) {
        try {

            Optional<ProjectProfile> optionalPP = _projectProfileDao.findByProfileIdpAndProjectIdproject(idprofile, idproject);
            if (optionalPP.isEmpty()) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas dans ce projet");
            }

            ProjectProfile pp = optionalPP.get();
            Optional<Timesheet> ts = _timesheetDao.findByMoisAndYearAndProjectprofile_Id(month, year, pp.getId());
            if (ts.isPresent()) {
                Timesheet timesheet = ts.get();
                return ResponseEntity.ok(timesheet);
            } else {
                Timesheet newTimesheet = Timesheet.builder()
                        .mois(month)
                        .year(year)
                        .projectprofile(pp)
                        .status(Status.PENDING)
                        .build();

                _timesheetDao.save(newTimesheet);
                return ResponseEntity.status(HttpStatus.CREATED).body(newTimesheet);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement du timesheet");
        }
    }

    @Override
    public ResponseEntity<?> getTimesheetByMonthAndYear(String month, String year, Long idproject, Long idprofile) {

        try {  Optional<ProjectProfile> optionalPP = _projectProfileDao.findByProfileIdpAndProjectIdproject(idprofile, idproject);
            if (optionalPP.isEmpty()) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas dans ce projet");
            }

            ProjectProfile pp = optionalPP.get();
            Optional<Timesheet> ts = _timesheetDao.findByMoisAndYearAndProjectprofile_Id(month, year, pp.getId());
            if (ts.isPresent()) {
                Timesheet timesheet = ts.get();
                return ResponseEntity.ok(timesheet);
            } else {
                Timesheet newTimesheet = Timesheet.builder()
                        .mois(month)
                        .year(year)
                        .projectprofile(pp)
                        .status(Status.DRAFT)
                        .build();

                _timesheetDao.save(newTimesheet);
                return ResponseEntity.status(HttpStatus.CREATED).body(newTimesheet);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récupperation du timesheet");
        }

    }

    @Override
    public ResponseEntity<?> submitTimesheetStatus(Long idtimesheet, Long trigger) {
        try {
            Timesheet timesheet = _timesheetDao.findById(idtimesheet).orElse(null);
            if (timesheet == null) {
                return ResponseEntity.badRequest().body("Pas de timesheet pour ce profil pour l'instant");
            }
            timesheet.setStatus(Status.PENDING);
            //    timesheet.setNotes(note);
            Timesheet rts = _timesheetDao.save(timesheet);
            return ResponseEntity.ok(rts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la soumission du Timesheet");
        }

    }

    @Override
    public ResponseEntity<?> AproveTimesheetStatus(Long idtimesheet, Long trigger) {

        try {
            Timesheet timesheet = _timesheetDao.findById(idtimesheet).orElse(null);
            if (timesheet == null) {
                return ResponseEntity.badRequest().body("Pas de timesheet pour ce profil pour l'instant");
            }
            timesheet.setStatus(Status.APPROVED);
            //    timesheet.setNotes(note);
            _timesheetDao.save(timesheet);
            return ResponseEntity.ok(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'approbation du Timesheet");
        }

    }





    @Override
    public ResponseEntity<?> RejectTimesheetStatus(Long idtimesheet, Long trigger) {

        try {
            Timesheet timesheet = _timesheetDao.findById(idtimesheet).orElse(null);
            if (timesheet == null) {
                return ResponseEntity.badRequest().body("Pas de timesheet pour ce profil pour l'instant");
            }
            timesheet.setStatus(Status.REJECTED);
            //    timesheet.setNotes(note);
            _timesheetDao.save(timesheet);
            return ResponseEntity.ok(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'approbation du Timesheet");
        }
    }

    @Override
    public ResponseEntity<?> getTimesheetsByProjectId(Long projectId) {
        try {
            List<Timesheet> timesheets = _timesheetDao.findAllByProjectProfileProjectId(projectId);
            if (timesheets == null) {
                return ResponseEntity.badRequest().body("Aucune timesheet pour ce projet pour le moment");
            }
            Map<Long, List<Timesheet>> resp = timesheets.stream()
                    .collect(Collectors.groupingBy(t -> t.getProjectprofile().getId()));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récuperation du timesheet du profil");
        }

    }

    @Override
    public ResponseEntity<?> findAllByProjectProfileProjectIdAnsStatus(Long projectId, Status status) {
        try {
            List<Timesheet> timesheets = _timesheetDao.findAllByProjectProfileProjectIdAnsStatus(projectId,status);
            if (timesheets == null) {
                return ResponseEntity.badRequest().body("Aucune timesheet pour ce projet pour le moment");
            }
            Map<Long, List<Timesheet>> resp = timesheets.stream()
                    .collect(Collectors.groupingBy(t -> t.getProjectprofile().getId()));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récuperation des timesheets ");
        }
    }

    @Override
    public List<Timesheet> findByMonthYearProfileIdp(String nuMonth,String year,Long profileId) {
        return _timesheetDao.findByMonthnumber(nuMonth,year,profileId);
    }


    public String getMonthName(String monthNumber) {
        String[] months = {
                "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        };

        try {
            int monthIndex = Integer.parseInt(monthNumber);

            if (monthIndex < 1 || monthIndex > 12) {
                throw new IllegalArgumentException("Le numéro de mois doit être compris entre 01 et 12.");
            }

            return months[monthIndex - 1];
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Le numéro de mois doit être une chaîne numérique valide.");
        }
    }
    @Override
    public ResponseEntity<?> sendPendingMail(Long idtimesheet) {
        try {
            Timesheet timesheet = _timesheetDao.findById(idtimesheet).orElse(null);
            if (timesheet == null) {
                return ResponseEntity.badRequest().body("Pas de timesheet pour ce profil pour l'instant");
            }            String to = timesheet.getProjectprofile().getProject().getProgram().getChefprogram().getEmail();
            String month = this.getMonthName(timesheet.getMois());
            String managerName = timesheet.getProjectprofile().getProject().getProgram().getChefprogram().getFirstname();
            String profileName = timesheet.getProjectprofile().getProfile().getFirstname() + " " + timesheet.getProjectprofile().getProfile().getLastname();
            String submittedBy = timesheet.getProjectprofile().getProject().getChefprojet().getFirstname() + " " + timesheet.getProjectprofile().getProject().getChefprojet().getLastname();
            
            // Send timesheet submission email using template
            emailHelperService.sendTimesheetSubmissionEmail(to, managerName, profileName, month, submittedBy);
            _notificationService.sendNotification(
                    timesheet.getProjectprofile().getProject().getProgram().getChefprogram().getFirstname(),
                    Notification.builder()
                            .Status(PENDING)
                            .Message(String.format("""
                            Bonjour %s,
                                                        
                            Nous vous informons que le timesheet du profil %s%s pour le mois de %s a été soumis.
                                                        
                            Cordialement,
                            %s%s
                              """,
                                    timesheet.getProjectprofile().getProject().getProgram().getChefprogram().getFirstname(), timesheet.getProjectprofile().getProfile().getFirstname(), timesheet.getProjectprofile().getProfile().getLastname(), month,timesheet.getProjectprofile().getProject().getChefprojet().getFirstname() , timesheet.getProjectprofile().getProject().getChefprojet().getLastname()))
                            .Title("Nouvelle affectation à un projet")
                            .build());
            return ResponseEntity.ok(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l\'envoi du mail");
        }
    }

    @Override
    public ResponseEntity<?> sendRejectMail(Long idtimesheet) {
        try {
            Timesheet timesheet = _timesheetDao.findById(idtimesheet).orElse(null);
            if (timesheet == null) {
                return ResponseEntity.badRequest().body("Pas de timesheet pour ce profil pour l'instant");
            }            String to = timesheet.getProjectprofile().getProject().getChefprojet().getEmail();
            String month = this.getMonthName(timesheet.getMois());
            String projectManagerName = timesheet.getProjectprofile().getProject().getChefprojet().getFirstname();
            String profileName = timesheet.getProjectprofile().getProfile().getFirstname() + " " + timesheet.getProjectprofile().getProfile().getLastname();
            String refusedBy = timesheet.getProjectprofile().getProject().getProgram().getChefprogram().getFirstname() + " " + timesheet.getProjectprofile().getProject().getProgram().getChefprogram().getLastname();
            
            // Send timesheet rejection email using template
            emailHelperService.sendTimesheetRejectionEmail(to, projectManagerName, profileName, month, refusedBy);
            _notificationService.sendNotification(
                    timesheet.getProjectprofile().getProject().getChefprojet().getFirstname(),
                    Notification.builder()
                            .Status(PENDING)
                            .Message(String.format("""
                            Bonjour %s\s,
                                                         
                              Nous vous informons que le timesheet du profil %s%s pour le mois de %s a été refusé.
                                                         
                              Cordialement,
                             %s%s
                              """,
                                    timesheet.getProjectprofile().getProject().getChefprojet().getFirstname(), timesheet.getProjectprofile().getProfile().getFirstname(), timesheet.getProjectprofile().getProfile().getLastname(), month, timesheet.getProjectprofile().getProject().getProgram().getChefprogram().getFirstname(), timesheet.getProjectprofile().getProject().getProgram().getChefprogram().getLastname()))
                            .Title("Nouvelle affectation à un projet")
                            .build());
            return ResponseEntity.ok(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récuperation des timesheets ");
        }
    }


    @Override
   public ResponseEntity<?> getTimesheetByMonthAndYearAndUser(String month, String year, Long idproject, Long iduser){

        User user = _userRepository.findById(iduser).orElse(null);
        log.info("getTimesheetByMonthAndYearAndUser called with user: {}", user);
        if (user == null) {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé");
        }
        try {
            log.info("Fetching timesheet for user: {}, month: {}, year: {}, projectId: {}", user.getUsername(), month, year, idproject);

            ResponseEntity<?> profileResponse = _userService.getMatchingProfileId(iduser);

            // Check if the response is successful
            if (!profileResponse.getStatusCode().is2xxSuccessful()) {
                // Return the error message from the UserService
                return ResponseEntity.badRequest().body(profileResponse.getBody());
            }

            // Extract the profile ID safely
            Object responseBody = profileResponse.getBody();
            if (!(responseBody instanceof Map)) {
                return ResponseEntity.badRequest().body("Format de réponse inattendu du service de profil");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> profileData = (Map<String, Object>) responseBody;

            if (profileData == null || !profileData.containsKey("idp")) {
                return ResponseEntity.badRequest().body("Impossible de récupérer le profil associé à cet utilisateur");
            }

            Long profileId = ((Number) profileData.get("idp")).longValue();
            log.info("Extracted profile ID: {}", profileId);

            Optional<ProjectProfile> optionalPP = _projectProfileDao.findByProfileIdpAndProjectIdproject(profileId, idproject);
            log.info("ProjectProfile found: {}", optionalPP.isPresent() ? optionalPP.get() : "No ProjectProfile found");
            if (optionalPP.isEmpty()) {
                return ResponseEntity.badRequest().body("Le profil n'existe pas dans ce projet");
            }

            ProjectProfile pp = optionalPP.get();
            Optional<Timesheet> ts = _timesheetDao.findByMoisAndYearAndProjectprofile_Id(month, year, pp.getId());
            log.info("Timesheet found: {}", ts.isPresent() ? ts.get() : "No timesheet found");
            if (ts.isPresent()) {
                Timesheet timesheet = ts.get();
                return ResponseEntity.ok(timesheet);
            } else {
                Timesheet newTimesheet = Timesheet.builder()
                        .mois(month)
                        .year(year)
                        .projectprofile(pp)
                        .status(Status.DRAFT)
                        .build();

                _timesheetDao.save(newTimesheet);
                return ResponseEntity.status(HttpStatus.CREATED).body(newTimesheet);
            }
        } catch (Exception e) {
            log.error("Error retrieving timesheet", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récuperation du timesheet");
        }
    }

}
