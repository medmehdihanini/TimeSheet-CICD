package tn.ey.timesheetclient.profile.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.ey.timesheetclient.profile.model.Profilefunction;
import tn.ey.timesheetclient.profile.model.Profile;

import java.util.List;

public interface profileDao extends JpaRepository<Profile,Long> {
    Profile findByEmail(String email);
    List<Profile> findByPfunction(Profilefunction function);

}
