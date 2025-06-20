package tn.ey.timesheetclient.Activite_Dic.Services;


import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import tn.ey.timesheetclient.Activite_Dic.dao.CategorieRepository;
import tn.ey.timesheetclient.Activite_Dic.model.Categorie;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class CategorieServiceImpl implements CategorieService {

    private final CategorieRepository categorieDao;

    @Override
    public ResponseEntity<?> createCategorie(Categorie categorie) {
        try {
            // Check if a category with the same name already exists
            if (categorieDao.existsByName(categorie.getName())) {
                return ResponseEntity.badRequest().body("Une catégorie avec ce nom existe déjà");
            }

            Categorie savedCategorie = categorieDao.save(categorie);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCategorie);
        } catch (Exception e) {
            log.error("Erreur lors de la création de la catégorie", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la création de la catégorie: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> updateCategorie(Long id, Categorie categorie) {
        try {
            // Check if the category exists
            Optional<Categorie> existingCategorie = categorieDao.findById(id);
            if (existingCategorie.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Catégorie non trouvée");
            }

            // Check if the name is already used by another category
            if (!existingCategorie.get().getName().equals(categorie.getName()) &&
                    categorieDao.existsByName(categorie.getName())) {
                return ResponseEntity.badRequest().body("Une catégorie avec ce nom existe déjà");
            }

            // Update the category
            Categorie categorieToUpdate = existingCategorie.get();
            categorieToUpdate.setName(categorie.getName());

            Categorie updatedCategorie = categorieDao.save(categorieToUpdate);
            return ResponseEntity.ok(updatedCategorie);
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour de la catégorie", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la mise à jour de la catégorie: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> deleteCategorie(Long id) {
        try {
            // Check if the category exists
            if (!categorieDao.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Catégorie non trouvée");
            }

            categorieDao.deleteById(id);
            return ResponseEntity.ok("Catégorie supprimée avec succès");
        } catch (Exception e) {
            log.error("Erreur lors de la suppression de la catégorie", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la suppression de la catégorie: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> getCategorie(Long id) {
        try {
            Categorie categorie =categorieDao.findById(id).orElse(null);
            if(categorie == null) {
                return ResponseEntity.badRequest().body("categorie non trouvé !!!!");
            }
            return ResponseEntity.ok(categorie);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de la catégorie", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération de la catégorie: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> getAllCategories() {
        try {
            List<Categorie> categories = categorieDao.findAll();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des catégories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des catégories: " + e.getMessage());
        }
    }
}
