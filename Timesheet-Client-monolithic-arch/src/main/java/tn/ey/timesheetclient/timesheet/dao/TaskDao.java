package tn.ey.timesheetclient.timesheet.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.ey.timesheetclient.program.model.ProjectProfile;
import tn.ey.timesheetclient.timesheet.dto.TaskWithProjectIdDTO;
import tn.ey.timesheetclient.timesheet.model.Task;

import java.util.List;

public interface TaskDao extends JpaRepository<Task, Long> {
    List<Task> findByProfile_Id(Long idp);

    @Query("SELECT t FROM Task t WHERE t.profile.project.idproject = :projectId AND t.profile.profile.idp = :profileId")
    List<Task> findTasksByProjectIdAndProfileId(@Param("projectId") Long projectId, @Param("profileId") Long profileId);


    @Query("SELECT t FROM Task t WHERE SUBSTRING(t.datte, 6, 2) = :monthNumber")
    List<Task> findByMonthNumber(String monthNumber);

   /* @Query("SELECT t FROM Task t " +
            "WHERE t.profile.profile.idp = :profileId " +
            "AND SUBSTRING(t.datte, 6, 2) = :month")
    List<Task> findAllTasksByProfileIdAndMonth(@Param("profileId") Long profileId,
                                               @Param("month") String month);*/

    @Query("SELECT t FROM Task t WHERE t.profile.profile.idp = :profileId AND SUBSTRING(t.datte, 4, 7) = :monthYear")
    List<Task> findByMonthAndProfile(@Param("monthYear")String monthYear,@Param("profileId") Long profileId);

    @Query("SELECT new tn.ey.timesheetclient.timesheet.dto.TaskWithProjectIdDTO(t.id, t.datte, t.nbJour, t.text, t.workPlace, pr.idproject) " +
            "FROM Task t " +
            "JOIN t.profile p " +
            "JOIN p.project pr " +
            "WHERE t.profile.profile.idp = :profileId " +
            "AND SUBSTRING(t.datte, 4, 7) = :monthYear")
    List<TaskWithProjectIdDTO> findByMonthAndProfilee(@Param("monthYear") String monthYear, @Param("profileId") Long profileId);

    @Query("SELECT SUM(t.nbJour) FROM Task t WHERE t.datte = :datte AND t.profile.id = :id")
    Double sumNbJourByDatte(String datte,Long id);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.profile.project.idproject = :projectId AND t.profile.profile.idp = :profileId")
    Integer countTasksByProjectIdAndProfileId(@Param("projectId") Long projectId, @Param("profileId") Long profileId);
    
    @Query("SELECT SUM(t.nbJour) FROM Task t WHERE t.profile.project.idproject = :projectId AND t.profile.profile.idp = :profileId")
    Double sumTaskDaysByProjectIdAndProfileId(@Param("projectId") Long projectId, @Param("profileId") Long profileId);

    @Query("SELECT t FROM Task t WHERE t.profile.project.idproject = :projectId AND SUBSTRING(t.datte, 4, 7) = :monthYear")
    List<Task> findTasksByProjectIdAndMonthYear(@Param("projectId") Long projectId, @Param("monthYear") String monthYear);

    List<Task> findByProfile(ProjectProfile profile);
}
