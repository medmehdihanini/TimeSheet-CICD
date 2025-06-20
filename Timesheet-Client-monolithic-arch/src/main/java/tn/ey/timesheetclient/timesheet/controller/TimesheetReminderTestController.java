package tn.ey.timesheetclient.timesheet.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.ey.timesheetclient.timesheet.service.TimesheetReminderService;

/**
 * Test controller for timesheet reminder functionality
 * This should be removed or secured in production
 */
@RestController
@RequestMapping("/test/timesheet-reminder")
@RequiredArgsConstructor
public class TimesheetReminderTestController {

    private final TimesheetReminderService timesheetReminderService;

    /**
     * Manual trigger for testing the monthly reminder functionality
     */
    @PostMapping("/trigger")
    public String triggerManualReminder() {
        try {
            timesheetReminderService.triggerManualReminder();
            return "Timesheet reminder process triggered successfully. Check logs for details.";
        } catch (Exception e) {
            return "Error triggering timesheet reminder: " + e.getMessage();
        }
    }

    /**
     * Get information about the reminder schedule
     */
    @GetMapping("/info")
    public String getReminderInfo() {
        return "Timesheet Reminder Service Info:\n" +
               "- Scheduled to run on the 5th of every month at 9:00 AM\n" +
               "- Checks timesheets for the previous month\n" +
               "- Sends reminders only when some profiles have timesheets but others don't\n" +
               "- Notifies both project owners and program owners\n" +
               "- Use POST /test/timesheet-reminder/trigger to manually test the functionality";
    }
}
