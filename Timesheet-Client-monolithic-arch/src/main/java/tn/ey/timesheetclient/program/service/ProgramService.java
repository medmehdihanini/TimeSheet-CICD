package tn.ey.timesheetclient.program.service;

import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.dto.ProgramWithTasksDTO;
import tn.ey.timesheetclient.program.model.ProgramProjection;
import tn.ey.timesheetclient.program.model.Status;
import tn.ey.timesheetclient.program.model.Program;

import java.math.BigDecimal;
import java.text.ParseException;
import java.util.List;

public interface ProgramService {
    ResponseEntity<?> createProgram(Program p);
    ResponseEntity<?> createProgram(Program p,Long idchefProgram);
    ResponseEntity<?> addProgramImage(MultipartFile file, Long idp);
    ResponseEntity<?> updateProgram(Program p,Long idp);
    ResponseEntity<?> getAllPrograms();
    ResponseEntity<?> getAllProgramsByChefProg(Long idchef);
    ResponseEntity<?> deleteProgram(Long idp);
    ResponseEntity<?> deleteProgramByContractNumber(Long idp);
    ResponseEntity<?> getOneProgram(Long idp);
    ResponseEntity<?> changerProgramStatus(Long idp, Status status);
    ResponseEntity<?> assignChefProgram(Long idchef,Long idp);
    ResponseEntity<?> assignProfileProgram(Long idprof, Long idp, Double mandaybudget, BigDecimal dailyrate,String function);

    ResponseEntity<?> getProfilesOfProgram(Long idprog);
     ResponseEntity<?> getProgramManagers();
    List<Profile> getProfilesForProgramId(Long programId);
    List<Profile> getProgramProfiles(Long programId);
    List<Program> getProgramsByProfileIdAndFunction(String email);

    List<Program> getProgramsByStatus(Long id,Status status);

    ResponseEntity<?>  deleteProfileFromProject(Long Idp);
    ResponseEntity<?> getOneProgramWithContractNumber(Long idp);
   //ResponseEntity<?> addMandayBudgetToPogramProfile()
   boolean validateProgramDates(String startDateStr, String endDateStr) throws ParseException;
    ResponseEntity<?> updateProgramProfileManDayBudget(Long idprof, Long idp, Double mandaybudget,BigDecimal dailyrate);
    List<ProgramProjection> findProgramsByStatuses(Long idc, List<Status> statuses);
    
    ResponseEntity<?> getProfileProgramStats(Long profileId, Long programId);
    
    ResponseEntity<?> getProgramProfileTasks(Long programId, Long profileId);
    
    // New method for program statistics
    ResponseEntity<?> getProgramStats(Long programId);
}

