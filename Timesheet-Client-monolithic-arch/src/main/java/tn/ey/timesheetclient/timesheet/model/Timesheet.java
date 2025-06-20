package tn.ey.timesheetclient.timesheet.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import tn.ey.timesheetclient.program.model.ProjectProfile;

import java.io.Serializable;
import java.time.Month;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name= "_timesheet")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Timesheet implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    Long idtimesheet;

    String mois;
    String year;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    Status status = Status.DRAFT;
    String Notes;


    @ManyToOne
    @JoinColumn(name = "profile_id")
    ProjectProfile projectprofile;


}
