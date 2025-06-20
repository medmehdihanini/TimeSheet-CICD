package tn.ey.timesheetclient.Logs.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.ey.timesheetclient.Logs.model.Log;

import java.util.List;
import java.util.Set;

@Repository
public interface LogRepository extends JpaRepository<Log, Long> {
    List<Log> findByProgramIdprogOrProjectProgramIdprog(Long programId, Long programIdFromProject);
    List<Log> findByProjectIdproject(Long projectId);
    
    @Modifying
    @Query("DELETE FROM Log l WHERE l.project.idproject IN :projectIds")
    void deleteByProjectIdIn(Set<Long> projectIds);
    
    @Modifying
    @Query("DELETE FROM Log l WHERE l.program.idprog = :programId")
    void deleteByProgramId(Long programId);
}