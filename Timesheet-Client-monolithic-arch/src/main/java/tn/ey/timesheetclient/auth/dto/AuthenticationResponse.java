package tn.ey.timesheetclient.auth.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;
import tn.ey.timesheetclient.user.model.User;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationResponse{
    String token;
    ConnectedUserDto connecteduser;
}
