package com.hackedpro.smartexam;

// ออกแบบและพัฒนาโดย
// ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
// ให้เครดิตผู้พัฒนาระบบ

import static org.junit.Assert.assertEquals;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class SmartExamInstrumentedTest {

    @Test
    public void applicationContextUsesSmartExamPackage() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("com.hackedpro.smartexam", appContext.getPackageName());
    }
}
