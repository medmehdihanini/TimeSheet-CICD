package tn.ey.timesheetclient.profile.model;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name= "_profile")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Profile implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    Long idp;
    String firstname;
    String lastname;
    @Enumerated(EnumType.STRING)
    Profilefunction pfunction;
    @Enumerated(EnumType.STRING)
    Departement departement;
    String email;
    BigDecimal dailyrate;
    Double mandaybudget;
    @Lob
    @Column(length = Integer.MAX_VALUE, nullable = true)
    private byte[] image;

    // Removed bidirectional collections - these will be queried via repositories when needed
    // This eliminates the circular dependency: Profile -> ProgramProfile -> Program -> ProgramProfile -> Profile
    // and Profile -> ProjectProfile -> Project -> ProjectProfile -> Profile

}
