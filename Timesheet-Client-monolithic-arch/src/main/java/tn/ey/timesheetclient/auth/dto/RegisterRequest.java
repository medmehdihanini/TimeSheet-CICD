package tn.ey.timesheetclient.auth.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;
import tn.ey.timesheetclient.user.model.Role;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {
    String firstname;
    String lastname;
    String email;
    Role role;
}
