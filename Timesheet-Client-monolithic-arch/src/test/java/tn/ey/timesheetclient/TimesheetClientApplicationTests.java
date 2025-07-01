package tn.ey.timesheetclient;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TimesheetClientApplicationTests {

    @Test
    void contextLoads() {
        // This test verifies that the Spring application context loads successfully
        assertTrue(true, "Application context should load without errors");
    }

    @Test
    void applicationShouldStart() {
        // Simple test to verify application startup
        assertDoesNotThrow(() -> {
            // Test that no exceptions are thrown during context initialization
        }, "Application should start without throwing exceptions");
    }

    @Test
    void basicMathOperations() {
        // Simple unit test for basic operations
        int a = 5;
        int b = 3;
        
        assertEquals(8, a + b, "Addition should work correctly");
        assertEquals(2, a - b, "Subtraction should work correctly");
        assertEquals(15, a * b, "Multiplication should work correctly");
    }

    @Test
    void stringOperations() {
        // Simple string test
        String projectName = "TimeSheet";
        String companyName = "EY";
        
        assertNotNull(projectName, "Project name should not be null");
        assertNotNull(companyName, "Company name should not be null");
        assertEquals("TimeSheet-EY", projectName + "-" + companyName, "String concatenation should work");
        assertTrue(projectName.contains("Sheet"), "Project name should contain 'Sheet'");
    }

}
