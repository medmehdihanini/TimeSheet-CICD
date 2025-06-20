package tn.ey.timesheetclient.Logs.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.program.model.Project;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "_logs")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Log {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String username;
    String email;
    String action;
    
    @Enumerated(EnumType.STRING)
    LogType logType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id", nullable = true)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    Program program;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = true)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    Project project;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime timestamp;

    public enum LogType {
        SYSTEM,
        PROGRAM,
        PROJECT
    }
}