package tn.ey.timesheetclient.Activite_Dic.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.ey.timesheetclient.Activite_Dic.model.ActiviteDictionnaire;

import java.util.List;

public interface ActiviteDictionnaireRepository extends JpaRepository<ActiviteDictionnaire, Long> {
    List<ActiviteDictionnaire> findByCategorieId(Long categorieId);
}