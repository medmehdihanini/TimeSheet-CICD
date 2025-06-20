package tn.ey.timesheetclient.timesheet.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.timesheet.model.Status;
import tn.ey.timesheetclient.timesheet.model.Timesheet;

import java.util.List;
import java.util.Optional;

public interface TimesheetDao extends JpaRepository<Timesheet,Long> {

    Optional<Timesheet> findByMoisAndYearAndProjectprofile_Id(String mois, String year, Long idpp);
    @Query("SELECT t FROM Timesheet t WHERE t.projectprofile.project.idproject = :projectId")
    List<Timesheet> findAllByProjectProfileProjectId(Long projectId);

    @Query("SELECT t FROM Timesheet t WHERE t.projectprofile.project.idproject = :projectId AND t.status= :status")
    List<Timesheet> findAllByProjectProfileProjectIdAnsStatus(Long projectId,Status status);
    @Query("SELECT t FROM Timesheet t WHERE t.mois = :nuMonth And t.year= :year And t.projectprofile.profile.idp= :profild")
    List<Timesheet> findByMonthnumber(String nuMonth,String year,Long profild);

    List<Timesheet> findByProjectprofile_Id(Long id);


    @Query("SELECT t FROM Timesheet t JOIN t.projectprofile pp JOIN pp.project p WHERE p.program = :program")
    List<Timesheet> findByProjectProfile_Project_Program(@Param("program") Program program);


}
