package tn.ey.timesheetclient.user.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.ey.timesheetclient.user.model.Role;
import tn.ey.timesheetclient.user.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findUserByEmail(String email);

    List<User> findByRole(Role role);
    
    @Query("SELECT u FROM User u WHERE u.profile.idp = :profileId")
    User findByProfile_Idp(@Param("profileId") Long profileId);
}

