package tn.ey.timesheetclient.profile.DTO;

import lombok.Data;
import tn.ey.timesheetclient.program.model.Status;

import java.util.Map;

@Data
public class ProjectStats {
    private Long projectId;
    private String name;
    private Status status;
    private Double mandayBudget;
    private Double consumedMandayBudget;
    private Long taskCount;
    private tn.ey.timesheetclient.timesheet.model.Status timesheetStatus; // Single timesheet status
    private Map<String, Long> workplaceCounts; // EY vs. Chez le client per project
}