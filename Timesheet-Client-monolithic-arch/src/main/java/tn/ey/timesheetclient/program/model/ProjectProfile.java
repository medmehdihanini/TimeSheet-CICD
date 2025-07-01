package tn.ey.timesheetclient.program.model;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import tn.ey.timesheetclient.profile.model.Profile;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name= "project_profile")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectProfile implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    Long id;
    Double mandaybudget;    @Builder.Default
    Double consumedmandaybudget = 0.0;

    // Keep unidirectional references to both Project and Profile
    // This allows us to navigate from ProjectProfile to both entities
    // but eliminates the circular dependencies
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "project_id")
    Project project;

    @ManyToOne
    @JoinColumn(name = "profile_id")
    Profile profile;

    // Removed bidirectional collections:
    // - tasks: will be queried via TaskRepository when needed
    // - timesheets: will be queried via TimesheetRepository when needed
    // This eliminates circular dependencies: ProjectProfile -> Task -> ProjectProfile
    // and ProjectProfile -> Timesheet -> ProjectProfile

}
