package tn.ey.timesheetclient.user.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.user.dao.UserRepository;
import tn.ey.timesheetclient.user.model.User;
import tn.ey.timesheetclient.user.service.UserService;
import tn.ey.timesheetclient.Logs.services.LogService;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Paths;
import java.util.List;


@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userservice;
    private final UserRepository _userDao;
    private final LogService logService;

    @Value("${upoadDir}")
    private String uploadFolder;

    @GetMapping("/getUserByEmail/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        return userservice.retrieveUserByEmail(email);
    }

    @PutMapping("/addImageToUser/{idp}")
    public ResponseEntity<?> addImageToProject(Model model, HttpServletRequest request, final @RequestParam("image") MultipartFile file, @PathVariable Long idp) {
        try {
            User u = _userDao.findById(idp).orElse(null);
            if(u == null) {
                return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
            }
            
            String userName = u.getFirstname() + " " + u.getLastname();
            String uploadDirectory = request.getServletContext().getRealPath(uploadFolder);
            String fileName = file.getOriginalFilename();
            String filePath = Paths.get(uploadDirectory, fileName).toString();

            if (fileName == null || fileName.contains("..")) {
                return ResponseEntity.badRequest().body("Désolé! Le nom de fichier contient une séquence de chemin invalide " + fileName);
            }
            
            try {
                File dir = new File(uploadDirectory);
                if (!dir.exists()) {
                    dir.mkdirs();
                }
                BufferedOutputStream stream = new BufferedOutputStream(new FileOutputStream(new File(filePath)));
                stream.write(file.getBytes());
                stream.close();
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement du fichier");
            }
            
            byte[] imageData = file.getBytes();
            u.setImage(imageData);
            _userDao.save(u);
            logService.logAction("Image ajoutée à l'utilisateur: " + userName);
            return ResponseEntity.status(HttpStatus.CREATED).body(u);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur lors du traitement du téléchargement de l'image");
        }
    }

    @GetMapping("/getAllUsers")
    public ResponseEntity<?> getAllUsers() {
        return userservice.getAllUserss();
    }

    @GetMapping("/getUserById/{idu}")
    public ResponseEntity<?> getUserById(@PathVariable Long idu) {
        return userservice.getAllUsersById(idu);
    }

    @PutMapping("/updateUser/{idu}")
    public ResponseEntity<?> updateUSer(@PathVariable Long idu, @RequestBody User u) {
        ResponseEntity<?> response = userservice.updateUser(idu, u);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Utilisateur mis à jour: " + u.getFirstname() + " " + u.getLastname());
        }
        return response;
    }

    @DeleteMapping("/deleteUser/{idu}")
    public ResponseEntity<?> deleteUserById(@PathVariable Long idu) {
        User user = _userDao.findById(idu).orElse(null);
        String userName = user != null ? user.getFirstname() + " " + user.getLastname() : "Utilisateur inconnu";
        
        ResponseEntity<?> response = userservice.deleteUser(idu);
        if (response.getStatusCode().is2xxSuccessful()) {
            logService.logAction("Utilisateur supprimé: " + userName);
        }
        return response;
    }

    @GetMapping("/getAllProjectManagers")
    public List<User> getAllProjectManagers() {
        return userservice.getProjectManagers();
    }

    @GetMapping("/getMatchingProfileId/{userId}")
    public ResponseEntity<?> getMatchingProfileId(@PathVariable Long userId) {
        ResponseEntity<?> response = userservice.getMatchingProfileId(userId);
        return response;
    }
}
