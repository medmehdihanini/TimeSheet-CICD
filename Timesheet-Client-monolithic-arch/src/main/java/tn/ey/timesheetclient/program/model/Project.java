package tn.ey.timesheetclient.program.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import tn.ey.timesheetclient.user.model.User;

import java.io.Serializable;

@Entity
@Table(name = "_project")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Project implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    Long idproject;
    
    String name;
    String description;
    
    @Builder.Default
    boolean state = true;
    
    @Lob
    @Column(length = Integer.MAX_VALUE, nullable = true)
    private byte[] image;
    
    @Enumerated(EnumType.STRING)
    Status status;

    @ManyToOne(fetch = FetchType.LAZY)
    User chefprojet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_idprog", nullable = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Program program;
    
    // Removed bidirectional collection:
    // - projectProfiles: will be queried via ProjectProfileRepository when needed
    // This eliminates the circular dependency: Project -> ProjectProfile -> Project
    
    // Note: The @PreRemove method is no longer needed since we removed the bidirectional collections
    // Cascade operations will be handled at the repository/service level
}
