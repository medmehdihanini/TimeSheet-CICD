package tn.ey.timesheetclient.user.service;

import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.user.model.User;

import java.util.List;

public interface UserService {

    ResponseEntity<?> retrieveUserByEmail(String Email);
    ResponseEntity<?> addImageToUser(MultipartFile image, Long idp);
    ResponseEntity<?> getAllUserss();
    ResponseEntity<?> getAllUsersById(Long idu);
    ResponseEntity<?> updateUser(Long idu, User u);
    ResponseEntity<?> deleteUser(Long idu);
    List<User> getProjectManagers();
    ResponseEntity<?> getMatchingProfileId(Long userId);
}
