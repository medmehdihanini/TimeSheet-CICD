package tn.ey.timesheetclient.mail;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmailHelperService {

    @Autowired
    @Qualifier("emailTemplateService")
    private EmailTemplateService emailTemplateService;

    /**
     * Send welcome email to new user
     */
    public String sendWelcomeEmail(String toEmail, String firstName, String email, String password) {
        Map<String, String> templateData = new HashMap<>();
        templateData.put("FIRSTNAME", firstName);
        templateData.put("EMAIL", email);
        templateData.put("PASSWORD", password);

        String[] cc = {"timsheeta@gmail.com"};
        
        return emailTemplateService.sendTemplatedEmail(
                EmailTemplateType.WELCOME, 
                toEmail, 
                cc, 
                null, // Use default subject
                templateData, 
                null
        );
    }

    /**
     * Send password reset email
     */
    public String sendPasswordResetEmail(String toEmail, String firstName, String email, String newPassword) {
        Map<String, String> templateData = new HashMap<>();
        templateData.put("FIRSTNAME", firstName);
        templateData.put("EMAIL", email);
        templateData.put("NEW_PASSWORD", newPassword);

        String[] cc = {"timsheeta@gmail.com"};
        
        return emailTemplateService.sendTemplatedEmail(
                EmailTemplateType.PASSWORD_RESET, 
                toEmail, 
                cc, 
                null, // Use default subject
                templateData, 
                null
        );
    }

    /**
     * Send timesheet submission notification
     */
    public String sendTimesheetSubmissionEmail(String toEmail, String managerName, String profileName, 
                                             String month, String submittedBy) {
        Map<String, String> templateData = new HashMap<>();
        templateData.put("MANAGER_NAME", managerName);
        templateData.put("PROFILE_NAME", profileName);
        templateData.put("MONTH", month);
        templateData.put("SUBMITTED_BY", submittedBy);
        templateData.put("SUBMISSION_DATE", java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        String[] cc = {"timsheeta@gmail.com"};
        
        return emailTemplateService.sendTemplatedEmail(
                EmailTemplateType.TIMESHEET_SUBMISSION, 
                toEmail, 
                cc, 
                "Une timesheet a été soumise", 
                templateData, 
                new MultipartFile[0]
        );
    }

    /**
     * Send timesheet rejection notification
     */
    public String sendTimesheetRejectionEmail(String toEmail, String projectManagerName, String profileName, 
                                            String month, String refusedBy) {
        Map<String, String> templateData = new HashMap<>();
        templateData.put("PROJECT_MANAGER_NAME", projectManagerName);
        templateData.put("PROFILE_NAME", profileName);
        templateData.put("MONTH", month);
        templateData.put("REFUSED_BY", refusedBy);
        templateData.put("REFUSAL_DATE", java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        String[] cc = {"timsheeta@gmail.com"};
        
        return emailTemplateService.sendTemplatedEmail(
                EmailTemplateType.TIMESHEET_REJECTION, 
                toEmail, 
                cc, 
                "Refus de timesheet", 
                templateData, 
                new MultipartFile[0]
        );
    }

    /**
     * Send timesheet reminder email
     */
    public String sendTimesheetReminderEmail(String toEmail, String recipientName, String recipientRole,
                                           String projectName, String programName, String period,
                                           String profilesWithTimesheet, String profilesWithoutTimesheet,
                                           int submissionRate) {
        Map<String, String> templateData = new HashMap<>();
        templateData.put("RECIPIENT_NAME", recipientName);
        templateData.put("RECIPIENT_ROLE", recipientRole);
        templateData.put("PROJECT_NAME", projectName);
        templateData.put("PROGRAM_NAME", programName);
        templateData.put("PERIOD", period);
        templateData.put("PROFILES_WITH_TIMESHEET", profilesWithTimesheet);
        templateData.put("PROFILES_WITHOUT_TIMESHEET", profilesWithoutTimesheet);
        templateData.put("SUBMISSION_RATE", String.valueOf(submissionRate));
        templateData.put("REMINDER_DATE", java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        String[] cc = {"timsheeta@gmail.com"};
        
        return emailTemplateService.sendTemplatedEmail(
                EmailTemplateType.TIMESHEET_REMINDER, 
                toEmail, 
                cc, 
                "Rappel : Timesheets manquantes - " + projectName, 
                templateData, 
                null
        );
    }

    /**
     * Send project manager nomination email
     */
    public String sendProjectManagerNominationEmail(String toEmail, String firstName, String programName, 
                                                   String projectName, String projectDescription) {
        Map<String, String> templateData = new HashMap<>();
        templateData.put("FIRSTNAME", firstName);
        templateData.put("PROGRAM_NAME", programName);
        templateData.put("PROJECT_NAME", projectName);
        templateData.put("PROJECT_DESCRIPTION", projectDescription);
        templateData.put("NOMINATION_DATE", java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        String[] cc = {"timsheeta@gmail.com"};
        
        return emailTemplateService.sendTemplatedEmail(
                EmailTemplateType.PROJECT_MANAGER_NOMINATION, 
                toEmail, 
                cc, 
                null, // Use default subject
                templateData, 
                null
        );
    }

    /**
     * Send project assignment email
     */
    public String sendProjectAssignmentEmail(String toEmail, String firstName, String programName, 
                                           String projectName, String projectDescription) {
        Map<String, String> templateData = new HashMap<>();
        templateData.put("FIRSTNAME", firstName);
        templateData.put("PROGRAM_NAME", programName);
        templateData.put("PROJECT_NAME", projectName);
        templateData.put("PROJECT_DESCRIPTION", projectDescription);
        templateData.put("ASSIGNMENT_DATE", java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        String[] cc = {"timsheeta@gmail.com"};
        
        return emailTemplateService.sendTemplatedEmail(
                EmailTemplateType.PROJECT_ASSIGNMENT, 
                toEmail, 
                cc, 
                null, // Use default subject
                templateData, 
                null
        );
    }

    /**
     * Send plain text email (for backwards compatibility)
     */
    public String sendPlainEmail(MultipartFile[] file, String to, String[] cc, String subject, String body) {
        return emailTemplateService.sendMail(file, to, cc, subject, body);
    }
}
