package tn.ey.timesheetclient.program.model;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import tn.ey.timesheetclient.profile.model.Profile;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name= "program_profile")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProgramProfile implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    Long id;

    String functionn;

    // Keep unidirectional references to both Program and Profile
    // This allows us to navigate from ProgramProfile to both entities
    // but eliminates the circular dependencies
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id", nullable = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Program program;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = true)
    Profile profile;

    Double mandaybudget;
    BigDecimal dailyrate;

    @Builder.Default
    Double consumedmandaybudget = 0.0;

}
