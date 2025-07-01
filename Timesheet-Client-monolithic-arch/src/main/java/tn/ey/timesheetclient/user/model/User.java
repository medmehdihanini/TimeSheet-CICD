package tn.ey.timesheetclient.user.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.program.model.Project;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name= "_user")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String firstname;
    String lastname;
    String email;
    String password;
    @Enumerated(EnumType.STRING)
    Role role;
    @Lob
    @Column(length = Integer.MAX_VALUE, nullable = true)
    private byte[] image;    @Builder.Default
    @OneToMany(mappedBy = "chefprojet")
    Set<Project> projects = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "chefprogram", cascade = CascadeType.ALL)
    Set<Program> programs = new HashSet<>();

    @OneToOne//if you create the user account the profile will be created automatically;
    Profile profile;





    @JsonIgnore
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
