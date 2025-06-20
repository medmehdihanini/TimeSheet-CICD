package tn.ey.timesheetclient.Logs.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.ey.timesheetclient.Logs.dao.LogRepository;
import tn.ey.timesheetclient.Logs.model.Log;
import tn.ey.timesheetclient.Logs.services.LogServiceImp;

import java.util.List;

@RestController
@RequestMapping("/api/v1/logs")
@RequiredArgsConstructor
public class LogController {

    private final LogRepository logRepository;
    private final LogServiceImp logServiceImp;


    @GetMapping("/all")
    public List<Log> getAllLogs() {
        return logRepository.findAll();
    }

    @GetMapping("/program/{programId}")
    public ResponseEntity<List<Log>> getProgramLogs(@PathVariable Long programId) {
        // Find logs for specific program and its projects
        List<Log> logs = logRepository.findByProgramIdprogOrProjectProgramIdprog(programId, programId);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Log>> getProjectLogs(@PathVariable Long projectId) {
        List<Log> logs = logRepository.findByProjectIdproject(projectId);
        return ResponseEntity.ok(logs);
    }

    @DeleteMapping("/delete-selected")
    public ResponseEntity<?> deleteSelectedLogs(@RequestBody List<Long> ids) {
        try {
            logServiceImp.DeleteSelectedLogs(ids);
            return ResponseEntity.ok("Selected logs deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting selected logs: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<?> deleteAllLogs() {
        try {
            logServiceImp.DeleteAllLogs();
            return ResponseEntity.ok("All logs deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting all logs: " + e.getMessage());
        }
    }
}
