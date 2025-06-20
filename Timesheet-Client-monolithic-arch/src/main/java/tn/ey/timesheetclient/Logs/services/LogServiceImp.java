package tn.ey.timesheetclient.Logs.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import tn.ey.timesheetclient.Logs.dao.LogRepository;
import tn.ey.timesheetclient.Logs.model.Log;
import tn.ey.timesheetclient.program.model.Program;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.user.model.User;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogServiceImp implements LogService {
    private final SimpMessagingTemplate messagingTemplate;
    private final LogRepository logRepository;

    @Override
    public void logAction(String action) {
        logSystemAction(action);
    }

    public void logProgramAction(String action, Program program) {
        createAndSaveLog(action, program, null, Log.LogType.PROGRAM);
    }

    public void logProjectAction(String action, Project project) {
        createAndSaveLog(action, project != null ? project.getProgram() : null, project, Log.LogType.PROJECT);
    }

    public void logSystemAction(String action) {
        createAndSaveLog(action, null, null, Log.LogType.SYSTEM);
    }

    private void createAndSaveLog(String action, Program program, Project project, Log.LogType logType) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String email;
                String fullName;
                
                Object principal = authentication.getPrincipal();
                if (principal instanceof User) {
                    User userDetails = (User) principal;
                    email = userDetails.getEmail();
                    fullName = userDetails.getFirstname() + " " + userDetails.getLastname();
                } else {
                    // If principal is a string (email), use it as both username and email
                    email = principal.toString();
                    fullName = email;
                }

                String logMessage = String.format("User %s performed action: %s", fullName, action);
                String contextInfo = "";
                
                if (program != null) {
                    contextInfo += " in program: " + program.getName();
                }
                if (project != null) {
                    contextInfo += " in project: " + project.getName();
                }
                
                if (!contextInfo.isEmpty()) {
                    logMessage += contextInfo;
                }

                Log logEntry = Log.builder()
                        .username(fullName)
                        .email(email)
                        .action(logMessage)
                        .timestamp(LocalDateTime.now())
                        .program(program)
                        .project(project)
                        .logType(logType)
                        .build();

                log.info("Saving log: {}", logMessage);
                Log savedLog = logRepository.save(logEntry);
                log.info("Log saved successfully with ID: {}", savedLog.getId());

                // Create a simplified DTO for WebSocket to avoid Hibernate proxy issues
                Map<String, Object> logDto = createSimplifiedLogDto(savedLog);

                // Broadcast to admin channel
                log.info("Broadcasting to admin channel /logs/admin");
                messagingTemplate.convertAndSend("/logs/admin", logDto);

                // Broadcast to program chief if applicable
                if (program != null) {
                    String programChannel = "/logs/program/" + program.getIdprog();
                    log.info("Broadcasting to program channel: {}", programChannel);
                    messagingTemplate.convertAndSend(programChannel, logDto);
                }

                // Broadcast to project chief if applicable
                if (project != null) {
                    String projectChannel = "/logs/project/" + project.getIdproject();
                    log.info("Broadcasting to project channel: {}", projectChannel);
                    messagingTemplate.convertAndSend(projectChannel, logDto);
                }
                
                log.info("Log broadcast completed successfully");
            }
        } catch (Exception e) {
            log.error("Error in createAndSaveLog: {}", e.getMessage(), e);
        }
    }

    /**
     * Creates a simplified log DTO that avoids Hibernate proxy issues for WebSocket transmission
     */
    private Map<String, Object> createSimplifiedLogDto(Log log) {
        Map<String, Object> logDto = new HashMap<>();
        logDto.put("id", log.getId());
        logDto.put("username", log.getUsername());
        logDto.put("email", log.getEmail());
        logDto.put("action", log.getAction());
        logDto.put("timestamp", log.getTimestamp());
        logDto.put("logType", log.getLogType());
        
        // Add simplified program info if exists
        if (log.getProgram() != null) {
            Map<String, Object> programInfo = new HashMap<>();
            programInfo.put("id", log.getProgram().getIdprog());
            programInfo.put("name", log.getProgram().getName());
            logDto.put("program", programInfo);
        }
        
        // Add simplified project info if exists
        if (log.getProject() != null) {
            Map<String, Object> projectInfo = new HashMap<>();
            projectInfo.put("id", log.getProject().getIdproject());
            projectInfo.put("name", log.getProject().getName());
            logDto.put("project", projectInfo);
        }
        
        return logDto;
    }

    @Override
    public void DeleteSelectedLogs(List<Long> ids) {
        try {
            logRepository.deleteAllById(ids);
            log.info("Deleted selected logs with IDs: {}", ids);
        } catch (Exception e) {
            log.error("Error deleting logs: {}", e.getMessage());
        }
    }

    @Override
    public void DeleteAllLogs() {
        try {
            logRepository.deleteAll();
            log.info("Deleted all logs");
        } catch (Exception e) {
            log.error("Error deleting all logs: {}", e.getMessage());
        }
    }

    @Override
    public List<Log> getAllLogs() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof User) {
                User currentUser = (User) principal;
                return getAllUserSpecificLogs(currentUser);
            }
            // If principal is a string (probably during JWT auth), return all logs
            // You may want to customize this behavior based on your requirements
            return logRepository.findAll();
        }
        return List.of();
    }

    @Override
    public List<Log> getAllUserSpecificLogs(User user) {
        List<Log> allLogs = logRepository.findAll();
        
        // If user is null, return empty list
        if (user == null) {
            return List.of();
        }

        // Admin sees all logs
        if (user.getRole().name().equals("SUPER_ADMIN")) {
            return allLogs;
        }

        return allLogs.stream().filter(log -> {
            // For Program Chief
            if (log.getProgram() != null && log.getProgram().getChefprogram() != null 
                && log.getProgram().getChefprogram().getId().equals(user.getId())) {
                return true;
            }
            
            // For Project Manager
            if (log.getProject() != null && log.getProject().getChefprojet() != null 
                && log.getProject().getChefprojet().getId().equals(user.getId())) {
                return true;
            }
            
            // For Program Chief, also include logs from all projects under their programs
            if (log.getProject() != null && log.getProject().getProgram() != null 
                && log.getProject().getProgram().getChefprogram() != null 
                && log.getProject().getProgram().getChefprogram().getId().equals(user.getId())) {
                return true;
            }
            
            return false;
        }).collect(Collectors.toList());
    }
}