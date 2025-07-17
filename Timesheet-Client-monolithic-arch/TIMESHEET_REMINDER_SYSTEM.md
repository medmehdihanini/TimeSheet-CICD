# Monthly Timesheet Reminder System

## Overview

This system automatically sends reminder emails on the 5th of every month to project owners and program owners when some profiles in a project have submitted their timesheets but others haven't.

## Architecture Components

### 1. Email Template System

#### New Template
- **File**: `src/main/resources/templates/email/timesheet-reminder-template.html`
- **Type**: `EmailTemplateType.TIMESHEET_REMINDER`
- **Subject**: "Rappel : Timesheets manquantes"

#### Template Variables
- `{{RECIPIENT_NAME}}` - Name of the email recipient
- `{{RECIPIENT_ROLE}}` - Role (Chef de Projet / Chef de Programme)
- `{{PROJECT_NAME}}` - Name of the project
- `{{PROGRAM_NAME}}` - Name of the program
- `{{PERIOD}}` - Period for which timesheets are missing (e.g., "Janvier 2025")
- `{{PROFILES_WITH_TIMESHEET}}` - Comma-separated list of profiles who submitted
- `{{PROFILES_WITHOUT_TIMESHEET}}` - Comma-separated list of profiles who haven't submitted
- `{{SUBMISSION_RATE}}` - Percentage of profiles who submitted timesheets
- `{{REMINDER_DATE}}` - Date when the reminder was sent

### 2. Service Classes

#### TimesheetReminderService
- **Location**: `tn.ey.timesheetclient.timesheet.service.TimesheetReminderService`
- **Main Method**: `sendMonthlyTimesheetReminders()`
- **Schedule**: Runs on the 5th of every month at 9:00 AM
- **Cron Expression**: `0 0 9 5 * ?`

#### EmailHelperService (Enhanced)
- **New Method**: `sendTimesheetReminderEmail()`
- **Purpose**: Sends formatted reminder emails using the template system

### 3. Business Logic

#### Process Flow
1. **Monthly Trigger**: Cron job runs on the 5th of each month at 9:00 AM
2. **Period Calculation**: Checks timesheets for the previous month
3. **Project Iteration**: Loops through all projects in the system
4. **Profile Analysis**: For each project:
   - Identifies profiles with timesheets for the period
   - Identifies profiles without timesheets for the period
5. **Reminder Condition**: Sends reminders only when:
   - Some profiles have submitted timesheets AND
   - Other profiles have NOT submitted timesheets
6. **Email Delivery**: Sends emails to:
   - Project owner (chef de projet)
   - Program owner (chef de programme)
   - Avoids duplicate emails if the same person is both project and program owner

#### Data Model Relationships
```
Program (1) --> (N) Project
Project (1) --> (N) ProjectProfile
ProjectProfile (1) --> (N) Timesheet
ProjectProfile (N) --> (1) Profile
Program (N) --> (1) User (chef de programme)
Project (N) --> (1) User (chef de projet)
```

### 4. Configuration

#### Scheduling Enabled
- **File**: `TimesheetClientApplication.java`
- **Annotation**: `@EnableScheduling` added to main application class

#### Cron Schedule
- **Frequency**: Monthly
- **Day**: 5th of each month
- **Time**: 9:00 AM
- **Timezone**: Server timezone

### 5. Testing

#### Manual Testing Endpoints

##### Trigger Manual Reminder
```http
POST /test/timesheet-reminder/trigger
```
Manually triggers the reminder process for testing purposes.

##### Get Reminder Information
```http
GET /test/timesheet-reminder/info
```
Returns information about the reminder system configuration.

##### Test Email Template
```http
POST /test/email/timesheet-reminder
```
Parameters:
- `email`: Recipient email address
- `recipientName`: Name of recipient
- `recipientRole`: Role (Chef de Projet / Chef de Programme)
- `projectName`: Project name
- `programName`: Program name
- `period`: Period (optional, default: "Janvier 2025")
- `profilesWithTimesheet`: Comma-separated names (optional)
- `profilesWithoutTimesheet`: Comma-separated names (optional)
- `submissionRate`: Percentage (optional, default: 50)

### 6. Logging

The system provides comprehensive logging:
- Info level: Process start/end, summary statistics
- Debug level: Individual project processing details
- Error level: Failures in processing or email sending

### 7. Error Handling

- Individual project failures don't stop the entire process
- Email sending failures are logged but don't interrupt processing
- Graceful handling of missing data (null checks)

### 8. Production Considerations

#### Security
- Remove or secure test endpoints in production
- Consider adding authentication to manual trigger endpoints

#### Performance
- Uses lazy loading for entity relationships
- Processes projects individually to handle large datasets
- Efficient database queries using existing repository methods

#### Monitoring
- Comprehensive logging for monitoring and debugging
- Success/failure metrics logged for each run

## Future Enhancements

1. **Configurable Schedule**: Make the cron schedule configurable via properties
2. **Email Preferences**: Allow users to opt-out of reminder emails
3. **Multiple Reminder Types**: Different reminders for different stages (e.g., weekly warnings)
4. **Dashboard Integration**: Display reminder statistics in admin dashboard
5. **Template Customization**: Allow runtime customization of email templates
6. **Notification History**: Track and store notification history for auditing

## Troubleshooting

### Common Issues

1. **Emails Not Sent**: Check email configuration in `application.properties`
2. **Schedule Not Working**: Verify `@EnableScheduling` is present
3. **No Reminders Generated**: Check if projects have mixed timesheet status
4. **Template Errors**: Verify template file exists and placeholders are correct

### Debug Steps

1. Enable debug logging for the package: `tn.ey.timesheetclient.timesheet.service`
2. Use manual trigger endpoint to test functionality
3. Check email template test endpoint for template rendering issues
4. Verify database relationships and data consistency
