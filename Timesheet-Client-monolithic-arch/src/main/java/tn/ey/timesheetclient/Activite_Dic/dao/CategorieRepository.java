package tn.ey.timesheetclient.Activite_Dic.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.ey.timesheetclient.Activite_Dic.model.Categorie;


public interface CategorieRepository extends JpaRepository<Categorie, Long> {
    boolean existsByName(String name);
}