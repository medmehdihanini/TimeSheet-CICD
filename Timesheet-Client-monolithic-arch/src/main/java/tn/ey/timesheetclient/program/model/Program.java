package tn.ey.timesheetclient.program.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import tn.ey.timesheetclient.user.model.User;

import java.io.Serializable;
import java.util.Date;

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

    // Removed bidirectional collections:
    // - programProfiles: will be queried via ProgramProfileRepository when needed
    // - projects: will be queried via ProjectRepository when needed
    // This eliminates circular dependencies while maintaining all necessary relationships

}
