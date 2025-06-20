package tn.ey.timesheetclient.mail;

import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

public interface EmailTemplateService {
    
    /**
     * Send email using HTML template
     * @param templateType Type of email template (welcome, password-reset, etc.)
     * @param to Recipient email address
     * @param cc CC recipients (can be null)
     * @param subject Email subject
     * @param templateData Data to replace placeholders in template
     * @param attachments File attachments (can be null or empty)
     * @return Success message
     */
    String sendTemplatedEmail(EmailTemplateType templateType, String to, String[] cc, 
                             String subject, Map<String, String> templateData, 
                             MultipartFile[] attachments);
    
    /**
     * Send plain text email (backwards compatibility)
     * @param file File attachments
     * @param to Recipient email address
     * @param cc CC recipients
     * @param subject Email subject
     * @param body Plain text body
     * @return Success message
     */
    String sendMail(MultipartFile[] file, String to, String[] cc, String subject, String body);
}
