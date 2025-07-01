package tn.ey.timesheetclient.timesheet.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.ey.timesheetclient.Logs.services.LogService;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.timesheet.dao.TimesheetDao;
import tn.ey.timesheetclient.timesheet.model.Status;
import tn.ey.timesheetclient.timesheet.model.Timesheet;
import tn.ey.timesheetclient.timesheet.service.ITimesheetService;

import java.util.List;


@RestController
@RequestMapping("/api/v1/timesheet")
@AllArgsConstructor
public class TimesheetController {

    private final ITimesheetService _timesheetService;
    private final LogService logService;
    private final TimesheetDao timesheetDao;
    private final profileDao _profileDao;
    private final ProjectDao _projectDao;

    @PostMapping("/add")
    public ResponseEntity<?> addAssignTimesheet(@RequestParam String month, @RequestParam String year, @RequestParam Long idproject, @RequestParam Long idprofile) {
        ResponseEntity<?> response = _timesheetService.addAssignTimesheet(month, year, idproject, idprofile);
        if (response.getStatusCode().is2xxSuccessful()) {
            Project project = _projectDao.findById(idproject).orElse(null);
            Profile profile = _profileDao.findById(idprofile).orElse(null);
            
            String projectName = project != null ? project.getName() : "Projet inconnu";
            String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
            
            logService.logProjectAction("Création de feuille de temps pour le projet: " + projectName + 
                ", profil: " + profileName + " pour " + month + "/" + year, project);
        }
        return response;
    }

    @GetMapping("/get")
    public ResponseEntity<?> getTimesheetByMonthAndYear(@RequestParam String month, @RequestParam String year, @RequestParam Long idproject, @RequestParam Long idprofile) {
        return _timesheetService.getTimesheetByMonthAndYear(month, year, idproject, idprofile);
    }

    @GetMapping("/getByMonth")
    public List<Timesheet> getTimesheetByMonthAndYearProfile(@RequestParam String month, @RequestParam String year, @RequestParam Long idprofile) {
        return _timesheetService.findByMonthYearProfileIdp(month, year, idprofile);
    }

    @PutMapping("/changesatatus/{idtimesheet}/{trigger}")
    public ResponseEntity<?> changeSatatusLong(@PathVariable Long idtimesheet, @PathVariable Long trigger) {
        ResponseEntity<?> response;
        String action;
        switch (trigger.intValue()) {
            case 1:
                response = _timesheetService.submitTimesheetStatus(idtimesheet, trigger);
                action = "soumise";
                break;
            case 2:
                response = _timesheetService.RejectTimesheetStatus(idtimesheet, trigger);
                action = "rejetée";
                break;
            case 3:
                response = _timesheetService.AproveTimesheetStatus(idtimesheet, trigger);
                action = "approuvée";
                break;
            default:
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Valeur de déclencheur non valide");
        }
        if (response.getStatusCode().is2xxSuccessful()) {
            Timesheet timesheet =timesheetDao.findById(idtimesheet).orElse(null);
            if (timesheet != null && timesheet.getProjectprofile() != null) {
                Project project = null;
                Profile profile = null;
                
                if (timesheet.getProjectprofile().getProject() != null) {
                    project = timesheet.getProjectprofile().getProject();
                }
                
                if (timesheet.getProjectprofile().getProfile() != null) {
                    profile = timesheet.getProjectprofile().getProfile();
                }
                
                String projectName = project != null ? project.getName() : "Projet inconnu";
                String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
                String monthYear = timesheet.getMois() + "/" + timesheet.getYear();
                
                if (project != null) {
                    logService.logProjectAction("Feuille de temps de " + profileName + " pour " + monthYear + 
                        " " + action + " dans le projet: " + projectName, project);
                } else {
                    logService.logAction("Feuille de temps de " + profileName + " pour " + monthYear + " " + action);
                }
            } else {
                logService.logAction("Feuille de temps " + action);
            }
        }
        return response;
    }

    @GetMapping("/projectTimesheets/{projectId}/{status}")
    public ResponseEntity<?> getTimesheetsByProjectId(@PathVariable Long projectId, @PathVariable String status) {
        switch (status) {
            case "all":
                return _timesheetService.getTimesheetsByProjectId(projectId);
            case "APPROVED":
                return _timesheetService.findAllByProjectProfileProjectIdAnsStatus(projectId, Status.APPROVED);
            case "DRAFT":
                return _timesheetService.findAllByProjectProfileProjectIdAnsStatus(projectId, Status.DRAFT);
            case "SUBMITTED":
                return _timesheetService.findAllByProjectProfileProjectIdAnsStatus(projectId, Status.SUBMITTED);
            case "REJECTED":
                return _timesheetService.findAllByProjectProfileProjectIdAnsStatus(projectId, Status.REJECTED);
            case "PENDING":
                return _timesheetService.findAllByProjectProfileProjectIdAnsStatus(projectId, Status.PENDING);
            default:
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Statut indisponible");
        }
    }

    @GetMapping("/sendEmail/{idtimesheet}")
    public ResponseEntity<?> senEmail(@PathVariable Long idtimesheet) {
        ResponseEntity<?> response = _timesheetService.sendRejectMail(idtimesheet);
        if (response.getStatusCode().is2xxSuccessful()) {
            Timesheet timesheet = timesheetDao.findById(idtimesheet).orElse(null);
            if (timesheet != null && timesheet.getProjectprofile() != null) {
                Project project = null;
                Profile profile = null;
                
                if (timesheet.getProjectprofile().getProject() != null) {
                    project = timesheet.getProjectprofile().getProject();
                }
                
                if (timesheet.getProjectprofile().getProfile() != null) {
                    profile = timesheet.getProjectprofile().getProfile();
                }
                
                String projectName = project != null ? project.getName() : "Projet inconnu";
                String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
                String monthYear = timesheet.getMois() + "/" + timesheet.getYear();
                
                if (project != null) {
                    logService.logProjectAction("Email de rejet envoyé pour la feuille de temps de " + profileName + 
                        " pour " + monthYear + " dans le projet: " + projectName, project);
                } else {
                    logService.logAction("Email de rejet envoyé pour la feuille de temps de " + profileName + " pour " + monthYear);
                }
            } else {
                logService.logAction("Email de rejet envoyé pour une feuille de temps");
            }
        }
        return response;
    }

    @GetMapping("/sendAprouvalEmail/{idtimesheet}")
    public ResponseEntity<?> sendAprouvalEmail(@PathVariable Long idtimesheet) {
        ResponseEntity<?> response = _timesheetService.sendPendingMail(idtimesheet);
        if (response.getStatusCode().is2xxSuccessful()) {
            Timesheet timesheet = timesheetDao.findById(idtimesheet).orElse(null);
            if (timesheet != null && timesheet.getProjectprofile() != null) {
                Project project = null;
                Profile profile = null;
                
                if (timesheet.getProjectprofile().getProject() != null) {
                    project = timesheet.getProjectprofile().getProject();
                }
                
                if (timesheet.getProjectprofile().getProfile() != null) {
                    profile = timesheet.getProjectprofile().getProfile();
                }
                
                String projectName = project != null ? project.getName() : "Projet inconnu";
                String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
                String monthYear = timesheet.getMois() + "/" + timesheet.getYear();
                
                if (project != null) {
                    logService.logProjectAction("Email d'approbation envoyé pour la feuille de temps de " + profileName + 
                        " pour " + monthYear + " dans le projet: " + projectName, project);
                } else {
                    logService.logAction("Email d'approbation envoyé pour la feuille de temps de " + profileName + " pour " + monthYear);
                }
            } else {
                logService.logAction("Email d'approbation envoyé pour une feuille de temps");
            }
        }
        return response;
    }

    @GetMapping("/getTmesheetByMonthAndYearAndUser")
    public ResponseEntity<?> getTimesheetByMonthAndYearAndUser(@RequestParam String month, @RequestParam String year, @RequestParam Long idproject, @RequestParam Long idprofile) {
        return _timesheetService.getTimesheetByMonthAndYearAndUser(month, year, idproject, idprofile);
    }
}