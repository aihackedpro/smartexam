package com.hackedpro.smartexam;

// ออกแบบและพัฒนาโดย
// ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
// ให้เครดิตผู้พัฒนาระบบ

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class SmartExamUnitTest {

    @Test
    public void packageNameIsStable() {
        assertEquals("com.hackedpro.smartexam", SmartExamUnitTest.class.getPackage().getName());
    }
}
