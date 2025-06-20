package tn.ey.timesheetclient.mail;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for testing email templates
 * This should be removed in production
 */
@RestController
@RequestMapping("/test")
public class EmailTestController {

    @Autowired
    private EmailHelperService emailHelperService;

    @Autowired
    private EmailTemplateService emailTemplateService;

    /**
     * Test welcome email
     */
    @PostMapping("/email/welcome")
    public String testWelcomeEmail(@RequestParam String email,
                                 @RequestParam String firstName,
                                 @RequestParam String password) {
        try {
            return emailHelperService.sendWelcomeEmail(email, firstName, email, password);
        } catch (Exception e) {
            return "Erreur: " + e.getMessage();
        }
    }

    /**
     * Test password reset email
     */
    @PostMapping("/email/password-reset")
    public String testPasswordResetEmail(@RequestParam String email,
                                       @RequestParam String firstName,
                                       @RequestParam String newPassword) {
        try {
            return emailHelperService.sendPasswordResetEmail(email, firstName, email, newPassword);
        } catch (Exception e) {
            return "Erreur: " + e.getMessage();
        }
    }

    /**
     * Test timesheet submission email
     */
    @PostMapping("/email/timesheet-submission")
    public String testTimesheetSubmissionEmail(@RequestParam String email,
                                             @RequestParam String managerName,
                                             @RequestParam String profileName,
                                             @RequestParam String month,
                                             @RequestParam String submittedBy) {
        try {
            return emailHelperService.sendTimesheetSubmissionEmail(email, managerName, profileName, month, submittedBy);
        } catch (Exception e) {
            return "Erreur: " + e.getMessage();
        }
    }

    /**
     * Test timesheet rejection email
     */
    @PostMapping("/email/timesheet-rejection")
    public String testTimesheetRejectionEmail(@RequestParam String email,
                                            @RequestParam String projectManagerName,
                                            @RequestParam String profileName,
                                            @RequestParam String month,
                                            @RequestParam String refusedBy) {
        try {
            return emailHelperService.sendTimesheetRejectionEmail(email, projectManagerName, profileName, month, refusedBy);
        } catch (Exception e) {
            return "Erreur: " + e.getMessage();
        }
    }

    /**
     * Test timesheet reminder email
     */
    @PostMapping("/email/timesheet-reminder")
    public String testTimesheetReminderEmail(@RequestParam String email,
                                           @RequestParam String recipientName,
                                           @RequestParam String recipientRole,
                                           @RequestParam String projectName,
                                           @RequestParam String programName,
                                           @RequestParam(defaultValue = "Janvier 2025") String period,
                                           @RequestParam(defaultValue = "John Doe, Jane Smith") String profilesWithTimesheet,
                                           @RequestParam(defaultValue = "Bob Wilson, Alice Brown") String profilesWithoutTimesheet,
                                           @RequestParam(defaultValue = "50") int submissionRate) {
        try {
            return emailHelperService.sendTimesheetReminderEmail(
                    email, recipientName, recipientRole, projectName, programName, 
                    period, profilesWithTimesheet, profilesWithoutTimesheet, submissionRate
            );
        } catch (Exception e) {
            return "Erreur: " + e.getMessage();
        }
    }

    /**
     * Test generic template email
     */
    @PostMapping("/email/test-template")
    public String testTemplateEmail(@RequestParam String email,
                                  @RequestParam String firstName) {
        try {
            Map<String, String> templateData = new HashMap<>();
            templateData.put("FIRSTNAME", firstName);

            return emailTemplateService.sendTemplatedEmail(
                    EmailTemplateType.TEST,
                    email,
                    null,
                    null,
                    templateData,
                    null
            );
        } catch (Exception e) {
            return "Erreur: " + e.getMessage();
        }
    }
}
