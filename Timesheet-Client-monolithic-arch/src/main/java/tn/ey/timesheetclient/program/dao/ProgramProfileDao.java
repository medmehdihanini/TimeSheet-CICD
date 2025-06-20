package tn.ey.timesheetclient.program.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.program.model.ProgramProfile;

import java.util.List;

public interface ProgramProfileDao extends JpaRepository<ProgramProfile,Long> {

   /* @Query("SELECT pp.profile, pp.mandaybudget FROM ProgramProfile pp WHERE pp.program.idprog = :programId")
    List<Object[]> findProfilesWithMandayBudgetByProgramId(@Param("programId") Long programId);*/

    @Query("SELECT pp.profile, pp.mandaybudget, pp.consumedmandaybudget,pp.id, pp.dailyrate, pp.functionn FROM ProgramProfile pp WHERE pp.program.idprog = :programId ORDER BY pp.profile.firstname ASC")
    List<Object[]> findProfilesWithMandayBudgetByProgramId(@Param("programId") Long programId);
    @Query("SELECT pp.profile FROM ProgramProfile pp WHERE pp.program.idprog = :programId")
    List<Profile> findProfilesByProgramId(@Param("programId") Long programId);

    @Query("SELECT pp.program FROM ProgramProfile pp WHERE pp.profile.email = :email")
    List<Program> findProgramsByProfileEmailAndProfileFunction(@Param("email") String email);

    ProgramProfile findByProgramIdprogAndProfileIdp(Long programId, Long profileId);

    @Query("SELECT SUM(pp.mandaybudget) FROM ProgramProfile pp WHERE pp.profile.idp = :profileId")
    Long sumMandayBudgetByProfileId(@Param("profileId") Long profileId);

    void deleteByProgram(Program program);

    List<ProgramProfile> findByProfile_Idp(Long idp);

    List<ProgramProfile> findByProgram_Idprog(Long idprog);
}
