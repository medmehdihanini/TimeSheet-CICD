package tn.ey.timesheetclient.profile.service;

import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.profile.model.Profile;

import java.util.List;

public interface ProfileService {
    ResponseEntity<?> createProfile(Profile p);
    ResponseEntity<?> addProfileImage(MultipartFile file,Long idp);
    ResponseEntity<?> updateProfile(Profile p,Long idp);
    ResponseEntity<?> getAllProfiles();
    ResponseEntity<?> deleteProfile(Long idp);
    ResponseEntity<?> getOneProfile(Long idp);
    List<Profile> getProjectManagers();
    ResponseEntity<?>getProfileStats(Long profileId);

}
