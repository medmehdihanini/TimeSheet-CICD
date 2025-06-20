package tn.ey.timesheetclient.Activite_Dic.Services;


import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import tn.ey.timesheetclient.Activite_Dic.dao.ActiviteDictionnaireRepository;
import tn.ey.timesheetclient.Activite_Dic.dao.CategorieRepository;
import tn.ey.timesheetclient.Activite_Dic.model.ActiviteDictionnaire;
import tn.ey.timesheetclient.Activite_Dic.model.Categorie;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class ActiviteDictionnaireServiceImpl implements ActiviteDictionnaireService {

    private final ActiviteDictionnaireRepository activiteDictionnaireDao;
    private final CategorieRepository categorieDao;



    @Override
    public ResponseEntity<?> createActiviteDictionnaire(Long categorieId, ActiviteDictionnaire activiteDictionnaire) {
        try {
            // Check if the category exists
            Optional<Categorie> categorie = categorieDao.findById(categorieId);
            if (categorie.isEmpty()) {
                return ResponseEntity.badRequest().body("La catégorie spécifiée n'existe pas");
            }

            activiteDictionnaire.setCategorie(categorie.get());
            ActiviteDictionnaire savedActivite = activiteDictionnaireDao.save(activiteDictionnaire);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedActivite);
        } catch (Exception e) {
            log.error("Erreur lors de la création de l'activité dictionnaire", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la création de l'activité dictionnaire: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> updateActiviteDictionnaire(Long id, ActiviteDictionnaire activiteDictionnaire) {
        try {
            // Check if the activity exists
            Optional<ActiviteDictionnaire> existingActivite = activiteDictionnaireDao.findById(id);
            if (existingActivite.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activité dictionnaire non trouvée");
            }

            // Check if the category exists if it's being changed
            if (activiteDictionnaire.getCategorie() != null &&
                    activiteDictionnaire.getCategorie().getId() != null) {
                Optional<Categorie> categorie = categorieDao.findById(activiteDictionnaire.getCategorie().getId());
                if (categorie.isEmpty()) {
                    return ResponseEntity.badRequest().body("La catégorie spécifiée n'existe pas");
                }
                existingActivite.get().setCategorie(categorie.get());
            }

            // Update the description
            existingActivite.get().setDescription(activiteDictionnaire.getDescription());

            ActiviteDictionnaire updatedActivite = activiteDictionnaireDao.save(existingActivite.get());
            return ResponseEntity.ok(updatedActivite);
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour de l'activité dictionnaire", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la mise à jour de l'activité dictionnaire: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> deleteActiviteDictionnaire(Long id) {
        try {
            // Check if the activity exists
            if (!activiteDictionnaireDao.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activité dictionnaire non trouvée");
            }

            activiteDictionnaireDao.deleteById(id);
            return ResponseEntity.ok("Activité dictionnaire supprimée avec succès");
        } catch (Exception e) {
            log.error("Erreur lors de la suppression de l'activité dictionnaire", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la suppression de l'activité dictionnaire: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> getActiviteDictionnaire(Long id) {
        try {
            ActiviteDictionnaire activiteDictionnaire = activiteDictionnaireDao.findById(id).orElse(null);
            if (activiteDictionnaire == null) {
                return ResponseEntity.badRequest().body("Activité dictionnaire non trouvée");
            }
            return ResponseEntity.ok(activiteDictionnaire);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'activité dictionnaire", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération de l'activité dictionnaire: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> getAllActiviteDictionnaires() {
        try {
            List<ActiviteDictionnaire> activites = activiteDictionnaireDao.findAll();
            return ResponseEntity.ok(activites);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des activités dictionnaire", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des activités dictionnaire: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> getActiviteDictionnairesByCategorie(Long categorieId) {
        try {
            // Check if the category exists
            Optional<Categorie> categorie = categorieDao.findById(categorieId);
            if (categorie.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Catégorie non trouvée");
            }

            List<ActiviteDictionnaire> activites = activiteDictionnaireDao.findByCategorieId(categorieId);
            return ResponseEntity.ok(activites);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des activités dictionnaire par catégorie", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des activités dictionnaire par catégorie: " + e.getMessage());
        }
    }
}
