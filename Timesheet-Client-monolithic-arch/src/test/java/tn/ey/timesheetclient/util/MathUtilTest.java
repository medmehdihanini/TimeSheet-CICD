package tn.ey.timesheetclient.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for MathUtil class
 * These are pure unit tests that don't require Spring context
 */
class MathUtilTest {

    private MathUtil mathUtil;

    @BeforeEach
    void setUp() {
        mathUtil = new MathUtil();
    }

    @Test
    void testAdd() {
        // Test addition with positive numbers
        assertEquals(8, mathUtil.add(5, 3), "5 + 3 should equal 8");
        
        // Test addition with negative numbers
        assertEquals(-2, mathUtil.add(-5, 3), "-5 + 3 should equal -2");
        
        // Test addition with zero
        assertEquals(5, mathUtil.add(5, 0), "5 + 0 should equal 5");
    }

    @Test
    void testSubtract() {
        // Test subtraction with positive numbers
        assertEquals(2, mathUtil.subtract(5, 3), "5 - 3 should equal 2");
        
        // Test subtraction with negative result
        assertEquals(-2, mathUtil.subtract(3, 5), "3 - 5 should equal -2");
        
        // Test subtraction with zero
        assertEquals(5, mathUtil.subtract(5, 0), "5 - 0 should equal 5");
    }

    @Test
    void testMultiply() {
        // Test multiplication with positive numbers
        assertEquals(15, mathUtil.multiply(5, 3), "5 * 3 should equal 15");
        
        // Test multiplication with zero
        assertEquals(0, mathUtil.multiply(5, 0), "5 * 0 should equal 0");
        
        // Test multiplication with negative numbers
        assertEquals(-15, mathUtil.multiply(-5, 3), "-5 * 3 should equal -15");
    }

    @Test
    void testDivide() {
        // Test division with positive numbers
        assertEquals(2.5, mathUtil.divide(5, 2), 0.001, "5 / 2 should equal 2.5");
        
        // Test division with exact division
        assertEquals(3.0, mathUtil.divide(15, 5), 0.001, "15 / 5 should equal 3.0");
        
        // Test division by zero throws exception
        assertThrows(IllegalArgumentException.class, 
            () -> mathUtil.divide(5, 0), 
            "Division by zero should throw IllegalArgumentException");
    }

    @Test
    void testIsEven() {
        // Test even numbers
        assertTrue(mathUtil.isEven(4), "4 should be even");
        assertTrue(mathUtil.isEven(0), "0 should be even");
        assertTrue(mathUtil.isEven(-2), "-2 should be even");
        
        // Test odd numbers
        assertFalse(mathUtil.isEven(3), "3 should not be even");
        assertFalse(mathUtil.isEven(-3), "-3 should not be even");
    }

    @Test
    void testFactorial() {
        // Test factorial of positive numbers
        assertEquals(1, mathUtil.factorial(0), "0! should equal 1");
        assertEquals(1, mathUtil.factorial(1), "1! should equal 1");
        assertEquals(6, mathUtil.factorial(3), "3! should equal 6");
        assertEquals(120, mathUtil.factorial(5), "5! should equal 120");
        
        // Test factorial of negative number throws exception
        assertThrows(IllegalArgumentException.class, 
            () -> mathUtil.factorial(-1), 
            "Factorial of negative number should throw IllegalArgumentException");
    }

    @Test
    void testFactorialLargeNumber() {
        // Test factorial of larger number
        assertEquals(3628800, mathUtil.factorial(10), "10! should equal 3628800");
    }
}
