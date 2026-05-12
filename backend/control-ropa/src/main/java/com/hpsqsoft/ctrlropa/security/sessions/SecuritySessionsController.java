package com.hpsqsoft.ctrlropa.security.sessions;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/security/sessions")
public class SecuritySessionsController {

    private final SecuritySessionsService service;

    public SecuritySessionsController(SecuritySessionsService service) {
        this.service = service;
    }

    @GetMapping
    public SecuritySessionsResponse findCurrentState() {
        return service.findCurrentState();
    }

    @PostMapping("/users/{userId}/unlock")
    public void unlockUser(@PathVariable Long userId) {
        service.unlockUser(userId);
    }

    @PostMapping("/users/{userId}/revoke-sessions")
    public void revokeUserSessions(@PathVariable Long userId) {
        service.revokeUserSessions(userId);
    }

    @PostMapping("/{sessionId}/revoke")
    public void revokeSession(@PathVariable Long sessionId) {
        service.revokeSession(sessionId);
    }

    @PostMapping("/revoke-all")
    public void revokeAllSessions() {
        service.revokeAllSessions();
    }
}
