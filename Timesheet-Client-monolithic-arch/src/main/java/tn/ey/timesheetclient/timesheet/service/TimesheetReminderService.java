package tn.ey.timesheetclient.timesheet.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.ey.timesheetclient.mail.EmailHelperService;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.dao.ProjectProfileDao;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.program.model.ProjectProfile;
import tn.ey.timesheetclient.timesheet.dao.TimesheetDao;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing timesheet reminders
 * Runs automatically to check for missing timesheets across all periods
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TimesheetReminderService {

    private final ProjectDao projectDao;
    private final ProjectProfileDao projectProfileDao;
    private final TimesheetDao timesheetDao;
    private final EmailHelperService emailHelperService;

    /**
     * Scheduled task that runs automatically to check for missing timesheets
     * Cron expression: 30 * * * * * (every 30 seconds for testing)
     * For production, consider: 0 0 9 5 * ? (5th of every month at 9:00 AM)
     */    
    @Scheduled(cron = " 0 0 8 5 * ?")
    @Transactional(readOnly = true)
    public void sendTimesheetReminders() {
        log.info("Starting timesheet reminder process...");
        
        try {
            // Get all active projects (no need to eagerly load projectProfiles anymore)
            List<Project> allProjects = projectDao.findAll();
            log.info("Found {} projects to check", allProjects.size());
            
            int projectsProcessed = 0;
            int remindersSet = 0;
            
            for (Project project : allProjects) {
                try {
                    boolean reminderSent = processProjectTimesheets(project);
                    if (reminderSent) {
                        remindersSet++;
                    }
                    projectsProcessed++;
                } catch (Exception e) {
                    log.error("Error processing project {}: {}", project.getName(), e.getMessage(), e);
                }
            }
            
            log.info("Timesheet reminder process completed. Projects processed: {}, Reminders sent: {}", 
                    projectsProcessed, remindersSet);
                    
        } catch (Exception e) {
            log.error("Error during timesheet reminder process: {}", e.getMessage(), e);
        }
    }

    /**
     * Process timesheets for a specific project and send reminders if needed
     */
    private boolean processProjectTimesheets(Project project) {
        log.debug("Processing project: {}", project.getName());
        
        // Get project profiles using repository query instead of accessing collection
        List<ProjectProfile> projectProfiles = projectProfileDao.findProjectProfilesByProjectId(project.getIdproject());
        
        // Skip projects without profiles
        if (projectProfiles == null || projectProfiles.isEmpty()) {
            log.debug("Project {} has no profiles, skipping", project.getName());
            return false;
        }
        
        log.debug("Project {} has {} profiles", project.getName(), projectProfiles.size());
        
        // Check timesheet status for each profile (check if they have any timesheets at all)
        List<ProjectProfile> profilesWithTimesheet = projectProfiles.stream()
                .filter(this::hasAnyTimesheet)
                .collect(Collectors.toList());
                
        List<ProjectProfile> profilesWithoutTimesheet = projectProfiles.stream()
                .filter(pp -> !hasAnyTimesheet(pp))
                .collect(Collectors.toList());
        
        log.debug("Project {}: {} profiles with timesheets, {} profiles without timesheets", 
                project.getName(), profilesWithTimesheet.size(), profilesWithoutTimesheet.size());
        
        // Only send reminder if some profiles have timesheets but others don't
        if (!profilesWithTimesheet.isEmpty() && !profilesWithoutTimesheet.isEmpty()) {
            sendRemindersForProject(project, profilesWithTimesheet, profilesWithoutTimesheet);
            return true;
        }
        
        return false;
    }

    /**
     * Check if a project profile has any timesheet at all
     */
    private boolean hasAnyTimesheet(ProjectProfile projectProfile) {
        return timesheetDao.findByProjectprofile_Id(projectProfile.getId()).stream().findAny().isPresent();
    }

    /**
     * Send reminder emails to project owner and program owner
     */
    private void sendRemindersForProject(Project project,
                                       List<ProjectProfile> profilesWithTimesheet,
                                       List<ProjectProfile> profilesWithoutTimesheet) {
        
        String projectName = project.getName();
        String programName = project.getProgram() != null ? project.getProgram().getName() : "Non défini";
        String period = "Général"; // Generic period since we're not checking specific periods
        
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
        sendTimesheetReminders();
    }
}
