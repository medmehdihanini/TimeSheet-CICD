package tn.ey.timesheetclient.ChatRoom.Model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.user.model.User;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name= "chat_room")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatRoom implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    long id;
    
    String name;
    
    @Column(nullable = true)
    String description;
    
    @Column(name = "created_date")
    LocalDateTime createdDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    User creator;    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    Project project;
    
    @Builder.Default
    @ManyToMany
    @JoinTable(
        name = "chat_room_members",
        joinColumns = @JoinColumn(name = "chat_room_id"),
        inverseJoinColumns = @JoinColumn(name = "profile_id")
    )
    Set<Profile> members = new HashSet<>();
    
    @Builder.Default
    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    List<ChatMessage> messages = new ArrayList<>();
    
    public void addMember(Profile profile) {
        members.add(profile);
    }
    
    public void removeMember(Profile profile) {
        members.remove(profile);
    }
}