package tn.ey.timesheetclient.timesheet.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.ey.timesheetclient.mail.EmailHelperService;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.program.model.ProjectProfile;
import tn.ey.timesheetclient.timesheet.dao.TimesheetDao;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing monthly timesheet reminders
 * Runs automatically on the 5th of each month to check for missing timesheets
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TimesheetReminderService {

    private final ProjectDao projectDao;
    private final TimesheetDao timesheetDao;
    private final EmailHelperService emailHelperService;

    /**
     * Scheduled task that runs on the 5th of every month at 9:00 AM
     * Cron expression: 0 0 9 5 * ? (second, minute, hour, day, month, day_of_week)
     *     @Scheduled(cron = "0 0 9 5 * ?")

     */    //@Scheduled(cron = "30 * * * * *")
    @Transactional(readOnly = true)
    public void sendMonthlyTimesheetReminders() {
        log.info("Starting monthly timesheet reminder process...");
        
        try {
            // Get current month and year for timesheet checking
            LocalDate now = LocalDate.now();
            LocalDate previousMonth = now.minusMonths(1);
            String month = previousMonth.getMonth().toString();
            String year = String.valueOf(previousMonth.getYear());
            String period = previousMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
              log.info("Checking timesheets for period: {} (month: {}, year: {})", period, month, year);
            
            // Get all active projects with their projectProfiles eagerly loaded
            List<Project> allProjects = projectDao.findAllWithProjectProfiles();
            log.info("Found {} projects to check", allProjects.size());
            
            int projectsProcessed = 0;
            int remindersSet = 0;
            
            for (Project project : allProjects) {
                try {
                    boolean reminderSent = processProjectTimesheets(project, month, year, period);
                    if (reminderSent) {
                        remindersSet++;
                    }
                    projectsProcessed++;
                } catch (Exception e) {
                    log.error("Error processing project {}: {}", project.getName(), e.getMessage(), e);
                }
            }
            
            log.info("Monthly timesheet reminder process completed. Projects processed: {}, Reminders sent: {}", 
                    projectsProcessed, remindersSet);
                    
        } catch (Exception e) {
            log.error("Error during monthly timesheet reminder process: {}", e.getMessage(), e);
        }
    }

    /**
     * Process timesheets for a specific project and send reminders if needed
     */
    private boolean processProjectTimesheets(Project project, String month, String year, String period) {
        log.debug("Processing project: {}", project.getName());
        
        // Skip projects without profiles
        if (project.getProjectProfiles() == null || project.getProjectProfiles().isEmpty()) {
            log.debug("Project {} has no profiles, skipping", project.getName());
            return false;
        }
        
        List<ProjectProfile> projectProfiles = project.getProjectProfiles().stream().toList();
        log.debug("Project {} has {} profiles", project.getName(), projectProfiles.size());
        
        // Check timesheet status for each profile
        List<ProjectProfile> profilesWithTimesheet = projectProfiles.stream()
                .filter(pp -> hasTimesheetForPeriod(pp, month, year))
                .collect(Collectors.toList());
                
        List<ProjectProfile> profilesWithoutTimesheet = projectProfiles.stream()
                .filter(pp -> !hasTimesheetForPeriod(pp, month, year))
                .collect(Collectors.toList());
        
        log.debug("Project {}: {} profiles with timesheet, {} profiles without timesheet", 
                project.getName(), profilesWithTimesheet.size(), profilesWithoutTimesheet.size());
        
        // Only send reminder if some profiles have timesheets but others don't
        if (!profilesWithTimesheet.isEmpty() && !profilesWithoutTimesheet.isEmpty()) {
            sendRemindersForProject(project, period, profilesWithTimesheet, profilesWithoutTimesheet);
            return true;
        }
        
        return false;
    }

    /**
     * Check if a project profile has a timesheet for the given period
     */
    private boolean hasTimesheetForPeriod(ProjectProfile projectProfile, String month, String year) {
        return timesheetDao.findByMoisAndYearAndProjectprofile_Id(month, year, projectProfile.getId()).isPresent();
    }

    /**
     * Send reminder emails to project owner and program owner
     */
    private void sendRemindersForProject(Project project, String period, 
                                       List<ProjectProfile> profilesWithTimesheet,
                                       List<ProjectProfile> profilesWithoutTimesheet) {
        
        String projectName = project.getName();
        String programName = project.getProgram() != null ? project.getProgram().getName() : "Non défini";
        
        // Prepare profile lists for email
        String profilesWithTimesheetNames = profilesWithTimesheet.stream()
                .map(pp -> pp.getProfile().getFirstname() + " " + pp.getProfile().getLastname())
                .collect(Collectors.joining(", "));
                
        String profilesWithoutTimesheetNames = profilesWithoutTimesheet.stream()
                .map(pp -> pp.getProfile().getFirstname() + " " + pp.getProfile().getLastname())
                .collect(Collectors.joining(", "));
        
        int submissionRate = (profilesWithTimesheet.size() * 100) / 
                           (profilesWithTimesheet.size() + profilesWithoutTimesheet.size());
        
        // Send reminder to project owner
        if (project.getChefprojet() != null && project.getChefprojet().getEmail() != null) {
            try {
                String projectOwnerName = project.getChefprojet().getFirstname() + " " + 
                                        project.getChefprojet().getLastname();
                                        
                emailHelperService.sendTimesheetReminderEmail(
                        project.getChefprojet().getEmail(),
                        projectOwnerName,
                        "Chef de Projet",
                        projectName,
                        programName,
                        period,
                        profilesWithTimesheetNames,
                        profilesWithoutTimesheetNames,
                        submissionRate
                );
                
                log.info("Reminder sent to project owner {} for project {}", 
                        projectOwnerName, projectName);
                        
            } catch (Exception e) {
                log.error("Failed to send reminder to project owner for project {}: {}", 
                         projectName, e.getMessage());
            }
        }
        
        // Send reminder to program owner
        if (project.getProgram() != null && 
            project.getProgram().getChefprogram() != null && 
            project.getProgram().getChefprogram().getEmail() != null) {
            
            try {
                String programOwnerName = project.getProgram().getChefprogram().getFirstname() + " " + 
                                        project.getProgram().getChefprogram().getLastname();
                
                // Don't send duplicate email if project owner and program owner are the same
                if (!project.getProgram().getChefprogram().getEmail().equals(
                    project.getChefprojet() != null ? project.getChefprojet().getEmail() : "")) {
                    
                    emailHelperService.sendTimesheetReminderEmail(
                            project.getProgram().getChefprogram().getEmail(),
                            programOwnerName,
                            "Chef de Programme",
                            projectName,
                            programName,
                            period,
                            profilesWithTimesheetNames,
                            profilesWithoutTimesheetNames,
                            submissionRate
                    );
                    
                    log.info("Reminder sent to program owner {} for project {}", 
                            programOwnerName, projectName);
                }
                
            } catch (Exception e) {
                log.error("Failed to send reminder to program owner for project {}: {}", 
                         projectName, e.getMessage());
            }
        }
    }

    /**
     * Manual trigger for testing purposes (can be removed in production)
     */
    public void triggerManualReminder() {
        log.info("Manual timesheet reminder triggered");
        sendMonthlyTimesheetReminders();
    }
}
