package tn.ey.timesheetclient.program.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.timesheet.model.Task;
import tn.ey.timesheetclient.timesheet.model.Timesheet;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

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
    Double mandaybudget;

    @Builder.Default
    Double consumedmandaybudget = 0.0;

    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE) // Add this
    @JoinColumn(name = "project_id")
    Project project;

    @ManyToOne
    @JoinColumn(name = "profile_id")
    Profile profile;

    @Builder.Default
    @JsonIgnore
    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    Set<Task> tasks = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "projectprofile", cascade = CascadeType.ALL, orphanRemoval = true)
    Set<Timesheet> timesheets = new HashSet<>();


}
