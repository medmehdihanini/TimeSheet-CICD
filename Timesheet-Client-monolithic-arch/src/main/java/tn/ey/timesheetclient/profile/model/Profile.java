package tn.ey.timesheetclient.profile.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import tn.ey.timesheetclient.program.model.ProgramProfile;
import tn.ey.timesheetclient.program.model.ProjectProfile;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

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

    @Builder.Default
    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<ProgramProfile> programProfiles = new HashSet<>();
    @Builder.Default
    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<ProjectProfile> projectProfiles = new HashSet<>();

}
