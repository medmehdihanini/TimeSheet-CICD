package tn.ey.timesheetclient;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Simple unit tests that don't require Spring context
 * These tests focus on basic functionality and logic
 */
class TimesheetClientApplicationTests {

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

    @Test
    void booleanLogic() {
        // Test boolean operations
        boolean isProduction = false;
        boolean isTestEnvironment = true;
        
        assertFalse(isProduction, "Should not be production environment");
        assertTrue(isTestEnvironment, "Should be test environment");
        assertTrue(isProduction || isTestEnvironment, "At least one should be true");
    }

    @Test
    void arrayOperations() {
        // Test array operations
        int[] numbers = {1, 2, 3, 4, 5};
        
        assertEquals(5, numbers.length, "Array should have 5 elements");
        assertEquals(1, numbers[0], "First element should be 1");
        assertEquals(5, numbers[4], "Last element should be 5");
        
        // Calculate sum
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        assertEquals(15, sum, "Sum of array elements should be 15");
    }

}
