package tn.ey.timesheetclient.mail;

import lombok.Getter;

@Getter
public enum EmailTemplateType {
    WELCOME("welcome-template.html", "Bienvenue sur Timesheet EY"),
    PASSWORD_RESET("password-reset-template.html", "Réinitialisation de mot de passe - Timesheet EY"),
    TIMESHEET_SUBMISSION("timesheet-submission-template.html", "Nouvelle timesheet soumise"),
    TIMESHEET_REJECTION("timesheet-rejection-template.html", "Timesheet refusée"),
    TIMESHEET_REMINDER("timesheet-reminder-template.html", "Rappel : Timesheets manquantes"),
    PROJECT_MANAGER_NOMINATION("project-manager-nomination-template.html", "Nomination en tant que chef de projet"),
    PROJECT_ASSIGNMENT("project-assignment-template.html", "Nouvelle affectation à un projet"),
    TEST("test-template.html", "Test Email Template - Timesheet EY");
    
    private final String templateFile;
    private final String defaultSubject;
    
    EmailTemplateType(String templateFile, String defaultSubject) {
        this.templateFile = templateFile;
        this.defaultSubject = defaultSubject;
    }

}
