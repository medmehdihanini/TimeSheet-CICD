package tn.ey.timesheetclient.mail;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service("emailTemplateService")
public class EmailTemplateServiceImpl implements EmailTemplateService {
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    @Autowired
    private JavaMailSender javaMailSender;

    @Override
    public String sendTemplatedEmail(EmailTemplateType templateType, String to, String[] cc, 
                                   String subject, Map<String, String> templateData, 
                                   MultipartFile[] attachments) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            mimeMessageHelper.setFrom(fromEmail);
            mimeMessageHelper.setTo(to);
            if (cc != null && cc.length > 0) {
                mimeMessageHelper.setCc(cc);
            }
            mimeMessageHelper.setSubject(subject != null ? subject : templateType.getDefaultSubject());

            // Load and process the HTML template
            String htmlContent = loadAndProcessTemplate(templateType, templateData);
            mimeMessageHelper.setText(htmlContent, true); // true indicates HTML

            // Add the EY logo as inline image
            ClassPathResource logoResource = new ClassPathResource("EY.png");
            if (logoResource.exists()) {
                mimeMessageHelper.addInline("ey-logo", logoResource);
            }

            // Add attachments if any
            if (attachments != null) {
                for (MultipartFile file : attachments) {
                    if (file != null && !file.isEmpty()) { 
                          String filename = file.getOriginalFilename();
                        mimeMessageHelper.addAttachment(
                                filename != null ? filename : "attachment",
                                new ByteArrayResource(file.getBytes()));
                    }
                }
            }

            javaMailSender.send(mimeMessage);
            return "Email envoyé avec succès";

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage(), e);
        }
    }

    @Override
    public String sendMail(MultipartFile[] file, String to, String[] cc, String subject, String body) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            mimeMessageHelper.setFrom(fromEmail);
            mimeMessageHelper.setTo(to);
            if (cc != null && cc.length > 0) {
                mimeMessageHelper.setCc(cc);
            }
            mimeMessageHelper.setSubject(subject);
            mimeMessageHelper.setText(body);                if (file != null) {
                    for (MultipartFile attachment : file) {
                        if (attachment != null && !attachment.isEmpty()) {
                            String filename = attachment.getOriginalFilename();
                            mimeMessageHelper.addAttachment(
                                    filename != null ? filename : "attachment",
                                    new ByteArrayResource(attachment.getBytes()));
                        }
                    }
                }

            javaMailSender.send(mimeMessage);
            return "mail send";

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String loadAndProcessTemplate(EmailTemplateType templateType, Map<String, String> templateData) 
            throws IOException {
        // Load base template
        ClassPathResource baseResource = new ClassPathResource("templates/email/base-template.html");
        String baseTemplate = new String(baseResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        // Load content template
        ClassPathResource contentResource = new ClassPathResource("templates/email/" + templateType.getTemplateFile());
        String contentTemplate = new String(contentResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        // Replace placeholders in content template
        String processedContent = replacePlaceholders(contentTemplate, templateData);

        // Inject content into base template
        String finalHtml = baseTemplate.replace("{{CONTENT}}", processedContent);
        
        // Replace title in base template
        String title = templateData.getOrDefault("TITLE", templateType.getDefaultSubject());
        finalHtml = finalHtml.replace("{{TITLE}}", title);

        return finalHtml;
    }

    private String replacePlaceholders(String template, Map<String, String> data) {
        if (data == null) {
            return template;
        }

        String result = template;
        for (Map.Entry<String, String> entry : data.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace(placeholder, value);
        }

        // Add current date if not provided
        if (!data.containsKey("CURRENT_DATE")) {
            String currentDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            result = result.replace("{{CURRENT_DATE}}", currentDate);
        }

        return result;
    }
}
