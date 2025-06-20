package tn.ey.timesheetclient.auth.dto;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.user.model.Role;

import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConnectedUserDto {
    Long id;
    String firstname;
    String lastname;
    String email;
    @Enumerated(EnumType.STRING)
    Role role;
    @Lob
    private byte[] image;


    @Builder.Default
    Set<Project> projects = new HashSet<>();

    @Builder.Default
    Set<Program> programs = new HashSet<>();

}
