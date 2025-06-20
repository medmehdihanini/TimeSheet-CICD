package tn.ey.timesheetclient.Activite_Dic.Services;

import org.springframework.http.ResponseEntity;
import tn.ey.timesheetclient.Activite_Dic.model.Categorie;

public interface CategorieService {
    ResponseEntity<?> createCategorie(Categorie categorie);
    ResponseEntity<?> updateCategorie(Long id, Categorie categorie);
    ResponseEntity<?> deleteCategorie(Long id);
    ResponseEntity<?> getCategorie(Long id);
    ResponseEntity<?> getAllCategories();
}
