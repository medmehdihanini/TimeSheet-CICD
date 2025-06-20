package tn.ey.timesheetclient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TimesheetClientApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimesheetClientApplication.class, args);
    }

}
