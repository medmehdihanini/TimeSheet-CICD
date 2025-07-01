package tn.ey.timesheetclient.program.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.ey.timesheetclient.program.model.Project;

import java.util.List;

public interface ProjectDao extends JpaRepository<Project,Long> {
    List<Project> findByProgram_Idprog(Long idproject);
    void deleteByIdproject(Long idproject);

    List<Project> findByChefprojetId(Long chefprojetId);
    
    @Query("SELECT p FROM Project p WHERE p.program.chefprogram.id = :chefProgramId")
    List<Project> findAllByChefProgramId(Long chefProgramId);

    // Removed findAllWithProjectProfiles() method as projectProfiles collection no longer exists
    // Use findAll() and ProjectProfileDao.findProjectProfilesByProjectId() separately if needed

}
