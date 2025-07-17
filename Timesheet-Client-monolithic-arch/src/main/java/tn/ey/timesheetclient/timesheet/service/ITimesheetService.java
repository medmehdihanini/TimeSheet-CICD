package tn.ey.timesheetclient.timesheet.service;

import org.springframework.http.ResponseEntity;
import tn.ey.timesheetclient.timesheet.model.Status;
import tn.ey.timesheetclient.timesheet.model.Timesheet;

import java.util.List;

public interface ITimesheetService {
    ResponseEntity<?> addAssignTimesheet(String month, String year, Long idproject, Long idprofile);
    ResponseEntity<?> getTimesheetByMonthAndYear(String month, String year, Long idproject, Long idprofile);
    ResponseEntity<?> submitTimesheetStatus(Long idtimesheet, Long trigger);
    ResponseEntity<?> AproveTimesheetStatus(Long idtimesheet, Long trigger);
    ResponseEntity<?> RejectTimesheetStatus(Long idtimesheet, Long trigger);
    ResponseEntity<?> getTimesheetsByProjectId(Long projectId);
    ResponseEntity<?> findAllByProjectProfileProjectIdAnsStatus(Long projectId, Status status);
    List<Timesheet>findByMonthYearProfileIdp(String nuMonth,String year,Long profileId);
    ResponseEntity<?> sendRejectMail(Long idtimesheet);
    ResponseEntity<?> sendingApprovalMail(Long idtimesheet);
    ResponseEntity<?> sendSubmissionNotificationMail(Long idtimesheet);
    ResponseEntity<?> getTimesheetByMonthAndYearAndUser(String month, String year, Long idproject, Long idprofile);
}

