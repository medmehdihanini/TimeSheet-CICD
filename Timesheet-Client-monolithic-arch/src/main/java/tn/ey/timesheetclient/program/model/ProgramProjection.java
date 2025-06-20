package tn.ey.timesheetclient.program.model;

import java.util.Date;

public interface ProgramProjection {
    Long getIdprog();
    String getNumcontrat();
    String getName();
    Status getStatus();
    Date getLaunchedat();
    byte[] getImage();
}
