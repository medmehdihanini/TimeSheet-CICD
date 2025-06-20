package tn.ey.timesheetclient.program.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.model.ProjectProfile;
import tn.ey.timesheetclient.timesheet.model.Task;

import java.util.List;
import java.util.Optional;

public interface ProjectProfileDao extends JpaRepository<ProjectProfile,Long > {
   /* @Query("SELECT pp.profile, pp.mandaybudget, pp.consumedmandaybudget , pp.id FROM ProjectProfile pp WHERE pp.project.idproject = :projectId ORDER BY pp.profile.firstname ASC")
    List<Object[]> findProfilesWithMandayBudgetAndConsumedByProjectId(@Param("projectId") Long projectId);
*/

    @Query("SELECT pp.profile, pp.mandaybudget, pp.consumedmandaybudget, pp.id, ppf.functionn , ppf.dailyrate " +
            "FROM ProjectProfile pp " +
            "JOIN ProgramProfile ppf ON pp.profile.idp = ppf.profile.idp AND pp.project.program.idprog = ppf.program.idprog " +
            "WHERE pp.project.idproject = :projectId " +
            "ORDER BY pp.profile.firstname ASC")
    List<Object[]> findProfilesWithMandayBudgetAndConsumedByProjectId(@Param("projectId") Long projectId);

   // ProjectProfile findByProfileIdpAndProjectIdproject(Long profileId, Long projectId);
    Optional<ProjectProfile> findByProfileIdpAndProjectIdproject(Long profileId, Long projectId);


    @Query("SELECT t FROM Task t WHERE t.profile.profile.idp = :profileId AND t.profile.project.idproject != :projectId")
    List<Task> findTasksByProfileIdAndNotProjectId(Long profileId, Long projectId);

    @Query("SELECT pp.profile FROM ProjectProfile pp WHERE pp.project.idproject = :projectId")
    List<Profile> findProfilesByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT pp FROM ProjectProfile pp WHERE pp.project.idproject = :projectId")
    List<ProjectProfile> findProjectProfilesByProjectId(@Param("projectId") Long projectId);


    @Transactional
    @Modifying
    @Query("DELETE FROM Task t WHERE t.profile.id = :projectProfileId")
    void deleteTasksByProjectProfileId(Long projectProfileId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Timesheet ts WHERE ts.projectprofile.id = :projectProfileId")
    void deleteTimesheetsByProjectProfileId(Long projectProfileId);

    @Transactional
    @Modifying
    @Query("DELETE FROM ProjectProfile pp WHERE pp.id = :projectProfileId")
    void deleteProjectProfileById(Long projectProfileId);

    default void deleteProjectProfileWithAssociations(Long projectProfileId) {
        deleteTasksByProjectProfileId(projectProfileId);
        deleteTimesheetsByProjectProfileId(projectProfileId);
        deleteProjectProfileById(projectProfileId);
    }

    @Query(value = "SELECT COALESCE(SUM(pp.mandaybudget), 0) FROM project_profile pp " +
            "JOIN _project p ON pp.project_id = p.idproject " +
            "WHERE pp.profile_id = :profileId AND p.program_idprog = :programId",
            nativeQuery = true)
    Double findTotalMandayBudgetByProgramAndProfile(@Param("programId") Long programId,
                                                    @Param("profileId") Long profileId);

    List<ProjectProfile> findByProfile_Idp(Long idp);

    List<ProjectProfile> findByProject_IdprojectAndProfile_Idp(Long idproject, Long idp);

 List<ProjectProfile> findByProject_Idproject(Long idproject);



}