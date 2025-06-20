package tn.ey.timesheetclient.auth.service;
import lombok.RequiredArgsConstructor;
import org.passay.CharacterData;
import org.passay.CharacterRule;
import org.passay.EnglishCharacterData;
import org.passay.PasswordGenerator;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tn.ey.timesheetclient.auth.dto.*;
import tn.ey.timesheetclient.config.JwtService;
import tn.ey.timesheetclient.mail.EmailHelperService;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.user.model.Role;
import tn.ey.timesheetclient.user.model.User;
import tn.ey.timesheetclient.user.dao.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthenticationService {    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailHelperService emailHelperService;
    private final profileDao _profileDao;


    //Password Generator

    public String generatePassayPassword() {
        PasswordGenerator gen = new PasswordGenerator();
        CharacterData lowerCaseChars = EnglishCharacterData.LowerCase;
        CharacterRule lowerCaseRule = new CharacterRule(lowerCaseChars);
        lowerCaseRule.setNumberOfCharacters(2);

        CharacterData upperCaseChars = EnglishCharacterData.UpperCase;
        CharacterRule upperCaseRule = new CharacterRule(upperCaseChars);
        upperCaseRule.setNumberOfCharacters(2);

        CharacterData digitChars = EnglishCharacterData.Digit;
        CharacterRule digitRule = new CharacterRule(digitChars);
        digitRule.setNumberOfCharacters(2);

        CharacterData specialChars = new CharacterData() {
            public String getErrorCode() {
                return "ERROR_CODE";
            }

            public String getCharacters() {
                return "!@#$%^&*()_+";
            }
        };
        CharacterRule splCharRule = new CharacterRule(specialChars);
        splCharRule.setNumberOfCharacters(2);

        return gen.generatePassword(10, splCharRule, lowerCaseRule,
                upperCaseRule, digitRule);

    }
    public ResponseEntity<?> register(RegisterRequest request) {
        try{
           /* if(!request.getEmail().endsWith("@tn.ey.com"))// Email belong to EY domain
            {
                return ResponseEntity.badRequest().body("Email doesn't belong to EY Tunisia !!!!");
            }*/
        if(repository.findUserByEmail(request.getEmail()).isPresent())// Email is Unique
        {
            return ResponseEntity.badRequest().body("L'adresse e-mail existe déjà !!!!");
        }
            String pass = generatePassayPassword();
            var user = User.builder()
                    .firstname(request.getFirstname())
                    .lastname(request.getLastname())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(pass))
                    .role(request.getRole())
                    .build();        User u = repository.save(user);
            
            // Send welcome email using template
            System.out.println("--------------------------------------------");
            System.out.println("password:"+pass);
            System.out.println("--------------------------------------------");
            
            emailHelperService.sendWelcomeEmail(user.getEmail(), user.getFirstname(), user.getEmail(), pass);
            
            return  ResponseEntity.ok(u);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur de sauvegarde de l'utilisateur");
        }
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findUserByEmail(request.getEmail()).orElseThrow();// need to find the correct exception ,catch it , handle it and so
        var jwtToken = jwtService.generateToken(user);
        System.out.println(jwtToken);
        ConnectedUserDto connecteduser = new ConnectedUserDto();
        connecteduser.setId(user.getId());
        connecteduser.setFirstname(user.getFirstname());
        connecteduser.setLastname(user.getLastname());
        connecteduser.setEmail(user.getEmail());
        connecteduser.setRole(user.getRole());
        connecteduser.setImage(user.getImage());
        connecteduser.setPrograms(user.getPrograms());
        connecteduser.setProjects(user.getProjects());

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .connecteduser(connecteduser)
                .build();
    }


    public ResponseEntity<?> createAccountFromProfile(Long idp) {
        try {
            Profile p= _profileDao.findById(idp).orElse(null);//check profile existance
            if(p == null){
                return ResponseEntity.badRequest().body("Profil non trouvé !!!!");
            }

            if (repository.findUserByEmail(p.getEmail()).isPresent())//  check account existance
            {
                return ResponseEntity.badRequest().body("Le compte utilisateur existe déjà !!!!");
            }
            String pass = generatePassayPassword();
            RegisterRequest user=RegisterRequest.builder()
                    .firstname(p.getFirstname())
                    .lastname(p.getLastname())
                    .email(p.getEmail())
                    .role(Role.PROJECT_MANAGER)
                    .build();
            User u = repository.findUserByEmail(p.getEmail()).orElse(null);
            if (u == null)//  check account existence
            {
                synchronized(this) {
                ResponseEntity<?> res = this.register(user);
                User uu = (User) res.getBody();
                    if (uu != null && uu.getImage() != null) {
                        uu.setImage(p.getImage());
                    }
                    repository.save(uu);
            }
            }
            return  ResponseEntity.ok(user);
        }catch(Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la création du compte utilisateur");
        }
    }


    public ResponseEntity<?> changePassword(ChangePasswordRequest request) {
        try {
            // Find user by email
            var userOptional = repository.findUserByEmail(request.getEmail());
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body("Utilisateur non trouvé");
            }
            
            User user = userOptional.get();
            
            // Verify old password
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                return ResponseEntity.badRequest().body("L'ancien mot de passe est incorrect");
            }
            
            // Update password
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            repository.save(user);
            
            return ResponseEntity.ok("Mot de passe changé avec succès");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors du changement de mot de passe: " + e.getMessage());
        }
    }
    
    public ResponseEntity<?> resetPassword(PasswordResetRequest request) {
        try {
            // Find user by email
            var userOptional = repository.findUserByEmail(request.getEmail());
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body("Utilisateur non trouvé");
            }
            
            User user = userOptional.get();
              // Generate new password
            String newPassword = generatePassayPassword();
            
            // Update user password
            user.setPassword(passwordEncoder.encode(newPassword));
            repository.save(user);
            
            // Send password reset email using template
            emailHelperService.sendPasswordResetEmail(user.getEmail(), user.getFirstname(), user.getEmail(), newPassword);
            
            return ResponseEntity.ok("Un nouveau mot de passe a été envoyé à votre adresse e-mail");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de la réinitialisation du mot de passe: " + e.getMessage());
        }
    }
}
