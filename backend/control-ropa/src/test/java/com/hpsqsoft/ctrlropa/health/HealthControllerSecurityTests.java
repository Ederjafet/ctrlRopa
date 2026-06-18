package com.hpsqsoft.ctrlropa.health;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HealthControllerSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointDoesNotRequireSessionToken() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"));
    }

    @Test
    void healthEndpointWithTrailingSlashDoesNotRequireSessionToken() throws Exception {
        mockMvc.perform(get("/api/health/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"));
    }

    @Test
    void tenantCurrentRequiresSessionToken() throws Exception {
        mockMvc.perform(get("/api/tenant/current"))
                .andExpect(status().isUnauthorized());
    }
}
