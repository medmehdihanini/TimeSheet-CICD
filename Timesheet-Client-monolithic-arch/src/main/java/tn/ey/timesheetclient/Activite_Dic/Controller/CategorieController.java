package tn.ey.timesheetclient.Activite_Dic.Controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.ey.timesheetclient.Activite_Dic.Services.CategorieService;
import tn.ey.timesheetclient.Activite_Dic.model.Categorie;

@RestController
@RequestMapping("/api/categories")
@AllArgsConstructor
public class CategorieController {

    private final CategorieService categorieService;

    @PostMapping
    public ResponseEntity<?> createCategorie(@RequestBody Categorie categorie) {
        return categorieService.createCategorie(categorie);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategorie(@PathVariable Long id, @RequestBody Categorie categorie) {
        return categorieService.updateCategorie(id, categorie);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategorie(@PathVariable Long id) {
        return categorieService.deleteCategorie(id);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCategorie(@PathVariable Long id) {
        return categorieService.getCategorie(id);
    }

    @GetMapping
    public ResponseEntity<?> getAllCategories() {
        return categorieService.getAllCategories();
    }
}