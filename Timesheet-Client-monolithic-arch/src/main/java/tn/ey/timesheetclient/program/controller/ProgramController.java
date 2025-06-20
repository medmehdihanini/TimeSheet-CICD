package tn.ey.timesheetclient.program.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.Logs.services.LogService;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.model.ProgramProjection;
import tn.ey.timesheetclient.program.service.ProgramService;
import tn.ey.timesheetclient.program.model.Status;
import tn.ey.timesheetclient.program.dao.ProgramDAO;
import tn.ey.timesheetclient.program.dto.ProgramWithTasksDTO;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.user.dao.UserRepository;
import tn.ey.timesheetclient.user.model.User;

import java.math.BigDecimal;
import java.util.List;

@CrossOrigin(origins = "http://13.74.191.237:8085")
@RestController
@RequestMapping("/api/v1/program")
@AllArgsConstructor
public class ProgramController {
    private final ProgramService programservice;
    private final LogService logService;
    private final ProgramDAO programDAO;
    private final UserRepository userRepository;
    private final profileDao _profileDao;

    @PostMapping("/addProg")
    public ResponseEntity<?> addProgram(@RequestBody Program p) {
        ResponseEntity<?> response = programservice.createProgram(p);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProgramAction("Programme créé avec nom: " + p.getName(), p);
        }
        return response;
    }

    @PostMapping("/addProg/{idechef}")
    public ResponseEntity<?> addProgram(@RequestBody Program p, @PathVariable Long idechef) {
        ResponseEntity<?> response = programservice.createProgram(p, idechef);
        if (response.getStatusCode().is2xxSuccessful()) {
            User chef = userRepository.findById(idechef).orElse(null);
            String chefName = chef != null ? chef.getFirstname() + " " + chef.getLastname() : "Chef inconnu";
            logService.logProgramAction("Programme créé avec nom: " + p.getName() + " avec chef: " + chefName, p);
        }
        return response;
    }

    @PutMapping("/addImageToProgram/{idp}")
    public ResponseEntity<?> addImageToProgram(@RequestParam("image") MultipartFile image, @PathVariable Long idp) {
        ResponseEntity<?> response = programservice.addProgramImage(image, idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            Program p = programDAO.findById(idp).orElse(null);
            if (p != null) {
                logService.logProgramAction("Image ajoutée au programme: " + p.getName(), p);
            }
        }
        return response;
    }

    @PutMapping("/updateProgram/{idp}")
    public ResponseEntity<?> updateProgram(@RequestBody Program p, @PathVariable Long idp) {
        ResponseEntity<?> response = programservice.updateProgram(p, idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProgramAction("Programme mis à jour: " + p.getName(), p);
        }
        return response;
    }

    @GetMapping("/getPrograms")
    public ResponseEntity<?> getAllPrograms() {
        return programservice.getAllPrograms();
    }

    @GetMapping("/getprogprofiles/{idp}")
    public List<Profile> getProgramProfiles(@PathVariable Long idp) {
        return programservice.getProgramProfiles(idp);
    }

    @GetMapping("/getProgramsOfChief/{idchef}")
    public ResponseEntity<?> getAllProgramsByChief(@PathVariable Long idchef) {
        return programservice.getAllProgramsByChefProg(idchef);
    }

    @GetMapping("/getOneProgram/{idp}")
    public ResponseEntity<?> getOneProgram(@PathVariable Long idp) {
        return programservice.getOneProgram(idp);
    }

    @GetMapping("/getOneProgramWithContactNumber/{idp}")
    public ResponseEntity<?> getOneProgramWithContractId(@PathVariable Long idp) {
        return programservice.getOneProgramWithContractNumber(idp);
    }

    @DeleteMapping("/deleteOneProgram/{idp}")
    public ResponseEntity<?> deleteOneProgram(@PathVariable Long idp) {
        Program program = programDAO.findById(idp).orElse(null);
        String programName = program != null ? program.getName() : "Programme inconnu";
        
        ResponseEntity<?> response = programservice.deleteProgram(idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProgramAction("Programme supprimé: " + programName, null);
        }
        return response;
    }

    @DeleteMapping("/deleteOneProgramByContractNumber/{idp}")
    public ResponseEntity<?> deleteOneProgramByContractNumber(@PathVariable Long idp) {
        Program program = programDAO.findByNumcontrat(idp);
        String programName = program != null ? program.getName() : "Programme inconnu";
        String contractNumber = program != null ? String.valueOf(idp) : "inconnu";
        
        ResponseEntity<?> response = programservice.deleteProgramByContractNumber(idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProgramAction("Programme supprimé avec numéro de contrat: " + contractNumber + " (" + programName + ")", null);
        }
        return response;
    }

    @PutMapping("/changeProgramStatus")
    public ResponseEntity<?> changeProgramStatus(@RequestParam("idp") Long idp, @RequestParam("status") Status status) {
        Program program = programDAO.findById(idp).orElse(null);
        String programName = program != null ? program.getName() : "Programme inconnu";
        
        ResponseEntity<?> response = programservice.changerProgramStatus(idp, status);
        if (response.getStatusCode().is2xxSuccessful()) {
            String statusFr;
            switch(status) {
                case IN_PROGRESS: statusFr = "IN_PROGRESS"; break;
                case UNLAUNCHED: statusFr = "UNLAUNCHED"; break;
                case ON_HOLD: statusFr = "EN ATTENTE"; break;
                case CANCELED: statusFr = "CANCELED"; break;
                case FINISHED: statusFr = "FINISHED"; break;
                default: statusFr = status.toString();
            }
            logService.logProgramAction("Statut du programme " + programName + " changé à " + statusFr, program);
        }
        return response;
    }

    @PutMapping("/assignchefprogram/{idchef}/{idp}")
    public ResponseEntity<?> assignChefProgram(@PathVariable Long idchef, @PathVariable Long idp) {
        User chef = userRepository.findById(idchef).orElse(null);
        Program program = programDAO.findById(idp).orElse(null);
        
        String chefName = chef != null ? chef.getFirstname() + " " + chef.getLastname() : "Chef inconnu";
        String programName = program != null ? program.getName() : "Programme inconnu";
        
        ResponseEntity<?> response = programservice.assignChefProgram(idchef, idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProgramAction("Chef " + chefName + " assigné au programme: " + programName, program);
        }
        return response;
    }

    @PutMapping("/assignProfileprogram")
    public ResponseEntity<?> assignProfileProgram(
            @RequestParam Long idprog,
            @RequestParam Long idp,
            @RequestParam Double manday,
            @RequestParam BigDecimal dailyrate,
            @RequestParam String function) {
        
        Profile profile = _profileDao.findById(idp).orElse(null);
        Program program = programDAO.findById(idprog).orElse(null);
        
        String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
        String programName = program != null ? program.getName() : "Programme inconnu";
        
        ResponseEntity<?> response = programservice.assignProfileProgram(idprog, idp, manday, dailyrate, function);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProgramAction("Profil " + profileName + " assigné au programme " + programName + 
                " avec " + manday + " jours-homme, taux journalier: " + dailyrate + "€, fonction: " + function, program);
        }
        return response;
    }

    @GetMapping("/profilePrograms/{programId}")
    public ResponseEntity<?> getProfilesWithMandayBudget(@PathVariable Long programId) {
        return programservice.getProfilesOfProgram(programId);
    }

    @GetMapping("/prograManagers")
    public ResponseEntity<?> getProgramManagers() {
        return programservice.getProgramManagers();
    }

    @GetMapping("/profileforPrograms/{programId}")
    public List<Profile> getProfilesProgram(@PathVariable Long programId) {
        return programservice.getProfilesForProgramId(programId);
    }

    @GetMapping("/programsByPartnerProfile/{email}")
    public List<Program> getProgramsByProfileIdAndFunction(@PathVariable String email) {
        return programservice.getProgramsByProfileIdAndFunction(email);
    }

    @GetMapping("/getProgramsByStatus/{idc}/{status}")
    public List<Program> getProgramByStatus(@PathVariable Status status, @PathVariable Long idc) {
        return programservice.getProgramsByStatus(idc, status);
    }

    @DeleteMapping("/deleteProfileFromProgram/{idpp}")
    public ResponseEntity<?> deleteProfileFromProgram(@PathVariable Long idpp) {
        // Idéalement, il faudrait récupérer le nom du profile et du programme, mais nous n'avons pas accès direct au ProgramProfile par ID
        ResponseEntity<?> response = programservice.deleteProfileFromProject(idpp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProgramAction("Profil retiré du programme", null);
        }
        return response;
    }

    @PutMapping("/updateProgProfileManday/{idprof}/{idp}/{mandaybudget}/{dailyrate}")
    public ResponseEntity<?> updateProgramProfileManday(@PathVariable Long idprof, @PathVariable Long idp, @PathVariable Double mandaybudget, @PathVariable BigDecimal dailyrate) {
        Profile profile = _profileDao.findById(idprof).orElse(null);
        Program program = programDAO.findById(idp).orElse(null);
        
        String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
        String programName = program != null ? program.getName() : "Programme inconnu";
        
        ResponseEntity<?> response = programservice.updateProgramProfileManDayBudget(idprof, idp, mandaybudget, dailyrate);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProgramAction("Budget jours-homme mis à jour à " + mandaybudget + " et taux journalier à " + dailyrate + 
                "TND pour le profil " + profileName + " dans le programme " + programName, program);
        }
        return response;
    }

    @PostMapping("/filterByStatus/{idc}")
    public ResponseEntity<List<ProgramProjection>> getProgramsByStatuses(@RequestBody List<Status> statuses, @PathVariable Long idc) {
        List<ProgramProjection> programs = programservice.findProgramsByStatuses(idc, statuses);
        return ResponseEntity.ok(programs);
    }

    @GetMapping("/profileProgramStats/{profileId}/{programId}")
    public ResponseEntity<?> getProfileProgramStats(@PathVariable Long profileId, @PathVariable Long programId) {
       
    
        
        return programservice.getProfileProgramStats(profileId, programId);
        
         
    }

    @GetMapping("/tasks/{programId}/{profileId}")
    public ResponseEntity<?> getProgramProfileTasks(@PathVariable Long programId, @PathVariable Long profileId) {
        
    
        return programservice.getProgramProfileTasks(programId, profileId);
        
        
    }

    @GetMapping("/stats/{programId}")
    public ResponseEntity<?> getProgramStatistics(@PathVariable Long programId) {
        Program program = programDAO.findById(programId).orElse(null);
        String programName = program != null ? program.getName() : "Programme inconnu";
        
        ResponseEntity<?> response = programservice.getProgramStats(programId);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logProgramAction("Statistiques consultées pour le programme: " + programName, program);
        }
        return response;
    }
}