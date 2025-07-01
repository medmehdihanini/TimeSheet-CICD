package tn.ey.timesheetclient.timesheet.model;

import jakarta.persistence.*;
import lombok.*;
import tn.ey.timesheetclient.program.model.ProjectProfile;

import java.io.Serializable;

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

    // Keep unidirectional reference to ProjectProfile
    // This allows Task to know its ProjectProfile but eliminates circular dependency
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")
    ProjectProfile profile;
}
