package tn.ey.timesheetclient.Activite_Dic.Controller;


import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.ey.timesheetclient.Activite_Dic.Services.ActiviteDictionnaireService;
import tn.ey.timesheetclient.Activite_Dic.model.ActiviteDictionnaire;

@RestController
@RequestMapping("/api/activites-dictionnaire")
@AllArgsConstructor
public class ActiviteDictionnaireController {

    private final ActiviteDictionnaireService activiteDictionnaireService;



    @PostMapping("/categorie/{categorieId}")
    public ResponseEntity<?> createActiviteDictionnaireWithCategorie(
            @PathVariable Long categorieId,
            @RequestBody ActiviteDictionnaire activiteDictionnaire) {
        return activiteDictionnaireService.createActiviteDictionnaire(categorieId, activiteDictionnaire);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateActiviteDictionnaire(
            @PathVariable Long id,
            @RequestBody ActiviteDictionnaire activiteDictionnaire) {
        return activiteDictionnaireService.updateActiviteDictionnaire(id, activiteDictionnaire);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteActiviteDictionnaire(@PathVariable Long id) {
        return activiteDictionnaireService.deleteActiviteDictionnaire(id);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getActiviteDictionnaire(@PathVariable Long id) {
        return activiteDictionnaireService.getActiviteDictionnaire(id);
    }

    @GetMapping
    public ResponseEntity<?> getAllActiviteDictionnaires() {
        return activiteDictionnaireService.getAllActiviteDictionnaires();
    }

    @GetMapping("/categorie/{categorieId}")
    public ResponseEntity<?> getActiviteDictionnairesByCategorie(@PathVariable Long categorieId) {
        return activiteDictionnaireService.getActiviteDictionnairesByCategorie(categorieId);
    }
}
