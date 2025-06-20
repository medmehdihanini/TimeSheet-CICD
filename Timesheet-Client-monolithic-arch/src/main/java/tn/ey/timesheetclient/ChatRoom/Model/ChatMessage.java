package tn.ey.timesheetclient.ChatRoom.Model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import tn.ey.timesheetclient.profile.model.Profile;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name= "chat_message")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id")
    @JsonIgnore
    ChatRoom chatRoom;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    Profile sender;
    
    @Column(columnDefinition = "TEXT")
    String content;
    
    @Column(name = "created_date")
    LocalDateTime createdDate;
    
    @Column(name = "content_type")
    @Enumerated(EnumType.STRING)
    MessageContentType contentType;
    
    @Column(name = "file_path", nullable = true)
    String filePath;
    
    @Column(name = "file_name", nullable = true)
    String fileName;
    
    @Column(name = "file_type", nullable = true)
    String fileType;
    
    @Column(name = "is_system_message")
    boolean systemMessage;
    
    @Builder.Default
    @ManyToMany
    @JoinTable(
        name = "message_read_status",
        joinColumns = @JoinColumn(name = "message_id"),
        inverseJoinColumns = @JoinColumn(name = "profile_id")
    )
    Set<Profile> readBy = new HashSet<>();
    
    public enum MessageContentType {
        TEXT, FILE, IMAGE, EMOJI, SYSTEM
    }
}

