package tn.ey.timesheetclient.Logs.services;

import tn.ey.timesheetclient.Logs.model.Log;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.user.model.User;
import java.util.List;

public interface LogService {
    void logAction(String action);
    void logProgramAction(String action, Program program);
    void logProjectAction(String action, Project project);
    void logSystemAction(String action);
    void DeleteSelectedLogs(List<Long> ids);
    void DeleteAllLogs();
    List<Log> getAllLogs();
    List<Log> getAllUserSpecificLogs(User user);
}
