package tn.ey.timesheetclient.profile.DTO;

import lombok.Data;
import tn.ey.timesheetclient.program.model.Status;

import java.util.List;
import java.util.Map;

@Data
public class ProgramStats {
    private Long programId;
    private String name;
    private Status status;
    private String client;
    private Double mandayBudget;
    private Double consumedMandayBudget;
    private List<ProjectStats> projects; // Projects for this program
}
