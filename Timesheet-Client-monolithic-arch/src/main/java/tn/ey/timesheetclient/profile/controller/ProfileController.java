package tn.ey.timesheetclient.profile.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.service.ProfileService;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.Logs.services.LogService;

import java.util.List;


@RestController
@RequestMapping("/api/v1/profile")
@AllArgsConstructor
public class ProfileController {

    private final ProfileService profileservice;
    private final LogService logService;
    private final profileDao _profileDao;

    @PostMapping("/addprofile")
    public ResponseEntity<?> addProfile(@RequestBody Profile p) {
        ResponseEntity<?> response = profileservice.createProfile(p);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Nouveau profil créé: " + p.getFirstname() + " " + p.getLastname());
        }
        return response;
    }

    @PutMapping("/addImageToProfile/{idp}")
    public ResponseEntity<?> addImageToPicture(@RequestParam("image") MultipartFile image, @PathVariable Long idp) {
        Profile profile = _profileDao.findById(idp).orElse(null);
        String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
        
        ResponseEntity<?> response = profileservice.addProfileImage(image, idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Image ajoutée au profil de " + profileName);
        }
        return response;
    }

    @PutMapping("/modifyProfile/{idp}")
    public ResponseEntity<?> modifyProfile(@RequestBody Profile p, @PathVariable Long idp) {
        ResponseEntity<?> response = profileservice.updateProfile(p, idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Profil mis à jour: " + p.getFirstname() + " " + p.getLastname());
        }
        return response;
    }

    @DeleteMapping("/deleteProfile/{idp}")
    public ResponseEntity<?> deleteProfile(@PathVariable Long idp) {
        Profile profile = _profileDao.findById(idp).orElse(null);
        String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
        
        ResponseEntity<?> response = profileservice.deleteProfile(idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Profil supprimé: " + profileName);
        }
        return response;
    }

    // Read-only operations don't need logging
    @GetMapping("/getAllProfiles")
    public ResponseEntity<?> getAllProfiles() {
        return profileservice.getAllProfiles();
    }

    @GetMapping("/getOneProfile/{idp}")
    public ResponseEntity<?> getOneP(@PathVariable Long idp) {
        return profileservice.getOneProfile(idp);
    }

    @GetMapping("/getAllProjectManagers")
    public List<Profile> getAllProjectManagers() {
        return profileservice.getProjectManagers();
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<?> getProfileStats(@PathVariable Long id) {
        Profile profile = _profileDao.findById(id).orElse(null);
        String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
        
        ResponseEntity<?> response = profileservice.getProfileStats(id);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Statistiques consultées pour le profil " + profileName);
        }
        return response;
    }
}
