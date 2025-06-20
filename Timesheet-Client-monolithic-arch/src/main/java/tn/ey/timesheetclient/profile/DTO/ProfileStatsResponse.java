package tn.ey.timesheetclient.profile.DTO;

import lombok.Data;
import tn.ey.timesheetclient.timesheet.model.Status;

import java.util.List;
import java.util.Map;
@Data
public class ProfileStatsResponse {
    private Long profileId;
    private String fullName;
    private List<ProgramStats> programs;
    private Map<String, Long> workplaceCounts;
}
