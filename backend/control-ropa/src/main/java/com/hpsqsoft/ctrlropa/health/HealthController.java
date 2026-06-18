package com.hpsqsoft.ctrlropa.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
public class HealthController {

    @GetMapping({"/api/health", "/api/health/"})
    public HealthResponse health() {
        return new HealthResponse("OK", LocalDateTime.now());
    }

    public static class HealthResponse {
        private String status;
        private LocalDateTime timestamp;

        public HealthResponse(String status, LocalDateTime timestamp) {
            this.status = status;
            this.timestamp = timestamp;
        }

        public String getStatus() { return status; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}
