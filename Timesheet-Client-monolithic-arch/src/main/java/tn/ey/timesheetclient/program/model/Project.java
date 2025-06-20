package tn.ey.timesheetclient.program.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.springframework.scheduling.config.Task;

import tn.ey.timesheetclient.timesheet.model.Timesheet;
import tn.ey.timesheetclient.user.model.User;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

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
    @OnDelete(action = OnDeleteAction.CASCADE) // This is the magic line
    private Program program;
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ProjectProfile> projectProfiles = new HashSet<>();    @PreRemove
    private void clearReferences() {
        // Handle project profiles first
        for (ProjectProfile profile : new HashSet<>(projectProfiles)) {
            // Handle tasks
            for (tn.ey.timesheetclient.timesheet.model.Task task : new HashSet<>(profile.getTasks())) {
                task.setProfile(null);
            }
            profile.getTasks().clear();
            
            // Handle timesheets
            for (Timesheet timesheet : new HashSet<>(profile.getTimesheets())) {
                timesheet.setProjectprofile(null);
            }
            profile.getTimesheets().clear();
            
            // Clear profile references
            profile.setProject(null);
            profile.setProfile(null);
        }
        projectProfiles.clear();
        
        // Clear program reference
        if (program != null) {
            program.getProjects().remove(this);
            program = null;
        }
        
        // Clear chef projet reference
        chefprojet = null;
        
        // Note: Chat room references are managed in the ProjectServiceImpl.deleteOneProject method
        // since we can't access ChatRoom entities directly from this entity
    }
}
