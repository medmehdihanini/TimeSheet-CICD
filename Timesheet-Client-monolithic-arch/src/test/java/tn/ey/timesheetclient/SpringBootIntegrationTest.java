package tn.ey.timesheetclient;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Integration test to verify Spring Boot application can start
 * This test only runs when the Spring profile allows it
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.sql.init.mode=never",
    "logging.level.org.springframework=WARN",
    "logging.level.org.hibernate=WARN"
})
class SpringBootIntegrationTest {

    @Test
    void contextLoads() {
        // This test verifies that the Spring application context loads successfully
        // with minimal configuration for testing
    }
}
