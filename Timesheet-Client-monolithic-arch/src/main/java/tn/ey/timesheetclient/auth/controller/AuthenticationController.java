package tn.ey.timesheetclient.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.ey.timesheetclient.auth.dto.AuthenticationRequest;
import tn.ey.timesheetclient.auth.dto.AuthenticationResponse;
import tn.ey.timesheetclient.auth.dto.ChangePasswordRequest;
import tn.ey.timesheetclient.auth.dto.PasswordResetRequest;
import tn.ey.timesheetclient.auth.service.AuthenticationService;
import tn.ey.timesheetclient.auth.dto.RegisterRequest;
import tn.ey.timesheetclient.Logs.services.LogService;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;

@CrossOrigin(origins = "http://13.74.191.237:8085")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;
    private final LogService logService;
    private final profileDao _profileDao;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        ResponseEntity<?> response = service.register(request);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Nouvel utilisateur enregistré: " + request.getEmail());
        }
        return response;
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        ResponseEntity<AuthenticationResponse> response = ResponseEntity.ok(service.authenticate(request));
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Utilisateur authentifié: " + request.getEmail());
        }
        return response;
    }

    @PostMapping("/registerwithprofile/{idp}")
    public ResponseEntity<?> registerwithprofile(@PathVariable Long idp) {
        Profile profile = _profileDao.findById(idp).orElse(null);
        String profileName = profile != null ? profile.getFirstname() + " " + profile.getLastname() : "Profil inconnu";
        
        ResponseEntity<?> response = service.createAccountFromProfile(idp);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Compte créé à partir du profil: " + profileName);
        }
        return response;
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        ResponseEntity<?> response = service.changePassword(request);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Mot de passe modifié pour: " + request.getEmail());
        }
        return response;
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequest request) {
        ResponseEntity<?> response = service.resetPassword(request);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Réinitialisation du mot de passe pour: " + request.getEmail());
        }
        return response;
    }
}
