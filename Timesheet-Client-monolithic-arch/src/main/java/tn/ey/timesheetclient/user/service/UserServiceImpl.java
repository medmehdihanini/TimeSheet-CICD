package tn.ey.timesheetclient.user.service;

import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.ChatRoom.dao.ChatRoomRepository;
import tn.ey.timesheetclient.ChatRoom.Model.ChatRoom;
import tn.ey.timesheetclient.user.dao.UserRepository;
import tn.ey.timesheetclient.user.model.Role;
import tn.ey.timesheetclient.user.model.User;
import java.util.Collections;

import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserServiceImpl implements UserService {    private final UserRepository _userDao;
    private final profileDao _profileDao;
    private final ProjectDao _projectDao;
    private final ChatRoomRepository _chatRoomRepository;

    @Override
    public ResponseEntity<?> retrieveUserByEmail(String email) {
        try {
            User u = _userDao.findUserByEmail(email).orElse(null);
            if (u == null)// Email is Unique
            {
                return ResponseEntity.badRequest().body("L'email n'existe pas !!!");
            }
            return ResponseEntity.ok(u);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récupération de l'utilisateur");
        }
    }

    @Override
    public ResponseEntity<?> addImageToUser(MultipartFile image, Long idp) {
        try{
            User u=_userDao.findById(idp).orElse(null);
            if(u ==null){
                return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
            }
            byte[] bytes = image.getBytes();
            //Blob blob = new javax.sql.rowset.serial.SerialBlob(bytes);
            u.setImage(bytes);
            _userDao.save(u);
            return ResponseEntity.status(HttpStatus.CREATED).body(u);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récupérationde l'image de l'utilisateur");
        }
    }

    @Override
    public ResponseEntity<?> getAllUserss() {
        try{
            List<User> users=_userDao.findAll();
            return ResponseEntity.ok(users);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récupération des utilisateur");
        }
    }

    @Override
    public ResponseEntity<?> getAllUsersById(Long idu) {
        try{
            User u=_userDao.findById(idu).orElse(null);
            if(u ==null){
                return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
            }
            return ResponseEntity.ok(u);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la récupération de l'utilisateur");
        }
    }

    @Override
    public ResponseEntity<?> updateUser(Long idu, User u) {
        try{
            User nu=_userDao.findById(idu).orElse(null);
            if(u ==null){
                return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
            }
            if (nu != null) {
                nu.setFirstname(u.getFirstname());
                nu.setLastname(u.getLastname());
                nu.setEmail(u.getEmail());
                nu.setRole(u.getRole());
                _userDao.save(nu);
            }
            return ResponseEntity.ok(u);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la modification de l'utilisateur");
        }
    }    @Override
    public ResponseEntity<?> deleteUser(Long idu) {
        try{
            User u=_userDao.findById(idu).orElse(null);
            if(u ==null){
                return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
            }
            
            // First, remove user from all projects where they are the project manager
            List<Project> projects = _projectDao.findByChefprojetId(idu);
            for (Project project : projects) {
                project.setChefprojet(null);
                _projectDao.save(project);
            }
            
            // Second, handle chat rooms created by this user
            List<ChatRoom> chatRooms = _chatRoomRepository.findByCreator_Id(idu);
            for (ChatRoom chatRoom : chatRooms) {
                chatRoom.setCreator(null);
                _chatRoomRepository.save(chatRoom);
            }
            
            _userDao.deleteById(idu);
            return ResponseEntity.ok(null);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la suppression de l'utilisateur: " + e.getMessage());
        }
    }

    @Override
    public List<User> getProjectManagers() {
        return _userDao.findByRole(Role.PROJECT_MANAGER);
    }

    @Override
    public ResponseEntity<?> getMatchingProfileId(Long userId) {
        try {
            // Get the user by ID
            User user = _userDao.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body("L'utilisateur n'existe pas");
            }
            
            // Get all profiles and filter by matching criteria
            List<Profile> profiles = _profileDao.findAll();
            Profile matchingProfile = profiles.stream()
                .filter(profile -> 
                    profile.getFirstname().equals(user.getFirstname()) && 
                    profile.getLastname().equals(user.getLastname()) && 
                    profile.getEmail().equals(user.getEmail()))
                .findFirst()
                .orElse(null);
            
            if (matchingProfile == null) {
                return ResponseEntity.badRequest().body("Aucun profil correspondant trouvé");
            }
            
    return ResponseEntity.ok().body(Collections.singletonMap("idp", matchingProfile.getIdp()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de la recherche du profil correspondant");
        }
    }
}
