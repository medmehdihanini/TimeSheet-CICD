package tn.ey.timesheetclient.program.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.ey.timesheetclient.program.model.Project;

import java.util.List;

public interface ProjectDao extends JpaRepository<Project,Long> {
    List<Project> findByProgram_Idprog(Long idproject);
    void deleteByIdproject(Long idproject);

    List<Project> findByChefprojetId(Long chefprojetId);    @Query("SELECT p FROM Project p WHERE p.program.chefprogram.id = :chefProgramId")
    List<Project> findAllByChefProgramId(Long chefProgramId);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.projectProfiles pp LEFT JOIN FETCH pp.profile")
    List<Project> findAllWithProjectProfiles();


}
