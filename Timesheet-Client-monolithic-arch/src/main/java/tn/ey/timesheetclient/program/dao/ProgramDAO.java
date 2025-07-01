package tn.ey.timesheetclient.program.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.program.model.ProgramProjection;
import tn.ey.timesheetclient.program.model.Status;

import java.util.List;

public interface ProgramDAO extends JpaRepository<Program,Long> {
    Program findByNumcontrat(Long number);
    List<Program> findByChefprogram_Id(Long idchef);
    List<Program> findByStatusAndChefprogramId(Status status, Long chefprogramId);
    List<Program> findByChefprogramIdAndStatusIn(Long chefprogramId,List<Status> statuses);    @Query("SELECT p.idprog AS idprog, p.numcontrat AS numcontrat, p.name AS name, p.status AS status, p.launchedat AS launchedat, p.image AS image " +
            "FROM Program p " +
            "WHERE p.chefprogram.id = :idc AND p.status IN :statuses")
    List<ProgramProjection> findProgramsByStatuses(Long idc,List<Status> statuses);

    long deleteByNumcontrat(Long numcontrat);    @Modifying
    @Query("DELETE FROM Program p WHERE p.idprog = :id")
    void deleteById(@Param("id") @NonNull Long id);

}
