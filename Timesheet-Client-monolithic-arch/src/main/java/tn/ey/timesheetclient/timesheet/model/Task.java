package tn.ey.timesheetclient.timesheet.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import tn.ey.timesheetclient.program.model.ProjectProfile;

import java.io.Serializable;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name= "_task")
public class Task implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    Long id;

    String datte;
    Double  nbJour ;
    String text;
    String workPlace;

    @JsonIgnore
    @ManyToOne
    ProjectProfile profile;
}
