 Email Template System - Timesheet EY

## Overview

This document describes the new email template system implemented for the Timesheet EY application. The system provides branded, responsive HTML email templates using the official EY color palette.

## Color Palette

The email templates use the official EY color scheme:

- **Primary Text**: `#333333` (51,51,51) - Dark gray for main content
- **EY Yellow**: `#ffe600` (255,230,0) - Brand color for buttons and accents
- **Background**: `#ffffff` (255,255,255) - White for clean backgrounds
- **Borders**: `#cccccc` (204,204,204) - Light gray for dividers and borders
- **Secondary Text**: `#999999` (153,153,153) - Medium gray for less important text

## Available Templates

### 1. Welcome Email (`WELCOME`)
- **File**: `welcome-template.html`
- **Usage**: New user registration
- **Placeholders**: `FIRSTNAME`, `EMAIL`, `PASSWORD`

### 2. Password Reset (`PASSWORD_RESET`)
- **File**: `password-reset-template.html`
- **Usage**: Password reset requests
- **Placeholders**: `FIRSTNAME`, `EMAIL`, `NEW_PASSWORD`

### 3. Timesheet Submission (`TIMESHEET_SUBMISSION`)
- **File**: `timesheet-submission-template.html`
- **Usage**: Notify managers of new timesheet submissions
- **Placeholders**: `MANAGER_NAME`, `PROFILE_NAME`, `MONTH`, `SUBMITTED_BY`, `SUBMISSION_DATE`

### 4. Timesheet Rejection (`TIMESHEET_REJECTION`)
- **File**: `timesheet-rejection-template.html`
- **Usage**: Notify of rejected timesheets
- **Placeholders**: `PROJECT_MANAGER_NAME`, `PROFILE_NAME`, `MONTH`, `REFUSED_BY`, `REFUSAL_DATE`

### 5. Test Template (`TEST`)
- **File**: `test-template.html`
- **Usage**: Testing the email system
- **Placeholders**: `FIRSTNAME`, `CURRENT_DATE`

## Template Structure

### Base Template
All emails use `base-template.html` which provides:
- Consistent header with EY logo
- Professional footer
- Responsive design
- Common styling

### Content Templates
Individual templates contain only the content section and use placeholders like `{{PLACEHOLDER_NAME}}`.

## Usage

### Using EmailHelperService (Recommended)

```java
@Autowired
private EmailHelperService emailHelperService;

// Send welcome email
emailHelperService.sendWelcomeEmail(
    "user@email.com", 
    "John", 
    "john@email.com", 
    "temporaryPassword123"
);

// Send password reset email
emailHelperService.sendPasswordResetEmail(
    "user@email.com", 
    "John", 
    "john@email.com", 
    "newPassword456"
);

// Send timesheet submission notification
emailHelperService.sendTimesheetSubmissionEmail(
    "manager@email.com", 
    "Manager Name", 
    "Employee Name", 
    "Janvier", 
    "Project Manager"
);
```

### Using EmailTemplateService Directly

```java
@Autowired
private EmailTemplateService emailTemplateService;

Map<String, String> templateData = new HashMap<>();
templateData.put("FIRSTNAME", "John");
templateData.put("EMAIL", "john@email.com");

emailTemplateService.sendTemplatedEmail(
    EmailTemplateType.WELCOME,
    "user@email.com",
    new String[]{"cc@email.com"},
    "Custom Subject",
    templateData,
    null // no attachments
);
```

### REST API

Send templated email via REST:

```bash
POST /mail/send-template
Content-Type: application/json

{
    "templateType": "WELCOME",
    "to": "user@email.com",
    "cc": ["cc@email.com"],
    "subject": "Custom Subject",
    "templateData": {
        "FIRSTNAME": "John",
        "EMAIL": "john@email.com",
        "PASSWORD": "temp123"
    }
}
```

## Features

### Responsive Design
- Mobile-friendly layout
- Flexible images and text
- Proper viewport settings

### Professional Styling
- EY brand colors
- Clean typography
- Consistent spacing
- Professional imagery

### Security
- Inline CSS for better email client compatibility
- Safe HTML rendering
- Input sanitization

### Accessibility
- High contrast colors
- Alt text for images
- Semantic HTML structure

## Development

### Adding New Templates

1. Create HTML template in `src/main/resources/templates/email/`
2. Add entry to `EmailTemplateType` enum
3. Create helper method in `EmailHelperService` (optional)
4. Use placeholders like `{{VARIABLE_NAME}}`

### Template Guidelines

- Use semantic HTML
- Include alt text for images
- Test in multiple email clients
- Keep CSS inline for compatibility
- Use the official color palette
- Ensure mobile responsiveness

### Common Placeholders

- `{{TITLE}}` - Email title (set automatically)
- `{{CURRENT_DATE}}` - Current date (set automatically)
- `{{FIRSTNAME}}` - User's first name
- `{{EMAIL}}` - User's email address

## Testing

Use the test template to verify the system:

```java
// Send test email
Map<String, String> data = new HashMap<>();
data.put("FIRSTNAME", "Test User");

emailTemplateService.sendTemplatedEmail(
    EmailTemplateType.TEST,
    "test@email.com",
    null,
    null,
    data,
    null
);
```

## Backward Compatibility

The original `EmailService` interface remains unchanged for backward compatibility. New code should use the template system via `EmailHelperService`.

## File Structure

```
src/main/resources/
└── templates/
    └── email/
        ├── base-template.html          # Base layout
        ├── welcome-template.html       # Welcome email
        ├── password-reset-template.html # Password reset
        ├── timesheet-submission-template.html # Timesheet submission
        ├── timesheet-rejection-template.html  # Timesheet rejection
        └── test-template.html          # Test template
```

## Dependencies

- Spring Boot Mail Starter
- Jakarta Mail API
- Thymeleaf (not required but recommended for future enhancements)

## Configuration

Ensure mail configuration in `application.properties`:

```properties
spring.mail.host=smtp.gmail.com
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.port=587
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.auth=true
```
