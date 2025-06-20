package tn.ey.timesheetclient.Activite_Dic.Services;


import org.springframework.http.ResponseEntity;
import tn.ey.timesheetclient.Activite_Dic.model.ActiviteDictionnaire;

public interface ActiviteDictionnaireService {
    ResponseEntity<?> createActiviteDictionnaire(Long categorieId, ActiviteDictionnaire activiteDictionnaire);
    ResponseEntity<?> updateActiviteDictionnaire(Long id, ActiviteDictionnaire activiteDictionnaire);
    ResponseEntity<?> deleteActiviteDictionnaire(Long id);
    ResponseEntity<?> getActiviteDictionnaire(Long id);
    ResponseEntity<?> getAllActiviteDictionnaires();
    ResponseEntity<?> getActiviteDictionnairesByCategorie(Long categorieId);
}
