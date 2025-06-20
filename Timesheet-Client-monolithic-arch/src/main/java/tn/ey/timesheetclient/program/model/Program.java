package tn.ey.timesheetclient.program.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.user.model.User;

import java.io.Serializable;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name= "_program")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Program implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    Long idprog;
    Long numcontrat;
    String name;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    Status status = Status.UNLAUNCHED;
    
    String Client;
    String startdate;
    String enddate;
    Date launchedat;
    
    @Lob
    @Column(length = Integer.MAX_VALUE, nullable = true)
    private byte[] image;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    User chefprogram;

    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ProgramProfile> programProfiles = new HashSet<>();

    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Project> projects = new HashSet<>();

    @PreRemove
    private void preRemove() {
        // Handle program profiles
        for (ProgramProfile pp : new HashSet<>(programProfiles)) {
            if (pp.getProfile() != null) {
                // Return manday budget to profile
                Profile profile = pp.getProfile();
                profile.setMandaybudget(profile.getMandaybudget() + pp.getMandaybudget());
                pp.setProfile(null);
            }
            pp.setProgram(null);
        }
        programProfiles.clear();

        // Handle projects
        for (Project project : new HashSet<>(projects)) {
            // Clear project references
            project.setChefprojet(null);
            project.setProgram(null);
        }
        projects.clear();
        chefprogram = null;
    }
}
